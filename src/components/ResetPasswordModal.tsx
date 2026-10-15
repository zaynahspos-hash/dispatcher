import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

interface ResetPasswordModalProps {
  onClose: () => void
}

export default function ResetPasswordModal({ onClose }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Custom API & OTP code support
  const [useOtpMode, setUseOtpMode] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [urlToken, setUrlToken] = useState('')
  const [urlEmail, setUrlEmail] = useState('')
  
  const [hasActiveSession, setHasActiveSession] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // On mount: auto-extract tokens and email from URL hash, search, or active session
  useEffect(() => {
    let isMounted = true

    const syncSession = async () => {
      try {
        const rawHash = window.location.hash.startsWith('#')
          ? window.location.hash.substring(1)
          : window.location.hash
        const rawSearch = window.location.search.startsWith('?')
          ? window.location.search.substring(1)
          : window.location.search

        // 1. Extract direct custom reset token & email
        const combined = new URLSearchParams(rawHash + '&' + rawSearch)
        const t = combined.get('token')
        const em = combined.get('email')
        if (t && isMounted) setUrlToken(t)
        if (em && isMounted) {
          setUrlEmail(em)
          setOtpEmail(em)
        }

        // 2. Direct hash extraction (access_token & refresh_token from Supabase recovery redirect)
        if (rawHash.includes('access_token=')) {
          const params = new URLSearchParams(rawHash.replace(/^.*(?=access_token=)/, ''))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            if (!error && data?.session && isMounted) {
              setHasActiveSession(true)
              return
            }
          }
        }

        // 3. Search params code extraction (PKCE flow)
        if (rawSearch.includes('code=')) {
          const searchParams = new URLSearchParams(rawSearch)
          const code = searchParams.get('code')
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)
            if (!error && data?.session && isMounted) {
              setHasActiveSession(true)
              return
            }
          }
        }

        // 4. Check existing Supabase session
        const { data: { session } } = await supabase.auth.getSession()
        if (isMounted) {
          setHasActiveSession(!!session)
        }
      } catch (err) {
        console.warn('[ResetPasswordModal] Session sync warning:', err)
        if (isMounted) setHasActiveSession(false)
      }
    }

    syncSession()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
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
      const cleanEmail = (otpEmail || urlEmail).trim().toLowerCase()
      const cleanCode = otpCode.trim().replace(/\D/g, '')
      const cleanToken = urlToken.trim()

      let updatedViaCustomApi = false

      // 1. If direct reset token or OTP code is available, call custom backend endpoint (updates auth.users via bcrypt)
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
            updatedViaCustomApi = true
          } else if (!hasActiveSession) {
            throw new Error(data.error || 'Failed to update password')
          }
        } catch (apiErr: any) {
          if (!hasActiveSession) throw apiErr
        }
      }

      // 2. If OTP mode was toggled and Supabase has an unverified session, verify OTP with Supabase too
      if (!updatedViaCustomApi && (useOtpMode || hasActiveSession === false)) {
        if (!cleanEmail) {
          setErrorMsg('Please enter your account email address.')
          setLoading(false)
          setUseOtpMode(true)
          return
        }
        if (!cleanCode || cleanCode.length < 6) {
          setErrorMsg('Please enter the 6-digit verification code from your email.')
          setLoading(false)
          setUseOtpMode(true)
          return
        }

        const { error: otpError } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanCode,
          type: 'recovery'
        })
        if (otpError && !updatedViaCustomApi) throw otpError
      }

      // 3. Update active Supabase session password if present
      if (hasActiveSession) {
        try {
          const { error: updateError } = await supabase.auth.updateUser({
            password: password,
          })
          if (updateError && !updatedViaCustomApi) throw updateError
        } catch (err: any) {
          if (!updatedViaCustomApi) throw err
        }
      }

      setSuccessMsg('Your password has been updated successfully! Redirecting...')
      
      // Clean up URL recovery hash
      if (
        window.location.hash.includes('recovery') ||
        window.location.hash.includes('access_token') ||
        window.location.hash.includes('type=') ||
        window.location.hash.includes('token=')
      ) {
        window.location.hash = '#paste'
      }

      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update your password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fade-in">
      <div className="relative w-full max-w-md p-6 sm:p-7 bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Create New Password
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Set a secure password for your merchant dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Message Feedbacks */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* OTP Code Fields (if triggered or toggled or no direct link token) */}
          {(useOtpMode || (!urlToken && hasActiveSession === false)) && (
            <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Email Verification Code
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                  6-Digit OTP
                </span>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">
                  Your Account Email
                </label>
                <input
                  type="email"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">
                  6-Digit Security Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm font-mono tracking-widest text-center text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>
          )}

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
                className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-slate-600 outline-none font-mono"
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
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-slate-600 outline-none font-mono"
            />
          </div>

          {/* Toggle OTP Code Entry if needed */}
          {!useOtpMode && !urlToken && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setUseOtpMode(true)}
                className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors font-medium cursor-pointer"
              >
                Have a 6-digit email code instead?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
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
              'Save New Password'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
