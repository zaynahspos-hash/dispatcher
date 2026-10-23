# 🔄 Automated Daily Courier Harvest & 90-Day Parcel Retention Engine

This guide explains how Zaynahs Courier Manager automatically archives customer contacts permanently (for 2 to 5+ years) across all merchants while auto-pruning parcel tracking logs older than 90 days.

---

## 🎯 Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │          Daily Cloud Trigger           │
                      │  (pg_cron / Supabase Scheduled / Web)  │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │ Supabase Edge Function:                │
                      │ daily-courier-sync                     │
                      └──────────────────┬─────────────────────┘
                                         │
         ┌───────────────────────────────┴───────────────────────────────┐
         ▼                                                               ▼
┌─────────────────────────────────┐                    ┌─────────────────────────────────┐
│ PostEx V3 Multi-Merchant API    │                    │ PostgreSQL Pruning RPC:         │
│ /get-merchant-orders            │                    │ purge_old_booked_parcels(90)    │
└────────────────┬────────────────┘                    └────────────────┬────────────────┘
                 │                                                      │
                 ▼                                                      ▼
┌─────────────────────────────────┐                    ┌─────────────────────────────────┐
│ public.customers (PostgreSQL)   │                    │ public.booked_history           │
│ - user_id + phone UNIQUE        │                    │ - Parcels older than 90 days    │
│ - Name, City, Address, Spend    │                    │   automatically trimmed         │
│ - RETAINED PERMANENTLY (5+ yrs) │                    │ - DB stays lean, fast & compact │
└─────────────────────────────────┘                    └─────────────────────────────────┘
```

---

## 🚀 1. Deploying the Edge Function

From the project root in terminal:
```bash
supabase functions deploy daily-courier-sync --no-verify-jwt
```

---

## ⏰ 2. Scheduling Daily Execution (Zero Laptop/App Needed)

You can run this daily at 2:00 AM UTC without ever opening a laptop or phone:

### Option A: Via Supabase SQL Editor (`pg_cron`)
Run this single SQL command in the Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'daily-postex-harvest-and-prune',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://' || current_setting('request.headers', true)::json->>'host' || '/functions/v1/daily-courier-sync',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"retentionDays": 90}'::jsonb
  );
  $$
);
```

### Option B: Free External Ping (e.g. cron-job.org / GitHub Actions)
Set up a daily HTTP POST request to:
```
POST https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/functions/v1/daily-courier-sync
Headers:
  Content-Type: application/json
  Authorization: Bearer <YOUR_SUPABASE_SERVICE_ROLE_KEY>
Body:
  {"retentionDays": 90}
```

---

## 🖱️ 3. On-Demand Execution from Admin Dashboard

In **Admin Control -> Customer Directory**:
- Click **"Auto Cloud Sync"** button in the header.
- The button invokes `daily-courier-sync` live and displays the harvest results:
  - Total contacts upserted into PostgreSQL.
  - Total active merchants scanned.
  - Confirmation of 90-day parcel retention pruning.

---

## 📊 4. Deep Filters & Filtered Export

Admin Customer Directory retains customers from **today up to 5+ years ago**:
- **Date Range Filter**: Select any historical range (e.g., `01/01/2022` to `23/10/2026`).
- **Merchant Store Dropdown**: Searchable dropdown matching email, store name, or merchant ID.
- **City / Destination Dropdown**: Searchable dropdown of unique parcel cities.
- **Export Formats**:
  1. **Meta 19-Column CSV**: Value-based audience matching Meta's official lookalike standard.
  2. **Google Contacts CSV**: Phone & WhatsApp contacts exportable directly to Google Contacts.
  3. **Standard CRM CSV**: Complete export with WhatsApp click-to-chat links.
- **Rule**: All exports strictly apply all active filters (date, merchant, city, source).
