# 19 — Navigation & State Restoration Rules (RULE NAV-RESTORE)

Persistent tab state, 0ms refresh landing, scroll restoration, and session continuity.

---

## 1. Zero-Loss Tab Landing on Browser Refresh & PWA Updates (RULE NAV1 — MANDATORY)

- **Invariant**: When a user or merchant refreshes the browser (F5, Cmd+R, mobile pull-to-refresh, PWA update button, or service worker controller change), the app **MUST land on the exact same active tab** (e.g. `#history`, `#admin/customers`, `#vault`, `#settings`, `#apps`, `#table`, `#results`), **NEVER fall back or reset to `#paste`**.
- **Two-Tier Tab Restoration**:
  1. **Primary**: `window.location.hash` (e.g., `#history`, `#admin/customers`). If present and valid, it takes immediate precedence.
  2. **Secondary Fallback**: `localStorage.getItem('parcel_app_active_tab')`. If the URL hash is momentarily absent, the app restores from localStorage and immediately writes the hash back to `window.location.hash = savedTab`.
- **Subtab Route Integrity**:
  - Deep admin and settings subpaths (such as `#admin/customers`, `#admin/merchants`, `#settings/addresses`) must be preserved in both state and URL.
  - The main navigation hook must only change `window.location.hash` if the *root* tab portion changed, preserving subpath routing without premature truncation.

---

## 2. Zero Kicking to `#paste` During Auth Hydration (RULE NAV2)

- When the application mounts, `supabase.auth.getSession()` resolves asynchronously over the wire. During the initial 50–300ms window, `user` is `null` and `initialAuthChecked` is `false`.
- **STRICT PROHIBITION**: Never trigger non-admin redirection or kick the user off protected tabs while `initialAuthChecked` is `false` or `user` is `null`.
- The user's active session email is cached synchronously in `localStorage.getItem('zaynah_active_user_email')` so admin credentials can be checked at 0ms during the initial render without auth thrashing.

---

## 3. PWA Cache-Busting Reload Hash Preservation (RULE NAV3)

- In `src/utils/pwaReload.ts` (`forceAppUpdate()`):
  Whenever clearing service workers or appending cache-busting timestamp queries (`?_ts=...`), the active hash **MUST be explicitly preserved**:
  ```ts
  const currentTab = localStorage.getItem('parcel_app_active_tab') || 'paste'
  const hash = window.location.hash || ('#' + currentTab)
  const currentUrl = new URL(window.location.href)
  currentUrl.searchParams.set('_ts', Date.now().toString())
  currentUrl.hash = hash
  window.location.replace(currentUrl.toString())
  ```

---

## 4. Sticky Action Continuity & Always-Visible Operations (RULE NAV4 / DS-STICKY)

- In `BookedHistory`, the bulk operations bar (`HistorySelectionBar` containing `Load Sheet`, `Print Labels`, `Sync Status`, `Cancel Bookings`, and `Select All`) **MUST be sticky** (`sticky top-0 z-30`).
- **Always Visible**: Action buttons must never disappear when 0 parcels are selected. The bar remains visible at all times, showing enabled actions with counts or 1-click select-and-operate functionality.
- **1-Click Load Sheet**: If the merchant clicks `Load Sheet` with 0 parcels explicitly checked, the system automatically detects all parcels in `pending_loadsheet` status, selects them, and opens the confirmation modal with zero wasted clicks.
- **Zero Backdrop-Blur Thrashing (RULE M10b)**: Sticky layers must strictly use high-contrast solid opacity layers (`bg-slate-50/95 dark:bg-[#0c121e]/95` or `bg-emerald-50/95 dark:bg-[#071813]/95`) with zero `backdrop-blur-*` to prevent mobile GPU stutter.

---

## 5. Scroll Position Restoration & In-Progress Edits

- In `BookedHistory`, when opening a Shipper Advice modal or tracking detail drawer and closing it, the user must return to the exact scroll position in the history list.
- Prevent scroll snapping or resetting to top on re-renders.
- In-progress edits in `ParcelTable` or raw input text in `PasteInput` must NEVER be discarded unintentionally on tab switching.
