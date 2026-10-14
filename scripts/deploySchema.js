import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function run() {
  const schemaPath = path.resolve(__dirname, '../supabase/schema/SUPER_MASTER_SCHEMA.sql')
  const sql = fs.readFileSync(schemaPath, 'utf8')

  const connectionStrings = [
    // Direct host (IPv6 or IPv4)
    `postgresql://postgres:${encodeURIComponent('Zd!q)m0ba+FhWCFjd$wH!t&9#')}@db.xhwqasbnsfjyxvzwueoo.supabase.co:5432/postgres`,
    // Transaction Pooler (IPv4)
    `postgresql://postgres.xhwqasbnsfjyxvzwueoo:${encodeURIComponent('Zd!q)m0ba+FhWCFjd$wH!t&9#')}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
    // Session Pooler (IPv4)
    `postgresql://postgres.xhwqasbnsfjyxvzwueoo:${encodeURIComponent('Zd!q)m0ba+FhWCFjd$wH!t&9#')}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`
  ]

  let client = null
  let connected = false

  for (const connStr of connectionStrings) {
    try {
      console.log(`Connecting to: ${connStr.replace(/:[^:@]+@/, ':****@')}...`)
      client = new Client({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false }
      })
      await client.connect()
      connected = true
      console.log('Connected successfully!')
      break
    } catch (err) {
      console.warn(`Connection failed:`, err.message)
    }
  }

  if (!connected || !client) {
    console.error('All connection attempts failed.')
    process.exit(1)
  }

  try {
    console.log('Executing SUPER_MASTER_SCHEMA.sql...')
    await client.query(sql)
    console.log('Schema executed successfully!')

    // Verify tables
    const res = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `)
    console.log('\nVerified Public Tables & RLS Status:')
    console.table(res.rows)
  } catch (err) {
    console.error('Error executing schema:', err)
  } finally {
    await client.end()
  }
}

run()
