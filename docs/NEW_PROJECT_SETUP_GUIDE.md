# 🚀 New Project Setup Guide — Zero-to-Production

Step-by-step onboarding guide for initializing Zaynah's Courier Manager on a fresh system or tenant instance.

---

## 1. Clone Repository & Install Dependencies
```bash
git clone <repo-url>
cd "Zaynahs Courier Manger"
npm install
```

---

## 2. Configure Environment Variables
Create `.env.local` in the project root:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# Admin Profile Configuration
VITE_ADMIN_EMAIL=admin@zaynahs.pk

# Default Operational Keys (Optional)
VITE_GROQ_API_KEY=gsk_...
VITE_POSTEX_TOKEN=...
```

---

## 3. Bootstrap Supabase Database (Zero Prisma)
1. Open your Supabase Project SQL Editor.
2. Open `supabase/schema/SUPER_MASTER_SCHEMA.sql`.
3. Copy the entire file contents, paste into SQL Editor, and click **Run**.
4. This instantly creates all `snake_case` tables, triggers, indexes, and strict multi-tenant RLS policies.

---

## 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 5. Verify Build
```bash
npm run build
```
Verify that `dist/index.html` generates with 0 errors.
