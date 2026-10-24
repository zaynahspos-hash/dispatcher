import { useState, useEffect } from 'react'
import { checkIsAdmin } from '../utils/adminAuth'

export type Tab = 'paste' | 'table' | 'results' | 'history' | 'vault' | 'settings' | 'admin' | 'apps'

const VALID_TABS: Tab[] = ['paste', 'table', 'results', 'history', 'vault', 'settings', 'admin', 'apps']

function isSystemHash(hash: string): boolean {
  return (
    hash.includes('recovery') ||
    hash.includes('access_token') ||
    hash.includes('type=') ||
    hash.includes('error')
  )
}

function getStoredAuthEmail(): string | null {
  try {
    const direct = localStorage.getItem('zaynah_active_user_email')
    if (direct) return direct
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('auth-token') || key.startsWith('sb-'))) {
        const val = localStorage.getItem(key)
        if (val) {
          const parsed = JSON.parse(val)
          const email = parsed.user?.email || parsed.currentSession?.user?.email || parsed.session?.user?.email
          if (email) return email
        }
      }
    }
  } catch {}
  return null
}

export function useNavigationTabs(user: any, adminEmails: string[] = []) {
  const isUserAdmin = checkIsAdmin(user?.email) || checkIsAdmin(getStoredAuthEmail()) || Boolean(
    user &&
    user.email &&
    adminEmails.some(e => e.toLowerCase().trim() === user.email.toLowerCase().trim())
  )

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    try {
      const rawHash = (window.location.hash || '').replace('#', '')
      const mainFromHash = rawHash.split('/')[0].split('?')[0].toLowerCase() as Tab
      
      const storedEmail = getStoredAuthEmail()
      const isAdminInitial = checkIsAdmin(user?.email) || checkIsAdmin(storedEmail)

      if (mainFromHash === 'admin') {
        if (isAdminInitial) return 'admin'
        return 'paste'
      }
      if (VALID_TABS.includes(mainFromHash)) return mainFromHash

      const saved = localStorage.getItem('parcel_app_active_tab') as Tab
      if (saved === 'admin') {
        if (isAdminInitial) return 'admin'
        return 'paste'
      }
      if (VALID_TABS.includes(saved)) {
        if (!window.location.hash) {
          window.location.hash = saved
        }
        return saved
      }
      return 'paste'
    } catch {
      return 'paste'
    }
  })

  // If authenticated user is confirmed admin and hash is #admin or #admin/*, permit admin tab
  useEffect(() => {
    const rawHash = (window.location.hash || '').replace('#', '')
    const mainFromHash = rawHash.split('/')[0].split('?')[0].toLowerCase()
    if (mainFromHash === 'admin' && isUserAdmin) {
      setActiveTab('admin')
    }
  }, [isUserAdmin])

  // Strictly block non-admin users from staying on admin tab or having #admin in URL
  // Only execute once auth is confirmed and user is actually loaded (user !== null)
  useEffect(() => {
    if (!isUserAdmin && user !== undefined && user !== null) {
      const rawHash = (window.location.hash || '').replace('#', '')
      const mainFromHash = rawHash.split('/')[0].split('?')[0].toLowerCase()
      if (activeTab === 'admin' || mainFromHash === 'admin') {
        setActiveTab('paste')
        window.location.hash = 'paste'
        try {
          localStorage.setItem('parcel_app_active_tab', 'paste')
        } catch {}
      }
      if (window.location.pathname.toLowerCase().startsWith('/admin')) {
        window.history.replaceState(null, '', '/#paste')
      }
    }
  }, [activeTab, isUserAdmin, user])

  // Handle direct /admin pathname routing safely
  useEffect(() => {
    if (window.location.pathname.toLowerCase().startsWith('/admin')) {
      if (isUserAdmin) {
        window.history.replaceState(null, '', '/#admin')
        setActiveTab('admin')
      } else if (user !== undefined) {
        window.history.replaceState(null, '', '/#paste')
        setActiveTab('paste')
      }
    }
  }, [isUserAdmin, user])

  // Sync activeTab to URL hash and localStorage
  useEffect(() => {
    const currentHash = window.location.hash || ''
    if (isSystemHash(currentHash)) return

    // Never sync 'admin' hash if user is not authorized admin
    if (activeTab === 'admin' && !isUserAdmin) {
      window.location.hash = 'paste'
      return
    }

    // Only update window.location.hash if main tab changed (preserves subtabs like #admin/customers)
    const rawHash = currentHash.replace('#', '')
    const mainFromHash = rawHash.split('/')[0].split('?')[0].toLowerCase()
    if (mainFromHash !== activeTab) {
      window.location.hash = activeTab
    }

    try {
      localStorage.setItem('parcel_app_active_tab', activeTab)
    } catch (e) {
      console.error('Error saving activeTab:', e)
    }
  }, [activeTab, isUserAdmin])

  // Sync state if user changes hash directly or uses browser back/forward
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash || ''
      if (isSystemHash(rawHash)) return

      const cleanMain = rawHash.replace('#', '').split('/')[0].split('?')[0].toLowerCase() as Tab
      if (VALID_TABS.includes(cleanMain)) {
        if (cleanMain === 'admin') {
          if (isUserAdmin) {
            setActiveTab('admin')
          } else {
            // Strictly block non-admins
            window.location.hash = activeTab === 'admin' ? 'paste' : activeTab
          }
        } else {
          setActiveTab(cleanMain)
        }
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [isUserAdmin, activeTab])

  return { activeTab, setActiveTab }
}
