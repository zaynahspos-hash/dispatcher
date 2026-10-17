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

---

## 5. Multi-Tenant Architecture & Isolated Database Concept (RULE MT-ISOLATE)
- **Official System Name**: **Multi-Tenant Architecture** (specifically the **Database-per-Tenant / Isolated Database Model / Silo Model**).
- **Core Operating Mechanics**:
  - **Independent Tenant Data Space**: Every tenant (e.g. Sarmad and Ali) operates within their own isolated data environment as if they have their own completely separate database.
  - **Absolute Segregation**: Tenant data remains 100% segregated and independent; there is zero data sharing or bleed between merchants.
  - **Identical ID Conflict Freedom**: If two tenants have the exact same custom order ID, customer phone number, or tracking reference (e.g. both have Order ID `1` or `tv-1001`), there is **ZERO conflict, error, or collision**. Each entity is strictly scoped to that tenant's identifier.
  - **Zero Cross-Tenant Visibility**: A tenant can never view, search, or access another tenant's orders, customer directory, or courier configurations.
- **Multi-Tenancy 3 Core Architecture Models Reference**:
  1. **Database-per-Tenant (Silo Model)**: Each tenant has their own dedicated or isolated virtual database. Maximum isolation, zero leakage, highest enterprise security. This is our primary architecture model.
  2. **Schema-per-Tenant**: Single database engine with separate PostgreSQL schemas per tenant.
  3. **Shared Database, Shared Schema**: Shared tables partitioned logically via `user_id` composite keys and enforced at the PostgreSQL kernel layer via Row Level Security (RLS) policies (`auth.uid() = user_id`).
- **Short Definition**: *Multi-Tenant System with Database-per-Tenant (Isolated Database) approach.*
