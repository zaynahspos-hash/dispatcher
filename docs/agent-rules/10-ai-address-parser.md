# 10 — AI Address Parser & Pakistani Address Intelligence

Groq LLaMA-3 prompt design, phonetic matching, and address extraction rules.

---

## 1. The Challenge of Pakistani Addresses
Pakistani eCommerce orders pasted from WhatsApp, Instagram DMs, or Facebook messages have notorious irregularities:
- Roman Urdu / English mixtures (`Ghar ka number 12, gali 4, chak 21 near tube-well`).
- Landmark-based directions instead of postal codes (`Mian Plaza k peechay, bakery k samnay`).
- Slang city abbreviations (`Lhr`, `Khi`, `Isb`, `Rwp`, `Fsd`, `Swl`).
- Messy phone numbers (`+92-300-1234567`, `0300 1234567`, `923001234567`).

---

## 2. Groq System Prompt Structure
The system prompt in `src/utils/groqParser.ts` must strictly specify:
1. **Output Format**: Pure JSON array of parcel objects with keys:
   `customerName`, `customerPhone`, `deliveryAddress`, `cityName`, `invoicePayment`, `orderDetail`, `orderRefNumber`.
2. **Phone Extraction**: Extract only Pakistani phone numbers. Normalize to `03XXXXXXXXX`.
3. **City Disambiguation**: Cross-reference against major Pakistani cities. Discard words like "Pakistan" from the city field.
4. **COD Amount**: Look for price cues like `Rs.`, `PKR`, `total:`, `cod:`, `amount:`.

---

## 3. Fallback Regex Parsing Engine
If Groq API is unavailable, unconfigured, or returns an HTTP error:
- The app automatically switches to an in-memory rule-based regex parser.
- Scans line-by-line for phone patterns (`/(?:03\d{2}|923\d{2}|\+923\d{2})[- ]?\d{7}/`).
- Matches known city names from `cityList.ts`.
- Extracts amounts using regex `/(?:rs\.?|pkr|total[:\s]*)\s*(\d+)/i`.
- Ensures merchants are NEVER blocked even during AI provider downtime.
