# 24 — Build Safety & Client Initialization Security

Rules to ensure zero runtime client crashes and bulletproof build passes.

---

## 1. Safe Client Initialization (RULE V1)
- Never use non-null assertions (`!`) on environment variables during initialization:
  ```typescript
  // ❌ Crash during static build if env var is missing
  export const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!)

  // ✅ Safe initialization with fallback
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  export const supabase = createClient(
    supabaseUrl || 'https://placeholder-project.supabase.co',
    supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
  )
  ```

---

## 2. Zero Unhandled Promise Rejections
- Every async network request to PostEx, Groq, or Supabase must have a try/catch block or error handler.
- Network timeouts must display helpful merchant feedback rather than silent white screens.
