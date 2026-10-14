# 🛡️ Admin System Guide & Global Logistics Oversight

Operational manual for system administrators managing Zaynah's Courier Manager.

---

## 1. Capabilities of the Admin Role
The Admin Panel (`src/components/AdminPanel.tsx`) gives administrators oversight across all merchant accounts:
- **Global Usage Logs Audit**: View parsing frequency, PostEx booking velocity, loadsheet generation, and API error spikes.
- **Tenant Directory & User Inspection**: Inspect registered users, their creation dates, roles, and assigned configurations.
- **Customer Directory & Fraud Screening**: Cross-tenant customer phone lookup. Identifies repeat returners, fake addresses, and unverified phone patterns across the network.
- **System Health Checks**: Verify Supabase connection latency, PostEx API status, and Groq rate limit metrics.

---

## 2. Admin Authentication & Role Detection
1. User logs in through standard Supabase Auth (`supabase.auth.signInWithPassword`).
2. The application checks the authenticated user's email against `VITE_ADMIN_EMAIL` and validates `public."User".role === 'admin'`.
3. If confirmed, the **Admin** navigation tab is rendered in the top/bottom navigation bar.
4. Database queries executed by the admin are authorized at the PostgreSQL layer via `public.is_admin()`.

---

## 3. Usage Log Monitoring
The admin dashboard aggregates activities logged via `logUsage()`:
- `order_parsed`: Metric of raw orders processed by Groq.
- `order_booked`: Metric of confirmed PostEx bookings.
- `advice_saved`: Indicator of operational courier frictions (rider re-attempts vs returns).
- `loadsheet_generated`: Handover confirmation to PostEx courier fleet.
