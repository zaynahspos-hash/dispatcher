# 🏗️ ULTRA DEEP REBUILD SYSTEM — Complete Architecture & Execution Manual
Zaynahs Courier Manager · B2B Multi-Tenant SaaS Logistics Engine
Vite · React 19 · Tailwind CSS v4 · TypeScript · Supabase (Pure API & RLS) · PostEx V3 · Groq LLaMA-3

---

## 1. Executive Summary & Purpose
This document provides the authoritative, exhaustive technical blueprint for the **Ultra Deep Rebuild** of Zaynahs Courier Manager. Every architectural invariant, database policy, courier API lifecycle, and UI component pattern is codified here to guarantee **100% compliance** across all 33 atomic rules in `docs/agent-rules/` and all operational guides in `docs/`.

---

## 2. Foundational Invariants (Non-Negotiable Core)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE PRIME DIRECTIVES                           │
├──────────────────────────────┬─────────────────────────────────────────┤
│ RULE D7: Zero Prisma         │ 100% Pure Supabase JS Client & REST API │
│ RULE D13: Strict snake_case  │ All tables & columns lowercase_snake    │
│ RULE D14: UUID v4 PKs        │ gen_random_uuid() for all primary keys  │
│ RULE D15: Strict RLS         │ auth.uid() = user_id multi-tenant lock  │
│ RULE D16: SaaS Auth          │ Supabase GoTrue JWT + Bearer headers    │
│ RULE D17: Pure Supabase PW   │ Built-in updateUser & reset API         │
│ RULE M10b: Zero Blur         │ No backdrop-blur-* on scrolling layers  │
│ RULE 23: File Modularity     │ 300–400 line target per component file  │
└──────────────────────────────┴─────────────────────────────────────────┘
```

---

## 3. The 6-Layer Architecture (Kaha, Kya, Kaise)

### 🧱 Layer 1: Database & RLS Security Engine
- **Primary Source of Truth**: `supabase/schema/SUPER_MASTER_SCHEMA.sql`
- **Canonical Tables (Pure `snake_case`)**:
  1. `users` (`id UUID PRIMARY KEY`, `email TEXT`, `role TEXT DEFAULT 'user'`, `created_at`, `updated_at`)
  2. `user_settings` (`user_id UUID PRIMARY KEY REFERENCES users(id)`, `settings JSONB`, `created_at`, `updated_at`)
  3. `booked_history` (`user_id UUID PRIMARY KEY REFERENCES users(id)`, `history JSONB`, `created_at`, `updated_at`)
  4. `customers` (`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID REFERENCES users(id)`, `phone TEXT`, `name TEXT`, `created_at`, `updated_at`, `UNIQUE(user_id, phone)`)
  5. `usage_logs` (`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID REFERENCES users(id)`, `action TEXT`, `details TEXT`, `created_at TIMESTAMPTZ DEFAULT now()`)
- **Row Level Security (RLS) Policy Pattern**:
  ```sql
  ALTER TABLE public.booked_history ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY "tenant_booked_history_isolation"
  ON public.booked_history
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());
  ```
- **Zero Cross-Tenant Leakage**: Tenant A (Store 1) cannot read, insert, update, or delete rows where `user_id` does not match their JWT `auth.uid()`.

---

### 🔑 Layer 2: Tenant Auth & Session Lifecycle (RULE D16 & D17)
- **Direct Supabase GoTrue Auth**:
  - `supabase.auth.signInWithPassword({ email, password })`
  - `supabase.auth.signUp({ email, password })`
  - `supabase.auth.signOut()`
- **Password Operations (100% Pure Supabase API)**:
  - **Logged-in Change**: `supabase.auth.updateUser({ password: newPassword })`
  - **Self-Service Forget Password**: `supabase.auth.resetPasswordForEmail(email, { redirectTo })` triggers recovery link containing `#type=recovery`.
  - **Recovery Interceptor**: Application URL hash watcher detects `#type=recovery` and activates `ResetPasswordModal`.
  - **B2B Admin WhatsApp Fallback**: Merchants without immediate SMTP access can click direct WhatsApp shortcut to Admin (`03027245937` / `923027245937`). Admin resets credentials via `supabase.auth.admin.updateUserById(userId, { password })`.
- **Role Elevation**:
  - Checked on login against `VITE_ADMIN_EMAIL`.
  - Elevated permissions governed inside PostgreSQL via `public.is_admin()` security-definer function.

---

### 🧠 Layer 3: AI Address Extraction & City Resolution Engine
- **Primary Source**: `src/utils/groqParser.ts` & `src/utils/cityList.ts`
- **Model**: Groq LLaMA-3 (`llama-3.3-70b-versatile` / `llama3-70b-8192`).
- **Pakistani Address Intelligence**:
  - Roman Urdu and English natural language extraction: Recipient Name, 11-digit Phone (`03...`), COD Amount, Street Address, and Destination City.
  - Typo-tolerant normalization (e.g. `Lhr` -> `LAHORE`, `Rwp` -> `RAWALPINDI`, `Khi` -> `KARACHI`).
  - Strict matching against the single source of truth: `src/utils/cityList.ts`.
- **Zero-Failure Fallback (Anti-Crash)**:
  - Catches Groq HTTP `429` rate limit and automatically delegates to local regex address parser (`parseAddressRegex`).
  - Zero user-facing downtime or parsing stops.
- **Data Integrity & Anti-Hallucination (RULE AI-INTEG)**:
  - Parcels with missing or ambiguous phone numbers, COD amounts, or unverified cities are flagged in yellow/red on `ParcelTable.tsx` for mandatory merchant confirmation before PostEx dispatch.

---

### 🚚 Layer 4: PostEx V3 Logistics Execution Engine
- **Primary Source**: `src/utils/postexApi.ts`
- **Endpoints & Operations**:
  1. **Order Creation**: `POST /services/integration/api/order/v3/create-order`
     - Dynamic merchant warehouse pickup codes (`pickupAddressCode`: e.g. `001`, `002`).
     - Auto-resolved return city if empty (`postex_return_city`).
     - Non-COD detection (flags with total = 0).
  2. **Airway Bill Generation**: `POST /services/reporting/api/report/integration/airway-bill`
     - Downloads base64 binary PDF for thermal 4x6 / A4 shipping label printing.
  3. **Loadsheet Generation**: `POST /services/integration/api/order/v1/generate-load-sheet`
     - Combines booked tracking numbers under a pickup warehouse address code to generate courier handover proof.
  4. **Shipper Advice**: `POST /services/integration/api/order/v1/add-shipper-advice`
     - Issues Re-attempt, Return to Origin, or Delivery Instruction updates for undelivered parcels.
  5. **Tracking Synchronization**: `GET /services/integration/api/order/v1/track-order`
     - Polled tracking updates for transit state mapping.

---

### ⚡ Layer 5: Caching & Zero-Stale Optimistic Sync (RULE C10)
- **Primary Source**: `src/hooks/useSettings.ts` & `src/utils/cacheWithExpiry.ts`
- **Zero Stale Data Showing (RULE C10)**:
  - On write, local memory and browser `localStorage` update **optimistically at 0ms**.
  - Supabase database write executes concurrently in the background.
  - If network fails, local state rolls back gracefully with user toast notification.
- **TTL Strategy**:
  - PostEx Operational Cities: 7 days TTL.
  - PostEx Live Tracking Status: 10–15 minutes TTL.
  - Offline fallback: Full offline access to past booked parcels and merchant settings.

---

### 📱 Layer 6: Mobile-First UI & Modular Component System (RULE 23 & M10b)
- **Target File Size**: 300–400 lines maximum per component file.
- **Mammoth Monolith Decoupling Plan**:
  - `src/App.tsx` (1,429 lines) ➔ Refactored into:
    1. `src/components/layout/AppHeader.tsx` (Profile, Theme toggle, Store status, PWA install button)
    2. `src/components/layout/NavigationTabs.tsx` (Mobile bottom bar & Desktop tab pills)
    3. `src/components/layout/InstallGuideModal.tsx` (PWA install prompt dialog)
    4. `src/components/layout/GlobalLoadingOverlay.tsx` (Progress dialog)
    5. `src/App.tsx` (< 300 lines — clean router and master state coordinator)
  - `src/components/BookedHistory.tsx` (1,392 lines) ➔ Refactored into:
    1. `src/components/history/HistorySearchFilter.tsx` (Search bar, status pills, date picker)
    2. `src/components/history/HistoryTableDesktop.tsx` (High-density desktop table view)
    3. `src/components/history/HistoryCardMobile.tsx` (44px touch target mobile card layout)
    4. `src/components/history/ShipperAdviceModal.tsx` (Advice submission dialog)
    5. `src/components/history/LoadSheetModal.tsx` (Pickup code selector & PDF trigger)
- **Performance Invariant (RULE M10b)**:
  - **Zero `backdrop-blur-*` across the application.**
  - Overlays use solid opacity (`bg-black/80`, `bg-black/60`, `bg-slate-900/95`) to prevent mobile GPU tile re-renders and scroll stutter.

---

## 4. Step-by-Step Rebuild Execution Roadmap

```
┌────────────────────────────────────────────────────────────────────────┐
│ REBUILD EXECUTION PHASES                                               │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 1: Code Modularity & Mammoth File Split (Rule 23)                │
│   • Step 1.1: Extract AppHeader, NavigationTabs, Modals from App.tsx   │
│   • Step 1.2: Extract ShipperAdviceModal & LoadSheetModal from History │
│   • Step 1.3: Verify Single-file build passes cleanly                  │
│                                                                        │
│ PHASE 2: Auth Provider & Session Hook Consolidation (Rule D16 & D17)   │
│   • Step 2.1: Centralize session & user role in `useAuth.ts`           │
│   • Step 2.2: Unify AuthPage & AuthModal on snake_case `users`         │
│   • Step 2.3: Verify Password Reset & WhatsApp Admin redirect          │
│                                                                        │
│ PHASE 3: End-to-End Logistics & Cloud Sync Verification                │
│   • Step 3.1: Verify Supabase database tables & RLS policies           │
│   • Step 3.2: Verify Groq AI extraction & city normalization           │
│   • Step 3.3: Verify PostEx V3 booking payload & dry-run response      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Verification Checklist & Acceptance Criteria
- [ ] Every database interaction uses lowercase `snake_case` tables and columns.
- [ ] All primary keys and tenant references are UUID v4.
- [ ] Row Level Security blocks all cross-tenant access.
- [ ] Zero Prisma remnants exist in the codebase.
- [ ] Zero `backdrop-blur-*` classes in any `.tsx` or `.css` file.
- [ ] All components adhere to the ~350 line modularity threshold.
- [ ] `npm run build` completes with 0 errors and generates a clean singlefile bundle.
