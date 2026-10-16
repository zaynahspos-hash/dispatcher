# 34 — Clean Code, Zero Silent Errors & Courier Extensibility

> Mandatory architectural standard for code readability, error visibility, strict folder discipline, and pluggable multi-courier logistics expansion.

---

## 1. RULE ARCH-READABLE (HUMAN-READABLE CLEAN CODEBASE)
- **Zero AI Slop / Spaghetti Code**: Code must be engineered for human developers to read, maintain, and extend with zero mental friction.
- **Explicit, Self-Documenting Naming**:
  - Functions: `calculateTotalCodAmount()`, `validatePakistanPhoneNumber()`, `resolveOperationalCity()`.
  - Variables: `unverifiedCitiesCount`, `isCancellingShipment`, `selectedTrackingNumbers`.
  - Banned: Abbreviations (`tmp`, `dat`, `c1`, `fn`, `cb`, `val2`) in domain or business logic.
- **Strict 400-Line Ceiling**:
  - Target: `150–300 lines` per file.
  - Hard limit: `400 lines maximum`. Any file exceeding 400 lines must be decomposed into dedicated subcomponents or hooks.
- **Strict Modularity & Separation of Concerns**: UI components handle presentation and user interactions; custom hooks handle state and side-effects; pure utilities handle math, formatting, and data transformation.

---

## 2. RULE ERR-ZERO-SILENT (STRICT BAN ON SILENT / SWALLOWED ERRORS)
- **Zero Silent Errors**: Catching an error and ignoring it without user feedback or logging is strictly prohibited across the entire repository.
  ```ts
  // ⛔ STRICTLY FORBIDDEN (BANNED PATTERN)
  try {
    doSomething()
  } catch (e) {
    // ignore
  }

  // ✅ MANDATORY PATTERN
  try {
    doSomething()
  } catch (err: any) {
    console.error('[Module::Action] Operation failed:', err)
    toast.error('Action Failed', err.message || 'Unable to complete request. Please retry.')
  }
  ```
- **User-Facing Error Guidance**:
  - Every API failure, network drop, or validation error affecting user intent must be reported via `useToast()` (`toast.error(...)` or `toast.warning(...)`).
  - Error messages must explain **what happened** and **what the user can do** (e.g. "PostEx Token Invalid: Please verify your merchant token in Settings").
- **Offline / Local Storage Fallback**:
  - If a storage or sync operation fails, log the exact error and preserve data in memory or safe local backup with explicit user notification.

---

## 3. RULE FOLDER-DISCIPLINE (ORGANIZED FOLDER DOMAINS)
- **Zero Domain Mixup**: Every file lives in its dedicated, purpose-specific directory:
  ```
  src/
  ├── components/
  │   ├── parcel/        # Dispatch staging grid, mobile cards, KPI toolbar, city autocomplete
  │   ├── results/       # Booking results, expandable result rows, edit forms
  │   ├── history/       # Booked history table, cards, filter bars, advice modals
  │   ├── settings/      # Settings tab panels (Courier, AI, WhatsApp, Defaults)
  │   ├── common/        # Shared UI (Toast, SearchableDropdown, Modals, Avatar, UserMenu)
  │   └── layout/        # App shell, AppHeader, AppLayout, TabBars, GlobalLoadingOverlay
  ├── couriers/          # Pluggable Courier Provider Architecture (PostEx, Trax, Leopards, TCS)
  │   ├── types.ts       # ICourierProvider, CourierId, standard payloads & responses
  │   ├── registry.ts    # Courier provider registry and active adapter resolution
  │   └── providers/     # Concrete courier implementations (postex.ts, trax.ts, leopards.ts)
  ├── hooks/             # Custom state & orchestration hooks (useSettings, useParcelOperations)
  ├── utils/             # Pure stateless helpers (groqParser, cityList, localPdfVault, supabaseClient)
  └── types/             # Shared global TypeScript types and database contracts
  ```

---

## 4. RULE COURIER-EXTENSIBILITY (PLUGGABLE MULTI-COURIER ENGINE)
- **Pluggable Adapter Pattern**:
  - All logistics providers must implement the standard `ICourierProvider` interface in `src/couriers/types.ts`:
    ```ts
    export interface ICourierProvider {
      id: CourierId
      name: string
      capabilities: CourierCapabilities
      testConnection(credentials: Record<string, string>): Promise<{ success: boolean; latencyMs: number; message: string }>
      bookParcel(parcel: CourierBookingPayload, credentials: Record<string, string>): Promise<CourierBookingResult>
      trackParcel(trackingNumber: string, credentials: Record<string, string>): Promise<CourierTrackingStatus>
      cancelParcel(trackingNumber: string, credentials: Record<string, string>): Promise<{ success: boolean; message: string }>
      printLabels(trackingNumbers: string[], credentials: Record<string, string>): Promise<Blob | string>
      getPickupAddresses(credentials: Record<string, string>): Promise<Array<{ code: string; address: string; city: string }>>
    }
    ```
- **Zero Core Disruption**:
  - Adding a new courier (e.g. Trax, Leopards, TCS, M&P, CallCourier) requires creating exactly ONE new file in `src/couriers/providers/<courier>.ts` and registering it in `src/couriers/registry.ts`.
  - The UI (Dispatch table, Booking results, History, Loadsheet) interacts ONLY with the standard `ICourierProvider`, requiring zero rewrites to existing PostEx booking code.
