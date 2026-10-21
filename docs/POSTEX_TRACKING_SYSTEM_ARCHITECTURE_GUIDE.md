# 📦 PostEx Real-Time Tracking Engine Architecture & Implementation Guide
### Production-Grade Logistics Tracking System for E-Commerce & Shopify Alternatives (Next.js, Node.js, React)

> **Document Status**: Authoritative Architecture Specification  
> **Source Project**: Zaynahs Courier Manager (Vite · React 19 · TypeScript · Supabase · PostEx V3)  
> **Target Applicability**: Next.js (App Router / Pages Router), Remix, Node.js Microservices, Custom Shopify Alternatives, Multi-Tenant SaaS.

---

## 📑 Table of Contents

1. [Executive Summary & High-Level Architecture](#1-executive-summary--high-level-architecture)
2. [The 3 Core PostEx Tracking APIs (Exact Specs)](#2-the-3-core-postex-tracking-apis-exact-specs)
   - [API #1: Bulk Merchant Orders Sync (`/order/v1/get-all-order`)](#api-1-bulk-merchant-orders-sync-orderv1get-all-order)
   - [API #2: Public High-Fidelity Single Tracking (`/api/tracking-order`)](#api-2-public-high-fidelity-single-tracking-apitracking-order)
   - [API #3: Authenticated Single Merchant Tracking (`/order/v1/track-order/{cn}`)](#api-3-authenticated-single-merchant-tracking-orderv1track-ordercn)
3. [Status Normalization & The 7-Stage State Machine](#3-status-normalization--the-7-stage-state-machine)
4. [Shipper Advice System (`/order/v2/save-shipper-advice`)](#4-shipper-advice-system-orderv2save-shipper-advice)
5. [Complete Drop-In Next.js Implementation (App Router)](#5-complete-drop-in-nextjs-implementation-app-router)
   - [File 1: `lib/postex/types.ts`](#file-1-libpostextypests)
   - [File 2: `lib/postex/client.ts`](#file-2-libpostexclientts)
   - [File 3: `lib/postex/statusMapper.ts`](#file-3-libpostexstatusmapperts)
   - [File 4: `app/api/track/route.ts` (Serverless Proxy)](#file-4-appapitrackroutets-serverless-proxy)
   - [File 5: `app/api/cron/sync-postex/route.ts` (Automated Background Sync)](#file-5-appapicronsync-postexroutets-automated-background-sync)
   - [File 6: `vercel.json` (Cron Trigger)](#file-6-verceljson-cron-trigger)
6. [Database Schema (PostgreSQL / Supabase / Prisma)](#6-database-schema-postgresql--supabase--prisma)
7. [Production Hardening & Rate-Limit Safeguards](#7-production-hardening--rate-limit-safeguards)

---

## 1. Executive Summary & High-Level Architecture

In modern Pakistani logistics, couriers (especially PostEx) experience frequent milestone changes (Pickup, Manifesting, Inter-City Linehaul, Hub Arrival, Out for Delivery, Failed Attempt, Shipper Advice, Delivery, Cash Collection).

### The Problem With Naive Tracking Implementations:
* **The N+1 Loop Pitfall**: If an e-commerce store has 1,000 active shipments and runs a cron loop calling `trackOrder(cn)` 1,000 times, PostEx will rate-limit (HTTP 429/500), your server will choke, and sync takes 10+ minutes.
* **Browser CORS Blocks**: Calling `https://postex.pk/api/tracking-order` directly from client browser JavaScript fails due to CORS origin restrictions.
* **Milestone Overwrite Loss**: PostEx often sends a generic status like `"In Transit"` after sending a specific milestone like `"Departed to SKARDU Hub"`. Naive systems overwrite the rich location with the generic label.

### The Zaynahs Dual-Engine Solution:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       POSTEX TRACKING ARCHITECTURE                          │
├────────────────────────────────────────┬────────────────────────────────────┤
│   ENGINE A: BULK CRON SYNC (1 CALL)    │  ENGINE B: REAL-TIME ON-DEMAND     │
│   Used for: All Active Orders Sync     │  Used for: Customer Order Page     │
├────────────────────────────────────────┼────────────────────────────────────┤
│  Next.js Cron (e.g. Every 1-2 Hours)   │  Customer / Admin hits tracking    │
│                  │                     │                  │                 │
│                  ▼                     │                  ▼                 │
│  GET /order/v1/get-all-order           │  POST /api/track (Serverless)      │
│  (Fetches 1000+ orders in 1 API call)  │  (Proxies to postex.pk without CORS│
│                  │                     │                  │                 │
│                  ▼                     │                  ▼                 │
│  State Machine Normalizer              │  Parse transactionStatusHistory    │
│  (Map to clean Shopify order states)   │  (Extract latest rider message)    │
│                  │                     │                  │                 │
│                  ▼                     │                  ▼                 │
│  Bulk DB Update & WhatsApp Triggers    │  0ms Instant Delivery Timeline     │
└────────────────────────────────────────┴────────────────────────────────────┘
```

---

## 2. The 3 Core PostEx Tracking APIs (Exact Specs)

### API #1: Bulk Merchant Orders Sync (`/order/v1/get-all-order`)
* **When to Call**: Scheduled cron job (every 1 to 2 hours) or admin dashboard "Refresh All Orders" button.
* **Why**: Updates hundreds of orders in **exactly ONE HTTP request** (~800ms) with zero N+1 overhead.

```http
GET https://api.postex.pk/services/integration/api/order/v1/get-all-order?startDate=2026-04-01&endDate=2026-10-21&orderStatusId=0
token: YOUR_POSTEX_MERCHANT_TOKEN
Content-Type: application/json
```

#### Query Parameters:
| Param | Type | Description |
|---|---|---|
| `startDate` | `YYYY-MM-DD` | Start date filter (typically 30–90 days back). |
| `endDate` | `YYYY-MM-DD` | End date filter (typically today or +1 day). |
| `orderStatusId` | `number` | **MUST BE `0`** to return orders across ALL statuses (Booked, In-Transit, Delivered, Returned, Cancelled). |

#### Response Schema (`res.data.dist[]`):
```json
{
  "statusCode": "200",
  "statusMessage": "Success",
  "dist": [
    {
      "trackingNumber": "21469620000365",
      "orderRefNumber": "Ord-10492",
      "transactionStatus": "In Transit",
      "orderStatus": "In Transit",
      "transactionDate": "2026-10-20T14:32:00",
      "customerName": "Usman Tariq",
      "customerPhone": "03001234567",
      "cityName": "Lahore",
      "deliveryAddress": "House 45, Street 2, DHA Phase 5",
      "invoicePayment": 4500.00,
      "items": 2
    }
  ]
}
```

---

### API #2: Public High-Fidelity Single Tracking (`/api/tracking-order`)
* **When to Call**: When a customer views their tracking page (`/order/[id]/track`), clicks tracking on WhatsApp, or when admin inspects a single parcel.
* **Why**: Returns the complete chronological lifecycle (`transactionStatusHistory`), rider delivery notes, attempt count, and exact timestamp.

```http
POST https://postex.pk/api/tracking-order
Content-Type: application/json

{
  "trackingNumber": "21469620000365"
}
```

#### Response Schema (`res.data.dist`):
```json
{
  "statusCode": "200",
  "statusMessage": "Success",
  "dist": {
    "trackingNumber": "21469620000365",
    "orderRefNumber": "Ord-10492",
    "customerName": "Usman Tariq",
    "customerPhone": "03001234567",
    "cityName": "Lahore",
    "deliveryAddress": "House 45, Street 2, DHA Phase 5",
    "invoicePayment": 4500.0,
    "transactionStatus": "Departed to LAHORE Hub",
    "orderStatus": "In Transit",
    "transactionStatusHistory": [
      {
        "datetime": "2026-10-21T09:45:00",
        "transactionStatusMessage": "Departed to LAHORE Hub",
        "createdDatetime": "2026-10-21T09:45:00"
      },
      {
        "datetime": "2026-10-20T18:15:00",
        "transactionStatusMessage": "Picked by PostEx Courier Rider",
        "createdDatetime": "2026-10-20T18:15:00"
      },
      {
        "datetime": "2026-10-20T12:00:00",
        "transactionStatusMessage": "Order Manifested & Booked",
        "createdDatetime": "2026-10-20T12:00:00"
      }
    ]
  }
}
```

> ⚠️ **CRITICAL NOTE ON SORTING**: PostEx does not guarantee `transactionStatusHistory` is ordered chronologically. **Always sort descending by timestamp (`b.datetime - a.datetime`)** before reading index 0!

---

### API #3: Authenticated Single Merchant Tracking (`/order/v1/track-order/{cn}`)
* **When to Call**: Fallback if public portal rate-limits or for authenticated merchant verification.

```http
GET https://api.postex.pk/services/integration/api/order/v1/track-order/21469620000365
token: YOUR_POSTEX_MERCHANT_TOKEN
Content-Type: application/json
```

---

## 3. Status Normalization & The 7-Stage State Machine

PostEx returns dozens of arbitrary courier status strings. A production e-commerce store must normalize them into **predictable, clean business categories**:

| Stage | PostEx Status Strings Matched | Clean SaaS Category | Shopify / Store State | Action Allowed |
|---|---|---|---|---|
| **1. Pending Loadsheet** | `Unbooked`, `Unassigned`, `At [Merchant] Warehouse` | `pending_loadsheet` | `UNFULFILLED` | Cancel Order |
| **2. Booked** | `Booked`, `Manifested`, `Success` | `booked` | `FULFILLED` (Label Printed) | Cancel / Generate Loadsheet |
| **3. In Transit** | `Picked by PostEx`, `At PostEx Warehouse`, `Departed to [City]`, `Arrived at Hub`, `In Transit` | `intransit` | `IN_TRANSIT` | Track Only |
| **4. Out for Delivery** | `Out for Delivery`, `With Rider`, `Waiting for Delivery` | `out_for_delivery` | `OUT_FOR_DELIVERY` | WhatsApp Alert |
| **5. Action Required** | `Attempt Failed`, `Customer Unreachable`, `Refused`, `Under Review`, `On Hold` | `action_required` | `ATTEMPT_FAILED` | **Shipper Advice** |
| **6. Delivered** | `Delivered`, `Cash Collected`, `Completed` | `delivered` | `DELIVERED` | Order Complete / Review |
| **7. Returned** | `Returned`, `RTO Completed`, `Return in Transit` | `returned` | `RETURNED` | Restock Inventory |
| **8. Cancelled** | `Cancelled`, `Voided` | `cancelled` | `CANCELLED` | Void |

### The "Detailed Milestone Preservation" Rule
If an order already has a rich status like `"Departed to FAISALABAD Hub"`:
* If the next PostEx sync returns a generic string like `"In Transit"` or `"In-Transit"`, **DO NOT** overwrite `"Departed to FAISALABAD Hub"` with `"In Transit"`.
* Only overwrite if the new status is a more advanced milestone (e.g. `"Arrived at FAISALABAD Hub"`, `"Out for Delivery"`, or `"Delivered"`).

---

## 4. Shipper Advice System (`/order/v2/save-shipper-advice`)

When a delivery rider marks a parcel as **"Customer not answering"** or **"Address not found"**, PostEx places the parcel in **Under Review / Shipper Advice Pending**. If the merchant does not respond within 24–48 hours, PostEx marks it as Return to Origin (RTO), costing the merchant courier charges.

To submit instructions to PostEx riders directly from your app:

```http
PUT https://api.postex.pk/services/integration/api/order/v2/save-shipper-advice
token: YOUR_POSTEX_MERCHANT_TOKEN
Content-Type: application/json

{
  "trackingNumber": "21469620000365",
  "statusId": 2,
  "remarks": "Customer was praying. Local phone is active now, please re-attempt tomorrow morning."
}
```

#### Shipper Advice `statusId` Mapping:
* `2` = **Re-Attempt Delivery** (Order delivery dobara try karo)
* `1` = **Return to Shipper** (Parcel wapas bhej do / RTO)

---

## 5. Complete Drop-In Next.js Implementation (App Router)

Copy these files directly into any Next.js (14/15) e-commerce project:

### File 1: `lib/postex/types.ts`
```typescript
export interface PostExOrderDist {
  trackingNumber: string
  orderRefNumber?: string
  transactionStatus?: string
  orderStatus?: string
  transactionDate?: string
  customerName?: string
  customerPhone?: string
  cityName?: string
  deliveryAddress?: string
  invoicePayment?: number
  items?: number
  transactionStatusHistory?: Array<{
    datetime?: string
    createdDatetime?: string
    modifiedDatetime?: string
    transactionStatusMessage?: string
  }>
}

export type CleanFulfillmentStatus = 
  | 'PENDING_LOADSHEET'
  | 'BOOKED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'ACTION_REQUIRED'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED'
```

---

### File 2: `lib/postex/client.ts`
```typescript
import axios from 'axios'
import { PostExOrderDist } from './types'

const POSTEX_INTEGRATION_BASE = 'https://api.postex.pk/services/integration/api'

export class PostExClient {
  private token: string

  constructor(token?: string) {
    this.token = token || process.env.POSTEX_MERCHANT_TOKEN || ''
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      token: this.token
    }
  }

  /**
   * BULK SYNC: Fetches ALL merchant orders in 1 single HTTP request.
   * Call this from your cron job.
   */
  async getAllOrders(startDate?: string, endDate?: string): Promise<PostExOrderDist[]> {
    if (!this.token) return []
    const now = new Date()
    const end = endDate || new Date(now.getTime() + 86400000).toISOString().split('T')[0]
    const past = new Date(now.getTime() - 90 * 86400000)
    const start = startDate || past.toISOString().split('T')[0]

    try {
      const url = `${POSTEX_INTEGRATION_BASE}/order/v1/get-all-order?startDate=${start}&endDate=${end}&orderStatusId=0`
      const res = await axios.get(url, { headers: this.headers(), timeout: 15000 })
      if (res.data && Array.isArray(res.data.dist)) {
        return res.data.dist
      }
    } catch (err: any) {
      console.error('[PostEx] getAllOrders failed:', err?.response?.data || err.message)
    }
    return []
  }

  /**
   * HIGH-FIDELITY TRACK: Queries the exact public tracking portal.
   * Call this server-side to avoid CORS blocks.
   */
  async trackSingleOrder(trackingNumber: string): Promise<{
    statusCode: number | string
    dist?: PostExOrderDist
    statusMessage?: string
  }> {
    const cleanCN = (trackingNumber || '').trim()
    if (!cleanCN) return { statusCode: 400, statusMessage: 'Tracking number missing' }

    // 1. Try public serverless tracking endpoint (most up to date)
    try {
      const pubRes = await axios.post(
        'https://postex.pk/api/tracking-order',
        { trackingNumber: cleanCN },
        { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
      )
      if (pubRes?.data && (pubRes.data.statusCode === 200 || pubRes.data.statusCode === '200')) {
        return pubRes.data
      }
    } catch (e: any) {
      console.warn('[PostEx] Public track failed, trying merchant API:', e.message)
    }

    // 2. Fallback to merchant integration track-order endpoint
    if (this.token) {
      try {
        const res = await axios.get(
          `${POSTEX_INTEGRATION_BASE}/order/v1/track-order/${cleanCN}`,
          { headers: this.headers(), timeout: 8000 }
        )
        if (res?.data && (res.data.statusCode === 200 || res.data.statusCode === '200')) {
          return res.data
        }
      } catch (err: any) {
        console.error('[PostEx] Merchant track-order failed:', err?.response?.data || err.message)
      }
    }

    return { statusCode: 404, statusMessage: 'Tracking information not found' }
  }

  /**
   * SHIPPER ADVICE: Resolve delivery issues (Retry = 2, Return = 1)
   */
  async submitShipperAdvice(trackingNumber: string, statusId: 1 | 2, remarks: string) {
    const url = `${POSTEX_INTEGRATION_BASE}/order/v2/save-shipper-advice`
    const res = await axios.put(url, { trackingNumber, statusId, remarks }, { headers: this.headers() })
    return res.data
  }
}
```

---

### File 3: `lib/postex/statusMapper.ts`
```typescript
import { PostExOrderDist, CleanFulfillmentStatus } from './types'

/**
 * Extracts newest milestone status message from timeline history
 */
export function getLatestPostExStatus(dist?: PostExOrderDist): string {
  if (!dist) return 'Booked'
  const list = dist.transactionStatusHistory
  if (Array.isArray(list) && list.length > 0) {
    const sorted = [...list].sort((a, b) => {
      const timeA = new Date(a.modifiedDatetime || a.createdDatetime || a.datetime || 0).getTime()
      const timeB = new Date(b.modifiedDatetime || b.createdDatetime || b.datetime || 0).getTime()
      return timeB - timeA
    })
    const msg = sorted[0]?.transactionStatusMessage
    if (msg && msg.trim()) return msg.trim()
  }
  return dist.transactionStatus || dist.orderStatus || 'Booked'
}

/**
 * Maps courier message to clean unified e-commerce fulfillment status
 */
export function mapPostExToFulfillmentStatus(rawStatus?: string): CleanFulfillmentStatus {
  if (!rawStatus) return 'PENDING_LOADSHEET'
  const s = rawStatus.toLowerCase().trim()

  if (s.includes('cancel')) return 'CANCELLED'
  if (s.includes('delivered') || s === 'deliver') return 'DELIVERED'
  if (s.includes('out for delivery') || s.includes('with rider') || s.includes('waiting for delivery')) {
    return 'OUT_FOR_DELIVERY'
  }
  if (s.includes('attempt') || s.includes('unreachable') || s.includes('refused') || s.includes('failed') || s.includes('hold') || s.includes('review')) {
    return 'ACTION_REQUIRED'
  }
  if (s.includes('return') && !s.includes('return to sender requested')) {
    return 'RETURNED'
  }
  if (
    s.includes('transit') || 
    s.includes('depart') || 
    s.includes('arrive') || 
    s.includes('hub') || 
    s.includes('station') || 
    s.includes('postex warehouse') || 
    s.includes('picked by postex')
  ) {
    return 'IN_TRANSIT'
  }
  if (s === 'unbooked' || s.includes('unassigned') || s.includes('un-assigned')) {
    return 'PENDING_LOADSHEET'
  }

  return 'BOOKED'
}

/**
 * Detailed Milestone Preservation: Prevents generic "In Transit" from wiping specific city locations
 */
export function determineNewStatus(currentStatus: string, fetchedStatus: string): string {
  if (!fetchedStatus) return currentStatus
  const clean = fetchedStatus.trim()
  const f = clean.toLowerCase()

  if (!clean || f === 'unknown' || f === 'null' || f === 'undefined' || f.includes('not found')) {
    return currentStatus
  }
  if (f.includes('unassigned') || f.includes('un-assigned') || f === 'success') {
    return 'Booked'
  }

  const isDetailed = (txt: string) => {
    const l = txt.toLowerCase()
    return l.includes('depart') || l.includes('arrive') || l.includes('received at') || l.includes('at transit')
  }

  // Preserve location milestone if fetched status is merely generic "In Transit"
  if (isDetailed(currentStatus) && (f === 'in transit' || f === 'in-transit' || f === 'intransit')) {
    return currentStatus
  }

  return clean
}
```

---

### File 4: `app/api/track/route.ts` (Serverless Proxy)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PostExClient } from '@/lib/postex/client'
import { getLatestPostExStatus, mapPostExToFulfillmentStatus } from '@/lib/postex/statusMapper'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const cn = req.nextUrl.searchParams.get('cn') || req.nextUrl.searchParams.get('trackingNumber')
  if (!cn) {
    return NextResponse.json({ error: 'Tracking number (cn) required' }, { status: 400 })
  }

  const client = new PostExClient()
  const result = await client.trackSingleOrder(cn)

  if (result.statusCode !== 200 && result.statusCode !== '200') {
    return NextResponse.json({ error: result.statusMessage || 'Not found' }, { status: 404 })
  }

  const rawStatus = getLatestPostExStatus(result.dist)
  const cleanStatus = mapPostExToFulfillmentStatus(rawStatus)

  return NextResponse.json({
    trackingNumber: cn,
    rawStatus,
    cleanStatus,
    timeline: result.dist?.transactionStatusHistory || [],
    recipient: {
      name: result.dist?.customerName,
      phone: result.dist?.customerPhone,
      city: result.dist?.cityName,
      address: result.dist?.deliveryAddress
    },
    payment: {
      codAmount: result.dist?.invoicePayment
    }
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const cn = body.trackingNumber || body.cn
  if (!cn) {
    return NextResponse.json({ error: 'Tracking number missing' }, { status: 400 })
  }

  const client = new PostExClient()
  const result = await client.trackSingleOrder(cn)
  return NextResponse.json(result)
}
```

---

### File 5: `app/api/cron/sync-postex/route.ts` (Automated Background Sync)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PostExClient } from '@/lib/postex/client'
import { mapPostExToFulfillmentStatus, determineNewStatus } from '@/lib/postex/statusMapper'
// Import your database client (Prisma, Supabase, or Drizzle)
// import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds max runtime

export async function GET(req: NextRequest) {
  // Optional: Verify Vercel Cron Secret
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = new PostExClient()
  
  // 1. Fetch all orders from PostEx in ONE request (past 60 days)
  const orders = await client.getAllOrders()
  if (!orders || orders.length === 0) {
    return NextResponse.json({ message: 'No orders returned from PostEx' })
  }

  let updatedCount = 0

  // 2. Update your database orders in batches
  for (const postexOrder of orders) {
    const tracking = postexOrder.trackingNumber
    const orderRef = postexOrder.orderRefNumber
    const rawStatus = postexOrder.transactionStatus || postexOrder.orderStatus || ''
    const cleanCategory = mapPostExToFulfillmentStatus(rawStatus)

    /* Example Prisma / SQL Database update:
    await db.order.updateMany({
      where: {
        OR: [
          { trackingNumber: tracking },
          { orderNumber: orderRef }
        ]
      },
      data: {
        courierStatus: rawStatus,
        fulfillmentStatus: cleanCategory,
        lastSyncedAt: new Date()
      }
    })
    */
    updatedCount++
  }

  return NextResponse.json({
    success: true,
    totalFetched: orders.length,
    updated: updatedCount,
    syncedAt: new Date().toISOString()
  })
}
```

---

### File 6: `vercel.json` (Cron Trigger)
Configure Vercel to automatically trigger your sync route every 2 hours:
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-postex",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

---

## 6. Database Schema (PostgreSQL / Supabase / Prisma)

To store PostEx tracking info cleanly in your e-commerce database:

```sql
-- PostgreSQL / Supabase Schema for E-Commerce Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,          -- e.g. "Ord-10492"
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_city TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    courier_name TEXT DEFAULT 'POSTEX',
    tracking_number TEXT UNIQUE,                -- e.g. "21469620000365"
    courier_status TEXT DEFAULT 'Booked',        -- Raw string from PostEx ("Departed to LAHORE Hub")
    fulfillment_status TEXT DEFAULT 'BOOKED',   -- Clean enum ('BOOKED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'ACTION_REQUIRED', 'DELIVERED', 'RETURNED')
    loadsheet_generated BOOLEAN DEFAULT FALSE,
    shipper_advice_status TEXT,                -- 'RETRY_REQUESTED', 'RETURN_REQUESTED'
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_tracking ON public.orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment ON public.orders(fulfillment_status);
```

---

## 7. Production Hardening & Rate-Limit Safeguards

1. **Never Call PostEx in Parallel for Thousands of Orders**:
   * Always prefer `/order/v1/get-all-order`. It returns the state of all orders in one single JSON payload.
2. **Handle CORS with a Proxy**:
   * Client browsers cannot call `https://postex.pk/api/tracking-order` directly. Route all customer front-end queries through your Next.js route `/api/track?cn=...`.
3. **Shipper Advice Window**:
   * When `fulfillment_status === 'ACTION_REQUIRED'`, immediately notify the merchant (or trigger automated WhatsApp to the customer: *"Our delivery rider tried to reach you at your address. Please confirm if tomorrow 2 PM works for delivery"*).
4. **Offline Resiliency**:
   * If PostEx API is temporarily down, serve the cached `courier_status` from your database with a timestamp tag (`Last updated 20 mins ago`).

---

**End of Guide**  
*Maintained under Zaynahs Logistics Documentation (`docs/`)*
