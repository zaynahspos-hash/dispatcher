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

## 3. Large Dataset Rendering
- When rendering more than 100 parcels, slice into pages of 25–50 rows with pagination or virtual scrolling to maintain 60fps scrolling on mobile devices.
