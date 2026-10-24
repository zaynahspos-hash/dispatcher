# 17 — Mobile Native App Style Rules

Engineering standards for delivering a liquid-smooth, native-app feel on mobile browsers and PWAs.

---

## 1. Visual & Haptic Feel
- **Rounded Corners**: Consistent `rounded-xl` / `rounded-2xl` scale. Sharp 90-degree corners are banned on interactive elements.
- **Elevation**: Soft, layered shadows (`shadow-sm`, `shadow-md`) instead of harsh borders.
- **Micro-Interactions**: Active tap scale feedback (`active:scale-[0.98] transition-transform duration-150`).
- **Touch Target Standard**: Minimum `44x44px` touch bounding boxes for all action buttons, status pills, and icons.

---

## 2. RULE M1 — Breakpoints Scale
```
Default (Mobile): 375px+
sm: 640px+   (Tablet portrait)
md: 768px+   (Tablet landscape)
lg: 1024px+  (Laptop / Desktop)
xl: 1280px+  (Wide desktop screens)
```

---

## 3. RULE M7 — Scroll Snap-Back Prevention (MANDATORY)
Primary scroll containers must declare `overscroll-y-none` (or `overscroll-behavior-y: none`) to prevent iOS/macOS rubber-band bounce from snapping back unexpectedly at page edges.
```tsx
// ✅ Correct
<main className="flex-1 overflow-y-auto overscroll-y-none">
```

---

## 4. RULE M8 — No Global DOM Scroll Mutation
- Never mutate `document.documentElement.style.*` directly for modal scroll locking.
- When locking body scroll for drawers or dialogs, always restore to empty string `''` in cleanup, never `'auto'`:
```tsx
useEffect(() => {
  document.body.style.overflow = 'hidden';
  return () => {
    document.body.style.overflow = '';
  };
}, []);
```

---

## 5. RULE M9 — Mobile Sticky Action Bars
- When sticky bars are used at the bottom of the viewport on mobile:
```tsx
<div className="sticky bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
  {/* Sticky CTA Content */}
</div>
```
- Never add excessive padding (`pb-36`) to parent containers that causes sticky elements to float in mid-air.

---

## 6. RULE M10b — Zero Backdrop-Blur App-Wide (ENFORCED)
- **`backdrop-blur-*` is strictly forbidden across the entire application.**
- Blur filters force the mobile GPU to re-composite all pixels underneath during scrolling, resulting in frame drops, battery drain, and visual jitter.
- Use high-contrast solid/opacity fills (`bg-white/95`, `bg-slate-900/95`, `bg-black/60`).

---

## 7. RULE M11 — Zero Broken Layouts & Full Content Auto-Expansion Guarantee
- **Zero Truncation on Operational Data**: Mobile cards and parcel rows must never cut off critical courier delivery addresses or notes.
- **Auto-Fit & Expand Text Toggle**: The single-click Auto button must synchronously:
  1. Trigger dynamic vertical expansion (`autoExpandLines`) across all rows so lines auto-wrap and show full multi-line text without manual clicking.
  2. Auto-fit column widths horizontally to match the longest content item.
- **Strict Mobile Input Boundary Control**:
  - Always enforce `min-w-0` and `w-full` on all flex child `<input>` and `<textarea>` elements to prevent HTML default minimum-width blowing out horizontal viewport bounds on 375px+ screens.
  - Multi-line textareas must use `resize-none break-words leading-relaxed` and dynamically calculate line rows based on text length.

---

## 8. RULE M12 — Absolute Zero Viewport Blowout & Breakpoint Synchronization (MANDATORY)
1. **Root Viewport Guards**:
   - `html, body, #root` must always enforce `overflow-x: hidden; max-width: 100vw; width: 100%;` in `src/index.css`.
   - The root application layout shell must declare `w-full max-w-full overflow-hidden`, **NEVER `w-screen`** (which evaluates to `100vw` and ignores scrollbar gutter widths).
2. **Main Canvas Boundary Isolation**:
   - The primary `<main>` element must declare `overflow-y-auto overflow-x-hidden min-w-0 max-w-full` so wide nested tables or buttons can never scroll the primary page horizontally.
3. **Unified Table/Card Breakpoint Synchronization Across All Tabs**:
   - **Handheld Mobile & Tablet (< 1024px)**: Must ALWAYS render touch-optimized mobile cards (`lg:hidden`). Never render wide 1400px spreadsheet grids on screens under 1024px where the desktop sidebar is hidden.
   - **Desktop (>= 1024px)**: Render full Excel spreadsheet grids (`hidden lg:block`) with self-contained internal horizontal scrolling (`overflow-x-auto min-w-0 max-w-full`).
9. Touch-Swipe Mobile Action Toolbars:
   - All multi-button toolbars (`Add Row`, `Export XLSX`, `Airway Vault`, `Expand Defaults`, `Auto-Fit`, `Clear All`) must use a dedicated touch-scroll track on mobile:
   ```tsx
   <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar scroll-smooth touch-pan-x py-0.5 max-w-full min-w-0">
   ```
   - This ensures buttons stay on a single thumb-scrollable row without expanding parent card boundaries or pushing page margins.

---

## 9. RULE M13 — Apple iOS Touch Tracks, Anti-Box Fragmentation & Shortened Chips (ENFORCED)
1. **Absolute Ban on Mobile Scrollbar Tracks**:
   - Native browser gray/white scrollbar tracks under horizontal chip bars or button rows are permanently banned on mobile.
   - All horizontal scroll strips must declare `overflow-x-auto no-scrollbar scroll-smooth touch-pan-x`.
   - In `src/index.css`, custom scrollbars must be strictly scoped to desktop (`@media (min-width: 1024px)`), and mobile scrollbars must be completely hidden with `display: none !important; width: 0 !important; height: 0 !important;`.
2. **Concise, High-Signal Filter Chips**:
   - Filter labels must be brief and concise to prevent horizontal clutter on handheld screens:
     - Use `Pending (N)` instead of `Pending for Load Sheet N`
     - Use `In Transit (N)` instead of `InTransit N`
     - Use `All (N)` instead of `All Dispatched N`
     - Use `Failed (N)` instead of `Failed Bookings N`
3. **Anti-Box Fragmentation & Double-Line Text Prevention**:
   - Avoid creating fragmented stacked boxes for summary metrics. Use cohesive responsive stat grids or single-line flex rows.
   - Text summaries containing counts, parcel tallies, and amounts must never wrap into broken double-line stacks on 375px+ screens.
4. **Zero Duplicate Selection Bars**:
   - If a global or top-level selection bar (e.g., `ResultsSelectionBar.tsx`) appears when rows are selected, any internal or card-level selection bars must automatically hide (`!selected || selected.size === 0`) to prevent dual-stacked selection bars.

---

## 10. RULE M14 — Mobile Card Collapse/Expand & Admin Panel UX (ENFORCED)
1. **Parcels Staging Mobile Card Collapse/Expand**:
   - Mobile parcel cards (`< 1024px`) must support two-tier expansion:
     - **Bulk Collapse All / Expand All**: Toggled via the top toolbar button (`Expand All` / `Collapse All`).
     - **1-by-1 Individual Card Toggle**: Operators can tap any collapsed summary strip (`#1 ref-id Rs. COD • Customer Name • City`) or chevron icon to expand/collapse that specific card independently.
   - Collapsed cards must occupy a compact ~48px row with quick-action delete and status indicators.
2. **Admin Panel Mobile Isolation & Bottom Sheet Drawer**:
   - Never auto-select merchants on initial page load on mobile (`< 1024px`). Mobile users must see the full merchant directory first.
   - On `< 1024px`, tapping a merchant opens an Apple iOS-style slide-up Bottom Sheet Drawer (`fixed inset-0 z-50 bg-black/60`) with drag indicator and close button. Never render merchant details below the list on mobile.
   - On desktop (`>= 1024px`), retain the 2-column split-screen layout with auto-selection and empty placeholder card.
3. **Mobile Customer Directory Invariant**:
   - Never hide customer tables on mobile without providing a mobile-native card view (`sm:hidden`).
   - Mobile customer cards must include direct 1-tap WhatsApp chat links and merchant store tags.
4. **Desktop Layout Invariant**:
   - Desktop spreadsheet grids (`>= 1024px`) with column resizing, drag handles, and multi-column editing must remain 100% untouched and functional whenever mobile changes are made.

---

## 11. RULE M15 — Universal App-Fit & Non-Clipping Responsive Layouts Across All Pages (RULE HARD ALL PAGES)
- **Zero Truncation or Edge-Clipping on Action Buttons**:
  - Buttons and interactive pills across all pages (`#paste`, `#table`, `#results`, `#history`, `#vault`, `#settings`, `#admin`) must never overflow their container or be clipped by parent borders (`Print Lab...` cutoff bug permanently banned).
  - All multi-button toolbars and selection bars must declare `flex flex-wrap items-center justify-between gap-2.5 w-full min-w-0 max-w-full`.
- **Small, Smart, Responsive Button Standard**:
  - Compact `h-7.5` to `h-8` heights, `px-2.5` to `px-3` horizontal padding, `rounded-lg` / `rounded-xl` radiuses, crisp `text-xs font-semibold` or `font-bold`.
  - Concise button labels (`Sync`, `Print`, `Report`, `Cancel`, `Book`) and auto-hiding of 0-count buttons (`Load Sheet (0)`, `Cancel (0)`).
- **Smooth Viewport Adaptation**:
  - Mobile (375px+), Tablet (640px - 1023px), and Desktop (1024px+) must maintain perfectly aligned, non-overlapping layouts without horizontal page bounce or jitter.




