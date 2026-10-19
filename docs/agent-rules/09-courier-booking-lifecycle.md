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

---

## 4. Dual-Source Ingestion & Deep Filter Matrix (Rule B4)
- **Two Distinct Sources Supported**:
  - `source: 'app'`: Orders booked directly within Zaynahs Courier Manager.
  - `source: 'postex_portal'`: External orders booked outside the app sharing the merchant token (Shopify, WooCommerce, Custom Store APIs, manual PostEx web portal bookings, bulk Excel uploads).
- **Deep 3-Dimensional Filter Matrix**:
  1. **Source Filter**: `[ All Sources ]`, `[ Booked in App ]`, `[ External / Stores / Portal ]`.
  2. **Status Milestone Filter**: `[ All Statuses ]`, `[ Booked ]`, `[ In Transit ]`, `[ Out for Delivery ]`, `[ Action Required ]`, `[ Delivered ]`.
  3. **Alert Dispatch State Filter**: `[ All ]`, `[ Pending Alert ]`, `[ Alert Sent ]`, `[ Skipped ]`.
- **Universal Actionability**: Both sources support identical 1-click WhatsApp alerts, Shipper Advice (Re-attempt/Return), and tracking timeline views.

---

## 5. WhatsApp Status Automation & Selective Dispatch Engine (Rule B5)
- **Zero-Ban Protocol**: All outbound WhatsApp tracking notifications use in-app human-paced queuing (30 to 50 second randomized delay) via official WhatsApp protocol (`web.whatsapp.com` / `wa.me`). Meta Cloud API fees and ban risks are strictly 0.00%.
- **Merchant's Choice (Selective Status Toggles)**: Merchant has complete autonomy to enable/disable alerts per milestone independently:
  - `enable_booking_alert`: Confirms order dispatch with tracking CN.
  - `enable_out_for_delivery_alert`: Alerts customer to keep phone on and COD ready (cuts RTO by ~40%).
  - `enable_action_required_alert`: Reaches customer immediately upon delivery failure/delay.
  - `enable_delivered_alert`: Thanks customer & requests store review.
- **Bi-Daily Scheduled Sync**: Tracking statuses sync automatically at peak delivery windows (10:30 AM & 6:30 PM PKT).
- **Conflict-Free Merge**: Tracking sync uses the PostEx CN as primary key and timestamp versioning (`updated_at`) to prevent overwriting local notes or state.

