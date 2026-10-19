import nodemailer from 'nodemailer';
import pg from 'pg';
import crypto from 'node:crypto';
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

// Gmail SMTP Transporter (Rule AUTH-SMTP1: always zaynahspos@gmail.com)
function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER || 'zaynahspos@gmail.com';
  const pass = (process.env.SMTP_PASS || 'lalyeyvqxloltjrs').replace(/\s+/g, '');

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

function renderConfirmationEmailHtml(code, actionUrl) {
  const logoUrl = 'https://dispatcher.zaynahspos.com/apple-touch-icon.png';
  const appUrl = 'https://dispatcher.zaynahspos.com';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Confirm Your Email Address</title>
  <style>
    body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; outline: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #070b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px 10px !important; }
      .email-card { width: 100% !important; border-radius: 14px !important; }
      .card-body { padding: 22px 16px !important; }
      .otp-code { font-size: 26px !important; letter-spacing: 4px !important; }
      .cta-btn { width: 100% !important; max-width: 100% !important; padding: 14px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #070b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <center style="width: 100%; background-color: #070b14;">
    <!-- Outer Wrapper Table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-wrapper" style="background-color: #070b14; margin: 0; padding: 32px 14px; width: 100% !important;">
      <tr>
        <td align="center">

          <!-- Main Card Container -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card" style="max-width: 540px; background-color: #0c1220; border: 1px solid #1e293b; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">

            <!-- Top Decorative Accent Bar -->
            <tr>
              <td height="4" style="background: linear-gradient(90deg, #10b981 0%, #059669 50%, #047857 100%); font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>

            <!-- Header Section with Logo -->
            <tr>
              <td align="center" style="padding: 28px 24px 12px 24px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${appUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                        <img src="${logoUrl}" alt="Zaynahs Courier Dispatcher" width="56" height="56" style="display: block; border-radius: 12px; border: 1px solid #334155;" />
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top: 10px;">
                      <span style="font-size: 15px; font-weight: 700; color: #f8fafc; letter-spacing: -0.2px;">
                        Zaynahs Courier Dispatcher
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Card Body Content -->
            <tr>
              <td class="card-body" style="padding: 16px 32px 28px 32px; text-align: center;">

                <!-- Badge -->
                <div style="display: inline-block; padding: 4px 12px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 9999px; margin-bottom: 16px;">
                  <span style="font-size: 11px; font-weight: 700; color: #34d399; letter-spacing: 0.5px; text-transform: uppercase;">
                    ACCOUNT VERIFICATION
                  </span>
                </div>

                <!-- Headline -->
                <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3;">
                  Verify Your Email Address
                </h1>

                <!-- Subheadline -->
                <p style="margin: 0 0 24px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                  Confirm your email address to activate your account and access multi-courier dispatch, real-time tracking, and automated WhatsApp logistics.
                </p>

                <!-- OTP Code Display Card -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #070b14; border: 1px solid #1e293b; border-radius: 12px; margin-bottom: 24px;">
                  <tr>
                    <td align="center" style="padding: 18px 16px;">
                      <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
                        One-Time Verification Code
                      </p>
                      <div class="otp-code" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 800; color: #10b981; letter-spacing: 6px; padding: 4px 0;">
                        ${code}
                      </div>
                      <p style="margin: 6px 0 0 0; font-size: 11px; color: #475569;">
                        Valid for 24 hours &bull; Do not share with anyone
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- 1-Click Action Button (Rule AUTH-DOMAIN1: strictly dispatcher.zaynahspos.com) -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 22px;">
                  <tr>
                    <td align="center">
                      <a href="${actionUrl}" target="_blank" class="cta-btn" style="display: inline-block; background-color: #10b981; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4); text-align: center;">
                        Confirm Email Address &rarr;
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Verification URL Direct Link -->
                <p style="margin: 0 0 16px 0; font-size: 11px; color: #64748b; line-height: 1.5; word-break: break-all;">
                  Button not opening? Copy and paste this link into your browser:<br />
                  <a href="${actionUrl}" target="_blank" style="color: #10b981; text-decoration: underline;">
                    ${actionUrl}
                  </a>
                </p>

                <!-- Security Note -->
                <p style="margin: 0; font-size: 11px; color: #475569; line-height: 1.5;">
                  If you did not register for Zaynahs Courier Dispatcher, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer Section -->
            <tr>
              <td style="padding: 18px 24px; background-color: #070b14; border-top: 1px solid #1e293b; text-align: center; border-radius: 0 0 16px 16px;">
                <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b; line-height: 1.5;">
                  &copy; 2026 <strong>Zaynahs Courier Dispatcher</strong> &bull; Intelligent Logistics Engine
                </p>
                <p style="margin: 0; font-size: 11px; color: #475569;">
                  <a href="${appUrl}" target="_blank" style="color: #10b981; text-decoration: none;">
                    dispatcher.zaynahspos.com
                  </a>
                </p>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
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

    // 1. Check if user already exists in auth.users
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
      // If already confirmed, let client know so they can sign in directly
      if (existing.rows[0].email_confirmed_at) {
        return res.status(200).json({
          success: true,
          already_confirmed: true,
          message: 'Your email is already verified. Please sign in with your password.'
        });
      }

      // Update password for unconfirmed user
      await db.query(
        `UPDATE auth.users
         SET encrypted_password = crypt($1, gen_salt('bf')),
             raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb($2::text)),
             updated_at = NOW()
         WHERE id = $3`,
        [cleanPassword, role, userId]
      );
    } else {
      userId = crypto.randomUUID();
      // Insert unconfirmed user record
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

    // Ensure identity exists
    await db.query(
      `INSERT INTO auth.identities (
         id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
       ) VALUES (
         gen_random_uuid(),
         $1::uuid,
         jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', false, 'phone_verified', false),
         'email',
         $1::text,
         NOW(),
         NOW(),
         NOW()
       ) ON CONFLICT (provider_id, provider) DO NOTHING`,
      [userId, cleanEmail]
    );

    // 2. Generate 6-digit OTP code and secure 64-char token
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString('hex');

    // 3. Store in public.email_confirmations
    await db.query(
      `INSERT INTO public.email_confirmations (user_id, email, code, token, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')`,
      [userId, cleanEmail, code, token]
    );

    // 4. Construct 1-click confirmation URL (Rule AUTH-DOMAIN1: strictly dispatcher.zaynahspos.com)
    const actionUrl = `https://dispatcher.zaynahspos.com/#type=signup&token=${token}&email=${encodeURIComponent(cleanEmail)}`;

    // 5. Send email via Gmail SMTP (Rule AUTH-SMTP1: always zaynahspos@gmail.com)
    const transporter = getTransporter();
    const senderName = process.env.SMTP_SENDER_NAME || 'Zaynahs Courier Dispatcher';
    const senderUser = process.env.SMTP_USER || 'zaynahspos@gmail.com';

    await transporter.sendMail({
      from: `"${senderName}" <${senderUser}>`,
      to: cleanEmail,
      subject: `Verify your Zaynahs Dispatcher account [${code}]`,
      html: renderConfirmationEmailHtml(code, actionUrl)
    });

    console.log(`[send-confirmation-email] Successfully sent confirmation email to ${cleanEmail} from ${senderUser}`);

    return res.status(200).json({
      success: true,
      message: `Verification code and link sent to ${cleanEmail} from ${senderUser}.`,
      email: cleanEmail
    });

  } catch (err) {
    console.error('[send-confirmation-email] Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to send confirmation email. Please try again.'
    });
  }
}
