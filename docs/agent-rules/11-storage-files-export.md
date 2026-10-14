# 11 — Storage, File Export & Bulk Excel Processing

Guidelines for parsing Excel sheets, generating PDF documents, and managing exports.

---

## 1. Excel Bulk Import (.xlsx / .xls / .csv)
- Parsed client-side using `xlsx` (`SheetJS`).
- **Flexible Header Matching**: Automatically identifies common column names:
  - Customer Name: `Name`, `Customer`, `Customer Name`, `Recipient`, `Consignee`
  - Phone: `Phone`, `Mobile`, `Contact`, `Cell`, `Number`
  - Address: `Address`, `Delivery Address`, `Shipping Address`, `Street`
  - City: `City`, `Destination`, `City Name`
  - COD: `COD`, `Amount`, `Price`, `Total`, `Invoice Payment`
  - Order Ref: `Order #`, `Order ID`, `Invoice #`, `Reference`
- Converted rows are injected directly into `ParcelTable` for batch review.

---

## 2. Booked Parcels Export
- Merchants can export filtered or all booked orders into `.xlsx` or `.csv`.
- Export includes:
  `Tracking #`, `Order Ref`, `Customer Name`, `Phone`, `City`, `Address`, `COD (PKR)`, `Status`, `Booked Date`, `Latest Update`.

---

## 3. PostEx Airway Bill & Thermal Printing
- Thermal printer format (4x6 inch label standard):
  - Prominent Barcode / QR Code for PostEx Tracking Number.
  - Recipient Name, Phone, and Clear Delivery Address.
  - Return Address & Warehouse pickup contact.
  - COD Amount prominently highlighted in bold border.
