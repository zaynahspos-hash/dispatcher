# 🔐 Supabase Auth, Custom SMTP & Password Lifecycle: The Master Guide
**Zaynahs Logistics Engine · Supabase GoTrue Auth · Direct PostgreSQL · Custom Gmail SMTP · Multi-Tenant Architecture**

---

## 📋 Executive Overview

In production web applications, relying solely on Supabase’s default email service often causes major operational bottlenecks:
1. **Free Tier Rate Limits (429 Errors)**: Supabase defaults limit outgoing transactional emails to ~3-4 emails per hour. When users test registration or password resets, they get locked out with `429 Too Many Requests`.
2. **Generic Unbranded Templates**: Default emails are plain text or poorly styled, lacking responsive mobile formatting and brand identity.
3. **Link Invalidation on Mobile**: Mobile email apps (Gmail, Apple Mail, Outlook) frequently mangle redirect URLs if wildcard URIs are not properly registered.

### The Solution: The Hybrid Bulletproof Auth Engine
This guide documents the battle-tested architecture deployed in this repository:
- **Supabase GoTrue Auth**: Manages encrypted user credentials, JWT session cookies, and Row Level Security (RLS) tokens.
- **Direct PostgreSQL Serverless API (`api/auth/register.js`)**: Instant account creation with auto-confirmed emails (`email_confirmed_at = NOW()`), bypassing email rate limits.
- **Dedicated Gmail SMTP Transporter (`api/auth/send-reset-email.js`)**: Real-time password recovery dispatching a **6-Digit Monospace OTP Code** AND a **1-Click Direct Recovery URL**.
- **Supabase Management API (`scripts/updateEmailTemplates.js`)**: Programmatic synchronization of all 6 system email templates directly into Supabase Auth with zero dashboard dependency.
- **Strict Emerald Theme (`#10b981`, `#059669`, `#34d399`)**: 100% fluid responsive design fitting desktop inboxes (Gmail Web, Outlook) down to narrow mobile screens (320px–390px).

---

## 🗺️ Complete Authentication Lifecycle Diagram

```
                              ┌───────────────────────────────────┐
                              │     User at / or /login           │
                              └─────────────────┬─────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
     [Sign In / Login Flow]                                        [Sign Up / Register Flow]
                 │                                                             │
  Enter Email & Password                                         Enter Email & Password
                 │                                                             │
   supabase.auth.signInWithPassword                               POST /api/auth/register
                 │                                                             │
   JWT Session Token Saved                                    Direct SQL to auth.users & public.users
                 │                                            email_confirmed_at = NOW()
                 ▼                                                             │
   Redirect to Main Dashboard                                                  ▼
                                                              Account Ready & Logged In Instantly!

═════════════════════════════════════════════════════════════════════════════════════════════════════
                                   PASSWORD RESET LIFECYCLE
═════════════════════════════════════════════════════════════════════════════════════════════════════

                              ┌───────────────────────────────────┐
                              │ User clicks "Forgot Password?"    │
                              └─────────────────┬─────────────────┘
                                                │
                                       Enters Email Address
                                                │
                                                ▼
                                   POST /api/auth/send-reset-email
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
             Generate 6-Digit OTP                               Generate 64-Char Hash
               (e.g., "732652")                                   Crypto Token
                       │                                                 │
                       └────────────────────────┬────────────────────────┘
                                                │
                                    Stored in PostgreSQL DB:
                                    public.password_resets
                                    (Expires in 1 Hour)
                                                │
                                                ▼
                                    Nodemailer Gmail SMTP
                                  (zaynahspos@gmail.com:465)
                                                │
                                                ▼
                               User Receives Responsive Emerald Email
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
     [Option A: 1-Click Link]                                      [Option B: 6-Digit OTP]
                 │                                                             │
  Clicks "Reset Password Directly"                               Copies 6-digit code into app
                 │                                                             │
  Redirects to:                                                  Frontend submits Code + New Password
  /#recovery=true&token=...&email=...                                          │
                 │                                                             │
  App detects hash on load                                                     │
  Auto-opens Reset Modal                                                       │
                 │                                                             │
                 └──────────────────────────────┬──────────────────────────────┘
                                                │
                                                ▼
                                   Verify Token / Code in DB
                                                │
                                                ▼
                                Update Password via Supabase Auth:
                                  supabase.auth.updateUser()
                                                │
                                                ▼
                                Success Toast + Auto Dashboard Login!
```

---

## 1. Database Infrastructure Setup

All auth metadata, RBAC roles, and password recovery states are stored in PostgreSQL using `snake_case` naming and `UUID` primary keys.

### 1.1 `public.users` Table
```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  store_name TEXT DEFAULT 'Zaynahs Dispatcher',
  phone TEXT,
  postex_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for instant auth lookups
CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(LOWER(email));
```

### 1.2 `public.password_resets` Table
```sql
CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_password_resets_lookup 
  ON public.password_resets(LOWER(email), code);
CREATE INDEX IF NOT EXISTS idx_password_resets_token 
  ON public.password_resets(token);
```

---

## 2. Google Mail Custom SMTP Setup

To send high-volume, reliable transactional emails without hitting Supabase free-tier limits, configure Google Mail SMTP using a 16-character Google App Password.

### 2.1 Generating a Google App Password
1. Sign in to the designated Google Account (`zaynahspos@gmail.com`).
2. Navigate to [Google Account Security](https://myaccount.google.com/security).
3. Ensure **2-Step Verification** is turned **ON**.
4. Search for **App Passwords** or visit: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
5. Enter an App Name (e.g., `Zaynahs Courier Dispatcher`).
6. Click **Create**. Google will display a 16-character password formatted like: `laly eyvq xlol tjrs`.
7. **Copy this code and strip all spaces**: `lalyeyvqxloltjrs`.

### 2.2 Environment Variables (`.env.local` & Vercel Dashboard)
Add these variables to your environment:
```ini
# Custom SMTP (Google Mail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=zaynahspos@gmail.com
SMTP_PASS=lalyeyvqxloltjrs
SMTP_SENDER_NAME="Zaynahs Courier Dispatcher"
SMTP_ADMIN_EMAIL=zaynahspos@gmail.com
```

---

## 3. Domain Configuration & Redirect URIs Whitelist

When a user clicks a password reset or email verification link, Supabase redirects them back to your web app. If the target domain is not explicitly whitelisted, Supabase rejects the request with an `Invalid redirect_uri` (HTTP 400).

### 3.1 Allowed URLs Format
In production, you must whitelist both the exact apex/subdomain and the wildcard subpaths:
- `https://dispatcher.zaynahspos.com`
- `https://dispatcher.zaynahspos.com/**`
- `http://localhost:5173`
- `http://localhost:5173/**`

### 3.2 Method A: Supabase Dashboard
1. Go to **Authentication** → **URL Configuration**.
2. Set **Site URL** to: `https://dispatcher.zaynahspos.com`
3. Under **Redirect URLs**, click **Add URL** and add:
   - `https://dispatcher.zaynahspos.com/**`
   - `http://localhost:5173/**`
4. Click **Save**.

### 3.3 Method B: Zero-Dashboard Management API (Programmatic)
Run this single command using your Supabase Personal Access Token (`sbp_...`):
```bash
curl -X PATCH 'https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/config/auth' \
  -H "Authorization: Bearer sbp_YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "site_url": "https://dispatcher.zaynahspos.com",
    "uri_allow_list": "https://dispatcher.zaynahspos.com/**,https://dispatcher.zaynahspos.com,http://localhost:5173/**,http://localhost:5173"
  }'
```

---

## 4. Programmatic Email Template Engine (`scripts/updateEmailTemplates.js`)

All 6 Supabase Auth email templates are maintained in code and deployed programmatically to avoid manual copy-pasting.

### 4.1 The 6 Core Auth Templates
| Template Type | Management API Key | Trigger | Variables Available |
|---------------|-------------------|---------|---------------------|
| **Recovery (Password Reset)** | `mailer_templates_recovery_content` | User requests password reset | `{{ .ConfirmationURL }}`, `{{ .Token }}` |
| **Email Confirmation** | `mailer_templates_confirmation_content` | New signup verification | `{{ .ConfirmationURL }}`, `{{ .Token }}` |
| **Magic Link** | `mailer_templates_magic_link_content` | Passwordless 1-click sign-in | `{{ .ConfirmationURL }}`, `{{ .Token }}` |
| **Team Invite** | `mailer_templates_invite_content` | Admin invites a new merchant | `{{ .ConfirmationURL }}` |
| **Email Change** | `mailer_templates_email_change_content` | User updates their email address | `{{ .ConfirmationURL }}`, `{{ .NewEmail }}` |
| **Reauthentication** | `mailer_templates_reauthentication_content` | Sensitive action identity check | `{{ .ConfirmationURL }}`, `{{ .Token }}` |

### 4.2 Running the Update Script
To update all 6 templates in Supabase and write fresh local `.html` backups:
```bash
node scripts/updateEmailTemplates.js [OPTIONAL_SUPABASE_TOKEN]
```
The script will output:
```
Saved 6 branded email templates to supabase/email-templates/
Configuring Custom SMTP: host=smtp.gmail.com, port=465, user=zaynahspos@gmail.com...
Deploying email templates to Supabase project: xhwqasbnsfjyxvzwueoo
HTTP Status: 200
SUCCESS! Email templates and sender name updated successfully in Supabase Auth!
```

---

## 5. Responsive Email Template Architecture (Desktop & Mobile)

Email clients (especially Gmail for Android and iOS) strip modern CSS properties and external stylesheets. Every template in this repository adheres to the following email standards:

### 5.1 The Master Template Blueprint
```html
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Reset Your Password</title>
  <style>
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
    body {
      margin: 0 !important; padding: 0 !important; width: 100% !important;
      background-color: #070b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #f1f5f9;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px 10px !important; }
      .email-card { width: 100% !important; border-radius: 14px !important; }
      .card-body { padding: 22px 16px !important; }
      .otp-code { font-size: 26px !important; letter-spacing: 4px !important; }
      .cta-btn { width: 100% !important; max-width: 100% !important; padding: 14px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #070b14; color: #f1f5f9;">
  <center style="width: 100%; background-color: #070b14;">
    <!-- Outer Wrapper -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-wrapper" style="background-color: #070b14; padding: 32px 14px; width: 100% !important;">
      <tr>
        <td align="center">
          <!-- Main Card (Max 540px) -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card" style="max-width: 540px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 36px rgba(0,0,0,0.55);">
            
            <!-- Top Emerald Gradient Bar -->
            <tr>
              <td style="background: linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%); height: 4px; line-height: 4px; font-size: 4px;">&nbsp;</td>
            </tr>

            <!-- Brand Logo & Header -->
            <tr>
              <td align="center" style="padding: 28px 24px 20px 24px;">
                <img src="https://dispatcher.zaynahspos.com/apple-touch-icon.png" width="52" height="52" style="border-radius: 13px; border: 1.5px solid rgba(16, 185, 129, 0.4); display: block;" />
                <h1 style="margin: 14px 0 6px 0; font-size: 18px; font-weight: 700; color: #ffffff;">Zaynahs Courier Dispatcher</h1>
                <span style="background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 20px; padding: 4px 12px; font-size: 10px; font-weight: 700; color: #10b981; letter-spacing: 1.5px; text-transform: uppercase;">
                  ACCOUNT SECURITY
                </span>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding: 0 24px;"><table role="presentation" width="100%"><tr><td style="border-top: 1px solid #1e293b;"></td></tr></table></td>
            </tr>

            <!-- Body -->
            <tr>
              <td class="card-body" style="padding: 24px 28px 20px 28px; text-align: left;">
                <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0;">Reset Your Account Password</h2>
                <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">A password reset was requested for your merchant account. Tap the button below or enter the 6-digit verification code in your browser:</p>

                <!-- OTP Code Box -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #070b14; border: 1px solid #1e293b; border-radius: 12px; margin: 20px 0;">
                  <tr>
                    <td align="center" style="padding: 18px 12px;">
                      <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; display: block; margin-bottom: 6px;">One-Time Security Code</span>
                      <div class="otp-code" style="font-family: ui-monospace, monospace; font-size: 30px; font-weight: 800; letter-spacing: 6px; color: #10b981;">732652</div>
                      <span style="font-size: 11px; color: #64748b; margin-top: 6px; display: block;">Expires in 60 minutes &bull; Single-use only</span>
                    </td>
                  </tr>
                </table>

                <!-- Primary Call to Action Button -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0 16px 0;">
                  <tr>
                    <td align="center">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; width: 100%; max-width: 280px;">
                        <tr>
                          <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);">
                            <a href="${actionUrl}" target="_blank" class="cta-btn" style="display: block; width: 100%; padding: 14px 24px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; text-align: center; border: 1px solid rgba(52, 211, 153, 0.3);">
                              Reset Password Directly &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Fallback URL -->
                <p style="margin: 16px 0 0 0; font-size: 11px; color: #475569; text-align: center; word-break: break-all;">
                  Button not working? Copy and paste this URL into your browser:<br/>
                  <a href="${actionUrl}" target="_blank" style="color: #10b981; text-decoration: underline;">${actionUrl}</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 18px 24px; background-color: #070b14; border-top: 1px solid #1e293b; text-align: center;">
                <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b;">&copy; 2026 <strong>Zaynahs Courier Dispatcher</strong> &bull; Intelligent Logistics Engine</p>
                <a href="https://dispatcher.zaynahspos.com" target="_blank" style="color: #10b981; font-size: 11px; text-decoration: none;">dispatcher.zaynahspos.com</a>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
```

---

## 6. Serverless Password Reset Dispatcher (`api/auth/send-reset-email.js`)

When the user requests a password reset from the frontend, the request is sent to our dedicated Vercel Serverless Function instead of the rate-limited Supabase client endpoint.

### 6.1 Endpoint Specification
- **Method**: `POST`
- **Route**: `/api/auth/send-reset-email`
- **Body**: `{ "email": "user@example.com" }`
- **Execution Flow**:
  1. Validate email syntax.
  2. Generate a secure 6-digit numeric OTP (`Math.floor(100000 + Math.random() * 900000)`).
  3. Generate a 64-character cryptographic token (`crypto.randomBytes(32).toString('hex')`).
  4. Store the tuple `(email, code, token, expires_at)` in `public.password_resets` with a 1-hour expiration window.
  5. Formulate 1-click URL: `https://dispatcher.zaynahspos.com/#recovery=true&token=${token}&email=${encodeURIComponent(email)}`.
  6. Dispatch using `nodemailer` via Gmail SMTP over port 465 (SSL).

---

## 7. Frontend Integration & URL Hash Listening

The frontend handles recovery links seamlessly without requiring page reloads or query param routers.

### 7.1 Detecting Recovery Hash on Mount (`App.tsx` / `AuthModal.tsx`)
```typescript
useEffect(() => {
  const handleHashChange = () => {
    const hash = window.location.hash || ''
    
    // Check if recovery parameter is present
    if (hash.includes('recovery=true')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''))
      const token = params.get('token')
      const email = params.get('email')
      
      // Open Reset Password dialog prefilled with token & email
      setIsResetPasswordOpen(true)
      setResetEmail(email || '')
      setResetToken(token || '')
      
      // Clean URL hash so refreshing does not re-trigger
      window.history.replaceState(null, '', window.location.pathname)
    }
  }

  handleHashChange()
  window.addEventListener('hashchange', handleHashChange)
  return () => window.removeEventListener('hashchange', handleHashChange)
}, [])
```

### 7.2 Executing the Password Change
When the user submits their new password:
```typescript
const handlePasswordUpdate = async (newPassword: string) => {
  setIsSubmitting(true)
  try {
    // 1. If user is logged in:
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) throw error

    showToast('Password updated successfully! Logging you in...', 'success')
    setIsResetPasswordOpen(false)
  } catch (err: any) {
    showToast(err.message || 'Failed to update password', 'error')
  } finally {
    setIsSubmitting(false)
  }
}
```

---

## 8. Interactive Email Testing Tool (`public/email-preview.html`)

To preview and visually audit all email templates across different screen viewports without sending real test emails:
1. Open the preview tool: [https://dispatcher.zaynahspos.com/email-preview.html](https://dispatcher.zaynahspos.com/email-preview.html)
2. Use the top tab bar to switch between templates:
   - `Password Reset`
   - `Email Confirm`
   - `Magic Link`
   - `Team Invite`
   - `Email Change`
   - `Verify Identity`
3. Use the viewport switcher to test responsiveness:
   - `Desktop (100%)`
   - `Tablet (600px)`
   - `iPhone (390px)`
   - `Mobile Small (320px)`

---

## 9. Troubleshooting & Gotchas Matrix

| Symptom / Error | Root Cause | Exact Solution |
|-----------------|------------|----------------|
| `535 5.7.8 Username and Password not accepted` | Standard Gmail password used instead of an App Password, or password has spaces | Generate a 16-character App Password at `myaccount.google.com/apppasswords`. Remove all spaces (`lalyeyvqxloltjrs`). |
| `429 Too Many Requests (Email rate limit exceeded)` | Calling `supabase.auth.resetPasswordForEmail` too many times on free tier | Always route password resets through `/api/auth/send-reset-email` which uses Gmail SMTP directly. |
| `Invalid redirect_uri (HTTP 400)` | Destination domain missing from Supabase URL Configuration allowlist | Add `https://yourdomain.com/**` and `https://yourdomain.com` under **Authentication → URL Configuration → Redirect URLs**. |
| Email looks off-center or overflows on mobile | Missing `width: 100% !important` or fixed table layout | Wrap all cards in `width="100%" cellpadding="0" cellspacing="0"` with `max-width: 540px` and inline fluid padding (`padding: 24px 18px`). |
| Top gradient or button colors turn blue | Legacy colors `#2563eb` or `#38bdf8` in template string | Enforce strict Emerald palette: `#059669` (Dark), `#10b981` (Primary), `#34d399` (Light). |
| Users don't receive emails / Lands in Spam | Missing DKIM/SPF on domain, or sender name not matching account | Use `SMTP_SENDER_NAME="Zaynahs Courier Dispatcher"` and ensure `from` header matches the authenticated `SMTP_USER`. |

---

## 10. Summary Checklist for Any New Project

When bootstrapping this Auth System in a new project:
- [ ] Set up `public.users` and `public.password_resets` in PostgreSQL.
- [ ] Whitelist `https://yourdomain.com/**` in Supabase Auth URL Configuration.
- [ ] Create a 16-character Google App Password on the sender Gmail account.
- [ ] Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` in `.env.local` and host environment.
- [ ] Deploy `/api/auth/send-reset-email.js` for serverless email dispatch.
- [ ] Deploy `/api/auth/register.js` for instant, rate-limit-free user signups.
- [ ] Run `node scripts/updateEmailTemplates.js` to push branded templates to Supabase.
- [ ] Test the full forgot-password loop using `public/email-preview.html` and a real test address.
