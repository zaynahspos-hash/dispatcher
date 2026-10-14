# 02 — Error Detection & Auto-Fix Protocols

Rules and workflows for identifying, diagnosing, and repairing errors autonomously across TypeScript, Vite, PostEx API, Groq LLM, and Supabase.

---

## 1. Vite & TypeScript Build Errors
- Har code change ke baad type check aur build verify karna lazmi hai:
  ```bash
  npm run build
  ```
- Agar build fail ho:
  - Line number aur file path check karo.
  - Type inference mismatch ko resolve karo — missing interface fields, undefined checks (`?.`), ya wrong prop passing.
  - Never silence a TypeScript error using `@ts-ignore` or `any`. Define proper interfaces in `src/types/` or component headers.

---

## 2. PostEx API Error Auto-Recovery Matrix

### A. HTTP 400 Bad Request — `INVALID MERCHANT STORE ADDRESS CODE`
- **Root Cause**: PostEx V3 payload mein `storeAddressCode` bheja gaya jabke merchant ke account mein store subdivisions configure nahi the.
- **Fix**: Request body se optional `storeAddressCode` completely omit karo. PostEx automatically account default warehouse use karega.

### B. HTTP 401 Unauthorized — `Invalid Token`
- **Root Cause**: Merchant ka PostEx API token expire ho gaya hai, galat store ka hai, ya `UserSettings` mein empty hai.
- **Fix**: User ko Settings tab mein redirect karne ka clear toast alert do aur localStorage cache refresh karo.

### C. Printable Return City Blank / Defaulting to Lahore
- **Root Cause**: Merchant ka single pickup warehouse hai aur `postex_return` address code empty tha.
- **Fix**: Fallback rule enforce karo in `src/utils/postexApi.ts`:
  ```typescript
  const returnCode = settings.postex_return || settings.postex_pickup;
  ```

---

## 3. Groq AI Parser Error Recovery
- **Rate Limit (HTTP 429)**: Groq free tier limit hit hone par fallback regex parser trigger ho, aur user ko retry countdown dikhe.
- **Malformed JSON Response**: LLaMA-3 markdown backticks (` ```json `) bhej sakta hai. Response ko clean regex se strip karo:
  ```typescript
  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  ```
- **Pakistani City Disambiguation**: Agar Groq "Rawalpindi" ki jagah "Pindi" nikalta hai ya "FSD" nikalta hai, to normalization dictionary se exact PostEx operational city match karo (`src/utils/cityList.ts`).

---

## 4. Supabase RLS 404 / 403 Auto-Detection
- **PGRST116 (No rows found)**: `.single()` call karne par row na hone se crash hota hai. Always use `.maybeSingle()`.
- **Row Level Security (RLS) Permission Denied**:
  - Check karo ke user Supabase session authenticated hai (`supabase.auth.getUser()`).
  - Table RLS policy check karo ke `auth.uid() = userid` condition match karti hai ya nahi.
