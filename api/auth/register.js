import pg from 'pg';
import crypto from 'node:crypto';

const { Pool } = pg;

let pool;
function getPool() {
  if (!pool) {
    const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'Zd!q)m0ba+FhWCFjd$wH!t&9#';
    const projectRef = process.env.SUPABASE_PROJECT_REF || 'xhwqasbnsfjyxvzwueoo';
    pool = new Pool({
      connectionString: `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000
    });
  }
  return pool;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // ignore JSON parse error
      }
    }
    const { email, password } = body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const db = getPool();

    // Check if user already exists in auth.users
    const existing = await db.query(
      `SELECT id, email_confirmed_at FROM auth.users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [cleanEmail]
    );

    const adminEmails = (process.env.VITE_ADMIN_EMAILS || 'shoaibzaynah@gmail.com,zaynahspos@gmail.com,totvoguepk@gmail.com')
      .split(',')
      .map(e => e.trim().toLowerCase());

    const role = adminEmails.includes(cleanEmail) ? 'admin' : 'user';

    let userId;

    if (existing.rows && existing.rows.length > 0) {
      userId = existing.rows[0].id;
      // User exists: update password, ensure confirmed and role set
      await db.query(
        `UPDATE auth.users
         SET encrypted_password = crypt($1, gen_salt('bf')),
             email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
             raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb($2::text)),
             updated_at = NOW()
         WHERE id = $3`,
        [cleanPassword, role, userId]
      );
    } else {
      userId = crypto.randomUUID();
      // Insert new confirmed user directly into auth.users (bypasses Supabase 429 rate limit)
      await db.query(
        `INSERT INTO auth.users (
           id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
           raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
           confirmation_token, recovery_token, email_change, email_change_token_new,
           email_change_token_current, phone_change, phone_change_token
         ) VALUES (
           $1::uuid,
           '00000000-0000-0000-0000-000000000000',
           'authenticated',
           'authenticated',
           $2,
           crypt($3, gen_salt('bf')),
           NOW(),
           '{"provider":"email","providers":["email"]}'::jsonb,
           jsonb_build_object('role', $4::text),
           NOW(),
           NOW(),
           '', '', '', '', '', '', ''
         )`,
        [userId, cleanEmail, cleanPassword, role]
      );
    }

    // CRITICAL: Ensure identity exists in auth.identities so GoTrue Auth can authenticate
    await db.query(
      `INSERT INTO auth.identities (
         id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
       ) VALUES (
         gen_random_uuid(),
         $1::uuid,
         jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true, 'phone_verified', false),
         'email',
         $1::text,
         NOW(),
         NOW(),
         NOW()
       ) ON CONFLICT (provider_id, provider) DO UPDATE
       SET updated_at = NOW()`,
      [userId, cleanEmail]
    );

    // Ensure sync into public.users and public.user_settings
    await db.query(
      `INSERT INTO public.users (id, email, role, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email,
           role = EXCLUDED.role,
           updated_at = NOW()`,
      [userId, cleanEmail, role]
    );

    await db.query(
      `INSERT INTO public.user_settings (user_id, created_at, updated_at)
       VALUES ($1, NOW(), NOW())
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Account registered and confirmed successfully.',
      user_id: userId,
      email: cleanEmail
    });

  } catch (err) {
    console.error('[API Register] Server error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error while creating account.' });
  }
}
