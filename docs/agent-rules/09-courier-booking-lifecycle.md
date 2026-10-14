# 09 — Courier Booking Lifecycle & Operations Engine

Step-by-step lifecycle of an order from raw customer message to successful PostEx delivery.

---

## 1. Complete Booking Pipeline

```
[Raw Order Text / Excel File]
              │
              ▼
   [Groq AI LLaMA-3 Parser]
  (Extracts Name, Phone, City, Address, COD, Ref)
              │
              ▼
  [Normalization & Validation]
  (Phone -> 03XXXXXXXXX, City -> cityList.ts match)
              │
              ▼
    [Parcel Review Table]
  (Merchant edits, verifies, selects orders)
              │
              ▼
  [PostEx V3 Booking Dispatch]
  (/order/v3/create-order with pickupCode fallback)
              │
              ▼
   [Tracking Number Issued]
  (CN-XXXX saved to BookedHistory + Supabase)
              │
              ▼
     [Bulk Load Sheet]
  (Select orders -> generate PostEx Rider PDF)
              │
              ▼
  [Live Tracking & Shipper Advice]
  (Delivery Under Review -> Retry Attempt / Return Advice)
```

---

## 2. Ingestion & Pre-Booking Validation Rules
- **Phone Validation**: Must normalize to Pakistani 11-digit mobile format (`03XXXXXXXXX`). Strip `+92`, `92-`, spaces, or hyphens automatically.
- **City Matching**: Match the extracted city against the canonical `src/utils/cityList.ts`. If city is ambiguous, prompt user via SearchableDropdown.
- **COD Formatting**: Cash on delivery amounts must be non-negative integers. If prepaid, set COD to 0.

---

## 3. PostEx V3 Dispatch Invariants
- `orderType`: Default to `"Normal"`.
- `invoiceDivision`: Default to `1`.
- `pickupAddressCode`: Must be valid merchant pickup address code.
- If booking succeeds:
  - Add to `BookedHistory` with timestamp, PostEx tracking number, and initial status `"Booked"`.
  - Remove from the pending ParcelTable pool so orders are never double-booked.
