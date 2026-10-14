# 🤖 Groq AI Address Parser & NLP Intelligence Guide

This guide details the Groq LLaMA-3 integration used to parse unstructured Pakistani customer addresses, roman Urdu texts, WhatsApp receipts, and raw messages into validated parcel structures.

---

## 1. System Architecture
```
[Raw Pasted Text (WhatsApp/Insta)]
             │
             ▼
[Clean Markdown & Whitespace]
             │
             ▼
[Groq API: llama-3.3-70b-versatile]
 (Structured Output Prompt)
             │
      ┌──────┴──────┐
      ▼             ▼
 [Valid JSON]   [Groq Error / 429]
      │             │
      │             ▼
      │      [In-Memory Regex Parser]
      │             │
      └──────┬──────┘
             ▼
 [Pakistani Phone Normalization (03XXXXXXXXX)]
             │
             ▼
 [City Normalization (cityList.ts Match)]
             │
             ▼
 [ParcelTable Ready Rows]
```

---

## 2. Groq System Prompt Specification
```markdown
You are an expert AI logistics parsing assistant specializing in Pakistani e-commerce orders.
Your task is to parse unstructured text (WhatsApp messages, Instagram orders, receipt pastes) into a clean JSON array of parcel objects.

Each parcel object MUST follow this exact schema:
{
  "customerName": string,       // Full customer name
  "customerPhone": string,      // Clean Pakistani mobile (03XXXXXXXXX)
  "deliveryAddress": string,    // House, street, area, landmarks
  "cityName": string,           // Target destination city in Pakistan
  "invoicePayment": number,     // Cash on Delivery amount in PKR (0 if prepaid)
  "orderDetail": string,        // Items, SKU, or summary
  "orderRefNumber": string      // Order ID / reference if found, or generate unique
}

Rules:
1. Always output strictly valid JSON inside [ ... ]. No conversational text, no markdown backticks.
2. Pakistani phone numbers must start with 03 and have 11 digits (e.g. 03001234567). Strip country codes like +92 or 92.
3. Clean cities: Recognize common abbreviations ("Lhr" -> "Lahore", "Khi" -> "Karachi", "Isb" -> "Islamabad", "Rwp" -> "Rawalpindi", "Fsd" -> "Faisalabad").
4. If Cash on Delivery is mentioned as "Rs 2500" or "Total: 3000", convert to integer numbers.
```

---

## 3. Fallback Regex Parser
When the Groq API key is unconfigured or rate limits are encountered, the fallback engine in `src/utils/groqParser.ts` executes:
- **Phone Pattern**: `/(?:03\d{2}|923\d{2}|\+923\d{2})[- ]?\d{7}/g`
- **COD Pattern**: `/(?:rs\.?|pkr|total[:\s]*|cod[:\s]*)\s*(\d+)/i`
- **City Matcher**: Iterates over `cityList` sorted by length descending to match city names embedded inside messy address strings.
