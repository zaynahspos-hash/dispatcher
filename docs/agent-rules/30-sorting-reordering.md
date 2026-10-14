# 30 — Sorting, Grouping & Bulk Reordering Rules

Conventions for ordering and organizing logistics datasets.

---

## 1. Parcel Table Sorting
- `ParcelTable` and `BookedHistory` support multi-column sorting:
  - Date Booked (Newest first by default)
  - COD Amount (High to Low / Low to High)
  - City Name (Alphabetical)
  - Status Severity (Action Required / Under Review first)

---

## 2. Bulk Action Selection
- Checkbox selection standard:
  - Select All / Deselect All
  - Shift-click for range selection
  - Floating sticky action bar showing count: `"X parcels selected"` with actions:
    - `Generate Load Sheet`
    - `Bulk Tracking Refresh`
    - `Delete / Archive`
