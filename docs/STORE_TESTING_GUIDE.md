# 🧪 Store Testing & Verification Guide
Zaynahs Courier Manager · PostEx V3 · Multi-Tenant SaaS Isolation

---

## 1. Overview & Purpose
This guide defines standard verification protocols for testing store onboarding, PostEx V3 merchant token credentials, dry-run order booking, address parsing accuracy, and database multi-tenant isolation.

---

## 2. PostEx API Token & Merchant Verification

### 2.1 PostEx Operational Status & City Check
Test merchant token validity and fetch available operational pickup addresses and service cities:

```bash
# Verify PostEx Merchant Token & Fetch Pickup Addresses
curl -s -X GET "https://api.postex.pk/services/integration/api/order/v1/get-pickup-addresses" \
  -H "token: YOUR_POSTEX_TOKEN" \
  -H "accept: application/json"
```

Expected response format:
```json
{
  "statusCode": "200",
  "statusMessage": "Success",
  "dist": [
    {
      "pickupAddressCode": "001",
      "address": "Warehouse 1, Main Road, Lahore",
      "cityName": "Lahore"
    }
  ]
}
```

### 2.2 PostEx Single Order Booking Dry-Run
To test order booking without creating real shipping obligations or in sandbox mode:

```bash
curl -s -X POST "https://api.postex.pk/services/integration/api/order/v3/create-order" \
  -H "token: YOUR_POSTEX_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderRefNumber": "TEST-ORD-001",
    "invoicePayment": 1500,
    "orderDetail": "1x Test Sample Item",
    "customerName": "Test Customer",
    "customerPhone": "03001234567",
    "deliveryAddress": "House 12, Street 4, Sector F-8/1",
    "destinationCity": "Islamabad",
    "invoiceDivision": 0,
    "transactionNotes": "Test dry-run parcel",
    "pickupAddressCode": "001"
  }'
```

---

## 3. Multi-Tenant SaaS Isolation Testing (RLS Security)

Ensure Tenant A cannot read, query, or mutate Tenant B's data:

### 3.1 Test Scenario: Cross-Tenant Read Block
1. Authenticate as User A (`user_id = A_UUID`).
2. Query `booked_history`, `user_settings`, `customers`, and `usage_logs`.
3. Verify that zero records belonging to User B are returned.

```typescript
// Verification in Supabase JS Client
const { data, error } = await supabase
  .from('booked_history')
  .select('*')

// All returned rows MUST have user_id === session.user.id
const crossTenantLeaks = (data || []).filter(row => row.user_id !== session.user.id)
console.assert(crossTenantLeaks.length === 0, 'SECURITY VIOLATION: Cross-tenant data leak!')
```

---

## 4. Groq AI Address Extraction Testing

Verify that raw unstructured Pakistani address messages accurately parse into structured fields:

### 4.1 Test Cases Matrix
| Input Text Sample | Expected Name | Expected Phone | Expected City | Expected Address | COD |
|-------------------|---------------|----------------|---------------|------------------|-----|
| `Ali Khan 0321-7654321 H 14 St 2 Gulberg III Lahore Rs 2500` | Ali Khan | 03217654321 | Lahore | H 14 St 2 Gulberg III | 2500 |
| `Bhai ye parcel send krna: Fatima Noor, Flat 4B, Clifton Karachi, 03339876543, 3400 cash` | Fatima Noor | 03339876543 | Karachi | Flat 4B, Clifton | 3400 |
| `Tariq Jameel, Shop 12 Anarkali Faisalabad, Phone: 03451122334, Amount 1800` | Tariq Jameel | 03451122334 | Faisalabad | Shop 12 Anarkali | 1800 |

### 4.2 Automated Rule Validation
- Phone numbers must normalize to 11 digits starting with `03...`
- City must resolve to normalized PostEx operational cities via `cityList.ts`
- Missing fields must trigger explicit user confirmation flags.

---

## 5. End-to-End Release Checklist
- [ ] Direct Supabase API queries use `snake_case` tables exclusively.
- [ ] No Prisma client code or remnants exist.
- [ ] User settings save and restore instantly with optimistic UI.
- [ ] WhatsApp tracking link generates correctly with format `923...`.
- [ ] `npm run build` succeeds with 0 TypeScript and bundling warnings.
