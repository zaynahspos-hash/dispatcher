<!-- BEGIN:courier-manager-agent-rules -->
# 📦 Zaynahs Courier Manager (Multi-Tenant SaaS Logistics Engine)
Vite · React 19 · Tailwind CSS v4 · TypeScript · Supabase (Pure API & RLS) · PostEx V3 · Groq AI
<!-- END:courier-manager-agent-rules -->

# AGENTS.md — Master Index & Autonomous Agent Operating System

> ⚠️ **CRITICAL ARCHITECTURAL DIRECTIVE**: This file is an **INDEX ONLY**. Every concrete rule and specification lives in exactly **ONE atomic file** in `docs/agent-rules/` below. Read the linked atomic file before modifying related code. If a rule appears to conflict, the atomic rule file is the single source of truth.

---

## ⛔ RULE #0 — ABSOLUTE PRIME DIRECTIVES (Always Active, Non-Negotiable)

1. **Fulfill the Request Directly** — Modify, refactor, or create exactly what is asked. Act autonomously and decisively.
2. **Multi-Tenant SaaS & Absolute Zero Data Sharing (RULE D15)** — B2B Multi-Tenant SaaS platform. Tenant A must NEVER see or access Tenant B's PostEx tokens, booked orders, customer directory, or settings. Enforced strictly at the database layer via PostgreSQL Row Level Security (RLS) on `auth.uid() = user_id`.
3. **STRICTLY USE ONLY `snake_case` — NEVER `camelCase` (RULE D13)** — All database tables, columns, foreign keys, and constraints MUST be lowercase `snake_case` (`users`, `user_settings`, `booked_history`, `customers`, `usage_logs`, `user_id`, `created_at`, `updated_at`). Never use `camelCase` or `PascalCase` in PostgreSQL.
4. **UUID Primary Keys Everywhere (RULE D14)** — Every table uses UUID v4 primary keys (`id UUID`, `user_id UUID`). Auto-increment integers are strictly banned.
5. **ZERO Prisma — 100% Direct Supabase API & Client (RULE D7)** — Prisma is permanently wiped. All database interaction occurs strictly via `@supabase/supabase-js` or Supabase REST/Management APIs. No direct Postgres TCP connections, no `psql`, no Prisma migrations.
6. **ZERO Cloudflare Dependency** — Cloudflare is NOT required. This is a private authenticated SaaS dashboard with real-time dynamic PostEx and Groq API calls. No edge caching, no cache purge webhooks. Standard static/Vercel/Netlify hosting.
7. **Mobile-First ALWAYS (RULE M1)** — Every screen, table, modal, drawer, filter, and action bar is engineered for handheld mobile devices first (375px+). Desktop is an expansive enhancement.
8. **Data Integrity & No Hallucinations (RULE AI-INTEG)** — Customer phone numbers, addresses, COD amounts, and courier tracking numbers must NEVER be guessed or fabricated. If Groq AI extraction has missing fields or low confidence, surface them explicitly to the user for manual confirmation.
9. **TypeScript Strict Mode** — Every file must be `.ts` or `.tsx`. Zero `any` types allowed in production paths. Clean, explicit interfaces for all API payloads and state objects.
10. **No Fake / Anti-AI Slop (RULE ANTI-AI)** — Zero generic mockup placeholders, zero fake lorem ipsum, zero artificial duplicate components. Write real, resilient, battle-tested production logic.
11. **Single Source of Truth (SSOT1)** — Exactly ONE shared module per responsibility:
   - Courier API → `src/utils/postexApi.ts`
   - AI Address Extraction → `src/utils/groqParser.ts`
   - Supabase Client & Logs → `src/utils/supabaseClient.ts`
   - City Resolution & Mapping → `src/utils/cityList.ts`
   - User Settings & Sync → `src/hooks/useSettings.ts`
   - Dropdown Search → `src/components/SearchableDropdown.tsx`
12. **0ms Instant Navigation & Micro-Interactions** — Tab switching, filter changes, and search operations must respond instantaneously without UI lag, blank screens, or layout jitter.
13. **Zero Backdrop-Blur Thrashing (RULE M10b)** — App-wide ban on `backdrop-blur-*` on scrolling layers and sticky action bars to prevent mobile GPU repaints and stutter. Use high-contrast solid/opacity layers instead (`bg-white/95`, `bg-[#0f172a]/95`, `bg-black/60`).
14. **Agent Executes Autonomously** — Run terminal builds, type checks, and verifications autonomously. Never ask the user to run routine commands unless external physical authentication or interactive credentials are required.

---

## 📖 Atomic Rule Files Directory (`docs/agent-rules/`)

| # | File | Scope & Topic Covered |
|---|------|------------------------|
| **00** | [00-prime-directives.md](docs/agent-rules/00-prime-directives.md) | Prime directives unpacked, foundational invariants, zero-tolerance rules |
| **01** | [01-core-operating-principles.md](docs/agent-rules/01-core-operating-principles.md) | Root-cause first, impact checking, scope discipline, structured logging |
| **02** | [02-error-detection-autofix.md](docs/agent-rules/02-error-detection-autofix.md) | Vite/TypeScript build error diagnosis, runtime error interceptors, auto-recovery |
| **03** | [03-frontend-vite-react-tailwind.md](docs/agent-rules/03-frontend-vite-react-tailwind.md) | React 19 rules, Vite SPA bundling, Tailwind CSS v4 setup, state lifecycle |
| **04** | [04-backend-api-routes.md](docs/agent-rules/04-backend-api-routes.md) | PostEx V3 endpoints, Shipper Advice, Loadsheets, Groq LLM API, Supabase REST |
| **05** | [05-database-supabase.md](docs/agent-rules/05-database-supabase.md) | Zero Prisma, snake_case only, UUID PKs, strict Multi-Tenant SaaS RLS, SUPER_MASTER_SCHEMA |
| **06** | [06-git-github.md](docs/agent-rules/06-git-github.md) | Git commit standards, secret hygiene, branch flow, release tagging |
| **07** | [07-deployment-hosting.md](docs/agent-rules/07-deployment-hosting.md) | Vite SPA builds, `vite-plugin-singlefile`, Vercel/Netlify hosting, zero Cloudflare |
| **08** | [08-caching-localstorage-sync.md](docs/agent-rules/08-caching-localstorage-sync.md) | Offline LocalStorage fallback, `cacheWithExpiry`, real-time Supabase cloud sync |
| **09** | [09-courier-booking-lifecycle.md](docs/agent-rules/09-courier-booking-lifecycle.md) | Order ingestion → Parsing → Validation → PostEx V3 Booking → Tracking → Advice → Loadsheet |
| **10** | [10-ai-address-parser.md](docs/agent-rules/10-ai-address-parser.md) | Groq LLaMA-3 prompt engineering, Pakistani address phonetic matching, city normalization |
| **11** | [11-storage-files-export.md](docs/agent-rules/11-storage-files-export.md) | Excel (.xlsx) bulk import/export, PostEx PDF loadsheet generation, thermal airway bills |
| **12** | [12-testing-verification.md](docs/agent-rules/12-testing-verification.md) | Verification checklist: TypeScript, PostEx API dry-run, Groq edge cases, RLS isolation |
| **13** | [13-autonomy-boundaries.md](docs/agent-rules/13-autonomy-boundaries.md) | Autonomous operations allowed vs explicit confirmation required |
| **14** | [14-design-system.md](docs/agent-rules/14-design-system.md) | Tailwind v4 tokens, Shopify/modern courier aesthetics, dark/light mode, card anatomy |
| **15** | [15-shared-components-ui-modules.md](docs/agent-rules/15-shared-components-ui-modules.md) | Shared UI components: SearchableDropdown, Modal/Drawer, StatusBadge, Toast, StatsCard |
| **16** | [16-multi-system-architecture.md](docs/agent-rules/16-multi-system-architecture.md) | Multi-tenant SaaS isolation, zero cross-tenant data sharing, admin vs user RBAC |
| **17** | [17-mobile-native-app-style.md](docs/agent-rules/17-mobile-native-app-style.md) | Native app feel: 44px touch targets, bottom sheets, scroll snap prevention, sticky action bars |
| **18** | [18-multi-domain-rules.md](docs/agent-rules/18-multi-domain-rules.md) | Warehouse pickup codes, return codes, dynamic origins, multi-store mapping |
| **19** | [19-navigation-state-restoration.md](docs/agent-rules/19-navigation-state-restoration.md) | Tab state preservation, scroll position restoration, session continuity |
| **20** | [20-error-diagnostics-matrix.md](docs/agent-rules/20-error-diagnostics-matrix.md) | Instant troubleshooting: PostEx errors (400/401/500), Groq rate limits, Supabase RLS 404/403 |
| **21** | [21-supabase-api-management.md](docs/agent-rules/21-supabase-api-management.md) | Zero Dashboard protocol: Management API curl recipes, SQL query endpoints, zero Cloudflare |
| **22** | [22-credentials-management.md](docs/agent-rules/22-credentials-management.md) | API token security: PostEx merchant token, Groq key, Supabase anon/service credentials |
| **23** | [23-code-architecture-modularity.md](docs/agent-rules/23-code-architecture-modularity.md) | 300–400 line file limit, separation of concerns, custom hooks, DRY standards |
| **24** | [24-vercel-build-security.md](docs/agent-rules/24-vercel-build-security.md) | Build safety, safe client initialization, zero unhandled rejections |
| **25** | [25-ai-seo-copywriting-engine.md](docs/agent-rules/25-ai-seo-copywriting-engine.md) | AI address intelligence, customer profiling, WhatsApp notification copy |
| **26** | [26-project-reference-table.md](docs/agent-rules/26-project-reference-table.md) | Master reference: PostEx endpoints, Groq models, Supabase snake_case tables, and headers |
| **27** | [27-single-source-of-truth.md](docs/agent-rules/27-single-source-of-truth.md) | SSOT enforcement across city lists, order status definitions, and configuration settings |
| **28** | [28-traffic-analytics.md](docs/agent-rules/28-traffic-analytics.md) | Usage logs audit trail, retention auto-cleanup, parcel metrics |
| **29** | [29-product-search-pagination.md](docs/agent-rules/29-product-search-pagination.md) | Instant parcel search, status pills filtering, large dataset pagination |
| **30** | [30-sorting-reordering.md](docs/agent-rules/30-sorting-reordering.md) | Multi-column sorting, status grouping, bulk checkbox actions |
| **31** | [31-modal-overlay-system.md](docs/agent-rules/31-modal-overlay-system.md) | Responsive bottom sheet drawer & dialog system, focus lock, zero blur |
| **32** | [32-anti-ai-quality-engineering.md](docs/agent-rules/32-anti-ai-quality-engineering.md) | Anti-AI slop protocols: real data validation, zero placeholder code, deep defensive patterns |

---

## 🔗 Master Technical & Operational Guides (`docs/`)

- [docs/POSTEX_INTEGRATION_GUIDE.md](docs/POSTEX_INTEGRATION_GUIDE.md) — Comprehensive PostEx V3 API manual, order booking endpoints, return city resolution, tracking sync, shipper advice, and load sheet PDF generation.
- [docs/GROQ_AI_SYSTEM_GUIDE.md](docs/GROQ_AI_SYSTEM_GUIDE.md) — Groq LLM configuration, prompt engineering, few-shot Pakistani address parsing, Roman Urdu handling, and fallback regex parser.
- [docs/SUPABASE_API_GUIDE.md](docs/SUPABASE_API_GUIDE.md) — Pure Supabase API & JS client reference, Management API curl recipes, zero Prisma architecture, snake_case schema, and zero Cloudflare.
- [docs/RLS_SECURITY_GUIDE.md](docs/RLS_SECURITY_GUIDE.md) — Multi-Tenant SaaS Row Level Security (RLS) deep-dive, strict tenant isolation, zero cross-tenant leakage, and security audit commands.
- [docs/ADMIN_SYSTEM_GUIDE.md](docs/ADMIN_SYSTEM_GUIDE.md) — Admin Panel operations, global usage logs audit, multi-tenant tenant inspection, and customer CRM.
- [docs/ADMIN_AUTH_SYSTEM.md](docs/ADMIN_AUTH_SYSTEM.md) — Multi-Tenant authentication flow, session management, and role elevation.
- [docs/ADMIN_CREATION_GUIDE.md](docs/ADMIN_CREATION_GUIDE.md) — Step-by-step onboarding for bootstrapping the first admin account.
- [docs/EXCEL_IMPORT_EXPORT_GUIDE.md](docs/EXCEL_IMPORT_EXPORT_GUIDE.md) — XLSX bulk import parser, smart column mapping, bulk PostEx booking, and export formats.
- [docs/ARCHITECTURE_AND_DATA_FLOW.md](docs/ARCHITECTURE_AND_DATA_FLOW.md) — Complete end-to-end data lifecycle: Raw text → Groq extraction → Table verification → PostEx dispatch → Cloud sync.
- [docs/UI_RULES.md](docs/UI_RULES.md) — Complete UI/UX rules, color palette, responsive typography scale, component design tokens, micro-interactions, and accessibility standards.
- [docs/UI_PERFORMANCE_GUIDE.md](docs/UI_PERFORMANCE_GUIDE.md) — Performance rules, zero backdrop-blur GPU protection, scroll rubber-band bounce prevention, and 0ms navigation.
- [docs/LESSONS_LEARNED.md](docs/LESSONS_LEARNED.md) — Historical debugging log, PostEx V2 vs V3 differences, RLS 404 gotchas, Vite + React 19 single-file bundling notes.
- [docs/NEW_PROJECT_SETUP_GUIDE.md](docs/NEW_PROJECT_SETUP_GUIDE.md) — Step-by-step onboarding guide, local environment configuration, Supabase SQL bootstrapping, and PostEx account linking.
- [docs/SCHEMA_CHANGE_LOG.md](docs/SCHEMA_CHANGE_LOG.md) — Timestamped record of every database modification, constraint update, and index creation.
- [docs/STORE_TESTING_GUIDE.md](docs/STORE_TESTING_GUIDE.md) — Test suites, dry-run booking verification, PostEx sandbox/live tracking checks, and curl command templates.
- [docs/CARD_STYLES_BASES.md](docs/CARD_STYLES_BASES.md) — Logistics parcel card and dashboard card anatomy standards.
- [docs/PWA_INSTALL_GUIDE.md](docs/PWA_INSTALL_GUIDE.md) — Progressive Web App installation for warehouse handheld scanners and mobile operations.
- [docs/ERROR_SYSTEM_GUIDE.md](docs/ERROR_SYSTEM_GUIDE.md) — Error interceptors, user toast notifications, and retry strategies.
- [docs/MANUAL_SETUP_GUIDE.md](docs/MANUAL_SETUP_GUIDE.md) — Zero-CLI manual setup guide using pure Supabase SQL and Vite.
- [docs/ULTRA_DEEP_REBUILD_SYSTEM.md](docs/ULTRA_DEEP_REBUILD_SYSTEM.md) — Master manual for the 6-layer ultra deep rebuild: architecture, RLS security, PostEx V3, modularity, and phase-by-phase execution.
- [supabase/schema/SUPER_MASTER_SCHEMA.sql](supabase/schema/SUPER_MASTER_SCHEMA.sql) — The authoritative SQL master schema for Supabase: pure snake_case tables, indexes, triggers, and strict multi-tenant RLS policies.

---

## 🧭 How Any Agent Must Use This File

1. **Before touching code**: Read this master index and identify the matching atomic rule file in `docs/agent-rules/`.
2. **Never skip 00, 01, 02, or 22**: Prime directives, operating principles, error detection, and anti-AI quality standards are ALWAYS active.
3. **If touching database**: Read [05-database-supabase.md](docs/agent-rules/05-database-supabase.md) + [docs/RLS_SECURITY_GUIDE.md](docs/RLS_SECURITY_GUIDE.md). **NEVER introduce Prisma. USE ONLY `snake_case`. Enforce Multi-Tenant isolation.**
4. **If touching PostEx integration**: Read [04-backend-api-routes.md](docs/agent-rules/04-backend-api-routes.md) + [09-courier-booking-lifecycle.md](docs/agent-rules/09-courier-booking-lifecycle.md) + [docs/POSTEX_INTEGRATION_GUIDE.md](docs/POSTEX_INTEGRATION_GUIDE.md).
5. **If touching UI/UX**: Read [03-frontend-vite-react-tailwind.md](docs/agent-rules/03-frontend-vite-react-tailwind.md) + [14-design-system.md](docs/agent-rules/14-design-system.md) + [17-mobile-native-app-style.md](docs/agent-rules/17-mobile-native-app-style.md) + [docs/UI_RULES.md](docs/UI_RULES.md).
6. **After every change**: Run `npm run build` to ensure `tsc` and Vite pass cleanly with 0 errors.

---

## ➕ RULE IDX1 — How to Add a NEW Rule (MANDATORY)

Whenever the user says *"add this rule"* / *"iska rule add karo"* or specifies a permanent project policy:
1. **Never add rule bodies directly into `AGENTS.md`**. This file is strictly a master index.
2. **Locate the matching atomic file** in `docs/agent-rules/` and add the rule in the appropriate section.
3. **If no existing file matches**, create a new atomic file: `docs/agent-rules/NN-topic-name.md` (using the next sequential number), define the rule cleanly, and register the new row in the index table above.
4. **Confirm the exact file location** to the user.
