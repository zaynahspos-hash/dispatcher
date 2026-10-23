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

export function useNavigationTabs(user: any, adminEmails: string[] = []) {
  const isUserAdmin = checkIsAdmin(user?.email) || Boolean(
    user &&
    user.email &&
    adminEmails.some(e => e.toLowerCase().trim() === user.email.toLowerCase().trim())
  )

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    try {
      const hash = window.location.hash.replace('#', '') as Tab
      // Strictly prevent initial state from defaulting to 'admin' for unverified/normal users
      if (hash === 'admin') return 'paste'
      if (VALID_TABS.includes(hash)) return hash
      const saved = localStorage.getItem('parcel_app_active_tab')
      if (saved === 'admin') return 'paste'
      return (saved as Tab) || 'paste'
    } catch {
      return 'paste'
    }
  })

  // If authenticated user is confirmed admin and hash is #admin, permit admin tab
  useEffect(() => {
    const rawHash = (window.location.hash || '').replace('#', '')
    if (rawHash === 'admin' && isUserAdmin) {
      setActiveTab('admin')
    }
  }, [isUserAdmin])

  // Strictly block non-admin users from staying on admin tab or having #admin in URL
  useEffect(() => {
    if (!isUserAdmin) {
      const rawHash = (window.location.hash || '').replace('#', '')
      if (activeTab === 'admin' || rawHash === 'admin') {
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
  }, [activeTab, isUserAdmin])

  // Handle direct /admin pathname routing safely
  useEffect(() => {
    if (window.location.pathname.toLowerCase().startsWith('/admin')) {
      if (isUserAdmin) {
        window.history.replaceState(null, '', '/#admin')
        setActiveTab('admin')
      } else {
        window.history.replaceState(null, '', '/#paste')
        setActiveTab('paste')
      }
    }
  }, [isUserAdmin])

  // Sync activeTab to URL hash and localStorage
  useEffect(() => {
    const currentHash = window.location.hash || ''
    if (isSystemHash(currentHash)) return

    // Never sync 'admin' hash if user is not authorized admin
    if (activeTab === 'admin' && !isUserAdmin) {
      window.location.hash = 'paste'
      return
    }

    window.location.hash = activeTab
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

      const hash = rawHash.replace('#', '') as Tab
      if (VALID_TABS.includes(hash)) {
        if (hash === 'admin') {
          if (isUserAdmin) {
            setActiveTab('admin')
          } else {
            // Strictly block non-admins
            window.location.hash = activeTab === 'admin' ? 'paste' : activeTab
          }
        } else {
          setActiveTab(hash)
        }
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [isUserAdmin, activeTab])

  return { activeTab, setActiveTab }
}
