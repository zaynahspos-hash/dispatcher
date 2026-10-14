# ⚠️ Error System & Fault Handling Guide
Zaynahs Courier Manager · Resilience, Interceptors & Error Diagnostics

---

## 1. Overview
The application incorporates a defensive error management system to ensure zero crashes, transparent user guidance, and immediate root-cause diagnosis across third-party courier APIs, AI parsing engines, and Supabase cloud sync.

---

## 2. PostEx API Error Diagnostics & Mapping

| Status Code | Meaning | Common Cause | Application Recovery Action |
|-------------|---------|--------------|-----------------------------|
| **400** | Bad Request | Missing `pickupAddressCode`, invalid phone (not 11 digits), or unsupported destination city | Highlights invalid fields in red, suggests city normalization via `cityList.ts`. |
| **401** | Unauthorized | Invalid, expired, or missing PostEx merchant API token | Triggers toast: `"Invalid PostEx Token. Please verify in Settings."` and directs user to Settings. |
| **403** | Forbidden | Merchant account suspended or restricted by PostEx operations | Informs user to contact PostEx account manager. |
| **404** | Not Found | Tracking number not registered in PostEx tracking system | Alerts user: `"Tracking number not found. If recently booked, please allow 10-15 minutes for courier sync."` |
| **500 / 502 / 503** | PostEx Server Error | PostEx API gateway downtime or maintenance window | Automatically suggests retrying in 30 seconds without wiping user input. |

---

## 3. Groq AI Parser Fallback System

1. **Groq API Rate Limiting (429)**:
   - When the Groq LLM API quota is exceeded or under load, the error interceptor catches `429` status immediately.
   - Automatically falls back to the local regex address parser (`parseAddressRegex`) without displaying a fatal crash to the user.
2. **Malformed JSON LLM Response**:
   - Groq output is sanitized by stripping Markdown backticks (` ```json `) and extracted via `JSON.parse` wrapped in a `try...catch` block.
   - If JSON decoding fails, regex fallback extraction is invoked automatically.

---

## 4. Supabase & Database Error Handling

1. **`PGRST116` (Zero Rows Returned)**:
   - Supabase throws `PGRST116` when `.single()` matches 0 rows.
   - Standard convention: Use `.maybeSingle()` instead of `.single()` to receive `null` without throwing an exception.
2. **`42501` (Permission Denied / RLS Violation)**:
   - Thrown when an authenticated user attempts to access or mutate a row belonging to another `user_id`.
   - Action: Logs security warning and displays `"Access denied: insufficient permissions"`.
3. **Optimistic UI Rollback**:
   - If a cloud write fails, local state rolls back to the previous snapshot, and an error notification is shown.

---

## 5. User Notification & Toast Standards
- **Success Toasts**: Emerald background, auto-dismiss in 2.5–3 seconds.
- **Warning Toasts**: Amber background, explicit guidance on missing data.
- **Error Toasts**: Crimson background, actionable instructions (e.g. "Check PostEx token" rather than raw stack traces).
