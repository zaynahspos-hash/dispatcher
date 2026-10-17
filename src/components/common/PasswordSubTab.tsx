import React, { useState } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { useToast } from './Toast'

interface PasswordSubTabProps {
  user: any
}

export const PasswordSubTab: React.FC<PasswordSubTabProps> = ({ user }) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const toast = useToast()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.')
      return
    }
    setPwLoading(true)
    setPwError('')
    setPwSuccess('')
    try {
      if (!user?.email) throw new Error('Session not found. Please log in again.')
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })
      if (signInError) throw new Error('Current password is incorrect.')

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError

      setPwSuccess('Password updated successfully!')
      toast.success('Password Updated', 'Your account credentials have been securely refreshed.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPwError(err.message || 'Failed to update password.')
      toast.error('Password Update Failed', err.message)
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <form onSubmit={handleUpdatePassword} className="space-y-3">
      {pwError && (
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium">
          {pwError}
        </div>
      )}
      {pwSuccess && (
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-medium">
          {pwSuccess}
        </div>
      )}

      <div>
        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
          Current Password
        </label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          placeholder="••••••••"
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
          New Password
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          placeholder="Min 6 characters"
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
          Confirm New Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="Confirm password"
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
        />
      </div>

      <button
        type="submit"
        disabled={pwLoading}
        className="w-full mt-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
      >
        {pwLoading ? 'Updating Password...' : 'Save New Password'}
      </button>
    </form>
  )
}
