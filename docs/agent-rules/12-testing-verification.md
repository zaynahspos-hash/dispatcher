# 12 — Testing, Verification & QA Protocols

Pre-flight checklists and verification standards before committing or deploying.

---

## 1. Mandatory TypeScript & Build Check
Every single code update must pass the production build test without errors:
```bash
npm run build
```
Any type error, missing export, or syntax failure blocks the task.

---

## 2. PostEx API Verification Checklist
Before declaring a PostEx integration task complete, verify:
- [ ] V3 endpoint (`/order/v3/create-order`) is invoked.
- [ ] `storeAddressCode` is omitted if not configured.
- [ ] `pickupAddressCode` defaults cleanly to `settings.postex_pickup`.
- [ ] `returnAddressCode` falls back to `postex_pickup` when `postex_return` is blank.
- [ ] Tracking numbers are successfully retrieved and stored.
- [ ] Shipper advice modal handles status IDs `1` (Return) and `2` (Retry).
- [ ] Load sheet generates a valid printable PDF.

---

## 3. Supabase RLS Multi-Tenant Test Checklist
- [ ] Log in with User A: ensure only User A's settings and history load.
- [ ] Log in with User B: verify User A's data is completely invisible.
- [ ] Log in as Admin: verify global access to all records in AdminPanel.
- [ ] Check console for zero `403 Forbidden` or `404 Not Found` RLS policy errors.
