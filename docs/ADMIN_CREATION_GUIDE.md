# 🛠️ Admin Creation Guide — Step-by-Step

Instructions for bootstrapping the first administrator account on a fresh Supabase deployment.

---

## 1. Prerequisites
- A running Supabase project with `supabase/schema/SUPER_MASTER_SCHEMA.sql` applied.
- `.env.local` configured with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## 2. Setting Up the Admin User

### Step 1: Set Admin Email in Environment
In `.env.local`:
```env
VITE_ADMIN_EMAIL=your-admin-email@domain.com
```

### Step 2: Sign Up via Application UI
1. Launch the local development server:
   ```bash
   npm run dev
   ```
2. Click **Sign In / Sign Up** in the header.
3. Switch to **Sign Up** mode and register using the exact email specified in `VITE_ADMIN_EMAIL`.
4. Enter a strong password and complete registration.

### Step 3: Verify Admin Role in Database
Run this query via Supabase SQL Editor:
```sql
SELECT id, email, role, "createdAt"
FROM public."User"
WHERE email = 'your-admin-email@domain.com';
```
The `role` column must return `admin`. If it displays `user`, run:
```sql
UPDATE public."User" SET role = 'admin' WHERE email = 'your-admin-email@domain.com';
```

---

## 3. Verify Admin Panel Access
1. Refresh the web application.
2. Verify that the **Admin Panel** tab appears in the navigation bar.
3. Open the Admin Panel and verify that global usage logs, tenant lists, and customer CRM tools are accessible.
