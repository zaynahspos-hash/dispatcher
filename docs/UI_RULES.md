# 🎨 UI RULES & Design System — Zaynah's Courier Manager

> Referenced by `docs/agent-rules/14-design-system.md` and `docs/agent-rules/17-mobile-native-app-style.md`.
> Mobile-first, Shopify-style logistics console. This is the single reference for consistent UI/UX.

---

## 1. Action Buttons & Touch Ergonomics
- Minimum touch target: **≥44x44px** on handheld screens.
- Micro-interaction: Active scaling `active:scale-[0.98] transition-transform duration-150`.
- Primary Button: Emerald / Indigo gradient or solid (`bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm`).
- Loading State: Must render an animated SVG spinner and disable repeated taps.

---

## 2. Color Palette & Dark Mode Tokens
- **Surface**:
  - Light: `bg-slate-50`, `bg-white`, `border-slate-200`
  - Dark: `dark:bg-slate-950`, `dark:bg-slate-900`, `dark:border-slate-800`
- **Text**:
  - High Contrast: `text-slate-900 dark:text-slate-50`
  - Muted: `text-slate-500 dark:text-slate-400`
- **Logistics Status Semantics**:
  - Delivered: Emerald (`bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800`)
  - Under Review: Amber (`bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800`)
  - Returned: Rose (`bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800`)
  - Booked / In Transit: Sky / Indigo (`bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800`)

---

## 3. Mobile Table & Card Representations
- On mobile screens (`< 768px`), table rows transform into compact parcel cards.
- Each card highlights:
  - Top row: Tracking Badge + COD Amount (bold).
  - Middle: Recipient Name, Phone with direct WhatsApp click-to-chat.
  - Bottom: Destination City + Shipper Advice trigger button.

---

## 4. Modal, Drawer & Overlay Standard (RULE M10b & MODAL1)
- **Zero Backdrop-Blur**: Never use `backdrop-blur-*` on overlays or sticky bars. Use `bg-black/60` or `bg-white/95` (prevents GPU repaint lag).
- **Mobile Drawer**: Slide up from bottom with `overscroll-contain` and drag handle.
- **Scroll Lock**: Lock body scroll cleanly on mount, restore to `''` on cleanup (RULE M8).
