# 🛠️ Zero-CLI Manual Setup Guide
Zaynahs Courier Manager · Supabase SQL Editor · Local Development

---

## 1. Overview
This guide provides a 100% manual, zero-CLI deployment process for setting up Zaynahs Courier Manager without needing Supabase CLI, Docker, or Postgres client tools.

---

## 2. Step 1: Bootstrap Database Schema in Supabase

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a new project or select your existing project.
3. In the left sidebar, click on **SQL Editor**.
4. Open the SQL master schema file from this repository:
   - `supabase/schema/SUPER_MASTER_SCHEMA.sql`
5. Copy the entire contents of `SUPER_MASTER_SCHEMA.sql` and paste it into the Supabase SQL Editor.
6. Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`).
7. Verify that all 5 tables (`users`, `user_settings`, `booked_history`, `customers`, `usage_logs`), indexes, triggers, and RLS policies are created successfully.

---

## 3. Step 2: Configure Environment Variables

Create or update `.env.local` in the project root:

```env
# Supabase Cloud Project Credentials
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Optional: Default PostEx & Groq keys (tenants can also enter their own in UI)
VITE_POSTEX_TOKEN=your_postex_merchant_api_token
VITE_GROQ_API_KEY=gsk_your_groq_api_key

# Admin Email for role elevation
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

---

## 4. Step 3: Install Dependencies & Run Locally

```bash
# Install node packages
npm install

# Start Vite local development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 5. Step 4: First Admin Onboarding

1. Open the app in your browser and click **Sign Up as Merchant**.
2. Register using the exact email specified in `VITE_ADMIN_EMAIL`.
3. The database trigger and client sync will automatically assign `role = 'admin'`.
4. Log in to see the **Admin Panel** tab in the navigation bar.

---

## 6. Step 5: Configure PostEx Merchant Token

1. Navigate to the **Settings** tab.
2. Enter your PostEx Merchant API Token.
3. Select your default pickup address code (e.g. `001`).
4. Enter your Groq API Key (or use system default).
5. Click **Save Settings**. Your credentials are encrypted and stored under your tenant ID in `user_settings`.
