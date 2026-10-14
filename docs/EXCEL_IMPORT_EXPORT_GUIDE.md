# 📊 Excel Import & Export Guide — Bulk Parcel Operations

Comprehensive manual for importing, parsing, mapping, and exporting bulk courier orders via Microsoft Excel (`.xlsx`, `.xls`) and CSV files.

---

## 1. Supported File Formats & Libraries
- Engine: Client-side `xlsx` (`SheetJS`).
- Supported Extensions: `.xlsx`, `.xls`, `.csv`.
- Zero Server Dependency: Processing occurs 100% in-browser, ensuring extreme parsing speed and merchant privacy.

---

## 2. Smart Header Auto-Detection Engine
The Excel importer in `src/App.tsx` and `src/components/PasteInput.tsx` dynamically scans column headers with fuzzy case-insensitive matching:

| Target Field | Recognized Header Synonyms |
|---|---|
| **Customer Name** | `Name`, `Customer`, `Customer Name`, `Recipient`, `Consignee`, `Client` |
| **Phone Number** | `Phone`, `Mobile`, `Contact`, `Cell`, `Cell #`, `Number`, `WhatsApp` |
| **Delivery Address** | `Address`, `Delivery Address`, `Shipping Address`, `Street Address`, `Location` |
| **Destination City** | `City`, `Destination`, `City Name`, `District`, `Town` |
| **COD / Invoice Amount** | `COD`, `Amount`, `Price`, `Total`, `Invoice Payment`, `Cash On Delivery`, `Value` |
| **Order Reference** | `Order #`, `Order ID`, `Invoice #`, `Reference`, `Order Number`, `Ref` |
| **Product / Items** | `Items`, `Products`, `Details`, `Order Detail`, `SKU`, `Description` |

---

## 3. Bulk Order Ingestion Workflow
```
[Merchant Uploads .xlsx File]
             │
             ▼
[SheetJS In-Memory Sheet Parse]
             │
             ▼
[Smart Header Mapping & Normalization]
             │
             ▼
[Pakistani Mobile Sanitization (03XXXXXXXXX)]
             │
             ▼
[Destination City Matching against cityList.ts]
             │
             ▼
[Populate ParcelTable for Batch Review]
             │
             ▼
[Select All -> Click 'Book All Selected' via PostEx V3]
```

---

## 4. Exporting Booked Parcel Reports
Merchants can export booked dispatch records from `BookedHistory` into `.xlsx`:
- **File Name**: `Zaynahs-Booked-Parcels-{YYYY-MM-DD}.xlsx`
- **Fields Included**:
  - `Tracking Number` (PostEx CN)
  - `Order Reference`
  - `Customer Name`
  - `Customer Phone`
  - `City`
  - `Address`
  - `COD Amount (PKR)`
  - `Current Status`
  - `Date Booked`
  - `Latest Tracking Update`
