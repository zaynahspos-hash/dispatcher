import { useState, useEffect } from 'react'

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

export function useNavigationTabs(user: any, adminEmails: string[]) {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    try {
      const hash = window.location.hash.replace('#', '') as Tab
      if (VALID_TABS.includes(hash)) return hash
      const saved = localStorage.getItem('parcel_app_active_tab')
      return (saved as Tab) || 'paste'
    } catch {
      return 'paste'
    }
  })

  // Sync activeTab to URL hash and localStorage
  useEffect(() => {
    const currentHash = window.location.hash || ''
    if (isSystemHash(currentHash)) return

    window.location.hash = activeTab
    try {
      localStorage.setItem('parcel_app_active_tab', activeTab)
    } catch (e) {
      console.error('Error saving activeTab:', e)
    }
  }, [activeTab])

  // Sync state if user changes hash directly or uses browser back/forward
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash || ''
      if (isSystemHash(rawHash)) return

      const hash = rawHash.replace('#', '') as Tab
      if (VALID_TABS.includes(hash)) {
        if (hash === 'admin') {
          if (user && user.email && adminEmails.includes(user.email.toLowerCase().trim())) {
            setActiveTab(hash)
          } else {
            window.location.hash = activeTab
          }
        } else {
          setActiveTab(hash)
        }
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [user, activeTab, adminEmails])

  return { activeTab, setActiveTab }
}
