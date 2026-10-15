# 14 — Design System & UI/UX Standards

Visual design tokens, component anatomy, aesthetic standards, and unified application feel.

---

## ⛔ PERMANENT UI/UX RULES & INVARIANTS

### 1. Rule DS1 — Unified Button Hierarchy (No Mismatched Clashes)
- **Primary Action (Exactly ONE per screen/section)**:
  - Solid high-contrast emerald: `bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm shadow-emerald-600/20 active:scale-[0.98] transition-all`.
  - Icon: Single directional or action-specific icon (e.g., `ArrowRightIcon` or `SendIcon`). Never repeat identical icons across differing button types.
- **Secondary Action**:
  - Elevated slate: `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold rounded-xl active:scale-[0.98] transition-all`.
  - **STRICTLY BANNED**: Do NOT mix pale mint (`bg-emerald-50 border-emerald-300`) buttons next to solid emerald buttons. Buttons must share consistent visual weights and family.
- **Destructive Action**:
  - Soft rose ghost: `border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100/80 font-bold rounded-xl active:scale-[0.98] transition-all`.
- **Button Sizing**:
  - Desktop: `h-10 px-4 text-xs font-bold`.
  - Mobile: `h-11 px-4 text-sm font-bold min-h-[44px]` (Apple touch guidelines).

---

### 2. Rule DS2 — Excel Spreadsheet Data Grid Architecture
- **Zero Floating Input Bubbles**:
  - Table inputs must NEVER look like individual floating pills inside cells.
  - Table cells must have clean grid borders (`border-b border-r border-slate-200/80 dark:border-slate-800`).
  - Inputs must be flush with the cell boundaries: `w-full h-full px-2.5 py-2.5 bg-transparent text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset`.
- **Alignment Rules**:
  - Textual fields (Customer Name, Address, City, Ref ID): `text-left`.
  - Currency & Financials (COD Amount): `text-right font-mono font-bold text-emerald-600 dark:text-emerald-400`.
  - Quantities & Counts (Items, Weight, Row #): `text-center font-mono`.
  - Status & Actions: `text-center`.
- **Horizontal Scroll & Clearance**:
  - Generous column widths so no header (e.g. `Action`) is ever truncated to `ACTIO`.
  - Explicit column widths: Ref ID (`w-32 min-w-[120px]`), Customer (`w-44 min-w-[170px]`), Phone (`w-36 min-w-[140px]`), City (`w-44 min-w-[170px]`), Address (`min-w-[280px]`), COD (`w-28 min-w-[110px]`), Items (`w-20 min-w-[80px]`), Type (`w-32 min-w-[130px]`), Action (`w-16 min-w-[64px]`).

---

### 3. Rule DS3 — Zero Header Pill Clutter
- Top header must NOT be cluttered with random mismatched capsules with varying font sizes, heights, and borders.
- **Brand Title**: Clean text (`Zaynahs Courier • AI Dispatcher`). Banned: random stacked `v2.4` and `LIVE` debug tags beside brand.
- **Header Action Controls**:
  - Uniform dimensions: `w-9 h-9` square buttons on mobile, matching height `h-9` on desktop.
  - Uniform borders: `border border-slate-200/90 dark:border-slate-800`.
  - Uniform radius: `rounded-xl`.
  - User Avatar Pill: Clicking opens the unified `UserAccountMenu` (Profile, Password, Avatar 10-20KB WebP Cloud Upload, Settings shortcut, Theme, Sign Out).

---

### 4. Rule DS4 — Native iOS Mobile Navigation & Zero Bleed-Through
- **100% Solid Opaque Background**:
  - Mobile bottom navigation bar MUST use solid `bg-white dark:bg-[#0c121e]`.
  - Never use translucent opacity without blur (`bg-white/95`) that allows scrolling cards or tables to bleed through.
- **No Clashing Indicator Lines**:
  - Banned: Floating top horizontal green bars that crash into icon badges.
  - Active state is expressed through active icon color (`text-emerald-600 dark:text-emerald-400`) and bold label.
- **5 Core Mobile Tabs**:
  - `Paste`, `Parcels`, `Dispatch`, `History`, `Apps`.
  - Settings is accessible via top-right user avatar menu.
- **Badge Anchor**:
  - Placed cleanly on top-right corner of icon: `-top-1 -right-2.5 min-w-[18px] h-[18px] px-1 text-[10px] font-black rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center ring-2 ring-white dark:ring-[#0c121e]`.
- **Bottom Clearance**:
  - Main scrollable container must have `pb-36` on mobile to guarantee no content or action button is ever obscured by the navigation bar.

---

### 5. Rule DS5 — Real-Time Process Transparency (Done / Remain / Total)
- Any batch operation (AI text cleaning, PostEx booking, sync) MUST display real-time counters:
  - **Done Count**: Current completed operations.
  - **Remaining Count**: Total minus completed.
  - **Total Count**: Exact total items.
  - **Animated Progress Bar**: Smooth percentage tracking.
  - **Active Step Indicator**: Precise description of what the engine is processing.
