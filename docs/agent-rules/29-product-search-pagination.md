# 29 — Parcel Search, Filtering & Pagination Rules

Performance rules for managing large volumes of booked parcels and customer directories.

---

## 1. Instant Client-Side Search
- Search in `BookedHistory` and `ParcelTable` must be instantaneous (debounced at 150ms).
- Queries search across:
  - Tracking Number (`CN-XXXX`)
  - Order Reference Number (`ORD-XXXX`)
  - Customer Name
  - Customer Phone (`0300...`)
  - Destination City

---

## 2. Status Filtering Pills
- Fast toggle filters for parcel status:
  - `All`
  - `Booked` / `In Transit`
  - `Delivered`
  - `Returned`
  - `Under Review` (Requires Shipper Advice)
- Selecting a filter must update UI instantly (0ms) without triggering external network calls.

---

## 3. Large Dataset Rendering & Unified Shared Pagination (RULE PAG1)
- **Mandatory Shared Component**: Exactly ONE reusable pagination module across the entire application: `src/components/common/SharedPagination.tsx` combined with `src/hooks/usePagination.ts`.
- **Identical Look & Feel Everywhere**: Used uniformly across all pages and tabs:
  - `BookedHistory.tsx`
  - `BookingResults.tsx`
  - `DocumentVaultTab.tsx`
  - `AdminCustomerDirectoryTab.tsx`
  - `AdminMerchantsTab.tsx`
- **Zero DB Roundtrips on Page Clicks (Rate-Limit & DDOS Protection)**:
  - Page navigation (`Prev`, `Next`, `1`, `2`, `10/25/50/100`) MUST execute in-memory over the cached array.
  - Never issue a Supabase REST query on page-switch. This eliminates edge rate limiting, prevents DB crashes, and keeps the UI at instant 0ms latency.
- **Apple Minimalist UI**:
  - Displays `Showing {from} - {to} of {total} {items}`.
  - Compact page size selector (`10`, `25`, `50`, `100` rows per page with localStorage memory).
  - Numeric buttons with smart ellipsis windowing and disabled boundary controls (`«`, `‹`, `›`, `»`).

