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

---

## 4. Rate-Limit Safe Multi-Batch Pipeline (Free Tier Guard)
When merchants paste multiple orders (e.g. 10, 20, 50+ orders):
1. **Intelligent Chunking**: Orders are chunked into batches of 4 (`chunkSize = 4`) to stay comfortably below provider TPM (Tokens Per Minute) ceilings and prevent HTTP 504 timeouts.
2. **Provider-Calibrated Inter-Batch Pacing**:
   - **Gemini Free Tier (15 RPM)**: Enforces `2800ms` inter-batch pacing delay.
   - **Groq Free Tier (30 RPM / 6000 TPM)**: Enforces `1800ms` inter-batch pacing delay.
   - **OpenAI (20 RPM)**: Enforces `2200ms` inter-batch pacing delay.
3. **Live Latency & Dynamic ETA Countdown**:
   - Measures real-time API roundtrip latency (`performance.now()`).
   - Calculates dynamic remaining time: `remainingBatches * ((avgLatencyMs / 1000) + (pacingDelayMs / 1000))`.
   - Live 1-second countdown ticker provides smooth remaining time feedback (`~Xs remaining`).

---

## 5. Apple Native Loading Sheet & Zero-Emoji Standard (RULE AI-SHEET)
1. **Apple iOS / macOS Dialog Anatomy**:
   - Dialog rendered as a sleek, native sheet (`rounded-3xl`, `bg-white dark:bg-[#0c121e]`, single border).
   - Activity ring with smooth inner spinner and subtle emerald status dot.
   - Micro-chips displaying: Model name (`gemini-1.5-flash`), Network Latency (`220ms` with SVG `ZapIcon`), and Rate Limit Guard (`15 RPM Free Tier` with SVG `ShieldIcon`).
   - Segmented metric bar for `Total Orders`, `Cleaned`, and `In Queue`.
2. **Strict Ban on AI Gamer / Slop Aesthetics**:
   - Zero clunky neon-colored gamer boxes or glowing arcade progress bars.
   - Zero raw emojis (`⚡`, `🛡️`, `⏱️` are strictly banned in UI per Rule 33; use clean SVGs).
3. **Zero Data Loss Guarantee**:
   - If AI quota or network limits fail completely, the system automatically activates `parseTextFallback`, fills the staged table with extracted orders, advances serials, and notifies the merchant with a toast. User data is NEVER discarded.

