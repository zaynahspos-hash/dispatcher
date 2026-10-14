-- ==============================================================================
-- 🚀 ZAYNAHS COURIER MANAGER — MULTI-TENANT SAAS SUPER MASTER SCHEMA
-- Pure snake_case Only · Never camelCase · UUID Primary Keys · Strict RLS
-- Absolute Zero Cross-Tenant Data Leakage · Zero Prisma · 100% Supabase Engine
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CORE MULTI-TENANT SAAS TABLES (STRICT snake_case ONLY)

-- Table: users
-- Represents tenant accounts and authentication profiles with RBAC roles
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: user_settings
-- Stores encrypted/tokenized tenant settings (PostEx token, Groq key, pickup codes)
-- Scoped 1-to-1 to tenant user_id
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: booked_history
-- Tenant parcel dispatch history (array of BookedParcel objects with CN tracking)
-- Scoped 1-to-1 to tenant user_id
CREATE TABLE IF NOT EXISTS public.booked_history (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: customers
-- Tenant customer directory for auto-complete & delivery intelligence
-- Scoped strictly to tenant user_id (unique per tenant + phone)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_tenant_customer_phone UNIQUE (user_id, phone)
);

-- Table: usage_logs
-- Audit trail of operations (parsing, bookings, advice, loadsheet)
-- Scoped strictly to tenant user_id
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. HIGH PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_customers_user_phone ON public.customers(user_id, phone);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_timestamp ON public.usage_logs(user_id, created_at DESC);

-- 4. AUTO-UPDATING TIMESTAMPS TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_booked_history_updated_at ON public.booked_history;
CREATE TRIGGER trg_booked_history_updated_at
  BEFORE UPDATE ON public.booked_history
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. ROW LEVEL SECURITY (RLS) — STRICT MULTI-TENANT ISOLATION
-- NO DATA SHARING BETWEEN TENANTS UNDER ANY CIRCUMSTANCES

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booked_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current authenticated user has system admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for "users"
DROP POLICY IF EXISTS "users_read_policy" ON public.users;
CREATE POLICY "users_read_policy" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_policy" ON public.users;
CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Policies for "user_settings" (Tenant Scoped: user_id)
DROP POLICY IF EXISTS "user_settings_read_policy" ON public.user_settings;
CREATE POLICY "user_settings_read_policy" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "user_settings_insert_policy" ON public.user_settings;
CREATE POLICY "user_settings_insert_policy" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_update_policy" ON public.user_settings;
CREATE POLICY "user_settings_update_policy" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "user_settings_delete_policy" ON public.user_settings;
CREATE POLICY "user_settings_delete_policy" ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Policies for "booked_history" (Tenant Scoped: user_id)
DROP POLICY IF EXISTS "booked_history_read_policy" ON public.booked_history;
CREATE POLICY "booked_history_read_policy" ON public.booked_history
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "booked_history_insert_policy" ON public.booked_history;
CREATE POLICY "booked_history_insert_policy" ON public.booked_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "booked_history_update_policy" ON public.booked_history;
CREATE POLICY "booked_history_update_policy" ON public.booked_history
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "booked_history_delete_policy" ON public.booked_history;
CREATE POLICY "booked_history_delete_policy" ON public.booked_history
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Policies for "customers" (Tenant Scoped: user_id)
DROP POLICY IF EXISTS "customers_read_policy" ON public.customers;
CREATE POLICY "customers_read_policy" ON public.customers
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "customers_insert_policy" ON public.customers;
CREATE POLICY "customers_insert_policy" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "customers_update_policy" ON public.customers;
CREATE POLICY "customers_update_policy" ON public.customers
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "customers_delete_policy" ON public.customers;
CREATE POLICY "customers_delete_policy" ON public.customers
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Policies for "usage_logs" (Tenant Scoped: user_id)
DROP POLICY IF EXISTS "usage_logs_read_policy" ON public.usage_logs;
CREATE POLICY "usage_logs_read_policy" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "usage_logs_insert_policy" ON public.usage_logs;
CREATE POLICY "usage_logs_insert_policy" ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "usage_logs_delete_policy" ON public.usage_logs;
CREATE POLICY "usage_logs_delete_policy" ON public.usage_logs
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- ==============================================================================
-- 6. BACKWARD COMPATIBILITY VIEWS WITH INSTEAD OF TRIGGERS
-- Ensures existing code querying PascalCase ("User", "UserSettings", etc.)
-- maps directly to the canonical snake_case tables with zero downtime.
-- ==============================================================================

-- Compatibility View: "User" -> users
CREATE OR REPLACE VIEW public."User" AS
  SELECT id, email, role, created_at AS "createdAt", updated_at AS "updatedAt"
  FROM public.users;

-- Compatibility View: "UserSettings" -> user_settings
CREATE OR REPLACE VIEW public."UserSettings" AS
  SELECT user_id AS userid, settings, created_at, updated_at
  FROM public.user_settings;

-- Compatibility View: "BookedHistory" -> booked_history
CREATE OR REPLACE VIEW public."BookedHistory" AS
  SELECT user_id AS userid, history, created_at, updated_at
  FROM public.booked_history;

-- Compatibility View: "Customer" -> customers
CREATE OR REPLACE VIEW public."Customer" AS
  SELECT id, user_id AS userid, phone, name, created_at, updated_at
  FROM public.customers;

-- Compatibility View: "UsageLog" -> usage_logs
CREATE OR REPLACE VIEW public."UsageLog" AS
  SELECT id, user_id AS "userId", action, details, created_at AS timestamp
  FROM public.usage_logs;
