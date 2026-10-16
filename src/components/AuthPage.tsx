import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { RefreshIcon } from './Icons'
import { forceAppUpdate } from '../utils/pwaReload'

interface AuthPageProps {
  onSuccess: () => void
}

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset'

export default function AuthPage({ onSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash || ''
      const s = window.location.search || ''
      if (
        h.includes('recovery') ||
        h.includes('type=recovery') ||
        s.includes('type=recovery') ||
        h.includes('token=') ||
        s.includes('token=') ||
        h.includes('access_token=')
      ) {
        return 'reset'
      }
      if (h.includes('signin') || s.includes('signin')) {
        return 'signin'
      }
      if (h.includes('signup') || s.includes('signup')) {
        return 'signup'
      }
      // First time visitors should default to 'signup' (Create Account)
      const hasLoggedIn = localStorage.getItem('has_logged_in')
      if (!hasLoggedIn) {
        return 'signup'
      }
    }
    return 'signin'
  })

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isResetEmailSent, setIsResetEmailSent] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Direct token and OTP verification states for reset flow
  const [otpCode, setOtpCode] = useState('')
  const [resetToken, setResetToken] = useState('')

  // Sync mode and tokens if URL hash or search params change
  useEffect(() => {
    const checkUrl = () => {
      const h = window.location.hash || ''
      const s = window.location.search || ''
      if (
        h.includes('recovery') ||
        h.includes('type=recovery') ||
        s.includes('type=recovery') ||
        h.includes('token=') ||
        s.includes('token=') ||
        h.includes('access_token=')
      ) {
        setMode('reset')
      }

      const params = new URLSearchParams(
        (h.includes('?') ? h.split('?')[1] : h.replace(/^#/, '')) + '&' + s.replace(/^\?/, '')
      )
      const t = params.get('token')
      const em = params.get('email')
      if (t) setResetToken(t)
      if (em) setEmail(em)
    }

    checkUrl()
    window.addEventListener('hashchange', checkUrl)
    return () => window.removeEventListener('hashchange', checkUrl)
  }, [])

  // Ensure matching row exists in public.users (RULE D13: snake_case)
  const ensureUserProfile = async (user: any) => {
    if (!user?.id) return
    try {
      // Postgres trigger `on_auth_user_created` automatically creates public.users and public.user_settings.
      // Only verify if we have an active authenticated session to avoid RLS 42501 on unconfirmed signups.
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session) return

      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'shoaibzaynah@gmail.com'
      const role = user.email === adminEmail ? 'admin' : 'user'

      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!data) {
        try {
          await supabase
            .from('users')
            .insert([{ id: user.id, email: user.email, role }])
        } catch {
          // Handled by database trigger
        }
      }
    } catch {
      // Handled by database trigger
    }
  }

  // Real Email Password Reset via Custom Gmail SMTP or Supabase Auth API
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setErrorMsg('Please enter your registered email address.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // 1. Send branded email via custom Gmail SMTP endpoint (uses zaynahspos@gmail.com for all tenants)
      let sentViaCustomSmtp = false
      try {
        const res = await fetch('/api/auth/send-reset-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail })
        })
        if (res.ok) {
          sentViaCustomSmtp = true
        }
      } catch {
        // Fallback below
      }

      // 2. If not sent via custom endpoint, trigger Supabase fallback
      if (!sentViaCustomSmtp) {
        const domain = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'https://dispatcher.zaynahspos.com'
          : window.location.origin
        const redirectTo = `${domain}/#recovery=true`
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo,
        })
        if (error) throw error
      }

      setIsResetEmailSent(true)
      setSuccessMsg(`Password reset link sent to ${cleanEmail}! Check your inbox and spam folder.`)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send password reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Setting New Password from Mail Link / Token
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const cleanEmail = email.trim().toLowerCase()
      const cleanCode = otpCode.trim().replace(/\D/g, '')
      const cleanToken = resetToken.trim()

      let updated = false

      // 1. Try custom backend endpoint (updates PostgreSQL auth.users with bcrypt)
      if (cleanToken || (cleanCode && cleanEmail)) {
        try {
          const res = await fetch('/api/auth/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cleanEmail,
              code: cleanCode,
              token: cleanToken,
              new_password: password
            })
          })
          const data = await res.json()
          if (res.ok && data.success) {
            updated = true
          }
        } catch {
          // Fallback below
        }
      }

      // 2. Try Supabase Auth API
      try {
        if (cleanCode && cleanEmail) {
          await supabase.auth.verifyOtp({ email: cleanEmail, token: cleanCode, type: 'recovery' })
        }
        const { error } = await supabase.auth.updateUser({ password })
        if (!error) updated = true
      } catch {
        // Handled if already updated via custom endpoint
      }

      if (!updated) {
        throw new Error('Failed to update password. Please check your verification code or request a fresh link.')
      }

      setSuccessMsg('Your password has been updated successfully! Logging you in...')
      
      // Clean up URL hash
      if (
        window.location.hash.includes('recovery') ||
        window.location.hash.includes('token') ||
        window.location.hash.includes('access_token')
      ) {
        window.location.hash = '#paste'
      }

      // Auto sign-in if email is present
      if (cleanEmail) {
        await supabase.auth.signInWithPassword({ email: cleanEmail, password })
      }

      setTimeout(() => {
        onSuccess()
      }, 1000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Login & Sign Up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.')
        return
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.')
        return
      }
    }

    setLoading(true)

    try {
      if (mode === 'signup') {
        const cleanEmail = email.trim().toLowerCase()

        // 1. First attempt direct Supabase sign up (auto-confirms and returns session immediately)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        })

        if (!signUpError && signUpData?.user) {
          if (signUpData.session) {
            await ensureUserProfile(signUpData.user)
            localStorage.setItem('has_logged_in', 'true')
            setSuccessMsg('Account created successfully! Logging you in...')
            setTimeout(() => {
              onSuccess()
            }, 600)
            return
          }
        }

        // 2. If email is already registered, attempt auto sign-in or advise user
        if (signUpError) {
          const errText = (signUpError.message || '').toLowerCase()
          if (errText.includes('already registered') || errText.includes('already exists') || (signUpData as any)?.user?.identities?.length === 0) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            })
            if (!signInError && signInData?.user) {
              await ensureUserProfile(signInData.user)
              localStorage.setItem('has_logged_in', 'true')
              setSuccessMsg('Welcome back! Logging you in...')
              setTimeout(() => {
                onSuccess()
              }, 600)
              return
            }
            throw new Error('This email is already registered. Please sign in or click "Forgot password?".')
          }

          // 3. If rate-limited (429), use serverless registration fallback
          try {
            const res = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: cleanEmail, password })
            })
            const regJson = await res.json()
            if (!res.ok) {
              throw new Error(regJson.error || 'Registration failed.')
            }
          } catch (e: any) {
            throw new Error(e.message || signUpError.message)
          }
        }

        // 4. Complete login session
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

        if (signInError) throw signInError

        if (signInData?.user) {
          await ensureUserProfile(signInData.user)
          localStorage.setItem('has_logged_in', 'true')
          setSuccessMsg('Account created successfully! Logging you in...')
          setTimeout(() => {
            onSuccess()
          }, 600)
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) throw error

        if (data.user) {
          await ensureUserProfile(data.user)
          localStorage.setItem('has_logged_in', 'true')
          onSuccess()
        }
      }
    } catch (err: any) {
      if (err.message === 'Invalid login credentials') {
        setErrorMsg("Invalid email or password. If you don't have an account, select 'Create Account' above.")
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOpenWhatsAppAdmin = () => {
    const adminPhone = '923027245937'
    const msg = `Assalam o Alaikum Admin! I need help with my Zaynahs Courier Manager account.%0AMy registered email: ${encodeURIComponent(email || 'Not provided')}`
    window.open(`https://wa.me/${adminPhone}?text=${msg}`, '_blank')
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-[#090d16] font-sans relative overflow-hidden select-none">
      
      {/* Background radial gradient accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Auth Card */}
      <div className="w-full max-w-[420px] bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        
        {/* Top-Right Hard Refresh Button for PWA */}
        <button
          type="button"
          onClick={async () => {
            if (isRefreshing) return
            setIsRefreshing(true)
            await forceAppUpdate()
          }}
          disabled={isRefreshing}
          className="absolute top-4 right-4 p-2 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
          title="Refresh app cache & check updates"
          aria-label="Refresh app"
        >
          <RefreshIcon size={14} className={isRefreshing ? 'animate-spin text-emerald-400' : ''} />
        </button>
        
        {/* App Branding & Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center mb-3">
            <img 
              src="/apple-touch-icon.png?v=20261014" 
              onError={(e) => { (e.target as HTMLImageElement).src = '/favicon-96x96.png?v=20261014' }} 
              className="w-full h-full object-contain drop-shadow-md" 
              alt="Zaynahs Courier Logo" 
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Zaynahs Courier
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Multi-Tenant SaaS Logistics Engine
          </p>
        </div>

        {/* Tab Segment Controls (Sign In / Create Account) - Hidden during Forgot Password or Reset Password */}
        {mode !== 'forgot' && mode !== 'reset' && (
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setErrorMsg('')
                setSuccessMsg('')
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setErrorMsg('')
                setSuccessMsg('')
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Forgot Password Header */}
        {mode === 'forgot' && (
          <div className="mb-6 p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Reset Password via Email</h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Enter your registered email address. We will send you a secure link to reset your password.
            </p>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-start gap-2 animate-shake">
            <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-start gap-2">
            <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* 1. Reset Password Form (Opened directly from Mail Link) */}
        {mode === 'reset' ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="mb-4 p-3.5 bg-emerald-950/40 border border-emerald-900/60 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Create New Password</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Set a new secure password for your merchant dashboard.
                </p>
              </div>
            </div>

            {/* Email Field (Auto-filled from link if available) */}
            {!resetToken && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">
                  Your Account Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="merchant@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-600 outline-none"
                />
              </div>
            )}

            {/* 6-Digit OTP Code (Only shown if no 1-click token) */}
            {!resetToken && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">
                  6-Digit Security Code from Email
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm font-mono tracking-widest text-center text-white placeholder-slate-600 outline-none"
                />
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving New Password...
                </span>
              ) : (
                'Save New Password & Sign In'
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setErrorMsg('')
                  setSuccessMsg('')
                }}
                className="text-xs text-slate-400 hover:text-white font-medium transition-colors cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        ) : mode === 'forgot' ? (
          /* 2. Forgot Password Request Form */
          <form onSubmit={handleSendResetEmail} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                Registered Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="merchant@example.com"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.22a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                    <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <span>{isResetEmailSent ? 'Resend Reset Link' : 'Send Password Reset Link'}</span>
              )}
            </button>

            {/* Admin WhatsApp Option */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleOpenWhatsAppAdmin}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.035-2.834-6.867-1.829-1.83-4.269-2.837-6.87-2.839-5.439 0-9.866 4.372-9.87 9.733-.001 1.73.465 3.418 1.348 4.908l-.993 3.629 3.73-.977z" />
                </svg>
                <span>Or contact Admin on WhatsApp (+92 302 724 5937)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setErrorMsg('')
                  setSuccessMsg('')
                }}
                className="text-xs text-slate-400 hover:text-white font-medium transition-colors cursor-pointer mt-1"
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          /* 3. Sign In & Create Account Forms */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="merchant@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5 pl-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot')
                      setErrorMsg('')
                      setSuccessMsg('')
                      setIsResetEmailSent(false)
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all font-mono"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Sign Up Only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all font-mono"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V5.5a5 5 0 0110 0V9h.5A2.5 2.5 0 0118 11.5v6a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 012 17.5v-6A2.5 2.5 0 014.5 9H5zm2-3.5a3 3 0 116 0V9H7V5.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>{mode === 'signup' ? 'Creating Merchant Account...' : 'Authenticating...'}</span>
                </div>
              ) : (
                <span>{mode === 'signup' ? 'Create Merchant Account' : 'Sign In to Dispatcher'}</span>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
