# 31 — Modal & Bottom-Sheet Overlay System (MODAL1)

Unified specifications for popups, confirmation dialogs, and mobile bottom drawers.

---

## 1. Responsive Drawer Pattern
- **Mobile (< 768px)**: Render as an ergonomic **Bottom Sheet**:
  - Slides up smoothly from bottom (`translate-y-0`).
  - Fixed top handle / header with close icon.
  - Body has `flex-1 min-h-0 overflow-y-auto overscroll-contain`.
  - Sticky confirmation buttons at bottom.
- **Desktop (>= 768px)**: Render as a **Centered Dialog**:
  - Max width `max-w-lg` or `max-w-xl`.
  - Elevation `shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl`.

---

## 2. Accessibility & Dismissal Invariants
- **Escape Key**: Closes modal automatically.
- **Backdrop Tap**: Clicking overlay outside modal triggers dismissal.
- **Scroll Lock**: Body scroll must be locked when modal is open and cleaned up safely to `''` on unmount (RULE M8).
- **Zero Blur**: Never use `backdrop-blur-*` on modal backdrop. Use `bg-black/60` (RULE M10b).

---

## 3. Scope Discipline & Dedicated Tab Invariant (MODAL2)
- **Modals are for Transient Actions Only**: Confirmation dialogs, quick single-field edits, auth/reset password, and single-item advice modals.
- **Strictly Banned When Dedicated Tab Exists**: Agar kisi domain ka dedicated Tab ya Page exist karta hai (e.g., `DocumentVaultTab` on `#vault`, `BookedHistory` on `#history`, `ParcelTable` on `#table`), to us domain ka koi duplicate popup modal banakar ya chhod kar screen par render karna strictly BANNED hai.
- **KPI Card & Button Trigger Standard**: Kisi bhi dashboard/results/summary bar ka card ya button agar kisi domain ko refer kare to woh popup kholne ke bajaye dedicated Tab par 0ms smooth transition karega (`setActiveTab(...)` / `window.location.hash = ...`).
