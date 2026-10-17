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
- **Zero Core Disruption & Future Expansion Roadmap**:
  - **Current Production Courier**: PostEx V3 is the 100% active, primary production courier engine across the entire system.
  - **Future Courier Roadmap (Deferred Activation)**: Additional couriers (Trax, Leopards, TCS, M&P, CallCourier) will be activated in future releases. They must NOT pollute active UI forms or confuse merchants today.
  - **Isolation Invariant**: When adding any courier in the future, it must live exclusively in `src/couriers/providers/<courier>.ts` and register in `src/couriers/registry.ts`. The core UI (Dispatch table, Booking results, History, Loadsheet) interacts via the unified interface, ensuring ZERO regressions to PostEx bookings.

---

## 5. RULE SETUP-1CMD — 1-COMMAND MASTER SETUP & DATABASE VIA API RUNNER
- **Master Schema Authority**:
  - `supabase/schema/SUPER_MASTER_SCHEMA.sql` is the single source of truth for all database tables, columns, constraints, foreign keys, triggers, and Row Level Security (RLS) policies.
  - All database interactions use lowercase `snake_case` (RULE D13) and UUID primary keys (RULE D14). ZERO Prisma (RULE D7).
- **1-Command Clone & Setup System (`npm run setup` / `npm run setup:clone`)**:
  - Any new developer, agent, or tenant cloning the repository must be able to bootstrap the entire project with exactly ONE command:
    ```bash
    npm run setup
    ```
  - The setup script (`scripts/setup.js`):
    1. Validates and auto-detects `.env.local` configuration.
    2. Deploys the complete `SUPER_MASTER_SCHEMA.sql` via Supabase API / PostgreSQL pooler connection without requiring manual SQL editor clicks.
    3. Verifies that all 5 core tables (`users`, `user_settings`, `booked_history`, `customers`, `usage_logs`) have Row Level Security (RLS) active and verified.
    4. Bootstraps storage buckets (`avatars`, `airway-bills`, `load-sheets`).
    5. Deploys dark Apple-grade auth email templates (`updateEmailTemplates.js`).
    6. Validates the TypeScript production build cleanly.
- **Portability Invariant**:
  - Scripts must never hardcode single-environment strings. Connection strings must dynamically read from `process.env.DATABASE_URL`, `process.env.SUPABASE_PROJECT_REF`, and `process.env.SUPABASE_DB_PASSWORD` with safe fallback.
