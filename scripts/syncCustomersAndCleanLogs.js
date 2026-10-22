import pg from 'pg'
import fs from 'fs'
import path from 'path'
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
  if (!raw) return ''
  const digits = String(raw).replace(/\D/g, '')
  if (digits.startsWith('92') && digits.length === 12) {
    return '0' + digits.slice(2)
  }
  if (digits.startsWith('3') && digits.length === 10) {
    return '0' + digits
  }
  return digits
}

async function run() {
  loadEnv()
  const projectRef = process.env.SUPABASE_PROJECT_REF || 'xhwqasbnsfjyxvzwueoo'
  const dbPassword = process.env.SUPABASE_DB_PASSWORD

  const connStr = `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } })
  await client.connect()

  // 1. Inspect existing customers table
  const curCust = await client.query('SELECT count(*), source FROM public.customers GROUP BY source')
  console.log('Current customers by source:', curCust.rows)

  // 2. Fetch all booked_history
  const histRows = await client.query('SELECT user_id, history FROM public.booked_history')
  console.log(`Found ${histRows.rows.length} booked_history rows.`)

  let insertedCount = 0
  let updatedCount = 0

  for (const row of histRows.rows) {
    const userId = row.user_id
    const history = Array.isArray(row.history) ? row.history : []

    for (const parcel of history) {
      const phone = cleanPhone(parcel.phone)
      const name = (parcel.name || '').trim()
      const source = parcel.source === 'postex_portal' ? 'postex_portal' : 'app'
      const bookingDate = parcel.bookingDate || parcel.updated_at || new Date().toISOString()

      if (phone && name) {
        // Upsert customer with source
        const res = await client.query(`
          INSERT INTO public.customers (user_id, phone, name, source, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $5)
          ON CONFLICT (user_id, phone) DO UPDATE SET
            name = EXCLUDED.name,
            source = CASE 
              WHEN EXCLUDED.source = 'postex_portal' AND public.customers.source = 'app' THEN public.customers.source 
              ELSE EXCLUDED.source 
            END,
            updated_at = EXCLUDED.updated_at
        `, [userId, phone, name, source, bookingDate])
        insertedCount++
      }
    }
  }

  console.log(`Processed ${insertedCount} parcel customer upserts.`)

  const afterCust = await client.query('SELECT count(*), source FROM public.customers GROUP BY source')
  console.log('Updated customers by source:', afterCust.rows)

  // 3. Clear spam usage_logs as requested: "Recent Merchant Activity (21) ye activity nahi chahye db bharni nahi h"
  const delLogs = await client.query("DELETE FROM public.usage_logs WHERE action IN ('order_parsed', 'API_KEY_ARCHIVED', 'api_key_archived') OR action LIKE '%parse%'")
  console.log(`Cleaned up ${delLogs.rowCount} spammy activity logs from usage_logs.`)

  await client.end()
}

run().catch(console.error)
