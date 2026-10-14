# 🧠 Lessons Learned & Historical Bug Resolution Log

Chronological knowledge base of architectural obstacles, API bugs, and verified permanent resolutions.

---

## 1. PostEx V3 Migration & Return City Resolution
- **Symptom**: Airway bills printed with blank return city or defaulted to Lahore instead of merchant pickup region (e.g. Sargodha).
- **Cause**: Merchant only configured pickup address code; return address code was empty in settings.
- **Permanent Fix**: Implemented automatic fallback in `src/utils/postexApi.ts`:
  ```typescript
  const returnCode = settings.postex_return || settings.postex_pickup;
  ```

---

## 2. Invalid Merchant Store Address Code (PostEx 400)
- **Symptom**: V3 order creation failed with `INVALID MERCHANT STORE ADDRESS CODE`.
- **Cause**: Sending optional `storeAddressCode` parameter on standard single-warehouse accounts triggered store validation.
- **Permanent Fix**: Completely omitted `storeAddressCode` from request payload unless explicitly configured.

---

## 3. Prisma Node Dependency in Static Vite SPA
- **Symptom**: Prisma client failed in client-side Vite builds; required Node.js native engine binaries and direct PostgreSQL TCP connections.
- **Permanent Fix**: Wiped Prisma completely from `package.json` and project files. Switched to direct `@supabase/supabase-js` with pure `snake_case` tables and RLS policies.

---

## 4. Mobile Backdrop-Blur GPU Thrashing
- **Symptom**: Janky, stuttering scroll on iOS Safari and mobile Chrome.
- **Permanent Fix**: Enforced RULE M10b banning `backdrop-blur-*` app-wide. Replaced with `bg-white/95` and `bg-slate-900/95`.
