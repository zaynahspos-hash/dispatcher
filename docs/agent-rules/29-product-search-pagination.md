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
  - Displays `Showing {from} - {to} of {total} {items}` with proper number localization.
  - Compact page size selector (`10`, `25`, `50`, `100`, `200`, `300`, `500` rows per page with localStorage persistence).
  - Numeric buttons with smart ellipsis windowing and disabled boundary controls (`«`, `‹`, `›`, `»`).

---

## 4. Hard 500 Limit & DOM Stability (RULE PAG-MAX500)
- **Hard 500-Row Viewport Cap**: Pagination options MUST strictly cap at 500 (`[10, 25, 50, 100, 200, 300, 500]`).
- **Ban on "All" in DOM Pagination**: An "All" page size option in interactive DOM tables is strictly banned. Rendering thousands of heavy interactive rows (with tooltips, action dropdowns, WhatsApp buttons, and event handlers) freezes browser threads and crashes mobile/desktop tabs.

---

## 5. Reporting Decoupled from Pagination (RULE REP-FILTER-SSOT)
- **100% Filter-Driven Reporting**: Executive and logistics reporting (`ExecutiveReportModal`, PDF manifest, Thermal bills, Excel/CSV exports) is **strictly decoupled** from pagination page limits.
- When no manual rows are checked, clicking `Report ({count})` always processes 100% of all filtered parcels (`filteredParcels`), even if the user is viewing only 10, 25, or 50 items on screen.
- Pagination is purely a rendering viewport to ensure smooth 60fps scrolling; it must NEVER restrict or truncate data reporting.

