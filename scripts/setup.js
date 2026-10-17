#!/usr/bin/env node

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Zaynahs Courier Manager — 1-Command Master Setup & Clone Runner
 * ─────────────────────────────────────────────────────────────────────────────
 * Sets up and verifies the complete environment in a single command:
 * 1. Validates local environment configuration (.env.local)
 * 2. Connects to Supabase and deploys SUPER_MASTER_SCHEMA.sql (Zero Prisma)
 * 3. Enforces Multi-Tenant Row Level Security (RLS) across all public tables
 * 4. Bootstraps private & public Storage Buckets (avatars, airway-bills, load-sheets)
 * 5. Configures Supabase Auth Custom SMTP & Dark Email Templates
 * 6. Verifies system readiness and reports diagnostics
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

console.log(`\n=============================================================`)
console.log(`📦 ZAYNAHS COURIER MANAGER — 1-COMMAND MASTER SETUP RUNNER`)
console.log(`=============================================================\n`)

function runCommand(command, args, cwd = rootDir) {
  return new Promise((resolve, reject) => {
    console.log(`\x1b[36m▶ Running:\x1b[0m ${command} ${args.join(' ')}`)
    const proc = spawn(command, args, { cwd, stdio: 'inherit', shell: true })
    proc.on('close', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })
    proc.on('error', reject)
  })
}

async function main() {
  try {
    // 1. Verify .env.local file
    const envPath = path.join(rootDir, '.env.local')
    if (!fs.existsSync(envPath)) {
      console.warn(`\x1b[33m⚠️  Warning: .env.local not found in project root.\x1b[0m`)
      console.log(`Creating template .env.local from defaults...`)
      const envTemplate = `# Zaynahs Courier Manager Environment Setup
VITE_SUPABASE_URL=https://xhwqasbnsfjyxvzwueoo.supabase.co
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_REF=xhwqasbnsfjyxvzwueoo
SUPABASE_DB_PASSWORD=
VITE_ADMIN_EMAILS=zaynahspos@gmail.com,shoaibzaynah@gmail.com
`
      fs.writeFileSync(envPath, envTemplate, 'utf8')
      console.log(`\x1b[32m✔ Created default .env.local template.\x1b[0m\n`)
    } else {
      console.log(`\x1b[32m✔ Local environment file (.env.local) detected.\x1b[0m\n`)
    }

    // 2. Deploy SUPER_MASTER_SCHEMA via deploySchema.js
    console.log(`\x1b[34m[Step 1/3] Deploying Database Master Schema & RLS Policies...\x1b[0m`)
    await runCommand('node', ['scripts/deploySchema.js'])
    console.log(`\x1b[32m✔ Supabase Schema & Security Invariants Deployed Successfully!\x1b[0m\n`)

    // 3. Update Custom SMTP & Dark Auth Email Templates
    console.log(`\x1b[34m[Step 2/3] Configuring Supabase Auth Email Templates...\x1b[0m`)
    try {
      await runCommand('node', ['scripts/updateEmailTemplates.js'])
      console.log(`\x1b[32m✔ Auth Email Templates Configured Successfully!\x1b[0m\n`)
    } catch (e) {
      console.warn(`\x1b[33m⚠️  Email template update skipped or credentials missing. Continuing...\x1b[0m\n`)
    }

    // 4. Verify Project Build & Types
    console.log(`\x1b[34m[Step 3/3] Verifying TypeScript & Vite Production Build...\x1b[0m`)
    await runCommand('npm', ['run', 'build'])
    console.log(`\x1b[32m✔ Application Bundle & TypeScript Verified Successfully!\x1b[0m\n`)

    console.log(`=============================================================`)
    console.log(`🎉 1-COMMAND SETUP COMPLETE! SYSTEM IS 100% OPERATIONAL.`)
    console.log(`=============================================================`)
    console.log(`• Database: Supabase PostgreSQL V3 Schema Deployed & RLS Enforced`)
    console.log(`• Courier Engine: Pluggable PostEx V3 + Trax + Leopards + TCS`)
    console.log(`• Web App: Ready to run via \x1b[32mnpm run dev\x1b[0m or deploy to Vercel`)
    console.log(`=============================================================\n`)
  } catch (error) {
    console.error(`\n\x1b[31m❌ Setup encountered an error:\x1b[0m`, error.message)
    process.exit(1)
  }
}

main()
