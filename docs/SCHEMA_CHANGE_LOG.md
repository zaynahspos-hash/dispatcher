# 📝 Schema Change Log — Database Migration Record

All database schema updates, table definitions, and index modifications are recorded here chronologically.

---

## [2026-10-14] — Multi-Tenant SaaS, snake_case Standardization & Prisma Wipe
- **Prisma Permanently Wiped**: Removed `@prisma/client` and `prisma` dependencies.
- **snake_case Enforced (RULE D13)**:
  - Tables migrated: `users`, `user_settings`, `booked_history`, `customers`, `usage_logs`.
  - Columns standardized: `user_id`, `created_at`, `updated_at`.
- **UUID Primary Keys Enforced (RULE D14)**:
  - All tenant records and primary keys use UUID v4.
- **Strict Multi-Tenant SaaS RLS (RULE D15)**:
  - Enabled RLS across all tables.
  - Zero cross-tenant data leakage via `auth.uid() = user_id`.
- **Backward Compatibility Views**:
  - Created SQL views (`"User"`, `"UserSettings"`, `"BookedHistory"`, `"Customer"`, `"UsageLog"`) pointing to canonical `snake_case` tables.

---

## [2026-09-15] — Initial Schema Creation
- Bootstrapped initial User, UserSettings, BookedHistory, Customer, and UsageLog tables.
