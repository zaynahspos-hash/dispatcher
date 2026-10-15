import nodemailer from 'nodemailer';
import pg from 'pg';
import crypto from 'node:crypto';

const { Pool } = pg;

// Singleton DB pool
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

// Gmail SMTP Transporter
function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER || 'zaynahspos@gmail.com';
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

function renderEmailHtml(code, actionUrl) {
  const logoUrl = 'https://dispatcher.zaynahspos.com/apple-touch-icon.png';
  const appUrl = 'https://dispatcher.zaynahspos.com';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { margin: 0; padding: 20px 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f1f5f9; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 12px !important; }
      .cell { padding: 20px 16px !important; }
      .otp { font-size: 26px !important; letter-spacing: 4px !important; }
    }
  </style>
</head>
<body style="background-color: #0b0f19; margin: 0; padding: 20px 0;">
  <center>
    <table role="presentation" width="100%" style="max-width: 520px; margin: 0 auto;" class="container">
      <tr>
        <td style="background: linear-gradient(90deg, #10b981, #06b6d4, #3b82f6); height: 4px; border-radius: 16px 16px 0 0;"></td>
      </tr>
      <tr>
        <td style="background-color: #111827; border: 1px solid #1f2937; border-top: 0; border-radius: 0 0 16px 16px; padding: 32px 24px; box-shadow: 0 12px 30px rgba(0,0,0,0.5);" class="cell">
          
          <table role="presentation" width="100%" style="text-align: center; margin-bottom: 24px;">
            <tr>
              <td align="center">
                <a href="${appUrl}" target="_blank">
                  <img src="${logoUrl}" alt="Zaynahs Dispatcher" width="56" height="56" style="border-radius: 14px; border: 1px solid rgba(255,255,255,0.15); display: block;" />
                </a>
                <h1 style="margin: 14px 0 2px 0; font-size: 18px; font-weight: 700; color: #ffffff;">
                  Zaynahs Courier Dispatcher
                </h1>
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #10b981; font-weight: 600;">
                  Account Security
                </p>
              </td>
            </tr>
          </table>

          <div style="border-top: 1px solid #1f2937; padding-top: 20px; text-align: left;">
            <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0;">
              Reset Your Account Password
            </h2>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0 0 20px 0;">
              A password reset was requested for your merchant account. Tap the button below or enter the 6-digit verification code in your browser:
            </p>

            <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 600; display: block; margin-bottom: 6px;">
                One-Time Security Code
              </span>
              <div class="otp" style="font-family: monospace; font-size: 30px; font-weight: 700; letter-spacing: 6px; color: #10b981;">
                ${code}
              </div>
            </div>

            <table role="presentation" width="100%" style="margin: 24px 0 12px 0;">
              <tr>
                <td align="center">
                  <a href="${actionUrl}" target="_blank" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 32px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(16,185,129,0.35);">
                    Reset Password Directly &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin: 20px 0 0 0; font-size: 11px; color: #64748b; line-height: 1.5; text-align: center;">
              This code and link will expire in 1 hour. If you did not request this, you can safely ignore this email.
            </p>
          </div>

          <div style="margin-top: 24px; border-top: 1px solid #1f2937; padding-top: 16px; text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #475569;">
              &copy; 2026 Zaynahs Courier Dispatcher &bull; <a href="${appUrl}" target="_blank" style="color: #64748b; text-decoration: none;">dispatcher.zaynahspos.com</a>
            </p>
          </div>

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
    const { email } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    // 1. Generate 6-digit OTP code and random 64-char token
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString('hex');

    // 2. Save to database
    const db = getPool();
    await db.query(
      `INSERT INTO public.password_resets (email, code, token, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour')`,
      [cleanEmail, code, token]
    );

    // 3. Construct 1-click URL
    const actionUrl = `https://dispatcher.zaynahspos.com/#recovery=true&token=${token}&email=${encodeURIComponent(cleanEmail)}`;

    // 4. Send email via Gmail SMTP
    const transporter = getTransporter();
    const senderName = process.env.SMTP_SENDER_NAME || 'Zaynahs Courier Dispatcher';
    const senderUser = process.env.SMTP_USER || 'zaynahspos@gmail.com';

    await transporter.sendMail({
      from: `"${senderName}" <${senderUser}>`,
      to: cleanEmail,
      subject: `Reset your Zaynahs Dispatcher password [${code}]`,
      html: renderEmailHtml(code, actionUrl)
    });

    console.log(`[send-reset-email] Sent reset code to ${cleanEmail}`);
    return res.status(200).json({
      success: true,
      message: `Password reset link and security code sent to ${cleanEmail}.`
    });
  } catch (err) {
    console.error('[send-reset-email] Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to send password reset email. Please try again.'
    });
  }
}
