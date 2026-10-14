# 21 — Supabase API Management & Automation (Zero Dashboard Protocol)

Programmatic execution recipes using curl, Supabase Management API, and REST APIs. Zero Cloudflare dependencies.

---

## 1. Supabase Management API (Direct SQL Execution)
Execute SQL migrations, table modifications, or RLS policies directly via terminal without manual dashboard navigation:
```bash
curl -X POST "https://api.supabase.com/v1/projects/{YOUR_PROJECT_REF}/database/query" \
  -H "Authorization: Bearer $SUPABASE_MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = '\''public'\'';"}'
```

---

## 2. Supabase Auth Admin (Tenant Provisioning)
```bash
curl -X POST "https://{YOUR_PROJECT_REF}.supabase.co/auth/v1/admin/users" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "merchant@zaynahs.pk",
    "password": "SecurePassword123!",
    "email_confirm": true
  }'
```

---

## 3. Verify PostEx Token via Direct Curl
```bash
curl -s "https://api.postex.pk/services/integration/api/order/v1/get-merchant-profile" \
  -H "token: YOUR_POSTEX_TOKEN"
```
