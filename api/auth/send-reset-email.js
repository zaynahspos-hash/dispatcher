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
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Reset Your Password</title>
  <style>
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 100% !important;
      background-color: #070b14;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f1f5f9;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 16px 10px !important;
      }
      .email-card {
        width: 100% !important;
        border-radius: 14px !important;
      }
      .card-body {
        padding: 22px 16px !important;
      }
      .otp-code {
        font-size: 26px !important;
        letter-spacing: 4px !important;
      }
      .cta-btn {
        width: 100% !important;
        max-width: 100% !important;
        padding: 14px 16px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #070b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <center style="width: 100%; background-color: #070b14;">
    <!-- Outer Wrapper Table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-wrapper" style="background-color: #070b14; margin: 0; padding: 32px 14px; width: 100% !important;">
      <tr>
        <td align="center">
          
          <!-- Inner Card Table (Max 540px, Fluid 100%) -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card" style="max-width: 540px; width: 100%; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 36px rgba(0,0,0,0.55);">
            
            <!-- Top Emerald Gradient Accent Bar -->
            <tr>
              <td style="background: #10b981; background: linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%); height: 4px; line-height: 4px; font-size: 4px; border-radius: 16px 16px 0 0;">&nbsp;</td>
            </tr>

            <!-- Header Section (Brand, Logo, Badge) -->
            <tr>
              <td align="center" style="padding: 28px 24px 20px 24px; text-align: center;">
                <a href="${appUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                  <img src="${logoUrl}" alt="Zaynahs Dispatcher" width="52" height="52" style="width: 52px; height: 52px; border-radius: 13px; border: 1.5px solid rgba(16, 185, 129, 0.4); display: block; margin: 0 auto; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.2);" />
                </a>
                <h1 style="margin: 14px 0 6px 0; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                  Zaynahs Courier Dispatcher
                </h1>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 20px; padding: 4px 12px; font-size: 10px; font-weight: 700; color: #10b981; letter-spacing: 1.5px; text-transform: uppercase;">
                      ACCOUNT SECURITY
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Subtle Divider -->
            <tr>
              <td style="padding: 0 24px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="border-top: 1px solid #1e293b; line-height: 1px; font-size: 1px;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Card Content Body -->
            <tr>
              <td class="card-body" style="padding: 24px 28px 20px 28px; text-align: left;">
                <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.35;">
                  Reset Your Account Password
                </h2>
                <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 20px 0;">
                  A password reset was requested for your merchant account. Tap the button below to choose a new password or enter the 6-digit verification code in your browser:
                </p>

                <!-- OTP Code Box -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #070b14; border: 1px solid #1e293b; border-radius: 12px; margin: 20px 0;">
                  <tr>
                    <td align="center" style="padding: 18px 12px; text-align: center;">
                      <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; display: block; margin-bottom: 6px;">
                        One-Time Security Code
                      </span>
                      <div class="otp-code" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 30px; font-weight: 800; letter-spacing: 6px; color: #10b981; line-height: 1.2; text-shadow: 0 0 14px rgba(16, 185, 129, 0.35);">
                        ${code}
                      </div>
                      <span style="font-size: 11px; color: #64748b; margin-top: 6px; display: block;">
                        Expires in 60 minutes &bull; Single-use only
                      </span>
                    </td>
                  </tr>
                </table>

                <!-- Action Button -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0 16px 0;">
                  <tr>
                    <td align="center">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; width: 100%; max-width: 280px;">
                        <tr>
                          <td align="center" style="border-radius: 12px; background-color: #10b981; background: linear-gradient(135deg, #059669 0%, #10b981 100%); box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);">
                            <a href="${actionUrl}" target="_blank" class="cta-btn" style="display: block; width: 100%; padding: 14px 24px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; text-align: center; box-sizing: border-box; border: 1px solid rgba(52, 211, 153, 0.3);">
                              Reset Password Directly &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Fallback URL -->
                <p style="margin: 16px 0 0 0; font-size: 11px; color: #475569; line-height: 1.5; text-align: center; word-break: break-all;">
                  Button not working? Copy and paste this URL into your browser:<br/>
                  <a href="${actionUrl}" target="_blank" style="color: #10b981; text-decoration: underline;">
                    ${actionUrl}
                  </a>
                </p>

                <!-- Security Advisory -->
                <p style="margin: 20px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
                  If you did not request this password reset, no action is needed. Your account remains completely secure.
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
