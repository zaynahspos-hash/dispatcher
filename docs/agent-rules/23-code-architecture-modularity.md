# 23 — Code Architecture & Modularity (300–400 Line Limit)

Engineering discipline for clean, maintainable, modular frontend code.

---

## 1. File Size & Responsibility Limits (RULE O1 — HARD ENFORCEMENT)
- **Target File Size**: `150–300 lines` per file.
- **Absolute Hard Limit (Ceiling)**: **`400 lines maximum`**.
- **Zero Tolerance Policy**:
  - No file may exceed 400 lines. Any file reaching 400 lines is considered in direct violation of architectural standards and must be decomposed immediately.
  - Multi-viewport components (desktop grid + mobile cards) MUST be separated into distinct subcomponents (`*DesktopGrid.tsx`, `*MobileCards.tsx`).
  - Multi-tab panels (e.g. Settings, Admin tabs) MUST be modularized into individual tab subcomponents (`src/components/settings/*Tab.tsx`).
  - Complex state and API side-effects MUST be isolated in `src/hooks/`.
  - Pure calculation and validation logic MUST live in `src/utils/`.

---

## 2. Separation of Concerns
```
src/
├── components/     # Presentational & interactive UI components
├── hooks/          # Custom state and sync hooks (e.g. useSettings)
├── utils/          # Pure helpers (postexApi, groqParser, cityList, supabaseClient)
├── types/          # Shared TypeScript interfaces and enums
└── App.tsx         # Top-level shell and tab orchestration
```

---

## 3. DRY (Don't Repeat Yourself)
- If a piece of UI, styling pattern, or business calculation is needed in two or more places, extract it immediately into a shared module.
