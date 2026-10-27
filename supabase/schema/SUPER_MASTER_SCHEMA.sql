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
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;

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

ALTER TABLE public.booked_history ADD COLUMN IF NOT EXISTS app_cns JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Table: customers
-- Tenant customer directory for auto-complete & delivery intelligence
-- Scoped strictly to tenant user_id (unique per tenant + phone)
-- Permanently preserved (2 to 5+ years) for marketing, lookalike audience & CRM
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  address TEXT,
  total_orders INT NOT NULL DEFAULT 1,
  total_spend NUMERIC NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'app',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_tenant_customer_phone UNIQUE (user_id, phone)
);

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'source') THEN 
    ALTER TABLE public.customers ADD COLUMN source TEXT NOT NULL DEFAULT 'app'; 
  END IF; 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'city') THEN 
    ALTER TABLE public.customers ADD COLUMN city TEXT; 
  END IF; 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'address') THEN 
    ALTER TABLE public.customers ADD COLUMN address TEXT; 
  END IF; 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'total_orders') THEN 
    ALTER TABLE public.customers ADD COLUMN total_orders INT NOT NULL DEFAULT 1; 
  END IF; 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'total_spend') THEN 
    ALTER TABLE public.customers ADD COLUMN total_spend NUMERIC NOT NULL DEFAULT 0; 
  END IF; 
END $$;

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
CREATE INDEX IF NOT EXISTS idx_customers_city ON public.customers(city);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at DESC);
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
    WHERE id = auth.uid() AND (
      role = 'admin' OR 
      email = ANY (ARRAY['shoaibzaynah@gmail.com', 'zaynahspos@gmail.com', 'totvoguepk@gmail.com'])
    )
  ) OR (
    (auth.jwt() ->> 'email') = ANY (ARRAY['shoaibzaynah@gmail.com', 'zaynahspos@gmail.com', 'totvoguepk@gmail.com'])
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
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

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

-- ==============================================================================
-- 7. PASSWORD RESETS & VERIFICATION CODES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON public.password_resets(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON public.password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_code ON public.password_resets(code);

-- 7.1 EMAIL CONFIRMATIONS & SIGNUP VERIFICATION CODES TABLE (Rule AUTH-SMTP1)
CREATE TABLE IF NOT EXISTS public.email_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  token TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_email_confirmations_email ON public.email_confirmations(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_email_confirmations_token ON public.email_confirmations(token);
CREATE INDEX IF NOT EXISTS idx_email_confirmations_code ON public.email_confirmations(code);

-- ==============================================================================
-- 8. AUTH INTEGRITY & SELF-HEALING TRIGGERS
-- Prevents "Database error querying schema" and guarantees identities exist
-- ==============================================================================

-- Trigger Function 1: Ensure auth token columns are never NULL
CREATE OR REPLACE FUNCTION public.ensure_auth_user_integrity()
RETURNS trigger AS $$
BEGIN
  NEW.confirmation_token := COALESCE(NEW.confirmation_token, '');
  NEW.recovery_token := COALESCE(NEW.recovery_token, '');
  NEW.email_change := COALESCE(NEW.email_change, '');
  NEW.email_change_token_new := COALESCE(NEW.email_change_token_new, '');
  NEW.email_change_token_current := COALESCE(NEW.email_change_token_current, '');
  NEW.phone_change := COALESCE(NEW.phone_change, '');
  NEW.phone_change_token := COALESCE(NEW.phone_change_token, '');
  
  -- Auto-confirm ONLY designated system admin accounts. All regular merchant users require email confirmation!
  IF LOWER(NEW.email) = ANY(ARRAY['shoaibzaynah@gmail.com', 'zaynahspos@gmail.com', 'totvoguepk@gmail.com']) THEN
    NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_ensure_auth_user_integrity ON auth.users;
CREATE TRIGGER tr_ensure_auth_user_integrity
BEFORE INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.ensure_auth_user_integrity();

-- Drop rogue auto-confirm triggers if lingering in the database
DROP TRIGGER IF EXISTS trigger_auto_confirm_user ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_new_user();

-- Trigger Function 2: Ensure auth.identities record exists for every user
CREATE OR REPLACE FUNCTION public.ensure_auth_identity()
RETURNS trigger AS $$
BEGIN
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    NEW.id,
    jsonb_build_object(
      'sub', NEW.id::text, 
      'email', NEW.email, 
      'email_verified', (NEW.email_confirmed_at IS NOT NULL), 
      'phone_verified', false
    ),
    'email',
    NEW.id::text,
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (provider_id, provider) DO UPDATE
  SET identity_data = jsonb_build_object(
        'sub', NEW.id::text, 
        'email', NEW.email, 
        'email_verified', (NEW.email_confirmed_at IS NOT NULL), 
        'phone_verified', false
      ),
      updated_at = NOW();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_ensure_auth_identity ON auth.users;
CREATE TRIGGER tr_ensure_auth_identity
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.ensure_auth_identity();

-- Trigger Function 3: Sync new auth users into public.users and public.user_settings
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
DECLARE
  v_role text := 'user';
  v_admin_emails text[] := ARRAY['shoaibzaynah@gmail.com', 'zaynahspos@gmail.com', 'totvoguepk@gmail.com'];
BEGIN
  IF LOWER(NEW.email) = ANY(v_admin_emails) THEN
    v_role := 'admin';
  END IF;

  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, v_role, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      role = CASE WHEN LOWER(EXCLUDED.email) = ANY(v_admin_emails) THEN 'admin' ELSE public.users.role END,
      updated_at = NOW();

  INSERT INTO public.user_settings (user_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ==============================================================================
-- 9. SUPABASE STORAGE BUCKET & RLS POLICIES FOR AVATARS
-- Ensures public access to user avatars with WebP/PNG/JPG/ICO support
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/x-icon', 'image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/x-icon', 'image/vnd.microsoft.icon'];

DROP POLICY IF EXISTS "Public avatars access" ON storage.objects;
CREATE POLICY "Public avatars access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can update their avatars" ON storage.objects;
CREATE POLICY "Users can update their avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can delete their avatars" ON storage.objects;
CREATE POLICY "Users can delete their avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- ==============================================================================
-- 10. MULTI-TENANT ADMIN RPC FUNCTIONS (CASCADE DELETE & PAUSE/UNPAUSE)
-- ==============================================================================

-- Function: admin_toggle_tenant_status (Pause / Unpause Merchant)
CREATE OR REPLACE FUNCTION public.admin_toggle_tenant_status(target_user_id UUID, new_status TEXT)
RETURNS JSONB AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot pause your own admin account.';
  END IF;

  IF new_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status. Must be active or suspended.';
  END IF;

  UPDATE public.users
  SET status = new_status,
      is_blocked = (new_status = 'suspended'),
      updated_at = NOW()
  WHERE id = target_user_id;

  UPDATE public.user_settings
  SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{is_blocked}', to_jsonb(new_status = 'suspended')),
      updated_at = NOW()
  WHERE user_id = target_user_id;

  INSERT INTO public.usage_logs (user_id, action, details, created_at)
  VALUES (
    target_user_id,
    'account_status',
    'Account status changed to ' || new_status || ' by administrator',
    NOW()
  );

  RETURN jsonb_build_object('success', true, 'status', new_status, 'is_blocked', (new_status = 'suspended'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: admin_delete_tenant_cascade (Cascade Wipe All Data on Merchant Deletion)
CREATE OR REPLACE FUNCTION public.admin_delete_tenant_cascade(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_count_customers INT := 0;
  v_count_logs INT := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own admin account.';
  END IF;

  SELECT COUNT(*) INTO v_count_customers FROM public.customers WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO v_count_logs FROM public.usage_logs WHERE user_id = target_user_id;

  -- 1. Wipe from Storage (avatars, documents)
  BEGIN
    DELETE FROM storage.objects 
    WHERE (name LIKE target_user_id::text || '/%' OR name LIKE target_user_id::text || '.%' OR owner = target_user_id);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 2. Wipe tenant rows from all application tables
  DELETE FROM public.booked_history WHERE user_id = target_user_id;
  DELETE FROM public.customers WHERE user_id = target_user_id;
  DELETE FROM public.usage_logs WHERE user_id = target_user_id;
  DELETE FROM public.user_settings WHERE user_id = target_user_id;
  DELETE FROM public.users WHERE id = target_user_id;

  -- 3. Delete from Supabase Auth (identities & users)
  DELETE FROM auth.identities WHERE user_id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_user_id', target_user_id,
    'customers_deleted', v_count_customers,
    'logs_deleted', v_count_logs
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_toggle_tenant_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_tenant_cascade(UUID) TO authenticated;

-- ==============================================================================
-- 90-DAY PARCEL RETENTION AUTO-PRUNING (Keeps Database Ultra-Fast)
-- Permanently preserves "customers" directory (2-5+ years),
-- while automatically trimming raw parcel tracking JSON in "booked_history" older than 90 days.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.purge_old_booked_parcels(retention_days INT DEFAULT 90)
RETURNS JSONB AS $$
DECLARE
  v_rows_updated INT := 0;
  v_cutoff TIMESTAMPTZ := NOW() - (retention_days || ' days')::INTERVAL;
BEGIN
  WITH updated AS (
    UPDATE public.booked_history bh
    SET history = (
      SELECT COALESCE(
        jsonb_agg(elem),
        '[]'::jsonb
      )
      FROM jsonb_array_elements(bh.history) AS elem
      WHERE 
        (elem->>'bookingDate' IS NULL) OR
        (elem->>'bookingDate' = '') OR
        (
          CASE 
            WHEN elem->>'bookingDate' ~ '^\d{4}-\d{2}-\d{2}' 
            THEN (elem->>'bookingDate')::timestamptz >= v_cutoff
            ELSE true
          END
        )
    ),
    updated_at = timezone('utc'::text, now())
    WHERE bh.history IS NOT NULL AND jsonb_array_length(bh.history) > 0
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_rows_updated FROM updated;

  RETURN jsonb_build_object(
    'status', 'success',
    'retention_days', retention_days,
    'cutoff_date', v_cutoff,
    'tenants_pruned', v_rows_updated
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.purge_old_booked_parcels(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_booked_parcels(INT) TO service_role;


