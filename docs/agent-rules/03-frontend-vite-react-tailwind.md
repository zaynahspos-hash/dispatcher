# 03 — Frontend Rules (Vite, React 19, Tailwind CSS v4)

Architecture, state management, and component conventions for Zaynah's Courier Manager client.

---

## 1. Tech Stack Overview
- **Bundler**: Vite 7 with `@vitejs/plugin-react` and `vite-plugin-singlefile`.
- **Framework**: React 19 (Hooks, Suspense, client-side SPA routing).
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`), Vanilla CSS tokens, mobile-first responsive classes.
- **Language**: TypeScript 5.9 strict.

---

## 2. Safe Access & Defensive Coding
- Never access nested object properties unsafely:
  - ❌ `order.customer.phone`
  - ✅ `order?.customer?.phone || ''`
  - ❌ `history[0].trackingNumber`
  - ✅ `history?.[0]?.trackingNumber`
- Unsafe data structures crash the whole SPA. Always provide fallback empty states (`[]`, `{}`, `''`).

---

## 3. Centralized Icons SSOT
- All icons must be imported from `src/components/Icons.tsx`:
  ```tsx
  import { TruckIcon, CheckCircleIcon, RefreshIcon } from './Icons';
  ```
- Do not import icons directly from third-party libraries across individual files. Maintain all SVG paths in one place.

---

## 4. 0ms Instant Navigation & Tab State
- The app features 5 primary operational views:
  1. **Paste Order Input** (Raw text paste & Groq AI extraction)
  2. **Parcel Table Review** (Pre-booking inspection & editing)
  3. **Booked History** (PostEx live tracking, status sync, shipper advice)
  4. **Settings** (PostEx tokens, Groq keys, pickup address codes)
  5. **Admin Panel** (Global audit logs, multi-tenant user inspector)
- Switching tabs must be instantaneous (0ms) using in-memory state or URL search parameters (`?tab=history`).
- Never perform redundant network requests on simple tab navigation. Use optimistic caching (`src/utils/cacheWithExpiry.ts`).

---

## 5. Mobile Native Ergonomics (RULE M1)
- Sticky bottom action bars on mobile for critical actions (`Book All Selected`, `Save Settings`, `Generate Load Sheet`).
- Tables must have horizontal scroll wrappers (`overflow-x-auto`) with fixed column min-widths to prevent mobile crushing.
- Use mobile drawer bottom-sheets for complex inputs (Shipper Advice remarks, parcel edit modal).

---

## 6. Zero Backdrop-Blur Thrashing (RULE M10b)
- Do NOT use `backdrop-blur-sm`, `backdrop-blur-md`, or `backdrop-blur-xl` on sticky headers or action bars.
- Mobile WebKit and Android Chrome repaint entire layers on scroll when blur is present, causing 15fps stutter.
- Use clean solid or high-contrast opacity backgrounds:
  ```tsx
  // ✅ Correct
  <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800">
  // ❌ Wrong
  <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md">
  ```
