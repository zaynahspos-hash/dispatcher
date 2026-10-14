# 04 — API Routes & External Integrations (PostEx, Groq, Supabase)

Specification for third-party courier APIs, AI processing engines, and cloud persistence.

---

## 1. PostEx API V3 Integration (The Gold Standard)

PostEx V3 is mandatory for order booking in this project because it matches modern flat payload structures and avoids legacy V2 address-mapping failures.

### A. Order Booking Endpoint
- **URL**: `https://api.postex.pk/services/integration/api/order/v3/create-order`
- **Method**: `POST`
- **Headers**:
  ```http
  token: {merchant_postex_token}
  Content-Type: application/json
  ```
- **Payload Schema**:
  ```json
  {
    "cityName": "Lahore",
    "customerName": "Fatima Zahra",
    "customerPhone": "03001234567",
    "deliveryAddress": "House 12, Street 4, Gulberg III",
    "invoiceDivision": 1,
    "invoicePayment": 2500,
    "orderDetail": "Summer Lawn Suit x 2",
    "orderRefNumber": "ORD-9821",
    "orderType": "Normal",
    "pickupAddressCode": "WH-LHR-01"
  }
  ```
- **Crucial Rules**:
  - `pickupAddressCode` must come from `settings.postex_pickup`.
  - Do NOT include `storeAddressCode` unless explicitly configured (prevents `INVALID MERCHANT STORE ADDRESS CODE`).
  - If return city address is needed, use `settings.postex_return || settings.postex_pickup`.

---

## 2. Real-Time Tracking Status Sync
- **URL**: `https://api.postex.pk/services/integration/api/order/v1/track-order/{trackingNumber}`
- **Method**: `GET`
- **Headers**: `token: {merchant_postex_token}`
- **Mapped Statuses**:
  - `Booked` / `Unassigned`
  - `Picked Up` / `In Transit`
  - `Out for Delivery`
  - `Delivered` (Green badge)
  - `Returned` / `Returned to Shipper` (Red badge)
  - `Delivery Under Review` / `Attempted` (Amber badge — triggers Shipper Advice)

---

## 3. Shipper Advice Endpoint
- **URL**: `https://api.postex.pk/services/integration/api/order/v2/save-shipper-advice`
- **Method**: `PUT`
- **Payload**:
  ```json
  {
    "trackingNumber": "CN-XXXX",
    "statusId": 2,
    "remarks": "Customer requested re-attempt tomorrow morning"
  }
  ```
- `statusId = 2` for **Retry Attempt**
- `statusId = 1` for **Return Requested**

---

## 4. Bulk Load Sheet PDF Generation
- **URL**: `https://api.postex.pk/services/integration/api/order/v2/generate-load-sheet`
- **Method**: `POST`
- **Payload**: Array of tracking numbers `["CN-001", "CN-002", ...]`
- **Response**: Base64 encoded PDF or binary stream. The app triggers automatic client download as `LoadSheet-{Date}.pdf`.

---

## 5. Groq AI Integration (LLaMA-3 Fast Inference)
- **URL**: `https://api.groq.com/openai/v1/chat/completions`
- **Method**: `POST`
- **Model**: `llama-3.3-70b-versatile` or `llama-3.1-8b-instant`
- **Headers**:
  ```http
  Authorization: Bearer {groq_api_key}
  Content-Type: application/json
  ```
- **Output Guarantee**: Must enforce strict JSON structure for parsed parcels.
