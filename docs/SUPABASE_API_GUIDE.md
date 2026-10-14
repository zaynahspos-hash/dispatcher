# ⚡ Supabase API & Zero Prisma Guide — Complete API Control

> **Zero Prisma. Zero direct DB connections. Zero Dashboard clicks.**
> All database control and schema migrations operate via Supabase Management API (`sbp_` tokens) and the `@supabase/supabase-js` client with strict Row Level Security (RLS).

---

## 📌 Architecture Overview

| Layer | Token Type | Base URL | Primary Role |
|---|---|---|---|
| **Management API** | Personal Access Token (`sbp_...`) | `https://api.supabase.com/v1` | SQL migrations, project provisioning, network configuration |
| **Service API** | Service Role Secret (`eyJhbGci...`) | `https://{ref}.supabase.co` | Admin RPC execution, bulk operations, user provisioning |
| **GoTrue Auth API** | Anon / Service Role | `https://{ref}.supabase.co/auth/v1` | Signup, login, password recovery, session tokens |
| **PostgREST Client** | Anon Key + User JWT | `https://{ref}.supabase.co/rest/v1` | Client-side reactive queries scoped by RLS |

---

## 1. Zero Prisma Mandate: Why Prisma is Banned
1. **No Node Runtime in Static SPAs**: This application is a high-speed Vite client. Prisma requires a Node.js binary engine, making single-file bundling or edge CDN deployments (`dist/index.html`) impossible.
2. **Direct RLS Integration**: `@supabase/supabase-js` passes the logged-in user's JWT directly in the `Authorization` header on every request. PostgreSQL RLS policies evaluate `auth.uid()` instantly at the database layer. Prisma bypasses RLS unless complex connection wrapping is performed.
3. **Instant Cold Start**: Zero binary initialization latency.

---

## 2. Programmatic SQL Execution via Management API

To apply schema updates, create tables, or update RLS policies without touching the Supabase dashboard:

```bash
curl -X POST "https://api.supabase.com/v1/projects/{YOUR_PROJECT_REF}/database/query" \
  -H "Authorization: Bearer $SUPABASE_MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = '\''public'\'';"
  }'
```

Applying the entire master schema:
```bash
curl -X POST "https://api.supabase.com/v1/projects/{YOUR_PROJECT_REF}/database/query" \
  -H "Authorization: Bearer $SUPABASE_MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
  {
    "query": "ALTER TABLE public.\"BookedHistory\" ENABLE ROW LEVEL SECURITY;"
  }
EOF
```

---

## 3. Client-Side Safe Access Patterns

### A. Fetching User Profile Without Crashing on Missing Rows
```typescript
// ❌ WRONG — throws PGRST116 error if row doesn't exist
const { data } = await supabase.from('User').select('*').eq('id', userId).single()

// ✅ CORRECT — returns data: null without throwing an HTTP 406 error
const { data, error } = await supabase.from('User').select('*').eq('id', userId).maybeSingle()
```

### B. Upserting Merchant Settings
```typescript
const { data, error } = await supabase
  .from('UserSettings')
  .upsert(
    {
      userid: user.id,
      settings: updatedSettings,
    },
    { onConflict: 'userid' }
  )
```

### C. Logging Usage Safely
```typescript
await supabase.from('UsageLog').insert([
  {
    userId: user.id,
    action: 'order_booked',
    details: JSON.stringify({ count: bookedParcels.length, provider: 'PostEx V3' }),
  },
])
```
