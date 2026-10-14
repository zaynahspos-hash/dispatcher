# 🔑 Admin Auth System, RBAC & Password Lifecycle
Zaynahs Courier Manager · Supabase GoTrue Auth · Multi-Tenant Password Management

---

## 1. Authentication Flow
```
[User Submits Credentials]
            │
            ▼
[Supabase GoTrue Auth: signInWithPassword]
            │
            ▼
 [JWT Session Returned with User UUID]
            │
            ▼
  [Query public.users for Role Field (RULE D13)]
       │                       │
       ▼ (role == 'admin')     ▼ (role == 'user')
 [Admin Access Granted]    [Merchant Access Granted]
 (Admin Tab Rendered)     (Standard Layout)
```

---

## 2. Elevating a User to Admin

### Method A: Direct SQL Execution (Pure snake_case)
```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'admin@yourdomain.com';
```

### Method B: Environment Variable Auto-Sync
On initial signup, `AuthModal.tsx` and `AuthPage.tsx` check:
```typescript
const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com'
const role = user.email === adminEmail ? 'admin' : 'user'
```
If the user's email matches `VITE_ADMIN_EMAIL`, they are automatically registered with `role: 'admin'`.

---

## 3. Password Management & Forget Password Lifecycle (RULE D17)

All password changes and resets operate 100% via Supabase Auth API without any external backend server:

### 3.1 Logged-in Password Change
When a merchant wants to update their existing password:
```typescript
const { data, error } = await supabase.auth.updateUser({
  password: newPassword
})
```
- Authenticated via the active JWT session.
- Updates immediately in `auth.users`.

### 3.2 Self-Service Forget Password via Email
When a user forgets their password and requests a reset:
```typescript
// 1. Dispatch password recovery link to user's registered inbox
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/#type=recovery`
})

// 2. User clicks email link and is redirected back to the app with #type=recovery
// 3. ResetPasswordModal prompts for the new password and calls:
const { error: updateError } = await supabase.auth.updateUser({
  password: newPassword
})
```

### 3.3 B2B Admin Reset Protocol (Direct WhatsApp Fallback)
For B2B SaaS where merchants require expedited assistance or if custom SMTP is not configured:
- `AuthModal.tsx` and `AuthPage.tsx` offer a direct WhatsApp shortcut to the system admin (`03027245937` / `923027245937`).
- The administrator updates the tenant password using the Supabase Admin API:
```typescript
const { data, error } = await supabase.auth.admin.updateUserById(userId, {
  password: temporaryPassword
})
```

---

## 4. Session Expiration & Refresh
- Supabase automatically handles JWT refresh in the background via browser `localStorage` tokens.
- On token expiration, the app gracefully prompts the merchant to re-authenticate without losing current in-memory parsed orders.
