# 05 — Database Rules (Supabase Pure API, Zero Prisma, snake_case Only, Strict Multi-Tenant SaaS RLS)

Comprehensive database operating rules for Zaynah's Courier Manager Multi-Tenant SaaS Engine.

---

## RULE D7 — ZERO PRISMA POLICY (STRICT & PERMANENT)
- **Prisma is completely banned.**
  - ❌ BANNED: `@prisma/client`, `prisma`, `prisma.schema`, `npx prisma db push`, `npx prisma migrate`, direct PostgreSQL TCP connections, `psql`.
  - ✅ ALLOWED: Direct `@supabase/supabase-js` client, Supabase REST endpoints, and Supabase Management API (`sbp_` tokens).
- **Why?** This application is a high-speed Vite Single-Page Application (SPA) designed to run statically. Node-dependent server ORMs like Prisma add unnecessary build weight, engine binaries, and connection pool bottlenecks.

---

## RULE D13 — USE ONLY `snake_case` ALWAYS (NEVER `camelCase`) (STRICT)
- **Strict PostgreSQL naming convention**: All table names, column names, foreign keys, constraints, trigger functions, and indexes MUST be lowercase `snake_case`.
- ❌ BANNED: `camelCase`, `PascalCase`, `"User"`, `"UserSettings"`, `"BookedHistory"`, `"Customer"`, `"UsageLog"`, `"createdAt"`, `"updatedAt"`, `"userId"`, `"orderRefNumber"`.
- ✅ MANDATORY:
  - Tables: `users`, `user_settings`, `booked_history`, `customers`, `usage_logs`.
  - Columns: `id`, `user_id`, `created_at`, `updated_at`, `email`, `role`, `settings`, `history`, `phone`, `name`, `action`, `details`.
- **Reason**: Quoted mixed-case names in PostgreSQL require double quotes everywhere in SQL queries. Unquoted queries automatically fold to lowercase, causing notorious syntax errors (`ERROR: column "userId" does not exist`), silent bugs, and broken joins.

---

## RULE D14 — UUID PRIMARY KEYS EVERYWHERE (STRICT)
- Every single table MUST use a standard UUID v4 as its primary key:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` or references `auth.users(id)`
  - Tenant references: `user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE`
- Auto-incrementing integer IDs (`serial`, `bigserial`, `1, 2, 3...`) are strictly BANNED.
- **Reason**: Integers allow enumeration attacks where one tenant can guess other tenants' order and customer IDs. UUID v4 provides 128-bit cryptographically secure isolation and maps 1:1 with Supabase Auth `auth.uid()`.

---

## RULE D15 — STRICT ZERO-DATA-SHARING MULTI-TENANT ISOLATION (RLS)
- **This dispatcher is a Multi-Tenant B2B SaaS platform.**
- **Absolute Zero Cross-Tenant Data Leakage**:
  - Tenant A (Store 1) must NEVER be able to see or access Tenant B's (Store 2) PostEx token, pickup address, booked parcels, customer directory, or usage logs.
  - Enforced at the database engine level via PostgreSQL Row Level Security (RLS) using `auth.uid() = user_id`.
  - Every single table in the public schema MUST have RLS enabled:
    ```sql
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.booked_history ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
    ```
- **Tenant Policy Pattern**:
  ```sql
  -- Read Policy
  CREATE POLICY "user_settings_read_policy" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

  -- Write Policy
  CREATE POLICY "user_settings_insert_policy" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- Update Policy
  CREATE POLICY "user_settings_update_policy" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());
  ```

---

## RULE D16 — SAAS TENANT AUTH LIFECYCLE & TOKEN SCOPING
- **Built-in Supabase Auth**:
  1. **Signup/Login**: Authenticates directly against Supabase `auth.users`.
  2. **JWT Injection**: Supabase returns a cryptographically signed JWT containing `auth.uid()`.
  3. **Auto Bearer Header**: The `@supabase/supabase-js` client automatically attaches this JWT to all REST calls.
  4. **PostgreSQL Validation**: PostgreSQL extracts `auth.uid()` from the JWT and automatically filters every query according to RLS policies.
  5. **Zero Client Security Reliance**: Even if a malicious tenant alters frontend JavaScript, the database rejects unauthorized queries at the SQL engine level.

---

## RULE D17 — PASSWORD CHANGE & RECOVERY SYSTEM (100% PURE SUPABASE AUTH API)
All password management operations MUST execute exclusively via the Supabase Auth API (`@supabase/supabase-js`) without any custom backend server or third-party auth libraries:

1. **Self-Service Forget Password Flow**:
   - Step 1: User requests password reset via `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/#type=recovery' })`.
   - Step 2: Supabase dispatches a cryptographically secure magic recovery link to the user's registered inbox.
   - Step 3: When the user clicks the link, the application URL hash contains `#type=recovery&access_token=...`.
   - Step 4: The application intercepts `#type=recovery` or `onAuthStateChange('PASSWORD_RECOVERY')` and displays `ResetPasswordModal`.
   - Step 5: User submits the new password, executed via `supabase.auth.updateUser({ password: newPassword })`.

2. **Logged-in Password Change Flow**:
   - Authenticated merchant updates password directly from settings/modal via:
     ```typescript
     const { data, error } = await supabase.auth.updateUser({ password: newPassword })
     ```
   - No current password verification or roundtrip email required; Supabase validates the active session JWT.

3. **Admin Password Reset Protocol (B2B SaaS)**:
   - For merchants without immediate SMTP access, `AuthPage.tsx` and `AuthModal.tsx` provide a direct WhatsApp assistance link to the verified administrator (`923027245937`).
   - The system administrator resets the tenant's password directly via the Supabase Admin API:
     ```typescript
     await supabase.auth.admin.updateUserById(tenantUserId, { password: temporaryPassword })
     ```

---

## 1. Core Multi-Tenant SaaS Tables (Single Source of Truth)

All tables live in `supabase/schema/SUPER_MASTER_SCHEMA.sql`:

1. **`users`**
   - `id`: UUID PRIMARY KEY (references `auth.users(id)` ON DELETE CASCADE)
   - `email`: TEXT UNIQUE NOT NULL
   - `role`: TEXT NOT NULL DEFAULT `'user'` CHECK (`role IN ('user', 'admin')`)
   - `created_at`: TIMESTAMPTZ NOT NULL DEFAULT `now()`
   - `updated_at`: TIMESTAMPTZ NOT NULL DEFAULT `now()`

2. **`user_settings`**
   - `user_id`: UUID PRIMARY KEY (references `users(id)` ON DELETE CASCADE)
   - `settings`: JSONB NOT NULL DEFAULT `'{}'` (Groq keys, PostEx token, pickup/return codes)
   - `created_at`: TIMESTAMPTZ
   - `updated_at`: TIMESTAMPTZ (auto-updated via trigger)

3. **`booked_history`**
   - `user_id`: UUID PRIMARY KEY (references `users(id)` ON DELETE CASCADE)
   - `history`: JSONB NOT NULL DEFAULT `'[]'` (Array of booked parcel records)
   - `created_at`: TIMESTAMPTZ
   - `updated_at`: TIMESTAMPTZ (auto-updated via trigger)

4. **`customers`**
   - `id`: UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
   - `user_id`: UUID NOT NULL REFERENCES `users(id)` ON DELETE CASCADE
   - `phone`: TEXT NOT NULL
   - `name`: TEXT NOT NULL
   - `created_at`: TIMESTAMPTZ
   - `updated_at`: TIMESTAMPTZ
   - `CONSTRAINT unique_tenant_customer_phone UNIQUE (user_id, phone)`

5. **`usage_logs`**
   - `id`: UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
   - `user_id`: UUID NOT NULL REFERENCES `users(id)` ON DELETE CASCADE
   - `action`: TEXT NOT NULL (`order_parsed`, `order_booked`, `advice_saved`, `loadsheet_generated`)
   - `details`: TEXT
   - `created_at`: TIMESTAMPTZ DEFAULT `now()`

---

6. **`password_resets`**
   - `id`: UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
   - `email`: TEXT NOT NULL
   - `code`: TEXT NOT NULL
   - `token`: TEXT NOT NULL
   - `expires_at`: TIMESTAMPTZ NOT NULL
   - `used`: BOOLEAN NOT NULL DEFAULT false
   - `created_at`: TIMESTAMPTZ DEFAULT `now()`

---

## 2. Backward Compatibility Views
For existing code paths, the schema provides SQL views mapping PascalCase to canonical `snake_case` tables:
- `"User"` ➔ `users`
- `"UserSettings"` ➔ `user_settings`
- `"BookedHistory"` ➔ `booked_history`
- `"Customer"` ➔ `customers`
- `"UsageLog"` ➔ `usage_logs`

---

## 3. Auth Integrity & Self-Healing Triggers (RULE D16)
To prevent Supabase GoTrue Auth `500: Database error querying schema` and identity lookups from ever failing:
1. **`tr_ensure_auth_user_integrity`**: Automatically ensures all token columns (`confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new`, `email_change_token_current`, `phone_change`, `phone_change_token`) default to `''` instead of `NULL` upon insert/update.
2. **`tr_ensure_auth_identity`**: Automatically provisions a corresponding entry in `auth.identities` whenever a user is inserted in `auth.users`.
3. **`on_auth_user_created`**: Syncs new auth users into `public.users` and initializes `public.user_settings`.

---

## 4. Supabase Storage `avatars` Bucket (RULE D17)
- **Bucket ID**: `avatars` (Public bucket, max 5MB limit).
- **Supported MIME Types**: `image/webp`, `image/png`, `image/jpeg`, `image/x-icon`.
- **Upload Optimization**: Images are automatically cropped and converted to high-quality **10–20 KB WebP format** (`image/webp`) on client canvas before upload.
- **Storage Policies**:
  - `SELECT`: Public access to all objects in `avatars` bucket.
  - `INSERT` / `UPDATE` / `DELETE`: Authenticated tenants can manage their own avatar assets.

---

## 5. 1-Command Database Setup & Verification (RULE D18)
To set up all tables, backward compatibility views, auth integrity triggers, and storage buckets on a freshly cloned repository:
```bash
npm run db:setup
```
This runs `scripts/deploySchema.js` which connects to Supabase PostgreSQL, executes `supabase/schema/SUPER_MASTER_SCHEMA.sql`, and outputs verified tables, storage buckets, and auth triggers status.

---

## 6. Master Schema Rule (RULE D6)
- Whenever any table, column, constraint, or policy is added or modified, `supabase/schema/SUPER_MASTER_SCHEMA.sql` must be updated in the SAME task.
- Zero Cloudflare rules, zero Edge worker requirements. Pure Supabase API & PostgreSQL.

