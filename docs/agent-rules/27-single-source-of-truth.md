# 27 — RULE SSOT1: Single Source of Truth (ZERO Duplicate Implementations)

Hard architectural rule. Applies to every utility, state handler, API call, and UI component.

---

## 1. The Rule
- Agar koi feature, logic, helper, ya data structure ek se zyada jagah chahiye, to uska **exactly ONE shared source** hona chahiye.
- Duplicate copies ya "almost identical" variants banana strictly BANNED hai.

---

## 2. Canonical Registry for Zaynah's Courier Manager
- **PostEx Courier API & Endpoints**: `src/utils/postexApi.ts`
  - Function: `bookOrderPostExV3()`, `trackOrderPostEx()`, `saveShipperAdvicePostEx()`, `generateLoadSheetPostEx()`
  - Never make direct `axios.post` calls to PostEx outside this file.
- **AI Address Extraction**: `src/utils/groqParser.ts`
  - Function: `parseOrdersWithGroq()`
  - Never inline prompt strings or fetch calls to Groq in components.
- **Pakistani City Directory**: `src/utils/cityList.ts`
  - Never hardcode custom city arrays in individual components.
- **Supabase Client & Activity Logger**: `src/utils/supabaseClient.ts`
  - Export: `supabase`, `logUsage(action, details)`
- **User Settings & Auth Sync**: `src/hooks/useSettings.ts`
  - Export: `useSettings()`
- **Centralized SVG Icons**: `src/components/Icons.tsx`
