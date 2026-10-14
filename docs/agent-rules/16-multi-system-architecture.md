# 16 — Multi-System Architecture & Multi-Tenant User Isolation
Zaynahs Courier Manager · B2B Multi-Tenant SaaS Isolation · Role-Based Access Control

---

## 1. Multi-Tenant SaaS Isolation & Zero Data Sharing (RULE D15)
- **Tenant Scope**: Each merchant/store owner is a discrete tenant uniquely identified by their Supabase UUID (`auth.uid()`).
- **Zero Cross-Tenant Leakage**: Tenant A must NEVER see, query, or mutate Tenant B's:
  - PostEx merchant tokens or warehouse pickup codes.
  - Booked parcels, tracking history, or loadsheets.
  - Customer directory and phone numbers.
  - Operation usage logs.
- **Engine-Level Enforcement**: Multi-tenant boundaries are enforced directly inside PostgreSQL via Row Level Security (RLS) on `auth.uid() = user_id`. Client-side filters are merely UX conveniences; security is 100% database-guaranteed.

---

## 2. UUID v4 Primary & Foreign Keys (RULE D14)
- **Cryptographic Security**: Every tenant and entity uses UUID v4 (`gen_random_uuid()`).
- **Anti-Enumeration**: Auto-increment integer IDs (`1, 2, 3...`) are strictly banned to prevent merchant ID enumeration attacks.
- **Direct Auth Coupling**: `user_id UUID REFERENCES public.users(id)` directly maps to Supabase `auth.users(id)`.

---

## 3. Strict `snake_case` Standard (RULE D13)
- All tables and columns are strictly lowercase `snake_case`:
  - Tables: `users`, `user_settings`, `booked_history`, `customers`, `usage_logs`.
  - Columns: `id`, `user_id`, `created_at`, `updated_at`, `phone`, `name`, `action`, `details`.
- Banned: `camelCase`, `PascalCase`, `"User"`, `"UserSettings"`, `"BookedHistory"`, `"createdAt"`, `"userId"`.

---

## 4. Role-Based Access Control (RBAC)
- **Normal Merchant (`role = 'user'`)**:
  - Full access to Parcel Parser, Parcel Table, Booked History, and Personal Settings.
  - Can only read and write their own data (`auth.uid() = user_id`).
  - No access to other tenants' data or the Admin Panel.
- **System Administrator (`role = 'admin'`)**:
  - Access to dedicated `AdminPanel.tsx`.
  - Elevated via PostgreSQL security-definer function `public.is_admin()`.
  - Can audit global `usage_logs`, inspect tenant health, and view cross-tenant customer CRM for fraud detection.
  - Admin operations are strictly audit-logged in `usage_logs`.
- **Secret Protection**: Never expose the Supabase `service_role` key in frontend code. All admin operations use standard JWT authentication checked by `is_admin()`.
