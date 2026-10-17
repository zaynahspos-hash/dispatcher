# 00 — Prime Directives (Rule #0, Unpacked)

These directives are permanently active on every task, prompt, refactor, and bug fix. No exceptions.

---

## 1. Fulfill the Request Directly
- Modify, build, or refactor exactly what the user asks for without hesitation or unwarranted pushback.
- Provide production-ready, fully working solutions rather than incomplete snippets or placeholders.

## 2. Multi-Tenant SaaS Architecture & Absolute Zero Data Sharing (RULE D15)
- **This application is a B2B Multi-Tenant SaaS Engine.**
- **Zero Cross-Tenant Leakage**: Tenant A (Store 1) must NEVER see Tenant B's (Store 2) PostEx tokens, booked orders, customer database, or settings.
- Enforced strictly at the database layer via PostgreSQL Row Level Security (RLS) scoped by `auth.uid() = user_id`.

## 3. STRICTLY USE ONLY `snake_case` — NEVER `camelCase` (RULE D13)
- All PostgreSQL database tables, columns, constraints, foreign keys, and indexes MUST be lowercase `snake_case`.
- ❌ BANNED: `camelCase`, `PascalCase`, `"User"`, `"UserSettings"`, `"BookedHistory"`, `"createdAt"`, `"updatedAt"`, `"userId"`.
- ✅ MANDATORY: `users`, `user_settings`, `booked_history`, `customers`, `usage_logs`, `id`, `user_id`, `created_at`, `updated_at`.

## 4. UUID Primary Keys Everywhere (RULE D14)
- Every table MUST use a UUID v4 primary key (`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`).
- Tenant foreign keys must be `user_id UUID REFERENCES users(id) ON DELETE CASCADE`.
- Integer auto-increment IDs (`serial`, `bigserial`) are strictly BANNED.

## 5. ZERO Prisma — 100% Direct Supabase API & Client (RULE D7)
- **Prisma is permanently wiped.**
- All database CRUD occurs via `@supabase/supabase-js`, direct Supabase REST endpoints, or the Supabase Management API.
- Zero direct Postgres TCP connections, no `psql`, no Prisma migrations.

## 6. ZERO Cloudflare Dependency
- **Cloudflare is NOT required.**
- This is a private, authenticated logistics SaaS dashboard with dynamic, real-time PostEx and Groq API calls.
- No public edge caching, no cache purge webhooks, and no Cloudflare Workers needed. Standard hosting (Vercel, Netlify, or static server) is used.

## 7. Mobile-First Engineering ALWAYS (RULE M1)
- Every screen, dashboard tab, parcel table, order card, search input, filter drawer, and sticky action bar MUST be designed mobile-first (starting at 375px viewport width).
- Desktop layouts are progressive multi-column enhancements.
- Touch targets must measure at least **44x44px** for effortless handheld thumb control.

## 8. Data Integrity & Anti-Hallucination (RULE AI-INTEG)
- Courier parcels involve real financial transactions (Cash on Delivery), recipient names, phone numbers, and physical delivery addresses.
- Never guess, invent, or approximate order data. If Groq AI extraction fails to parse a phone number or city name with high certainty, flag it clearly for manual merchant review.
- Never manipulate COD amounts or order reference numbers.

## 9. Strict TypeScript (Zero `any`)
- All application files must use `.ts` or `.tsx`.
- Strict typing across all PostEx API response payloads, Groq parsed structures, Supabase database rows, and React component props.
- No loose `any` casts in production logic.

## 10. Zero Backdrop-Blur Thrashing (RULE M10b)
- `backdrop-blur-*` is banned across the entire application on all sticky bars, headers, and scrolling card lists to prevent mobile GPU repaints. Use solid or crisp opacity backgrounds (`bg-white/95`, `bg-slate-900/95`, `bg-black/60`).

## 11. Anti-AI Slop Quality Standard (RULE ANTI-AI)
- Zero generic mockup placeholders, zero fake lorem ipsum, zero artificial duplicate components.
- Write real, resilient, battle-tested production logic.

## 12. Zero Auto-Push & Ask First (RULE G4)
- **NEVER run `git push` or deploy automatically under any condition.**
- Inspect and resolve all pending tasks and user questions first.
- Only push or deploy when the user explicitly gives approval in their prompt.

## 13. Apple Modern UI/UX Standard & Zero Over-Colored Slop (RULE APPLE-UI / DS6)
- The entire SaaS application must reflect modern Apple minimalist aesthetics: clean typography, calibrated spacing, disciplined contrast, and subtle borders.
- Over-colored neon rainbow gradients, gaudy AI slop styling, and saturated clown palettes are permanently forbidden.
- Layouts must be robust and non-breakable across all screen widths from mobile (375px+) to ultra-wide desktop.
- Complete operational content (addresses, product details, notes) must remain fully viewable with dynamic auto-expansion (`autoExpandLines`).

