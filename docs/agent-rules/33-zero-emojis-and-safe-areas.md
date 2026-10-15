# 33 — Zero Emojis, Native Mobile Safe Areas & Local Document Vault

> Mandatory project UI/UX and architectural standard. Single Source of Truth for icons, handheld safe areas, admin scoping, and offline document storage.

---

## 1. RULE UI-ZERO-EMOJIS (STRICT BAN ON EMOJIS IN PRODUCTION UI)
- **Zero Emojis Policy**: No emoji characters (`🚚`, `🤖`, `✉️`, `🔒`, `⚡`, `📦`, `🔄`, `🇵🇰`, `💳`, `✓`, `🔌`, `⚠️`, `☀️`, `🌙`, `📲`, `📥`, `🔗`, `📱`, `🌟`) may EVER be used in:
  - Navigation tab labels or icons
  - Action buttons or call-to-actions
  - Card titles, headers, subtitles, or badges
  - Template selector chips
  - System modals, drawers, or notifications
- **Mandatory SVG Standard**: Every graphic icon MUST be an SVG component imported from `src/components/Icons.tsx` (`TruckIcon`, `BotIcon`, `MailIcon`, `LockIcon`, `CheckIcon`, `PlugIcon`, `DownloadIcon`, `SmartphoneIcon`, `SunIcon`, `MoonIcon`, `AlertIcon`, etc.).

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
