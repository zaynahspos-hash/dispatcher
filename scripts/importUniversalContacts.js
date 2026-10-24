/**
 * Universal Contact & Customer Importer for Zaynahs Logistics
 * -------------------------------------------------------------
 * Supports ALL contact file types:
 *  - Google Contacts CSV (myContacts / Android / iPhone export)
 *  - Shopify Customer Export CSV
 *  - Standard CRM / Excel CSV (name, phone, city, address)
 *  - Raw WhatsApp / Phone Number exports
 *
 * Usage:
 *   node scripts/importUniversalContacts.js [filePath] [merchantEmail]
 *
 * Example:
 *   node scripts/importUniversalContacts.js "/Users/shoaib/Downloads/contacts.csv" "shoaibzaynah@gmail.com"
 */

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

function cleanPhone(raw) {
  if (!raw) return null
  const str = String(raw).trim().replace(/['"]/g, '')
  if (str.includes('*') || str.includes('#')) return null

  // Split multi-phone numbers (e.g. Google Contacts separated by ::: or / or comma)
  const parts = str.split(/:::|\/|,/)
  for (const p of parts) {
    const digits = p.replace(/\D/g, '')
    if (digits.startsWith('923') && digits.length === 12) {
      return '0' + digits.slice(2)
    }
    if (digits.startsWith('03') && digits.length === 11) {
      return digits
    }
    if (digits.startsWith('3') && digits.length === 10) {
      return '0' + digits
    }
  }
  return null
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

const shopifyOrderRegex = /^(\d{4,7})\b/

async function run() {
  loadEnv()

  const args = process.argv.slice(2)
  const filePath = args[0] || path.resolve(process.env.HOME || '', 'Downloads/contacts.csv')
  const targetEmail = args[1] || 'shoaibzaynah@gmail.com'

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    console.log('Usage: node scripts/importUniversalContacts.js <filePath> [merchantEmail]')
    process.exit(1)
  }

  console.log(`\n======================================================`)
  console.log(`📦 Universal Contact & Customer Importer`)
  console.log(`======================================================`)
  console.log(`File: ${filePath}`)
  console.log(`Target Merchant: ${targetEmail}`)

  const content = fs.readFileSync(filePath, 'utf8')
  const rows = parseCsv(content)
  console.log(`Parsed ${rows.length} total rows from file.`)

  const header = rows[0].map(h => h.toLowerCase())

  // Dynamic column detection
  const fnIdx = header.findIndex(h => h.includes('first name') || h === 'name' || h === 'fn' || h === 'customer name')
  const lnIdx = header.findIndex(h => h.includes('last name') || h === 'ln' || h === 'surname')
  const cityIdx = header.findIndex(h => h.includes('city') || h === 'ct')
  const addrIdx = header.findIndex(h => h.includes('address') || h === 'street')
  const notesIdx = header.findIndex(h => h.includes('notes') || h === 'description')
  const phoneIndices = header
    .map((h, i) => (h.includes('phone') || h.includes('mobile') || h.includes('contact') || h === 'tel') ? i : -1)
    .filter(i => i !== -1)

  const extracted = new Map()

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]

    // Find phone
    let phone = null
    for (const pIdx of phoneIndices) {
      if (row[pIdx]) {
        phone = cleanPhone(row[pIdx])
        if (phone) break
      }
    }
    // Check first name column if it contains a phone
    if (!phone && fnIdx !== -1 && row[fnIdx]) {
      phone = cleanPhone(row[fnIdx])
    }
    // Check all columns as fallback
    if (!phone) {
      for (const col of row) {
        phone = cleanPhone(col)
        if (phone) break
      }
    }
    if (!phone) continue

    // Extract details
    const fn = (fnIdx !== -1 ? row[fnIdx] : '') || ''
    const ln = (lnIdx !== -1 ? row[lnIdx] : '') || ''
    const city = (cityIdx !== -1 ? row[cityIdx] : '') || ''
    const addr = (addrIdx !== -1 ? row[addrIdx] : '') || ''
    const notes = (notesIdx !== -1 ? row[notesIdx] : '') || ''

    // Clean name
    let cleanName = [fn, ln].filter(Boolean).join(' ').trim()
    const digitsOnly = cleanName.replace(/\D/g, '')

    if (shopifyOrderRegex.test(fn) && !/^\d{10,}$/.test(fn)) {
      const match = fn.match(shopifyOrderRegex)
      const ordId = match[1]
      const rem = [fn.replace(ordId, '').trim(), ln].filter(Boolean).join(' ').trim()
      cleanName = rem ? `${rem} (Order #${ordId})` : `Order #${ordId}`
    } else if (digitsOnly.length >= 10 && cleanName.length <= 15) {
      cleanName = `Customer ${phone}`
    } else {
      cleanName = cleanName
        .replace(/^(?:03\d{9}|923\d{9}|3\d{9})\s*/, '')
        .replace(/\bgood\s*customer\b/gi, '')
        .replace(/\bcustomer\b/gi, '')
        .replace(/\bcusto\b/gi, '')
        .replace(/[#()"'`,;]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    if (!cleanName || cleanName.length < 2) {
      cleanName = `Valued Customer ${phone.slice(-4)}`
    }

    // Orders / Spend from notes if available
    let totalOrders = 1
    let totalSpend = 0.0
    const mOrders = notes.match(/Total Orders:\s*(\d+)/i)
    if (mOrders) totalOrders = Math.max(1, parseInt(mOrders[1], 10))
    const mSpend = notes.match(/Total Spent:\s*([\d.]+)/i)
    if (mSpend) totalSpend = parseFloat(mSpend[1])

    if (!extracted.has(phone)) {
      extracted.set(phone, {
        phone,
        name: cleanName,
        city: city.replace(/['"]/g, '').trim(),
        address: addr.replace(/['"]/g, '').trim(),
        total_orders: totalOrders,
        total_spend: totalSpend
      })
    } else {
      const existing = extracted.get(phone)
      if (existing.name.startsWith('Valued Customer') && !cleanName.startsWith('Valued Customer')) {
        existing.name = cleanName
      }
      if (!existing.city && city) existing.city = city.trim()
      if (!existing.address && addr) existing.address = addr.trim()
      existing.total_orders = Math.max(existing.total_orders, totalOrders)
      existing.total_spend = Math.max(existing.total_spend, totalSpend)
    }
  }

  const contactsList = Array.from(extracted.values())
  console.log(`\nExtracted ${contactsList.length} unique valid customer phone numbers!`)

  // Database Connection
  const projectRef = process.env.SUPABASE_PROJECT_REF || 'xhwqasbnsfjyxvzwueoo'
  const dbPassword = process.env.SUPABASE_DB_PASSWORD
  const connStr = `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } })
  await client.connect()

  // Find target user ID
  const userRes = await client.query('SELECT id, email FROM auth.users WHERE email = $1', [targetEmail])
  if (userRes.rows.length === 0) {
    console.error(`Merchant with email ${targetEmail} not found in database.`)
    await client.end()
    process.exit(1)
  }
  const targetUserId = userRes.rows[0].id
  console.log(`Found Merchant ID: ${targetUserId} for ${targetEmail}`)

  // Batch Upsert in chunks of 250
  const chunkSize = 250
  let totalProcessed = 0

  for (let i = 0; i < contactsList.length; i += chunkSize) {
    const chunk = contactsList.slice(i, i + chunkSize)
    const values = []
    const placeholders = []
    let pIdx = 1

    chunk.forEach(c => {
      const id = crypto.randomUUID()
      placeholders.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5}, $${pIdx+6}, $${pIdx+7}, $${pIdx+8}, NOW(), NOW())`)
      values.push(
        id,
        targetUserId,
        c.phone,
        c.name,
        c.city || null,
        c.address || null,
        'app',
        c.total_orders,
        c.total_spend
      )
      pIdx += 9
    })

    const query = `
      INSERT INTO public.customers (
        id, user_id, phone, name, city, address, source, total_orders, total_spend, created_at, updated_at
      )
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (user_id, phone) DO UPDATE
      SET
        name = CASE
          WHEN EXCLUDED.name IS NOT NULL AND EXCLUDED.name != '' AND EXCLUDED.name NOT LIKE 'Valued Customer%' THEN EXCLUDED.name
          ELSE public.customers.name
        END,
        city = COALESCE(NULLIF(EXCLUDED.city, ''), public.customers.city),
        address = COALESCE(NULLIF(EXCLUDED.address, ''), public.customers.address),
        total_orders = GREATEST(public.customers.total_orders, EXCLUDED.total_orders),
        total_spend = GREATEST(public.customers.total_spend, EXCLUDED.total_spend),
        updated_at = NOW()
    `
    await client.query(query, values)
    totalProcessed += chunk.length
    process.stdout.write(`\rProcessed ${totalProcessed} / ${contactsList.length} contacts...`)
  }

  console.log('\n✅ Bulk sync successfully completed!')

  const countRes = await client.query('SELECT count(*) FROM public.customers WHERE user_id = $1', [targetUserId])
  console.log(`📈 Total customers for ${targetEmail} in database: ${countRes.rows[0].count}`)

  const totalAllCust = await client.query('SELECT count(*) FROM public.customers')
  console.log(`🌐 Total customers across all merchants in database: ${totalAllCust.rows[0].count}`)

  await client.end()
}

run().catch(console.error)
