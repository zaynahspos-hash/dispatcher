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

---

## 3. RULE SSOT2 — Feature Graduation & Absolute Ban on Duplicate Legacy Modals
- **Feature Graduation Invariant**: Jab bhi koi feature, sub-view ya tool kisi popup modal / drawer se upgrade ho kar **dedicated Primary Tab, dedicated page, ya full-screen workspace** ban jaye (maslan: Airway Bill & CN Document Vault jab `#vault` Tab ban gaya):
  1. **Immediate Modal Eradication**: Us feature ka puraana popup modal component (e.g. `AirwayVaultModal.tsx`), uski state toggles (`isOpen`, `showVault`, `setShowVault`), aur uske imports app se **fauran mukammal delete / eradicate** kiye jayenge.
  2. **Zero Zombie / Duplicate UIs**: Ek hi feature ke do parallel interfaces (modal version + tab version) rakhna strictly FORBIDDEN hai. Ek feature ka hamesha **ek hi single canonical interface** hoga.
  3. **Universal Route Navigation**: Us feature ke tamam entry points, KPI summary cards, shortcut buttons, aur action toolbars ko popup kholne ke bajaye **directly dedicated tab par navigate** karwaya jayega (`setActiveTab('vault')` / `window.location.hash = '#vault'`).
  4. **Clean Codebase Sweep**: Feature graduation ke waqt codebase mein grep kar ke tamam legacy references ko clean up karna mandatory hai taake koi redundant popup screen par open na ho sake.
