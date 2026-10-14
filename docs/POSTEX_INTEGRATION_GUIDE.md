# 🚚 PostEx Courier Integration Guide — Complete Master Manual

This guide documents the full lifecycle of PostEx courier integration within Zaynah's Courier Manager, covering API endpoints, payload contracts, V2 to V3 migration resolutions, return city logic, shipper advice, and load sheet generation.

---

## 1. PostEx API V3 Order Creation

### Endpoint
- **URL**: `POST https://api.postex.pk/services/integration/api/order/v3/create-order`
- **Header**:
  ```http
  token: {merchant_api_token}
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

### Critical V3 Migration Learnings:
1. **Omit `storeAddressCode`**: On accounts with only a single primary merchant warehouse, sending `storeAddressCode` triggers the PostEx API error:
   ```json
   { "statusCode": "400", "statusMessage": "INVALID MERCHANT STORE ADDRESS CODE" }
   ```
   **Resolution**: `storeAddressCode` is completely omitted unless configured in Settings.
2. **Return City Resolution**: If `postex_return` (Return Address Code) is unconfigured in merchant settings, the booking logic automatically falls back to `postex_pickup`:
   ```typescript
   let returnCode = settings.postex_return || settings.postex_pickup;
   ```
   This prevents airway bills from displaying blank or defaulting to Lahore when the merchant's warehouse is located in another city (e.g. Sargodha, Faisalabad, Multan).

---

## 2. Live Tracking Status Synchronization

### Endpoint
- **URL**: `GET https://api.postex.pk/services/integration/api/order/v1/track-order/{trackingNumber}`
- **Header**: `token: {merchant_api_token}`

### Mapped Status Codes & UI Badges
| PostEx Status String | Manager Status Category | UI Badge Color | Action Required |
|---|---|---|---|
| `Booked` / `Unassigned` | `Booked` | Sky Blue | Rider pickup pending |
| `In Transit` / `En Route` | `In Transit` | Indigo | On the move |
| `Out for Delivery` | `Out for Delivery` | Purple | On vehicle for delivery |
| `Delivered` | `Delivered` | Emerald Green | Completed / COD collected |
| `Returned` / `Returned to Shipper` | `Returned` | Rose Red | Returned to merchant warehouse |
| `Delivery Under Review` / `Attempted` | `Under Review` | Amber Orange | **Shipper Advice Required** |

---

## 3. Shipper Advice (Retry Attempt vs Return Request)

When a parcel enters `Delivery Under Review` (e.g. customer phone powered off, gate locked, customer asked to deliver tomorrow), PostEx allows the shipper to issue instructions.

### Endpoint
- **URL**: `PUT https://api.postex.pk/services/integration/api/order/v2/save-shipper-advice`
- **Header**: `token: {merchant_api_token}`
- **Payload**:
  ```json
  {
    "trackingNumber": "CN-102938475",
    "statusId": 2,
    "remarks": "Customer contacted on WhatsApp; requested re-attempt tomorrow between 2pm and 5pm."
  }
  ```
- **Status IDs**:
  - `statusId: 2` ➔ **Retry Attempt** (Rider will re-attempt delivery)
  - `statusId: 1` ➔ **Return Requested** (Courier will abort and return parcel to sender)

---

## 4. Bulk Load Sheet Generation (Courier Handover)

When handing over parcels to the PostEx pickup rider, merchants generate a combined Load Sheet PDF.

### Endpoint
- **URL**: `POST https://api.postex.pk/services/integration/api/order/v2/generate-load-sheet`
- **Header**: `token: {merchant_api_token}`
- **Payload**:
  ```json
  [
    "CN-0010291",
    "CN-0010292",
    "CN-0010293"
  ]
  ```
- **Response Handling**: The API returns a base64 or binary PDF stream. The application automatically triggers a browser download titled `PostEx-LoadSheet-{Date}.pdf` and updates parcel flags.
