import pg from 'pg';

const { Pool } = pg;

let pool;
function getPool() {
  if (!pool) {
    const dbPassword = process.env.SUPABASE_DB_PASSWORD;
    const projectRef = process.env.SUPABASE_PROJECT_REF || 'xhwqasbnsfjyxvzwueoo';
    if (!dbPassword) {
      throw new Error('SUPABASE_DB_PASSWORD environment variable is missing.');
    }
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
    const { email, code, token, new_password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(new_password || '').trim();
    const cleanCode = String(code || '').trim();
    const cleanToken = String(token || '').trim();

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (!cleanCode && !cleanToken) {
      return res.status(400).json({ error: 'Verification code or reset token is required.' });
    }

    const db = getPool();

    // Verify token or code from public.password_resets
    const verifyResult = await db.query(
      `SELECT id FROM public.password_resets
       WHERE LOWER(email) = LOWER($1)
         AND (code = $2 OR token = $3)
         AND expires_at > NOW()
         AND used = false
       ORDER BY created_at DESC
       LIMIT 1`,
      [cleanEmail, cleanCode || 'NONE', cleanToken || 'NONE']
    );

    if (!verifyResult.rows || verifyResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired verification code. Please request a new password reset link.'
      });
    }

    const resetId = verifyResult.rows[0].id;

    // Update user password in auth.users using bcrypt
    const updateResult = await db.query(
      `UPDATE auth.users
       SET encrypted_password = crypt($1, gen_salt('bf')),
           updated_at = NOW()
       WHERE LOWER(email) = LOWER($2)`,
      [cleanPassword, cleanEmail]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({
        error: 'User account not found with this email address.'
      });
    }

    // Mark reset record as used
    await db.query(
      `UPDATE public.password_resets SET used = true WHERE id = $1`,
      [resetId]
    );

    console.log(`[update-password] Password successfully updated for ${cleanEmail}`);

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully! You can now log in.'
    });
  } catch (err) {
    console.error('[update-password] Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to update password. Please try again.'
    });
  }
}
