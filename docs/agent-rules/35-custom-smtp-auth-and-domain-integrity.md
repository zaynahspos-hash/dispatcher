# RULE 35 — Custom SMTP Authentication & Production Domain Integrity

> ⚠️ **CRITICAL DIRECTIVE**: All merchant authentication emails (Sign Up Confirmation, Password Reset, Magic Links, Security Alerts) MUST strictly originate from the verified merchant Gmail account (`zaynahspos@gmail.com`) via custom SMTP. Default unbranded Supabase mailer (`noreply@mail.app.supabase.io`), generic templates, and localhost URLs are permanently forbidden.

---

## ⛔ Rule AUTH-SMTP1 — Strict Custom Gmail SMTP Origin

1. **Verified Sender Only**: Every outgoing authentication email must strictly originate from:
   ```
   "Zaynahs Courier Dispatcher" <zaynahspos@gmail.com>
   ```
   via Google Mail SMTP (`smtp.gmail.com:465`, SSL).
2. **Absolute Ban on Unbranded Supabase Mailer**:
   - Outgoing emails must NEVER be sent from `noreply@mail.app.supabase.io` or `supabase.co`.
   - Generic white default Supabase templates (e.g., "powered by Supabase") are completely banned.
   - All emails must use the responsive Apple-minimalist dark branded HTML email layout.
3. **Bypass Supabase Free-Tier Rate Limits**:
   - Direct Gmail SMTP bypasses Supabase's built-in 30 emails/hour free-tier rate limit (which returns HTTP 429).
   - All email dispatches are processed via dedicated backend endpoints (`api/auth/send-confirmation-email.js`, `api/auth/send-reset-email.js`).

---

## Rule AUTH-DOMAIN1 — Production Domain Integrity (Zero Localhost in Emails)

1. **Strict Production URL Enclosure**:
   All verification links, password reset links, magic links, and action buttons inside emails MUST strictly use the official production domain:
   ```
   https://dispatcher.zaynahspos.com
   ```
2. **Absolute Ban on Localhost/IP in Outgoing Emails**:
   - Never embed `http://localhost:*`, `http://127.0.0.1:*`, or local LAN IPs in `actionUrl`, `emailRedirectTo`, or email links.
   - Handheld mobile devices opening email client links cannot resolve `localhost` back to the development machine, causing fatal connection errors.
   - Even when developers test on `http://localhost:5173`, the generated email link sent to an inbox must point strictly to `https://dispatcher.zaynahspos.com`.

---

## Rule AUTH-OTP1 — Dual Verification: 1-Click Link & 6-Digit Security Code

1. **Dual Verification Architecture**:
   Every account confirmation and password recovery email MUST provide two independent verification mechanisms:
   - **Mechanism A (1-Click Action Button)**: High-contrast emerald button linking directly to:
     `https://dispatcher.zaynahspos.com/#type=signup&token=${token}&email=${email}`
   - **Mechanism B (6-Digit Security Code)**: Prominent monospaced OTP code (e.g. `482915`) displayed inside an emerald card with `letter-spacing: 4px`.
2. **Mobile Keyboard-Friendly Input**:
   - The confirmation screen (`isAwaitingConfirmation`) and password reset screen must render a dedicated 6-digit numeric input with a "Verify" button.
   - Merchants who open email notifications on another device or cannot switch apps can simply type the 6-digit code directly into the UI to verify instantly without clicking external browser links.
3. **Automated URL Verification**:
   - When a user lands on the application with `#type=signup&token=...&email=...`, the application automatically verifies the token via `/api/auth/verify-confirmation` and transitions the merchant into the authenticated dashboard.

---

## Database Verification Schema (public.email_confirmations)

Verification tokens and OTP codes are persisted in PostgreSQL with a 24-hour expiration window:
```sql
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
```
On successful verification, `auth.users.email_confirmed_at` is set to `NOW()`, `auth.identities.identity_data->'email_verified'` is set to `true`, and rows are synced into `public.users` and `public.user_settings`.
