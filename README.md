# 🛍️ Parcel Booker (PostEx Integration)

A React, Vite, and Tailwind-based Shopify-style mobile-first parcel manager with automated AI address parsing and PostEx booking integration.

---

## 🛠️ PostEx V3 Migration & Return City Resolution

This document details the issues encountered during PostEx courier integration and how they were resolved.

### 1. The Printable "Return City" Issue
* **The Problem:** When parcels were booked via the application, printed airway bills (labels) had the "Return City" or "Sender City" details blank or defaulted to Lahore, even if the merchant's warehouse/pickup city was set to another region (e.g. Sargodha).
  * **Cause A (PostEx V2 API):** The V2 create-order endpoint failed to correctly map return address details for printing.
  * **Cause B (Empty Settings):** The merchant configuration settings for `postex_return` (Return Address Code) were empty because the merchant only has one warehouse registered under "Pickup Address". Since this key was empty, the app sent an empty return address value to PostEx.
* **The Resolution:** 
  1. **Fallback Configuration:** In `src/utils/postexApi.ts`, added logic to automatically fall back to the pickup address code if the return address code is left blank:
     ```typescript
     let returnCode = settings.postex_return || settings.postex_pickup;
     ```
  2. **V3 API Switch:** Switched order booking requests to PostEx V3 `/order/v3/create-order` endpoint, which supports flat payload mapping and matches the legacy WooCommerce plugin structure.

---

### 2. Merchant Store Address Validation Error
* **The Problem:** Booking parcels under the V3 API returned a `400 (Bad Request)` response with the status message `INVALID MERCHANT STORE ADDRESS CODE`.
* **The Cause:** The API request payload included `storeAddressCode: pickupCode`. On PostEx accounts that do not have custom store/subdivision configurations, sending this field triggers store validation checks and rejects the booking request.
* **The Resolution:** Removed the optional `storeAddressCode` parameter from the V3 create-order request body. Since the field is now omitted, validation is bypassed and bookings succeed correctly.

---

### 3. Real-Time Tracking Status Sync
* **Feature:** Added live status updates directly within the Booked History tab.
* **API Endpoint:** `GET /services/integration/api/order/v1/track-order/{trackingNumber}`
* **Integration:** Next to the status badge, merchants can click `🔄` to trigger a real-time status update. The status will synchronize to matches like `'Delivered'`, `'Returned'`, or `'Delivery Under Review'`, and save directly in local storage.

---

### 4. Shipper Advice (Retry Attempt / Return Requested)
* **Feature:** When a parcel is `'Delivery Under Review'` or `'Attempted'`, merchants can click the `📝 Advice` button to issue shipper directions.
* **API Endpoint:** `PUT /services/integration/api/order/v2/save-shipper-advice`
* **Payload:**
  ```json
  {
    "trackingNumber": "CN-XXXX",
    "statusId": 2, // 2 = Retry Attempt, 1 = Return Requested
    "remarks": "User note entered here"
  }
  ```
* **Integration:** Interactive drawer/modal dynamically triggers custom instructions directly to the courier agent assigned on the field.

---

### 5. Generate Load Sheet PDF
* **Feature:** Merchants can select booked orders and generate/download a PDF Load Sheet for the PostEx pickup rider.
* **API Endpoint:** `POST /services/integration/api/order/v2/generate-load-sheet`
* **Integration:** Bulk action `📄 Load Sheet` triggers the PostEx API and automatically downloads the load sheet as a local PDF document.
