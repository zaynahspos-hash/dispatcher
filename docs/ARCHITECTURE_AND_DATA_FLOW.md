# 🏗️ Architecture & Data Flow — Multi-Tenant SaaS Engine

Complete architectural blueprint of Zaynah's Courier Manager.

---

## 1. High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Vite + React 19 Client Application                   │
│                                                                        │
│   ┌────────────────────┐   ┌───────────────────┐   ┌───────────────┐   │
│   │  Paste / Excel     │   │  Review Grid      │   │ Booked Hub    │   │
│   │  Ingestion         │──▶│  (ParcelTable)    │──▶│ & Shipper     │   │
│   │  (Groq LLaMA-3)    │   │  City Validation  │   │ Advice Modal  │   │
│   └────────────────────┘   └───────────────────┘   └───────────────┘   │
└──────────────┬───────────────────────┬──────────────────────┬──────────┘
               │                       │                      │
               ▼                       ▼                      ▼
┌────────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│      Groq AI API       │  │   PostEx API V3    │  │  Supabase Postgres │
│  (LLaMA-3 Fast Parser) │  │  (Orders, Tracking,│  │  Multi-Tenant RLS  │
│                        │  │   Advice, Sheets)  │  │  Pure snake_case   │
└────────────────────────┘  └────────────────────┘  └────────────────────┘
```

---

## 2. Multi-Tenant Data Lifecycle

1. **Tenant Authentication**:
   - Merchant signs in via `supabase.auth.signInWithPassword`.
   - JWT is issued containing tenant `auth.uid()`.
   - Client fetches tenant configurations from `user_settings` where `user_id = auth.uid()`.
2. **Order Ingestion**:
   - Merchant pastes raw WhatsApp customer messages or uploads `.xlsx`.
   - Groq AI extracts entity fields (`name`, `phone`, `address`, `city`, `cod`).
   - Normalization formats phone to `03XXXXXXXXX` and resolves city via `cityList.ts`.
3. **Pre-Booking Verification**:
   - Parsed parcels render in `ParcelTable`.
   - Merchant edits missing fields or changes COD amounts directly in the grid.
4. **PostEx V3 Dispatch**:
   - Client sends POST request to `/order/v3/create-order` with merchant's token and pickup address code.
   - PostEx responds with tracking number (`CN-XXXX`).
5. **Persistence & Activity Log**:
   - Booked order record is prepended to `booked_history`.
   - Customer phone/name is recorded in `customers` directory for future autocomplete.
   - Audit event logged into `usage_logs`.
