# 28 — Usage Analytics & Operational Metrics

Audit tracking, performance analytics, and log retention.

---

## 1. Audit Trail (`UsageLog`)
Every significant merchant action is logged to the `UsageLog` table:
- `order_parsed`: Raw text or Excel parsed into parcel candidates.
- `order_booked`: Parcel dispatched to PostEx with generated tracking number.
- `advice_saved`: Shipper advice instruction submitted to courier rider.
- `loadsheet_generated`: Official courier handover sheet generated.

---

## 2. Retention & Auto-Pruning
- The application automatically prunes logs older than 100 entries per user via `src/utils/supabaseClient.ts` to prevent database bloat while preserving recent operational history.
- Admin Panel aggregates these logs into real-time activity metrics.
