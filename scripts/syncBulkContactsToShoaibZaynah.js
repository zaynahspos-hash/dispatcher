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

async function run() {
  loadEnv()

  const jsonPath = '/tmp/extracted_all_contacts.json'
  if (!fs.existsSync(jsonPath)) {
    console.error('File /tmp/extracted_all_contacts.json not found.')
    process.exit(1)
  }

  const contacts = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  console.log(`Loaded ${contacts.length} unique contacts to sync.`)

  const projectRef = process.env.SUPABASE_PROJECT_REF || 'xhwqasbnsfjyxvzwueoo'
  const dbPassword = process.env.SUPABASE_DB_PASSWORD
  const connStr = `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } })
  await client.connect()

  const targetUserId = '3ea331f7-ef5c-463c-9e14-4c2fbb8a85ad' // shoaibzaynah@gmail.com
  console.log(`Target merchant: ${targetUserId} (shoaibzaynah@gmail.com)`)

  // Process in chunks of 250 for high-performance parameterized upsert
  const chunkSize = 250
  let totalProcessed = 0

  for (let i = 0; i < contacts.length; i += chunkSize) {
    const chunk = contacts.slice(i, i + chunkSize)

    const values = []
    const placeholders = []
    let pIdx = 1

    chunk.forEach(c => {
      const id = crypto.randomUUID()
      // Clean name if leading with phone digits
      let name = (c.name || '').trim()
      name = name.replace(/^(?:03\d{9}|923\d{9}|3\d{9})\s*/, '').trim()
      if (!name || name.length < 2) {
        name = `Valued Customer ${c.phone.slice(-4)}`
      }

      placeholders.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5}, $${pIdx+6}, $${pIdx+7}, $${pIdx+8}, NOW(), NOW())`)
      values.push(
        id,
        targetUserId,
        c.phone,
        name,
        c.city || null,
        c.address || null,
        'app',
        c.total_orders || 1,
        c.total_spend || 0.0
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
    process.stdout.write(`\rProcessed ${totalProcessed} / ${contacts.length} contacts...`)
  }

  console.log('\nBulk upsert complete!')

  const countRes = await client.query(
    'SELECT count(*) FROM public.customers WHERE user_id = $1',
    [targetUserId]
  )
  console.log(`Total customers for shoaibzaynah in database now: ${countRes.rows[0].count}`)

  const totalAllCust = await client.query('SELECT count(*) FROM public.customers')
  console.log(`Total customers across all merchants in database: ${totalAllCust.rows[0].count}`)

  await client.end()
}

run().catch(console.error)
