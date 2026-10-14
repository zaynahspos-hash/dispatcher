# 22 — Credentials & Secrets Management

Hygiene rules for API tokens, secret keys, and credentials.

---

## 1. Classification of Keys
- **Public Client Keys**:
  - `VITE_SUPABASE_URL`: Public Supabase Project URL.
  - `VITE_SUPABASE_ANON_KEY`: Public anonymous client key (protected by RLS).
  - Safe to embed in client-side Vite builds.
- **Sensitive Operational Tokens**:
  - `PostEx Merchant Token`: Confers access to book parcels, create pickups, and download invoices.
  - `Groq API Key`: Confers access to LLM compute tokens.
  - **Storage Rule**: Never committed to git. Stored securely in `UserSettings.settings` encrypted/scoped to the individual merchant, or provided in local `.env.local` for single-merchant deployments.
- **Root Admin Keys**:
  - `SUPABASE_SERVICE_ROLE_KEY`: Bypasses all RLS policies. NEVER bundle into client-side JS.

---

## 2. Leakage Prevention Checklist
- [ ] No tokens logged to browser `console.log()` in production.
- [ ] No tokens exposed in error modal alerts.
- [ ] `.env.local` is present in `.gitignore`.
