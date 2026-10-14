# 14 — Design System & UI/UX Standards

Visual design tokens, component anatomy, and aesthetic standards.

---

## 1. Visual Aesthetics & Philosophy
- **Modern Logistics Dashboard**: Clean, crisp, high-density yet breathable courier interface inspired by Shopify Admin and Linear.
- **Palette**: Slate/indigo neutral base with vibrant semantic status accents.
  - Primary Brand: Emerald / Indigo (`bg-emerald-600 hover:bg-emerald-700`, `bg-indigo-600 hover:bg-indigo-700`)
  - Danger / Returned: Rose (`bg-rose-50 text-rose-700 border-rose-200`)
  - Warning / Under Review: Amber (`bg-amber-50 text-amber-700 border-amber-200`)
  - Success / Delivered: Emerald (`bg-emerald-50 text-emerald-700 border-emerald-200`)
  - Neutral / Booked: Sky / Slate (`bg-sky-50 text-sky-700 border-sky-200`)

---

## 2. Component Anatomy

### A. Action Buttons
- Minimum height: `44px` on mobile, `38px` on desktop.
- Rounded corners: `rounded-xl`.
- Micro-interaction: `active:scale-[0.98] transition-all`.

### B. Status Badges
- Pill shape: `px-2.5 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5`.

### C. Searchable Dropdown
- Clean border, keyboard navigable, floating menu with subtle shadow (`shadow-lg border border-slate-200 dark:border-slate-800 rounded-xl`).

### D. Table Design
- Mobile: Card-based parcel representation.
- Tablet / Desktop: Dense table with sticky header, zebra striping, and right-aligned numeric COD columns.
