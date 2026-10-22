import https from 'node:https';
import fs from 'node:fs';

// Auto-load .env.local
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'xhwqasbnsfjyxvzwueoo';
const SUPABASE_TOKEN = process.argv[2] || process.env.SUPABASE_TOKEN || 'sbp_fccc05a3d4aec534fe8f5cfb0137035d0acf5565';
const LOGO_URL = 'https://dispatcher.zaynahs.pk/apple-touch-icon.png';
const APP_URL = 'https://dispatcher.zaynahs.pk';

/**
 * Modern, mobile-native responsive HTML Email Template wrapper
 */
function createEmailTemplate({
  headline,
  subheadline,
  mainText,
  showToken = true,
  actionText,
  actionUrl = '{{ .ConfirmationURL }}',
  securityNote = 'This secure verification link is valid for 1 hour. If you did not initiate this request, no further action is required and you can safely ignore this email.',
  badgeText = 'ACCOUNT SECURITY'
}) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${headline}</title>
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
                <a href="${APP_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
                  <img src="${LOGO_URL}" alt="Zaynahs Dispatcher" width="52" height="52" style="width: 52px; height: 52px; border-radius: 13px; border: 1.5px solid rgba(16, 185, 129, 0.4); display: block; margin: 0 auto; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.2);" />
                </a>
                <h1 style="margin: 14px 0 6px 0; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                  Zaynahs Courier Dispatcher
                </h1>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 20px; padding: 4px 12px; font-size: 10px; font-weight: 700; color: #10b981; letter-spacing: 1.5px; text-transform: uppercase;">
                      ${badgeText}
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
                  ${headline}
                </h2>
                
                <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 16px 0;">
                  ${subheadline}
                </p>

                <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6; margin: 0 0 20px 0;">
                  ${mainText}
                </p>

                ${showToken ? `
                <!-- OTP Code Box -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #070b14; border: 1px solid #1e293b; border-radius: 12px; margin: 20px 0;">
                  <tr>
                    <td align="center" style="padding: 18px 12px; text-align: center;">
                      <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; display: block; margin-bottom: 6px;">
                        One-Time Verification Code
                      </span>
                      <div class="otp-code" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 30px; font-weight: 800; letter-spacing: 6px; color: #10b981; line-height: 1.2; text-shadow: 0 0 14px rgba(16, 185, 129, 0.35);">
                        {{ .Token }}
                      </div>
                      <span style="font-size: 11px; color: #64748b; margin-top: 6px; display: block;">
                        Expires in 60 minutes &bull; Single-use only
                      </span>
                    </td>
                  </tr>
                </table>
                ` : ''}

                <!-- Action Button -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0 16px 0;">
                  <tr>
                    <td align="center">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; width: 100%; max-width: 280px;">
                        <tr>
                          <td align="center" style="border-radius: 12px; background-color: #10b981; background: linear-gradient(135deg, #059669 0%, #10b981 100%); box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);">
                            <a href="${actionUrl}" target="_blank" class="cta-btn" style="display: block; width: 100%; padding: 14px 24px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; text-align: center; box-sizing: border-box; border: 1px solid rgba(52, 211, 153, 0.3);">
                              ${actionText} &rarr;
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

                <!-- Security Note -->
                <p style="margin: 20px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
                  ${securityNote}
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
                  <a href="${APP_URL}" target="_blank" style="color: #10b981; text-decoration: none;">
                    dispatcher.zaynahs.pk
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

// 1. Confirmation Email
const confirmationContent = createEmailTemplate({
  headline: 'Confirm Your Email Address',
  subheadline: 'Welcome to Zaynahs Courier Dispatcher — Your intelligent logistics booking engine.',
  mainText: 'Thank you for signing up. Please tap the button below to verify your email address and activate your merchant account.',
  showToken: true,
  actionText: 'Confirm Email Address',
  actionUrl: '{{ .ConfirmationURL }}',
  badgeText: 'ACCOUNT VERIFICATION',
  securityNote: 'This verification link is valid for 1 hour. If you did not create this account, you can safely ignore this email.'
});

// 2. Recovery / Password Reset Email
const recoveryContent = createEmailTemplate({
  headline: 'Reset Your Account Password',
  subheadline: 'A password reset request was received for your Zaynahs Courier Dispatcher account.',
  mainText: 'Click the button below to choose a new secure password. You can also use the one-time security code on your screen.',
  showToken: true,
  actionText: 'Reset Password',
  actionUrl: '{{ .ConfirmationURL }}',
  badgeText: 'SECURITY ALERT',
  securityNote: 'For your protection, this reset link expires in 1 hour. If you did not request a password reset, please secure your account immediately.'
});

// 3. Magic Link Email
const magicLinkContent = createEmailTemplate({
  headline: 'Your Instant Sign-In Link',
  subheadline: 'Use this secure 1-click link to log into Zaynahs Courier Dispatcher without typing a password.',
  mainText: 'Tap the button below to authenticate directly. This single-use link will expire shortly for your security.',
  showToken: true,
  actionText: 'Sign In to Dispatcher',
  actionUrl: '{{ .ConfirmationURL }}',
  badgeText: 'PASSWORDLESS LOGIN',
  securityNote: 'This link is single-use and expires in 1 hour. Never forward this email to anyone.'
});

// 4. Invite Email
const inviteContent = createEmailTemplate({
  headline: "You've Been Invited to Join",
  subheadline: 'You have been invited to collaborate on Zaynahs Courier Dispatcher.',
  mainText: 'Tap the button below to accept the invitation, configure your merchant credentials, and start processing PostEx orders seamlessly.',
  showToken: false,
  actionText: 'Accept Invitation & Get Started',
  actionUrl: '{{ .ConfirmationURL }}',
  badgeText: 'TEAM INVITATION',
  securityNote: 'This invitation link expires in 24 hours. Contact your store administrator if you have any questions.'
});

// 5. Email Change Email
const emailChangeContent = createEmailTemplate({
  headline: 'Confirm Your New Email Address',
  subheadline: 'A request was made to change your account email address.',
  mainText: 'Please click the button below to confirm <strong>{{ .NewEmail }}</strong> as your primary Zaynahs Dispatcher account email.',
  showToken: true,
  actionText: 'Confirm New Email',
  actionUrl: '{{ .ConfirmationURL }}',
  badgeText: 'EMAIL MODIFICATION',
  securityNote: 'If you did not request this email change, please log in immediately and review your account security.'
});

// 6. Reauthentication Email
const reauthenticationContent = createEmailTemplate({
  headline: 'Confirm Your Identity',
  subheadline: 'A sensitive action requires identity verification.',
  mainText: 'Use the one-time verification code below or tap the button to confirm your identity and proceed.',
  showToken: true,
  actionText: 'Verify Identity',
  actionUrl: '{{ .ConfirmationURL }}',
  badgeText: 'IDENTITY CHECK',
  securityNote: 'This code expires in 15 minutes. Never share this code with anyone.'
});

// Payload for Supabase Management API
const payload = {
  site_url: 'https://dispatcher.zaynahs.pk',
  uri_allow_list: 'https://dispatcher.zaynahs.pk/**,https://dispatcher.zaynahs.pk,https://dispatcher.zaynahspos.com/**,https://dispatcher.zaynahspos.com,http://localhost:5173/**,http://localhost:5173',
  mailer_subjects_confirmation: 'Verify your Zaynahs Dispatcher account',
  mailer_subjects_recovery: 'Reset your Zaynahs Dispatcher password',
  mailer_subjects_magic_link: 'Sign in to Zaynahs Courier Dispatcher',
  mailer_subjects_invite: "You're invited to Zaynahs Courier Dispatcher",
  mailer_subjects_email_change: 'Confirm your new email address',
  mailer_subjects_reauthentication: '{{ .Token }} is your verification code',
  
  mailer_templates_confirmation_content: confirmationContent,
  mailer_templates_recovery_content: recoveryContent,
  mailer_templates_magic_link_content: magicLinkContent,
  mailer_templates_invite_content: inviteContent,
  mailer_templates_email_change_content: emailChangeContent,
  mailer_templates_reauthentication_content: reauthenticationContent
};

// Export templates to local directory for inspection or manual dashboard paste
try {
  const templatesDir = 'supabase/email-templates';
  if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir, { recursive: true });
  fs.writeFileSync(`${templatesDir}/recovery.html`, recoveryContent, 'utf-8');
  fs.writeFileSync(`${templatesDir}/confirmation.html`, confirmationContent, 'utf-8');
  fs.writeFileSync(`${templatesDir}/magic_link.html`, magicLinkContent, 'utf-8');
  fs.writeFileSync(`${templatesDir}/invite.html`, inviteContent, 'utf-8');
  fs.writeFileSync(`${templatesDir}/email_change.html`, emailChangeContent, 'utf-8');
  fs.writeFileSync(`${templatesDir}/reauthentication.html`, reauthenticationContent, 'utf-8');
  console.log('Saved 6 branded email templates to supabase/email-templates/');
} catch (e) {
  console.warn('Could not save local email templates:', e.message);
}

// If SMTP settings are provided via env or arguments, attach them to enable custom SMTP & bypass free tier restriction
const smtpHost = process.env.SMTP_HOST;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : undefined;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
const smtpAdminEmail = process.env.SMTP_ADMIN_EMAIL || smtpUser;
const smtpSenderName = process.env.SMTP_SENDER_NAME || 'Zaynahs Courier Dispatcher';

if (smtpHost && smtpUser && smtpPass) {
  payload.smtp_host = smtpHost;
  payload.smtp_port = smtpPort;
  payload.smtp_user = smtpUser;
  payload.smtp_pass = smtpPass;
  payload.smtp_admin_email = smtpAdminEmail;
  payload.smtp_sender_name = smtpSenderName;
  console.log(`Configuring Custom SMTP: host=${smtpHost}, port=${smtpPort}, user=${smtpUser}, sender="${smtpSenderName}"`);
} else {
  console.log('Notice: Custom SMTP credentials not passed in environment. Run with SMTP_HOST, SMTP_USER, SMTP_PASS to apply custom templates & branding.');
}

console.log('Deploying email templates to Supabase project:', SUPABASE_PROJECT_REF);

const req = https.request(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${SUPABASE_TOKEN}`,
    'Content-Type': 'application/json'
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('SUCCESS! Email templates and sender name updated successfully in Supabase Auth!');
    } else {
      console.error('FAILED to update templates:', body);
    }
  });
});

req.on('error', err => {
  console.error('Request error:', err);
});

req.write(JSON.stringify(payload));
req.end();
