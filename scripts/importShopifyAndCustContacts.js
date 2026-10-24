import fs from 'fs'
import path from 'path'
import pg from 'pg'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const { Client } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local')
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '')
      }
    }
  }
}

function parseCsv(content) {
  const rows = []
  let currentRow = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        currentField += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim())
      currentField = ''
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && content[i + 1] === '\n') {
        i++
      }
      currentRow.push(currentField.trim())
      if (currentRow.some(f => f.length > 0)) {
        rows.push(currentRow)
      }
      currentRow = []
      currentField = ''
    } else {
      currentField += char
    }
  }
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    rows.push(currentRow)
  }
  return rows
}

function cleanPhone(raw) {
  if (!raw) return null
  if (raw.includes('*') || raw.includes('#')) return null
  
  const firstPart = raw.split(':::')[0].trim()
  const digits = firstPart.replace(/\D/g, '')
  
  if (digits.startsWith('923') && digits.length === 12) {
    return '0' + digits.slice(2)
  }
  if (digits.startsWith('03') && digits.length === 11) {
    return digits
  }
  if (digits.startsWith('3') && digits.length === 10) {
    return '0' + digits
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits
  }
  return null
}

const shopifyOrderRegex = /^(\d{4,7})\b/
const customerWordRegex = /\b(cust|customer|custo|cus|cutomer)\b/i

async function run() {
  loadEnv()

  const rawContent = fs.readFileSync('/tmp/contacts_raw.csv', 'utf8')
  const rows = parseCsv(rawContent)
  console.log(`Parsed ${rows.length} total rows from contacts CSV.`)

  const extracted = []
  const seenPhones = new Set()

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const firstName = row[0] || ''
    const middleName = row[1] || ''
    const lastName = row[2] || ''
    const orgName = row[10] || ''
    const orgTitle = row[11] || ''
    const notes = row[14] || ''
    const phone1 = row[20] || ''
    const phone2 = row[22] || ''

    const allNames = [firstName, middleName, lastName].filter(Boolean).join(' ')
    const allText = [firstName, middleName, lastName, orgName, orgTitle, notes].filter(Boolean).join(' ')

    const isShopifyOrder = shopifyOrderRegex.test(firstName.trim()) && !/^\d{10,}$/.test(firstName.trim())
    const isCustomer = customerWordRegex.test(allText)

    if (isShopifyOrder || isCustomer) {
      const validPhone = cleanPhone(phone1) || cleanPhone(phone2)
      if (!validPhone) continue

      if (seenPhones.has(validPhone)) continue
      seenPhones.add(validPhone)

      let cleanName = allNames
      if (isShopifyOrder) {
        const match = firstName.trim().match(shopifyOrderRegex)
        const orderNum = match ? match[1] : ''
        const remainingName = [firstName.replace(shopifyOrderRegex, '').trim(), middleName, lastName].filter(Boolean).join(' ').trim()
        if (remainingName) {
          cleanName = `${remainingName} (Order #${orderNum})`
        } else {
          cleanName = `Order #${orderNum}`
        }
      } else {
        cleanName = cleanName
          .replace(/good\s*customer/gi, '')
          .replace(/good\s*cutomer/gi, '')
          .replace(/whole\s*sale\s*custo/gi, '')
          .replace(/\bcustomer\b/gi, '')
          .replace(/\bcusto\b/gi, '')
          .replace(/\bcust\b/gi, '')
          .replace(/\bcus\b/gi, '')
          .replace(/\s+/g, ' ')
          .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
          .trim()
        if (!cleanName) cleanName = 'Valued Customer'
      }

      extracted.push({
        type: isShopifyOrder ? 'shopify_order' : 'customer_tag',
        cleanName,
        phone: validPhone,
        rawRow: row[0]
      })
    }
  }

  console.log(`\nFound ${extracted.length} qualifying Shopify Order & Customer contacts!`)
  console.log('Breakdown by type:')
  console.log('Shopify Orders:', extracted.filter(e => e.type === 'shopify_order').length)
  console.log('Customer Tagged:', extracted.filter(e => e.type === 'customer_tag').length)

  console.log('\nSample items:')
  console.dir(extracted.slice(0, 10), { depth: null })

  // Connect to Supabase
  const projectRef = process.env.SUPABASE_PROJECT_REF || 'xhwqasbnsfjyxvzwueoo'
  const dbPassword = process.env.SUPABASE_DB_PASSWORD
  const connStr = `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } })
  await client.connect()

  const targetUserId = '3ea331f7-ef5c-463c-9e14-4c2fbb8a85ad' // shoaibzaynah@gmail.com
  console.log(`\nSyncing to user ${targetUserId} (shoaibzaynah@gmail.com)...`)

  let inserted = 0
  let updated = 0

  for (const item of extracted) {
    const existing = await client.query(
      'SELECT id, name FROM public.customers WHERE user_id = $1 AND phone = $2',
      [targetUserId, item.phone]
    )

    if (existing.rows.length === 0) {
      const id = crypto.randomUUID()
      await client.query(
        `INSERT INTO public.customers (id, user_id, phone, name, source, total_orders, total_spend, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 1, 0, NOW(), NOW())`,
        [id, targetUserId, item.phone, item.cleanName, 'app']
      )
      inserted++
    } else {
      // Update existing if name was generic or empty
      const curName = existing.rows[0].name || ''
      if (!curName || curName === 'Valued Customer' || curName === 'Unknown') {
        await client.query(
          'UPDATE public.customers SET name = $1, updated_at = NOW() WHERE id = $2',
          [item.cleanName, existing.rows[0].id]
        )
        updated++
      }
    }
  }

  console.log(`\nDONE! Inserted: ${inserted}, Updated: ${updated}`)
  
  // Total in public.customers now for shoaibzaynah
  const finalCount = await client.query(
    'SELECT count(*) FROM public.customers WHERE user_id = $1',
    [targetUserId]
  )
  console.log(`Total customers for shoaibzaynah now in DB: ${finalCount.rows[0].count}`)

  await client.end()
}

run().catch(console.error)
