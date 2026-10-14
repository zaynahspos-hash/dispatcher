# 20 — Error Diagnostics & Instant Fix Matrix

Copy-paste error symptoms and immediate, verified resolutions.

---

| Error / Symptom | Root Cause | Immediate Actionable Fix |
|---|---|---|
| `INVALID MERCHANT STORE ADDRESS CODE` | `storeAddressCode` parameter included in PostEx V3 payload | Omit `storeAddressCode` entirely from the create-order request body. |
| Printable Return City says "Lahore" or blank | `postex_return` setting is empty in single-warehouse setup | Apply fallback: `let returnCode = settings.postex_return \|\| settings.postex_pickup;` |
| `PGRST116` / 406 Not Acceptable | Calling `.single()` when 0 rows match | Replace `.single()` with `.maybeSingle()`. |
| `new row violates row-level security policy` | User is unauthenticated or `auth.uid()` does not match `userid` | Ensure Supabase user session is active and payload includes correct `user.id`. |
| PostEx 401 Unauthorized | Expired or incorrect PostEx API token | Update PostEx token in Settings; verify token with test curl call. |
| Groq 429 Too Many Requests | Free tier rate limit exhausted | Switch to fallback in-memory regex parser or wait 60s. |
| React Hydration Mismatch / Error #418 | Reading `localStorage` during initial component render | Gate client storage reading inside `useEffect()` or set initial constant state. |
| Janky / Laggy Mobile Scrolling | `backdrop-blur-*` active on sticky header or action bar | Remove blur classes; replace with solid high-contrast backgrounds (`bg-white/95`, `bg-slate-900/95`). |
| Sticky bottom bar floating high above bottom | Parent container has `pb-36` padding trap | Remove excessive parent padding; set sticky bar to `bottom-0`. |
