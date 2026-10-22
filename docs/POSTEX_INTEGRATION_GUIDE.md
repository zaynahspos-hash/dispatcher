# 🚚 PostEx Courier Integration Guide — Complete Master Production Manual

This authoritative guide documents the complete end-to-end architecture, API contracts, date filtering, storage strategies, and copy-paste implementations for integrating PostEx Courier V3 into any SaaS logistics, eCommerce, Next.js, or React platform.

---

## 📋 Table of Contents
1. [Authentication & Merchant Headers](#1-authentication--merchant-headers)
2. [Order Creation API (V3)](#2-order-creation-api-v3)
3. [Live Parcel Tracking API](#3-live-parcel-tracking-api)
4. [Shipper Advice API (Retry vs Return)](#4-shipper-advice-api-retry-vs-return)
5. [Bulk Load Sheet Generation (PDF)](#5-bulk-load-sheet-generation-pdf)
6. [Bulk Orders Sync API (`get-all-order`)](#6-bulk-orders-sync-api-get-all-order)
7. [Gateway Timeout Mitigation & 7-Day Windowing](#7-gateway-timeout-mitigation--7-day-windowing)
8. [Strict Date Parsing & Zero-Timezone Distortion](#8-strict-date-parsing--zero-timezone-distortion)
9. [Quota-Free Client Storage Layer (IndexedDB + Encompassing Ranges)](#9-quota-free-client-storage-layer-indexeddb--encompassing-ranges)
10. [Customer CRM Directory Extraction & Bi-Directional Sync](#10-customer-crm-directory-extraction--bi-directional-sync)
11. [Universal Drop-in Implementation Blueprint](#11-universal-drop-in-implementation-blueprint)

---

## 1. Authentication & Merchant Headers

Every authenticated request to PostEx Integration APIs requires the merchant API token sent in the `token` HTTP header:

```http
token: MzY1NDJm...
Content-Type: application/json
```

- **Base URL**: `https://api.postex.pk/services/integration/api`
- **Security Rule**: Never expose raw merchant tokens to public client bundles. Store tokens in an encrypted database table (`user_settings` with RLS) or serverless proxy.

---

## 2. Order Creation API (V3)

### Endpoint
- **URL**: `POST https://api.postex.pk/services/integration/api/order/v3/create-order`
- **Headers**:
  ```http
  token: {merchant_token}
  Content-Type: application/json
  ```

### Request Payload
```json
{
  "cityName": "Lahore",
  "customerName": "Ayesha Malik",
  "customerPhone": "03011234567",
  "deliveryAddress": "House 45, Street 8, Sector Y, DHA Phase 3",
  "invoiceDivision": 1,
  "invoicePayment": 3450,
  "orderDetail": "Embroidered Lawn Suit x 1",
  "orderRefNumber": "ORD-2026-104",
  "orderType": "Normal",
  "pickupAddressCode": "WH-LHR-001"
}
```

### Critical V3 Rules & Lessons Learned:
1. **Omit `storeAddressCode`**: On merchant accounts with a single primary warehouse, passing `storeAddressCode` triggers `HTTP 400: INVALID MERCHANT STORE ADDRESS CODE`. Omit this parameter completely unless explicitly configured.
2. **Dynamic Return City Resolution**: If `returnAddressCode` is unconfigured, always fall back to `pickupAddressCode`. This prevents return airway bills from defaulting to Lahore or printing blank when the merchant operates from another city (e.g., Karachi, Multan, Faisalabad).

---

## 3. Live Parcel Tracking API

### Endpoint
- **URL**: `GET https://api.postex.pk/services/integration/api/order/v1/track-order/{trackingNumber}`
- **Header**: `token: {merchant_token}`

### Mapped Status Codes & Milestones
| PostEx Status String | Manager Status Category | UI Badge Color | Action Required |
|---|---|---|---|
| `Booked` / `Unassigned` | `Booked` | Sky Blue | Rider pickup pending |
| `In Transit` / `En Route` | `In Transit` | Indigo | On the move |
| `Out for Delivery` | `Out for Delivery` | Purple | On vehicle for delivery |
| `Delivered` | `Delivered` | Emerald Green | Completed / COD collected |
| `Returned` / `Returned to Shipper` | `Returned` | Rose Red | Returned to merchant warehouse |
| `Delivery Under Review` / `Attempted` | `Action Required` | Amber Orange | **Shipper Advice Required** |

---

## 4. Shipper Advice API (Retry vs Return)

When a parcel cannot be delivered (customer unreachable, refused, gate locked), PostEx moves it to `Delivery Under Review` and accepts shipper instructions.

### Endpoint
- **URL**: `PUT https://api.postex.pk/services/integration/api/order/v2/save-shipper-advice`
- **Header**: `token: {merchant_token}`
- **Payload**:
  ```json
  {
    "trackingNumber": "24261150099208",
    "statusId": 2,
    "remarks": "Customer contacted on WhatsApp; requested re-attempt tomorrow after 2 PM."
  }
  ```
- **Status IDs**:
  - `statusId: 2` ➔ **Retry Attempt** (Rider will re-attempt delivery)
  - `statusId: 1` ➔ **Return Requested** (Courier will abort and return parcel to shipper)

---

## 5. Bulk Load Sheet Generation (PDF)

When handing parcels over to the PostEx pickup rider, merchants generate a combined Load Sheet PDF.

### Endpoint
- **URL**: `POST https://api.postex.pk/services/integration/api/order/v2/generate-load-sheet`
- **Header**: `token: {merchant_token}`
- **Payload**:
  ```json
  {
    "pickupAddress": "Warehouse #1, Tulsa Road, Lalazar, Rawalpindi",
    "pickupAddressCode": "WH-RWP-001",
    "trackingNumbers": [
      "24261150099208",
      "28261150099196"
    ]
  }
  ```
- **Fallback**: If the object payload returns HTTP 400, PostEx accepts a raw JSON array of strings `["24261150099208", "28261150099196"]`.
- **Response**: Binary PDF Blob. Save as `PostEx-LoadSheet-{Date}.pdf` and mark parcels as `hasLoadSheet = true`.

---

## 6. Bulk Orders Sync API (`get-all-order`)

To display all booked orders, status milestones, and customer records from PostEx portal:

### Endpoint
- **URL**: `GET https://api.postex.pk/services/integration/api/order/v1/get-all-order?startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}&orderStatusId=0`
- **Header**: `token: {merchant_token}`

### Query Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `startDate` | string (`YYYY-MM-DD`) | Yes | Window start date (PKT timezone). |
| `endDate` | string (`YYYY-MM-DD`) | Yes | Window end date (PKT timezone). |
| `orderStatusId` | number | Yes | **Must be `0`** to return all statuses (Booked, Transit, Delivered, Returned, Cancelled). |

### Response Schema (`res.data.dist[]`)
```json
{
  "statusCode": "200",
  "statusMessage": "Success",
  "dist": [
    {
      "trackingNumber": "24261150099208",
      "orderRefNumber": "#3072135",
      "transactionStatus": "In Transit",
      "orderStatus": "In Transit",
      "orderDate": "2026-10-22T08:40:00",
      "transactionDate": "2026-10-22T20:45:06.000+0500",
      "customerName": "Arsalan Arsalan",
      "customerPhone": "03232782608",
      "cityName": "Karachi",
      "deliveryAddress": "A 216 block 12 fb area Karachi",
      "invoicePayment": 1599.00,
      "items": 1,
      "bookingWeight": 0.5
    }
  ]
}
```

---

## 7. Gateway Timeout Mitigation & 7-Day Windowing

### The Problem
Querying PostEx for 90 or 180 days in a single HTTP request causes backend database table locks on PostEx servers, triggering **Cloudflare HTTP 524 / 504 Gateway Timeouts**. When this happens, client applications silently display 0 parcels.

### The Production Solution: 7-Day Chunking with Retry
Split any requested date range (`startDate` to `endDate`) into sequential **7-day windows**:

```typescript
export async function fetchAllMerchantOrders(
  token: string,
  startDate: string,
  endDate: string,
  options: { on_progress?: (msg: string, current: number, total: number) => void }
): Promise<any[]> {
  const windowDays = 7;
  const windows: Array<{ from: string; to: string }> = [];

  // Generate 7-day chronological slices
  let cursor = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  while (cursor <= end) {
    const nextEnd = addDays(cursor, windowDays - 1);
    const windowEnd = nextEnd > end ? end : nextEnd;
    windows.push({ from: formatDate(cursor), to: formatDate(windowEnd) });
    cursor = addDays(cursor, windowDays);
  }

  const collected: any[] = [];
  const seenTracking = new Set<string>();

  for (let i = 0; i < windows.length; i++) {
    const w = windows[i];
    options.on_progress?.(`Loading parcels from PostEx (${i + 1}/${windows.length})...`, i + 1, windows.length);

    let success = false;
    let attempts = 0;

    while (!success && attempts < 2) {
      attempts++;
      try {
        const res = await axios.get(
          `https://api.postex.pk/services/integration/api/order/v1/get-all-order?startDate=${w.from}&endDate=${w.to}&orderStatusId=0`,
          { headers: { token }, timeout: 60000 }
        );

        const list = res.data?.dist || res.data?.data || [];
        for (const order of list) {
          const key = (order.trackingNumber || order.orderRefNumber || '').trim().toLowerCase();
          if (!key || seenTracking.has(key)) continue;
          seenTracking.add(key);
          collected.push(order);
        }
        success = true;
      } catch (err) {
        if (attempts >= 2) console.warn(`Window ${w.from} -> ${w.to} skipped:`, err);
        else await new Promise(r => setTimeout(r, 600));
      }
    }
  }

  return collected;
}
```

---

## 8. Strict Date Parsing & Zero-Timezone Distortion

### ⚠️ Common Bug: Timezone Shifting & Fake Today Leakage
1. **Safari Offset Bug**: PostEx sends timestamps with `+0500` offset (e.g. `2026-10-22T08:41:11.000+0500`). JavaScript's `new Date()` in Safari rejects this string unless normalized to RFC-3339 format (`+05:00`).
2. **UTC Conversion Bug**: Converting a Pakistani date (`2026-10-22 02:00:00 PKT`) to UTC (`2026-10-21 21:00:00Z`) causes the parcel to shift to yesterday!
3. **Missing Date Fallback Bug**: If `parsePortalDate()` defaults to `new Date().toISOString()`, any order missing a date is falsely counted in `Today`!

### Production-Grade Date Parser (`types.ts`)
```typescript
/**
 * Extracts normalized YYYY-MM-DD date string with absolute zero timezone distortion.
 * Direct string prefix matching guarantees official courier dates are preserved.
 */
export const getParcelDateStr = (dateVal?: string): string => {
  if (!dateVal) return '';
  const str = String(dateVal).trim();
  if (!str) return '';

  // 1. Match YYYY-MM-DD prefix directly
  const matchIso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchIso) return `${matchIso[1]}-${matchIso[2]}-${matchIso[3]}`;

  // 2. Match DD/MM/YYYY or DD-MM-YYYY format
  const matchSlash = str.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/);
  if (matchSlash) return `${matchSlash[3]}-${matchSlash[2]}-${matchSlash[1]}`;

  // 3. Fallback for valid timestamp objects
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return '';
};

/**
 * Normalizes non-standard PostEx timestamps to valid ISO strings.
 * CRITICAL: Returns '' (empty string) if date is missing. NEVER defaults to Today!
 */
export const parsePortalDate = (value?: string): string => {
  const raw = (value || '').trim();
  if (!raw) return '';
  const normalized = raw.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const dateStr = getParcelDateStr(normalized);
  if (dateStr) {
    if (normalized.includes('T')) return normalized;
    return `${dateStr}T12:00:00.000+05:00`;
  }
  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? '' : parsed.toISOString();
};
```

### Date Field Priority Order
When transforming PostEx orders, inspect fields in this exact order:
```typescript
const rawDate =
  order.orderDate ||
  order.bookingDate ||
  order.transactionDate ||
  order.createdDatetime ||
  order.modifiedDatetime ||
  order.orderDateString;

const bookingDate = parsePortalDate(rawDate) || existing?.bookingDate || '';
```

---

## 9. Quota-Free Client Storage Layer (IndexedDB + Encompassing Ranges)

### The Storage Challenge
Browser `localStorage` has a strict **5MB domain quota**. In high-volume logistics stores, syncing 30,000+ parcels or customer directory entries generates 15MB+ of JSON, causing silent `DOMException: QuotaExceededError` crashes.

### The 3-Tier Storage Hierarchy
1. **Tier 1 (Memory Map)**: 0ms instantaneous tab switching and filtering during active session.
2. **Tier 2 (IndexedDB `zaynah_logistics_v1`)**: Quota-free (100MB+) structured client database that survives full page reloads and browser restarts.
3. **Tier 3 (LocalStorage Snapshot)**: Lightweight fallback for small devices.

### Encompassing Range Optimization
If a merchant previously fetched **Last 3 Months** (`2026-07-24` to `2026-10-22`), selecting **Today** (`2026-10-22`), **Yesterday**, **Last 7 Days**, or **This Month** resolves in **0ms from memory/IndexedDB** without making a single network call:

```typescript
export function readExternalParcels(userId: string | undefined, fromDate: string, toDate: string): BookedParcel[] {
  const rKey = `${fromDate}|${toDate}`;
  const memKey = `${userId || 'guest'}_${rKey}`;

  // 1. Exact match in memory
  const exact = memoryStore.get(memKey);
  if (exact && exact.parcels.length > 0) return exact.parcels;

  // 2. Encompassing range match
  const userPrefix = `${userId || 'guest'}_`;
  for (const [key, stored] of memoryStore.entries()) {
    if (key.startsWith(userPrefix) && stored?.parcels?.length > 0) {
      const [storedFrom, storedTo] = stored.range.split('|');
      if (storedFrom <= fromDate && storedTo >= toDate) {
        return stored.parcels.filter(p => {
          const d = getParcelDateStr(p.bookingDate);
          return Boolean(d && d >= fromDate && d <= toDate);
        });
      }
    }
  }

  return [];
}
```

---

## 10. Customer CRM Directory Extraction & Bi-Directional Sync

Whenever PostEx orders are fetched for Booked History, automatically extract unique customer contacts and enrich the Admin Customer Directory:

```typescript
// Extract customer directory contacts from PostEx order objects
orders.forEach((order, idx) => {
  const rawPhone = (order.customerPhone || '').trim();
  if (!rawPhone) return;
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const rawDate = order.orderDate || order.bookingDate || order.transactionDate || order.createdDatetime;
  const validIsoDate = parsePortalDate(rawDate);

  const entry: CustomerEntry = {
    id: `portal_${merchantId}_${order.trackingNumber || order.orderRefNumber || idx}`,
    user_id: merchantId,
    name: order.customerName || 'Valued Customer',
    phone: rawPhone,
    city: order.cityName || '',
    address: order.deliveryAddress || '',
    source: 'postex_portal',
    created_at: validIsoDate,
    updated_at: validIsoDate,
    user: { email: merchantEmail }
  };

  customerMap.set(`${merchantId}_${cleanPhone}`, entry);
});

// Save to IndexedDB
await idbSaveCustomers(Array.from(customerMap.values()));

// Notify other open tabs/components
window.dispatchEvent(new CustomEvent('portal_parcels_synced', {
  detail: { userId: merchantId, count: orders.length }
}));
```

---

## 11. Universal Drop-in Implementation Blueprint

When creating a new courier management dashboard, adhere to these standard operational rules:

1. **Default Date Filter = `Today` Everywhere**: Both Booked History and Customer Directory must initialize with `startDate = Today` and `endDate = Today`.
2. **Sync on Explicit Button Click Only**: Date preset changes (`Today`, `Last 7 Days`, `This Month`) must filter locally cached records instantly without initiating automatic network sync loops.
3. **Uniform Progress Feedback**: Display a top banner above the search bar featuring:
   - Green pill card (`bg-emerald-50/90 dark:bg-emerald-900/25 border-emerald-200`)
   - Circular SVG spinner (`animate-spin h-4 w-4`)
   - Real-time window counter `(X/Y)`
   - Live elapsed seconds timer badge (`0:04s`).
4. **Zero Duplicate Requests**: If Tenant A's orders are cached for date range `R`, skip network fetching unless `force = true` is passed from the "Sync PostEx" button.
