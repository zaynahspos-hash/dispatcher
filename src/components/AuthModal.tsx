import React, { useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { ChevronLeftIcon, WhatsAppIcon } from './Icons'

interface AuthModalProps {
  onClose: () => void
  onSuccess: () => void
}

type AuthMode = 'signin' | 'signup' | 'forgot'

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isResetEmailSent, setIsResetEmailSent] = useState(false)
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false)
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('')
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false)
  const [confirmationOtp, setConfirmationOtp] = useState('')
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  // Rule AUTH-DOMAIN1: Strictly use official production domain for email links
  const PRODUCTION_APP_URL = 'https://dispatcher.zaynahspos.com'

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

  // Real Email Password Reset via Supabase Auth API
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
        const redirectTo = `${PRODUCTION_APP_URL}/#recovery=true`
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo,
        })
        if (error) throw error
      }

      setIsResetEmailSent(true)
      setSuccessMsg(`Password reset link sent to ${cleanEmail}! Please check your email.`)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send password reset email. Please try again.')
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

        // 1. Direct Supabase Auth Signup (Auto-confirmed via database trigger & Supabase auth config)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${PRODUCTION_APP_URL}/#type=signup`
          }
        })

        if (!signUpError && signUpData?.user) {
          if (signUpData.session) {
            await ensureUserProfile(signUpData.user)
            localStorage.setItem('has_logged_in', 'true')
            setSuccessMsg('Account created successfully! Logging you in...')
            setTimeout(() => {
              onSuccess()
              onClose()
            }, 500)
            return
          }

          // If session not immediately attached by Supabase, sign in directly (email is auto-confirmed in DB)
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          })

          if (!signInError && signInData?.user) {
            await ensureUserProfile(signInData.user)
            localStorage.setItem('has_logged_in', 'true')
            setSuccessMsg('Account created successfully! Logging you in...')
            setTimeout(() => {
              onSuccess()
              onClose()
            }, 500)
            return
          }
        }

        // 2. If user already exists, sign in directly or prompt user
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
                onClose()
              }, 500)
              return
            }
            throw new Error('This email is already registered. Please sign in or click "Forgot password?".')
          }
        }

        // 3. Fallback: Direct PostgreSQL Registration endpoint (/api/auth/register)
        try {
          const regRes = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password })
          })
          const regData = await regRes.json()
          if (regRes.ok && regData.success) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            })
            if (!signInError && signInData?.user) {
              await ensureUserProfile(signInData.user)
              localStorage.setItem('has_logged_in', 'true')
              setSuccessMsg('Account created successfully! Logging you in...')
              setTimeout(() => {
                onSuccess()
                onClose()
              }, 500)
              return
            }
          }
        } catch (apiErr: any) {
          console.warn('[handleSignUp Modal] Direct register fallback error:', apiErr.message)
        }

        if (signUpError) {
          throw new Error(signUpError.message || 'Registration failed.')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          if ((error.message || '').toLowerCase().includes('email not confirmed')) {
            setIsAwaitingConfirmation(true)
            setUnconfirmedEmail(email.trim().toLowerCase())
            setErrorMsg('Your email has not been confirmed yet. Please verify via the code or link sent to your inbox.')
            return
          }
          throw error
        }

        if (data.user) {
          await ensureUserProfile(data.user)
          localStorage.setItem('has_logged_in', 'true')
          setSuccessMsg('Welcome back! Logging in...')
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 600)
        }
      }
    } catch (err: any) {
      if (err.message === 'Invalid login credentials') {
        setErrorMsg("Invalid email or password. If you don't have an account, select 'Create Account' above.")
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please verify credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    const targetEmail = (unconfirmedEmail || email).trim().toLowerCase()
    if (!targetEmail) return
    setIsResendingConfirmation(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/auth/send-confirmation-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccessMsg(`Fresh verification code sent to ${targetEmail} from zaynahspos@gmail.com!`)
      } else {
        throw new Error(data.error || 'Failed to resend confirmation email.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend confirmation email.')
    } finally {
      setIsResendingConfirmation(false)
    }
  }

  // Handle 6-Digit OTP verification in modal
  const handleVerifyOtpConfirmation = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = confirmationOtp.trim().replace(/\D/g, '')
    const cleanEmail = (unconfirmedEmail || email).trim().toLowerCase()
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code.')
      return
    }
    setIsVerifyingOtp(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/auth/verify-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: cleanCode })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid or expired verification code.')
      }

      setSuccessMsg('Email verified successfully! Logging you in...')

      if (password) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })
        if (!signInError && signInData?.user) {
          await ensureUserProfile(signInData.user)
          localStorage.setItem('has_logged_in', 'true')
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 600)
          return
        }
      }

      setIsAwaitingConfirmation(false)
      setMode('signin')
      setSuccessMsg('Account activated successfully! Please sign in with your password.')
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check the code and try again.')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleOpenWhatsAppAdmin = () => {
    const adminPhone = '923027245937'
    const msg = `Assalam o Alaikum Admin! I need help with my Zaynahs Courier Manager account.%0AMy registered email: ${encodeURIComponent(email || 'Not provided')}`
    window.open(`https://wa.me/${adminPhone}?text=${msg}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in dark [color-scheme:dark]">
      <div className="relative w-full max-w-[400px] bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden [color-scheme:dark]">
        
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Branding & Logo */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 flex items-center justify-center mb-2">
            <img 
              src="/favicon-96x96.png?v=20261014" 
              onError={(e) => { (e.target as HTMLImageElement).src = '/apple-touch-icon.png?v=20261014' }} 
              className="w-full h-full object-contain drop-shadow-md" 
              alt="Logo" 
            />
          </div>
          <h2 className="text-lg font-black text-white tracking-tight">
            Merchant Authentication
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">
            Zaynahs Courier Manager Dashboard
          </p>
        </div>

        {/* Tab Segment Controls (Sign In / Create Account) */}
        {mode !== 'forgot' && !isAwaitingConfirmation && (
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-5">
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
          <div className="mb-5 p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-2xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Reset Password via Email</h3>
            <p className="text-[11px] text-slate-400">
              Enter your email to receive a password recovery link.
            </p>
          </div>
        )}

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-start gap-2">
            <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{errorMsg}</span>
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

        {/* Forms */}
        {isAwaitingConfirmation ? (
          <div className="space-y-4 text-center py-2 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Verify Your Email</h3>
            <p className="text-xs text-slate-400 leading-relaxed px-1">
              Verification code and link sent from <span className="text-emerald-400 font-semibold">zaynahspos@gmail.com</span> to <span className="text-emerald-400 font-mono font-semibold">{unconfirmedEmail}</span>.
            </p>

            {/* 6-Digit OTP Code Verification Form */}
            <form onSubmit={handleVerifyOtpConfirmation} className="my-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-left">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1 text-center">
                Enter 6-Digit Code from Email
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={confirmationOtp}
                  onChange={(e) => setConfirmationOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg text-sm font-mono tracking-[4px] text-center text-white placeholder-slate-600 outline-none"
                />
                <button
                  type="submit"
                  disabled={isVerifyingOtp || confirmationOtp.length !== 6}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center shadow-md shadow-emerald-600/20"
                >
                  {isVerifyingOtp ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>

            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={isResendingConfirmation}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-emerald-400 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
              >
                {isResendingConfirmation ? 'Sending Code...' : 'Resend Email from zaynahspos@gmail.com'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAwaitingConfirmation(false)
                  setMode('signin')
                  setErrorMsg('')
                  setSuccessMsg('')
                }}
                className="w-full py-2 text-slate-400 hover:text-white font-medium rounded-xl text-xs transition cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : mode === 'forgot' ? (
          <form onSubmit={handleSendResetEmail} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">
                Registered Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="merchant@example.com"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-slate-600 outline-none [color-scheme:dark]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Sending Reset Link...' : isResetEmailSent ? 'Resend Reset Link' : 'Send Reset Link'}
            </button>

            <div className="pt-2 border-t border-slate-800 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleOpenWhatsAppAdmin}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <WhatsAppIcon size={14} className="fill-current text-[#25D366] shrink-0" />
                <span>Contact Admin on WhatsApp (+92 302 724 5937)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setErrorMsg('')
                  setSuccessMsg('')
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                <ChevronLeftIcon size={14} />
                <span>Back to Sign In</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="merchant@example.com"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-slate-600 outline-none [color-scheme:dark]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 pl-1">
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
                    }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Forgot Password?
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
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-slate-600 outline-none font-mono [color-scheme:dark]"
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

            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-slate-600 outline-none font-mono [color-scheme:dark]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Log In'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
