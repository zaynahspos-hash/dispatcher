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

