# 23 — Code Architecture & Modularity (300–400 Line Limit)

Engineering discipline for clean, maintainable, modular frontend code.

---

## 1. File Size & Responsibility Limits (RULE O1)
- **Target File Size**: 150–350 lines.
- **Maximum Soft Limit**: 400 lines.
- When a component grows beyond 400 lines:
  - Extract sub-components (e.g. `ParcelRow`, `TrackingModal`, `AdviceDrawer`).
  - Extract business logic into dedicated custom hooks in `src/hooks/`.
  - Extract helper calculations into pure functions in `src/utils/`.

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
