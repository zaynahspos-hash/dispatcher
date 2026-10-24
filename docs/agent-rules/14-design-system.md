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

---

### 6. Rule DS6 — Apple Modern Minimalist UI & Anti-Overcolored Aesthetics (RULE APPLE-UI)
- **Apple Modern Minimalist Design Language**:
  - Crisp, disciplined typography with calibrated font weights (`font-medium`, `font-semibold`, `font-bold`, `font-mono` for financials/serials).
  - Clean neutral slate foundation: light mode `bg-slate-50` with `bg-white` cards; dark mode `bg-[#070b12]` with `bg-[#0c121e]` cards and subtle borders (`border-slate-200/80 dark:border-slate-800`).
- **Strict Anti-Overcoloring & Anti-AI Slop Mandate**:
  - Over-colored neon rainbow gradients, purple/magenta highlights, lime borders, and decorative gimmickry are permanently banned.
  - Color palette is disciplined and semantic:
    - **Emerald**: Primary action, confirmed status, matched cities, positive revenue.
    - **Amber**: Unverified cities, pending shipper advice, duplicate serial warning.
    - **Rose**: Invalid phone format, deleted rows, booking errors.
    - **Slate / Zinc**: Neutral borders, secondary actions, informational labels.
- **Resilient Non-Breakable Grid & Text Flow**:
  - Table cells and card blocks must never blowout or cause uncommanded horizontal body scrollbars.
  - All input wrappers and flex containers within data grids must include `min-w-0` and `overflow-hidden`.

---

### 7. Rule DS7 — Uniform Table Action Squircle Buttons & Anti-AI Pill Mandate
- **Table Row Action Cells Geometry**:
  - All action buttons inside data grid cells (Booking, WhatsApp, Delete, Cancel) MUST use uniform `w-7.5 h-7.5 rounded-xl` (30x30px) squircle icon buttons with clean semantic iconography:
    - **Single Order Booking**: `TruckIcon` (`w-7.5 h-7.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white`).
    - **WhatsApp Notification**: `WhatsAppIcon` (`w-7.5 h-7.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-600`).
    - **Row Deletion**: `TrashIcon` (`w-7.5 h-7.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30`).
    - **Shipment Cancellation**: `CancelIcon` (`w-7.5 h-7.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-600`).
- **Strictly Banned**:
  - Asymmetrical text pills (e.g., `[↻ Book]` sandwiched beside 30x30 squircle icon buttons) in table cells are permanently forbidden. They disrupt visual rhythm and look like AI-generated slop.

---

### 8. Rule DS8 — Desktop Horizontal Column Auto-Fit vs Mobile Vertical Card Accordion
- **Desktop Data Grids (>= 1024px)**:
  - All cell inputs MUST maintain clean, uniform single-line Excel height (`h-10` flush inputs).
  - Multi-line `<textarea>` elements in desktop grid cells are strictly banned.
  - Clicking `[↔ Auto-Fit]` expands column widths forward **HORIZONTALLY** (`triggerTableAutoFit`) based on maximum text content length so names, cities, and addresses are completely visible without clipping.
  - Alt+Click on `[↔ Auto-Fit]` resets column widths to default.
- **Mobile Card Lists (< 1024px)**:
  - Mobile cards use **vertical accordion expansion downwards** (`neche ki taraf`).
  - Mobile action toolbar provides `[Expand All / Collapse All]` to smoothly toggle all cards downwards simultaneously.
  - Tapping an individual card or clicking `View Extra Details` / `Hide Extra Details` expands the card downwards to reveal full address, product details, notes, and weights without horizontal table clipping.

---

### 9. Rule DS9 — Unified Mobile Card Anatomy (Parcels, Results, History)
- Every handheld card across all tabs MUST share identical visual hierarchy and layout:
  1. **Top Row**: Checkbox + Index (`#1`) | Tracking or Ref ID Pill | City Pill | Price (`Rs. {amount}` right-aligned).
  2. **Customer Row**: Customer Name (bold white/slate-900) + Phone number (font-mono text-slate-400) right-aligned.
  3. **Address Row**: Full address text (subtle slate-500, clean line-clamp or wrap).
  4. **Status / Alert Tag**: Clean semantic tag (WhatsApp alert, duplicate status).
  5. **Bottom Action Bar**: Standard Apple-grade action buttons (`h-9` or `h-8`, uniform radius, 44px touch clearance, uniform active scales).

---

### 10. Rule DS10 — Zero Container Overflow / No Breakout Guarantee
- Elements MUST NEVER pop outside card boundaries or cause horizontal overflow on mobile screens (375px+).
- **Header Actions Rule**: All card headers containing title + counts + action buttons (e.g. `Booked History` + `Expand All` + `Refresh Statuses`) MUST use responsive wrapping:
  - Container: `flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full min-w-0`
  - Button Group: `flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-between sm:justify-end`
- Buttons must NEVER have rigid fixed widths that exceed viewport bounds or push past card borders.

---

### 11. Rule DS11 — Apple-Grade Opacity Status Badges & Anti-AI White Blob Mandate
- Raw stark-white backgrounds (`bg-white`, `bg-[#eff6ff]`, `bg-blue-50`) on dark mode status badges are STRICTLY BANNED. They look like generic AI slop.
- All status badges in dark mode MUST use calibrated alpha-opacity tokens:
  - **Ready for Pickup / Booked**: `bg-emerald-500/10 border-emerald-500/20 text-emerald-400`
  - **In Transit / Picked by Courier**: `bg-sky-500/10 border-sky-500/20 text-sky-400`
  - **Pending Loadsheet / Warehouse**: `bg-amber-500/10 border-amber-500/20 text-amber-400`
  - **Action Required / Review**: `bg-amber-500/15 border-amber-500/30 text-amber-300 font-bold`
  - **Delivered**: `bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-bold`
  - **Cancelled / Returned**: `bg-rose-500/10 border-rose-500/20 text-rose-400`

---

### 12. Rule DS12 — Unified Financials, Tracking & Action Tokens
- **COD Price Token**: Everywhere price is shown, use:
  `font-mono font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap`
- **Tracking / CN Token**: Everywhere tracking is shown, use:
  `font-mono font-bold select-all` enclosed in a clean rounded pill.
- **City Token**: Everywhere city is shown, use uppercase bold pill:
  `text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wide`

---

### 13. Rule DS13 — WhatsApp Real Brand Color & Zero Discrepancy Mandate (SSOT1)
- **Authentic WhatsApp Brand Palette**:
  - Primary Brand Green: `#25D366`
  - Secondary Dark Teal: `#128C7E` (status indicator dot ring)
  - Pending / Unsent Tint: `#25D366/10` with `#25D366/40` border
- **Zero Information Discrepancy Mandate**:
  - The customer sub-pill (`Sent` vs `WA Pending`) and the WhatsApp action button state MUST ALWAYS be 100% synchronized via single source of truth `isParcelWhatsAppSent`.
  - Under NO circumstance may a row display a `Sent` pill while rendering a grey/unsent action button or vice-versa.
  - If a parcel has `whatsapp_sent`, `whatsappSent`, `whatsapp_booking_sent`, `whatsapp_status_sent`, or is registered in `waTracker`, both the pill and action button MUST display in the authentic WhatsApp green `Sent` state.
- **Mandatory Shared Component**:
  - All desktop tables and mobile cards across `#results` and `#history` MUST render via `src/components/common/WhatsAppActionButton.tsx`. Ad-hoc, diverging WhatsApp button implementations are strictly banned.

---

### 14. Rule DS14 — Overflow-Aware Horizontal Chip Navigation & Arrow Disclosure (SSOT1)
- **Mandatory Shared Component (`ScrollableChipsBar`)**:
  - All horizontal chip rows, segmented filter bars, quick date presets, and sub-tabs across the entire project MUST be wrapped in `src/components/common/ScrollableChipsBar.tsx`. Ad-hoc or duplicate horizontal scroll implementations are strictly banned.
- **Strict "Bilwaja Nahi" (Zero Unnecessary Arrows) Invariant**:
  - If all chips fit comfortably on screen without overflow (`scrollWidth <= clientWidth`), navigation arrows MUST BE 100% INVISIBLE.
  - On desktop or wide viewports where all pills fit naturally, 0 arrows clutter the interface.
- **Dynamic Overflow Disclosure (< and >)**:
  - Navigation arrows appear dynamically ONLY when chip content exceeds the available screen/container width.
  - **Left Arrow**: Rendered dynamically only when the user has scrolled right (`scrollLeft > 4`).
  - **Right Arrow**: Rendered dynamically only when there is off-screen content remaining to the right (`scrollLeft + clientWidth < scrollWidth - 4`).
  - When scrolled all the way to either end, the respective arrow hides immediately so the boundary chips are never obscured.
- **Apple Minimalist Navigation Controls**:
  - Arrow buttons are circular squircles (`w-7 h-7`), featuring subtle borders (`border-slate-200/90 dark:border-slate-700`), subtle shadows, and soft gradient edge masks that smoothly fade the underlying chips behind the buttons.
  - Uses strictly standard SVG icons (`ChevronLeftIcon`, `ChevronRightIcon` in `Icons.tsx`). Raw emojis are permanently banned (Rule 33).
  - Tapping arrows executes smooth step scrolling (`behavior: 'smooth'`) calibrated to 65% of the visible container width.
  - Full native touch swiping (`touch-pan-x`) and mouse wheel horizontal scrolling are 100% preserved.

---

### 15. Rule DS15 — Unified Brand & Functional Iconography Mandate (SSOT1)
- **Absolute Ban on Ad-Hoc & Hollow Inline SVGs**:
  - Developers and agents must NEVER paste custom, incomplete, or hollow inline `<svg>` markup into individual screens, tabs, buttons, or modals.
  - Every icon representing a brand or standard UI function (e.g., WhatsApp, Refresh, Search, AutoFit, Chevron, Calendar, Trash, Edit) MUST strictly be imported from `src/components/Icons.tsx` or use shared action wrappers like `src/components/common/WhatsAppActionButton.tsx`.
- **Authentic WhatsApp Icon Invariant**:
  - The official WhatsApp icon (`WhatsAppIcon` in `src/components/Icons.tsx`) contains both the complete speech bubble outline AND the inner telephone handset (`M17.472 14.382c...`).
  - Hollow speech bubble outlines (e.g., single-path `M.057 24l1.687...` lacking the phone receiver) are permanently banned.
- **Cross-Tab & Cross-View Uniformity**:
  - All tabs (`#results`, `#history`, `#settings`, `#admin`, auth modals, and system screens) MUST render the exact same authentic WhatsApp icon and brand palette (`#25D366` green, `#128C7E` dark teal).
  - Icons performing the same function must have matching visual weights, paddings, and uniform squircle geometry (`rounded-xl`, Rule DS7).

---

### 16. Rule DS16 — App-Fit, Aligned Native iOS Aesthetics & Responsive Non-Clipping Mandate Across All Pages (RULE HARD ALL PAGES)
- **Universal Scope Across All Pages & Modules**:
  - Enforced strictly on every screen: `#paste`, `#table`, `#results`, `#history`, `#vault`, `#settings`, `#admin`, all modal drawers, and sub-views.
- **Absolute Ban on Button & Text Clipping ("Hide / Cut-Off Issue")**:
  - Under NO circumstance may any button, action pill, counter badge, or dropdown be clipped, sliced in half by container borders, or truncated awkwardly (`Print Lab...` cutoff bug permanently forbidden).
  - All multi-button action bars (e.g., `HistorySelectionBar`, `ResultsSelectionBar`, `ParcelSelectionBar`, staging toolbars) MUST use responsive wrapping (`flex flex-wrap items-center justify-between gap-2.5 w-full min-w-0 max-w-full`).
  - Rigid `sm:flex-row` without wrap is strictly forbidden when combined child widths can exceed handheld, tablet, or split-desktop viewports.
- **Small, Smart, Responsive Apple Button Sizing**:
  - Desktop & Mobile: Compact `h-7.5` to `h-8` heights, `px-2.5` to `px-3` horizontal padding, `rounded-lg` / `rounded-xl` radiuses, crisp `text-xs font-bold` or `font-semibold`.
  - Concise, high-signal labels: Use `Sync (N)`, `Print (N)`, `Report (N)`, `Book (N)`, `Cancel (N)` instead of verbose sentences (`Sync Status for Parcels`).
  - Conditional Zero-Count Auto-Hiding: Non-actionable buttons with 0 items (e.g., `Load Sheet (0)`, `Cancel (0)`) MUST automatically hide to preserve valuable horizontal breathing room.
- **Native iOS Aesthetic Alignment**:
  - Clean card foundations with subtle border tokens (`border-slate-200/80 dark:border-slate-800`), restrained semantic colors (emerald, sky, amber, rose, slate), crisp micro-interaction haptics (`active:scale-95 transition-all`), and zero backdrop-blur thrashing (Rule M10b).

---

### 17. Rule DS17 — Anti-AI Clutter & Disciplined Apple Enterprise Software Buttons (RULE ANTI-AI-BUTTONS)
- **Permanent Ban on Bloated Candy Pills**:
  - Over-sized, wide, bloated action buttons (`h-10`, `px-4`, `px-5`, `rounded-full` puffy pills) are permanently banned across all pages.
  - Pastel candy backgrounds (`bg-sky-100`, `bg-emerald-100`, `bg-sky-500/15` bubbles) are banned on standard toolbars.
- **Strict Prohibition on Zero-Count (0) Buttons**:
  - Rendering disabled action buttons with 0 count (e.g., `Load Sheet (0)`, `Cancel (0)`) is strictly forbidden. If a conditional action has 0 applicable items, it MUST be completely hidden from the UI.
- **Disciplined Enterprise Software Sizing**:
  - All action bars, toolbars, and selection strips must use disciplined Apple macOS / iOS micro-sizing:
    - Height: `h-7.5` (30px)
    - Padding: `px-2.5`
    - Typography: `text-[11px]` to `text-xs font-semibold`
    - Radiuses: `rounded-lg`
    - Secondary buttons: elevated crisp white/slate (`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800`)
    - Primary button: Solid emerald (`bg-emerald-600 hover:bg-emerald-500 text-white font-bold`)
    - Micro-haptics: `active:scale-95 transition-all`


