import pg from 'pg';
import fs from 'node:fs';

// Auto-load .env.local in local dev & serverless environments
function loadLocalEnv() {
  if (fs.existsSync('.env.local')) {
    try {
      const content = fs.readFileSync('.env.local', 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    } catch {
      // ignore
    }
  }
}
loadLocalEnv();

const { Pool } = pg;

// Singleton DB pool
let pool;
function getPool() {
  if (!pool) {
    const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'Zd!q)m0ba+FhWCFjd$wH!t&9#';
    const projectRef = process.env.SUPABASE_PROJECT_REF || 'xhwqasbnsfjyxvzwueoo';
    const encodedPass = encodeURIComponent(dbPassword);
    pool = new Pool({
      connectionString: `postgresql://postgres.${projectRef}:${encodedPass}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
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
    const { email, code, token } = body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanCode = String(code || '').trim().replace(/\D/g, '');
    const cleanToken = String(token || '').trim();

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    if (!cleanCode && !cleanToken) {
      return res.status(400).json({ error: 'Verification code or token is required.' });
    }

    const db = getPool();

    // Check verification record in public.email_confirmations
    let matchQuery = `
      SELECT id, user_id, email, expires_at, used
      FROM public.email_confirmations
      WHERE LOWER(email) = LOWER($1)
        AND used = false
        AND expires_at > NOW()
    `;
    const params = [cleanEmail];

    if (cleanToken) {
      matchQuery += ` AND token = $2 LIMIT 1`;
      params.push(cleanToken);
    } else {
      matchQuery += ` AND code = $2 LIMIT 1`;
      params.push(cleanCode);
    }

    const matchRes = await db.query(matchQuery, params);

    if (!matchRes.rows || matchRes.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired verification code/link. Please request a new confirmation email.'
      });
    }

    const matchedRecord = matchRes.rows[0];

    // Mark token/code as used
    await db.query(
      `UPDATE public.email_confirmations SET used = true WHERE id = $1`,
      [matchedRecord.id]
    );

    // Look up user in auth.users
    const userRes = await db.query(
      `SELECT id, email FROM auth.users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [cleanEmail]
    );

    if (!userRes.rows || userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const userId = userRes.rows[0].id;

    const adminEmails = (process.env.VITE_ADMIN_EMAILS || 'shoaibzaynah@gmail.com,zaynahspos@gmail.com,totvoguepk@gmail.com')
      .split(',')
      .map(e => e.trim().toLowerCase());

    const role = adminEmails.includes(cleanEmail) ? 'admin' : 'user';

    // 1. Confirm user in auth.users
    await db.query(
      `UPDATE auth.users
       SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
           confirmation_token = '',
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    // 2. Mark identity as verified
    await db.query(
      `UPDATE auth.identities
       SET identity_data = jsonb_set(COALESCE(identity_data, '{}'::jsonb), '{email_verified}', 'true'::jsonb),
           updated_at = NOW()
       WHERE user_id = $1::uuid`,
      [userId]
    );

    // 3. Ensure sync into public.users
    await db.query(
      `INSERT INTO public.users (id, email, role, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email,
           role = EXCLUDED.role,
           updated_at = NOW()`,
      [userId, cleanEmail, role]
    );

    // 4. Ensure sync into public.user_settings
    await db.query(
      `INSERT INTO public.user_settings (user_id, created_at, updated_at)
       VALUES ($1, NOW(), NOW())
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    console.log(`[verify-confirmation] Successfully confirmed user ${cleanEmail} (ID: ${userId})`);

    return res.status(200).json({
      success: true,
      message: 'Email confirmed successfully! You can now sign in.',
      email: cleanEmail,
      user_id: userId
    });

  } catch (err) {
    console.error('[verify-confirmation] Server error:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error while confirming email.'
    });
  }
}
