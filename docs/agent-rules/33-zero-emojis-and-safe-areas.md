# 33 — Zero Emojis, Native Mobile Safe Areas & Local Document Vault

> Mandatory project UI/UX and architectural standard. Single Source of Truth for icons, handheld safe areas, admin scoping, and offline document storage.

---

## 1. RULE UI-ZERO-EMOJIS (STRICT BAN ON EMOJIS & UNICODE SYMBOLS IN UI)
- **Zero Emojis & Symbols Policy**: No emoji characters (`🚚`, `🤖`, `✉️`, `🔒`, `⚡`, `📦`, `🔄`, `🇵🇰`, `💳`, `🔌`, `⚠️`, `☀️`, `🌙`, `📲`, `📥`, `🔗`, `📱`, `🌟`) OR unicode arrows/symbols (`↕`, `↔`, `→`, `←`, `▲`, `▼`, `◀`, `▶`, `✓`, `✕`, `●`, `■`) may EVER be used in:
  - Navigation tab labels, toolbars, buttons, or pill chips
  - Action buttons or call-to-actions (e.g. NEVER `Auto-Fit (Expanded ↕)` or `← Back`)
  - Card titles, headers, subtitles, tooltips, or badges (e.g. NEVER `Sent ✓`)
  - Template selector chips or guidance lists
  - System modals, drawers, toasts, or notifications
- **Root Cause & Why Unicode Symbols Are Banned**:
  - On Apple devices (macOS, iOS Chrome & Safari) and Android, the OS system font renderer includes unicode arrows (`↕`, `↔`, `▶`) in its Apple Color Emoji / Noto Color Emoji fallback cascade.
  - When raw unicode characters are rendered in JSX text, the browser renders them as colored emoji boxes (e.g., `↕` becomes a blue emoji block).
  - Therefore, NEVER rely on raw unicode symbols for UI indicators.
- **Mandatory SVG Standard**: Every graphic icon MUST be an SVG component imported from `src/components/Icons.tsx` (`AutoFitIcon`, `CloseIcon`, `CheckIcon`, `ChevronLeftIcon`, `ChevronDownIcon`, `ChevronRightIcon`, `TruckIcon`, `BotIcon`, `MailIcon`, `LockIcon`, `PlugIcon`, `DownloadIcon`, `SmartphoneIcon`, `SunIcon`, `MoonIcon`, `AlertIcon`, etc.). Plain English text should accompany icons when necessary.
- **User Content & WhatsApp Notes Emoji Allowance**:
  - RULE UI-ZERO-EMOJIS applies strictly to app chrome, system buttons, headers, navigation bars, and table UI.
  - User-generated content (WhatsApp dispatch alert templates, customer notes `{note}`, SIM reminders, review follow-up messages, parcel notes, and courier notes) **100% supports emojis** entered or pasted by the merchant. The system must never strip, sanitize, or block emojis in user text notes, and WhatsApp URL generation must preserve all emoji characters via `encodeURIComponent`.
- **Manual Save Always (No Auto-Save on Keystrokes or Selectors Across ALL Settings Tabs)**:
  - Settings across ALL 4 tabs (`PostEx Courier`, `AI Engine`, `WhatsApp Alert`, `Order Defaults`) operate strictly under **Manual Save Always** mode.
  - Form inputs, selects, radio chips, and template editors must NEVER fire automatic database or localStorage write requests (`Auto-Save Active` is permanently wiped).
  - All changes are kept in local `draftSettings` state.
  - A prominent header indicator displays `Manual Save Mode` when clean, and an amber pulsating `Unsaved Changes` indicator + `Discard` button when modified.
  - Every sub-tab contains a dedicated bottom `Save [Tab] Settings` action button, complemented by a persistent floating sticky save bar across the page whenever modifications exist.
  - Saving settings commits the complete draft to Supabase and namespaced localStorage, keeping the user in the Settings view without disruptive tab redirects.

---

## 2. RULE M11 — MOBILE SAFE-AREA INSETS (NOTCH & GESTURE BAR PROTECTION)
- **Top Header**:
  - Must declare top padding using safe-area env:
    ```tsx
    pt-[max(env(safe-area-inset-top),14px)]
    h-[calc(60px+max(env(safe-area-inset-top),14px))]
    ```
  - Prevents overlap with iPhone notch, Dynamic Island, and Android camera punch-holes.
- **Bottom Navigation Bar**:
  - Maximum **5 primary tabs** on handheld mobile devices (`Paste`, `Parcels`, `Results`, `History`, `Settings`). Secondary tabs (`Apps`, `Admin`) must live in the side drawer.
  - Must declare bottom padding using safe-area env:
    ```tsx
    pb-[max(env(safe-area-inset-bottom),16px)]
    h-[calc(64px+max(env(safe-area-inset-bottom),16px))]
    ```
  - Prevents overlap with iOS Home Indicator gesture bar and Android 3-button navigation bars.
- **Main Canvas Bottom Clearance**:
  - Must declare `pb-[calc(94px+max(env(safe-area-inset-bottom),16px))]` and `overscroll-y-none` so content scrolls cleanly above the floating tab bar without clipping.

---

## 3. RULE AUTH-ADMIN-SCOPING (3-EMAIL STRICT WHITELIST)
- **Admin Control Access**:
  - The Admin Control panel (`#admin`) and Admin navigation items are strictly restricted to:
    1. `zaynahspos@gmail.com`
    2. `shoaibzaynah@gmail.com`
    3. `totvoguepk@gmail.com`
  - All other users must receive a clean redirect to `#paste` with 0 admin UI artifacts.

---

## 4. RULE LOCAL-DOC-VAULT (LOCAL PDF & AIRWAY BILL FILE MANAGER)
- Every generated CN Airway Bill PDF, Thermal Label, and PostEx Loadsheet is automatically indexed in the client's local persistent storage (`localPdfVault`).
- Features required:
  - Date range filtering (`All`, `Today`, `Last 7 Days`, `This Month`)
  - 1-click Re-download and Print
  - Delete 1-by-1
  - Multi-select delete
  - "Clear All Vault" with storage size indicator
