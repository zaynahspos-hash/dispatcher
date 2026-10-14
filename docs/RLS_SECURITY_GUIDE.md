# 🔐 Multi-Tenant SaaS Row Level Security (RLS) Guide — Roman Urdu & English

Complete guide to Row Level Security (RLS), multi-tenant SaaS isolation, UUID foreign keys, pure `snake_case` tables, and role-based policies for Zaynah's Courier Manager.

---

## 1. Multi-Tenant SaaS Model & Zero Data Sharing Rule

**Zaynah's Courier Manager is a B2B Multi-Tenant SaaS Platform.**
Har store owner / merchant ek alag **Tenant** hai.

```
┌─────────────────────────────────────────────────────────────┐
│                 B2B Multi-Tenant SaaS Isolation             │
├──────────────────────────────┬──────────────────────────────┤
│    Tenant A (Merchant 1)     │    Tenant B (Merchant 2)     │
│   UUID: 1111-1111-1111-1111  │   UUID: 2222-2222-2222-2222  │
│                              │                              │
│ • Apni Booked History dekhe  │ • Apni Booked History dekhe  │
│ • Apna PostEx API Token      │ • Apna PostEx API Token      │
│ • Apna Customer CRM Data     │ • Apna Customer CRM Data     │
│ • Apne Usage Logs            │ • Apne Usage Logs            │
└──────────────────────────────┴──────────────────────────────┘
                               ▲
                               │
               🔒 Zero Cross-Tenant Data Sharing
                     Strict PostgreSQL RLS
```

**Absolute Invariant**: Tenant A kabhi bhi Tenant B ka koi bhi parcel, tracking number, phone number, ya PostEx token NAHI dekh sakta. Zero leakage.

---

## 2. Table-by-Table Multi-Tenant Policy Matrix (STRICT `snake_case`)

| Table Name (snake_case) | Tenant Scoping Column | Normal Tenant Access | Admin Access |
|---|---|---|---|
| `public.users` | `id` | Read/Update own tenant record | Global inspect all tenants |
| `public.user_settings` | `user_id` | Read/Write own API keys & settings | Global config review |
| `public.booked_history` | `user_id` | Read/Write own booked parcels | Global delivery metrics |
| `public.customers` | `user_id` | Read/Write own customer directory | Global fraud screening |
| `public.usage_logs` | `user_id` | Read/Write own operation logs | Global activity audit |

---

## 3. SQL Policy Definitions (Canonical snake_case)

### Enable RLS Across All Tables
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booked_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
```

### Security Definer Helper Function: `is_admin()`
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Strict Tenant Policy Examples
```sql
-- Read Policy on user_settings
CREATE POLICY "user_settings_read_policy" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- Write / Update Policy on user_settings
CREATE POLICY "user_settings_update_policy" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Insert Policy on customers
CREATE POLICY "customers_insert_policy" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## 4. Verification & Diagnostic Commands
Run these queries via Supabase SQL Editor or Management API to inspect active policies:

```sql
-- Sab tables ka RLS status check karo (Sab tables pe rowsecurity = true hona chahiye)
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Kisi specific table ki active policies dekho
SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'booked_history';
```

---

## 5. Common RLS Errors & Fixes
| Error Message | Cause | Resolution |
|---|---|---|
| `new row violates row-level security policy` | Insert karte waqt `user_id` column mein logged-in user ka `auth.uid()` pass nahi kiya | Ensure insert payload assigns `user_id: user.id` |
| `PGRST116: JSON object requested, multiple (or no) rows returned` | Tenant ke liye table mein row create nahi hui aur code `.single()` use kar raha hai | Replace with `.maybeSingle()` or trigger initial profile creation on signup |
| Admin panel blank | Admin user ki row mein `role` column `'user'` set hai | Set `UPDATE public.users SET role = 'admin' WHERE email = 'admin@example.com';` |
