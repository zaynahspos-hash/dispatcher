import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

/**
 * Hook to listen for Supabase password recovery flows via URL hash or auth state event.
 */
export function usePasswordRecovery() {
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash || ''
      const s = window.location.search || ''
      return h.includes('recovery') || h.includes('type=recovery') || s.includes('type=recovery')
    }
    return false
  })

  useEffect(() => {
    const checkRecovery = () => {
      const h = window.location.hash || ''
      const s = window.location.search || ''
      if (h.includes('recovery') || h.includes('type=recovery') || s.includes('type=recovery')) {
        setIsResetPasswordOpen(true)
      }
    }

    checkRecovery()
    window.addEventListener('hashchange', checkRecovery)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPasswordOpen(true)
      }
    })

    return () => {
      window.removeEventListener('hashchange', checkRecovery)
      subscription.unsubscribe()
    }
  }, [])

  return { isResetPasswordOpen, setIsResetPasswordOpen }
}
