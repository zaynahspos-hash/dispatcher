import React, { useState, useEffect } from 'react'
import { TabItem, BottomTabBar } from './BottomTabBar'
import { SunIcon, MoonIcon, AlertTriangleIcon, RefreshIcon, AdminIcon, ChevronLeftIcon } from '../Icons'
import { forceAppUpdate } from '../../utils/pwaReload'
import { UserAvatar } from '../common/UserAvatar'
import { UserAccountMenu } from '../common/UserAccountMenu'
import { Settings } from '../../utils/aiParser'
import { DesktopSidebar } from './DesktopSidebar'

interface AppLayoutProps {
  children: React.ReactNode
  tabs: TabItem[]
  activeTab: string
  setActiveTab: (tab: any) => void
  user: any
  settings?: Settings
  updateSetting?: (key: keyof Settings | Partial<Settings>, value?: string) => void
  dailyTokens: number
  monthlyTokens: number
  dailyRequests?: number
  onLogout: () => void
  onOpenAuthModal: () => void
  isSettingsConfigured: boolean
  isInstallable: boolean
  isStandalone: boolean
  onInstallApp: () => void
  onOpenInstallGuide: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  operationalCitiesCount?: number
  avatarUrl?: string
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  tabs,
  activeTab,
  setActiveTab,
  user,
  settings,
  updateSetting = () => {},
  dailyTokens: _dailyTokens,
  monthlyTokens: _monthlyTokens,
  dailyRequests = 0,
  onLogout,
  isSettingsConfigured,
  isInstallable,
  isStandalone,
  onInstallApp,
  onOpenInstallGuide,
  theme,
  onToggleTheme,
  operationalCitiesCount = 500,
  avatarUrl
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('zaynah_desktop_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  // Reactive Display Name (Updated immediately when edited in UserAccountMenu)
  const [userDisplayName, setUserDisplayName] = useState<string>(() => {
    return (
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      (typeof window !== 'undefined' && user?.id ? localStorage.getItem(`zaynah_name_${user.id}`) : null) ||
      (typeof window !== 'undefined' ? localStorage.getItem('zaynah_name') : null) ||
      user?.email?.split('@')[0] ||
      'Merchant'
    )
  })

  useEffect(() => {
    if (!user) return
    const updateName = () => {
      const current =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        (user?.id ? localStorage.getItem(`zaynah_name_${user.id}`) : null) ||
        localStorage.getItem('zaynah_name') ||
        user?.email?.split('@')[0] ||
        'Merchant'
      setUserDisplayName(current)
    }
    updateName()
    const handleNameEvent = (e: any) => {
      if (e?.detail && typeof e.detail === 'string') {
        setUserDisplayName(e.detail)
      } else {
        updateName()
      }
    }
    window.addEventListener('zaynah_user_name_updated', handleNameEvent)
    return () => {
      window.removeEventListener('zaynah_user_name_updated', handleNameEvent)
    }
  }, [user])

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem('zaynah_desktop_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }

  const handleRefreshApp = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    await forceAppUpdate()
  }

  // Mobile Bottom Bar (5 core focused operations tabs - includes Admin for admin merchants)
  const hasAdminAccess = tabs.some(t => t.id === 'admin')
  const baseBottomTabIds = hasAdminAccess
    ? ['paste', 'table', 'results', 'history', 'admin']
    : ['paste', 'table', 'results', 'history', 'vault']
  const mobileBottomTabIds = baseBottomTabIds.includes(activeTab)
    ? baseBottomTabIds
    : [...baseBottomTabIds.slice(0, 4), activeTab]
  const mobileBottomTabs = mobileBottomTabIds.map(id => tabs.find(t => t.id === id)).filter(Boolean) as typeof tabs

  // Find active tab label for header breadcrumb
  const currentTabObj = tabs.find(t => t.id === activeTab) || tabs[0]

  return (
    <div className="h-screen w-full max-w-full flex bg-[var(--bg)] text-[var(--tx)] font-sans overflow-hidden transition-colors duration-200">
      
      {/* 1. Desktop Sidebar (Only >= 860px) */}
      <DesktopSidebar
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSettingsConfigured={isSettingsConfigured}
        operationalCitiesCount={operationalCitiesCount}
        dailyRequests={dailyRequests}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
      />

      {/* ========================================================
          2. MAIN CONTENT WRAPPER
          ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full h-full overflow-hidden">
        
        {/* Mobile Header (< 860px) */}
        <div className="min-[860px]:hidden shrink-0 bg-[var(--bg)]">
          {/* iOS Back Bar for Sub-screens */}
          {['vault', 'settings', 'apps', 'admin'].includes(activeTab) && (
            <div className="px-3 pt-[max(env(safe-area-inset-top),8px)] pb-1 flex items-center">
              <button
                type="button"
                onClick={() => setActiveTab('more')}
                className="ios-back-bar gap-1 text-[var(--ac)] hover:opacity-80 active:opacity-60 transition cursor-pointer"
              >
                <ChevronLeftIcon size={20} />
                <span className="text-[15px] font-medium">Back</span>
              </button>
            </div>
          )}

          {/* iOS Large Title Header */}
          <div className={`px-4 pb-2 flex items-center justify-between ${
            ['vault', 'settings', 'apps', 'admin'].includes(activeTab) ? 'pt-1' : 'pt-[max(env(safe-area-inset-top),10px)]'
          }`}>
            <h1 className="ios-h1 text-[var(--tx)]">
              {activeTab === 'paste' && 'New orders'}
              {activeTab === 'table' && 'Parcels'}
              {activeTab === 'results' && 'Results'}
              {activeTab === 'history' && 'History'}
              {activeTab === 'more' && 'More'}
              {activeTab === 'vault' && 'Document vault'}
              {activeTab === 'settings' && 'Settings'}
              {activeTab === 'apps' && 'All apps'}
              {activeTab === 'admin' && 'Admin control'}
            </h1>
            <button
              type="button"
              onClick={() => setActiveTab('more')}
              className="w-8.5 h-8.5 rounded-full bg-[var(--s2)] text-[var(--tx)] flex items-center justify-center text-xs font-bold border border-[var(--bd)] active:scale-95 transition-transform cursor-pointer shrink-0"
              title="Merchant Profile & More"
            >
              {userDisplayName.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>

        {/* Desktop Top Header / Portal Navbar (>= 860px) */}
        <header className="hidden min-[860px]:flex pt-[max(env(safe-area-inset-top),0.75rem)] pb-2.5 min-h-[calc(3.75rem+max(env(safe-area-inset-top),0.75rem))] px-6 lg:px-8 bg-[var(--s1)] border-b border-[var(--bd)] items-center justify-between gap-3 shrink-0 z-20 transition-colors duration-200">
          
          {/* Left: Desktop Breadcrumbs */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--t2)]">
              <span className="hover:text-[var(--tx)] cursor-pointer" onClick={() => setActiveTab('paste')}>
                Dispatcher
              </span>
              <span className="text-[var(--t3)]">/</span>
              <span className="text-[var(--tx)] font-bold flex items-center gap-1.5">
                <currentTabObj.Icon size={14} className="text-[var(--ac)]" />
                {currentTabObj.label}
              </span>
            </div>
          </div>

          {/* Right: Actions & User Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Settings Alert if not configured and not on settings tab */}
            {!isSettingsConfigured && activeTab !== 'settings' && (
              <button
                onClick={() => setActiveTab('settings')}
                className="h-9 px-3 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5 text-xs font-bold hover:bg-amber-500/25 transition cursor-pointer active:scale-98 shadow-xs"
                title="Configure Settings"
              >
                <AlertTriangleIcon size={14} className="text-amber-500 shrink-0" />
                <span>Setup</span>
              </button>
            )}

            {/* PWA App Hard Refresh / Cache Buster */}
            <button
              type="button"
              onClick={handleRefreshApp}
              disabled={isRefreshing}
              className="h-9 px-3 rounded-lg border border-[var(--bd)] bg-[var(--s1)] text-[var(--t2)] hover:text-[var(--tx)] hover:bg-[var(--s2)] transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50 shadow-xs"
              title="Refresh app & fetch latest updates"
              aria-label="Refresh app"
            >
              <RefreshIcon size={14} className={isRefreshing ? 'animate-spin text-[var(--ac)]' : 'text-[var(--t2)]'} />
              <span className="text-xs font-semibold">
                {isRefreshing ? 'Updating...' : 'Refresh'}
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-lg border border-[var(--bd)] bg-[var(--s1)] text-[var(--t2)] hover:bg-[var(--s2)] hover:text-[var(--tx)] flex items-center justify-center transition cursor-pointer active:scale-98 shadow-xs"
              title="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon size={15} className="text-amber-400" /> : <MoonIcon size={15} className="text-indigo-400" />}
            </button>

            {/* User Avatar Pill */}
            {user && (
              <button 
                type="button"
                onClick={() => setUserMenuOpen(prev => !prev)}
                className="h-9 px-2.5 rounded-lg border border-[var(--bd)] bg-[var(--s1)] hover:bg-[var(--s2)] flex items-center gap-2 transition cursor-pointer active:scale-98 shadow-xs"
                title="Account, Security & Settings"
                aria-label="Open User Account Menu"
              >
                <UserAvatar email={user.email} avatarUrl={settings?.avatar_url || avatarUrl} size="xs" />
                <span className="text-xs font-bold text-[var(--tx)] max-w-[140px] truncate">
                  {userDisplayName}
                </span>
                <svg className={`w-3.5 h-3.5 text-[var(--t3)] transition-transform ${userMenuOpen ? 'rotate-180 text-[var(--ac)]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>

        </header>

        {/* Scrollable Main Application Canvas */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 max-w-full px-2 sm:px-4 min-[860px]:px-8 py-2 min-[860px]:py-6 pb-[calc(76px+max(env(safe-area-inset-bottom),12px))] min-[860px]:pb-12 bg-[var(--bg)] transition-colors duration-200">
          <div className={`w-full min-w-0 max-w-full space-y-5 transition-all duration-200 ${
            isSidebarCollapsed ? 'max-w-none' : 'max-w-[1720px] 2xl:max-w-none'
          }`}>
            {children}
          </div>
        </main>

        {/* Desktop Portal Footer Status Bar (>= 860px) */}
        <footer className="hidden min-[860px]:flex h-8 px-6 lg:px-8 bg-[var(--s1)] border-t border-[var(--bd)] items-center justify-between text-[11px] text-[var(--t2)] select-none shrink-0 z-20">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ac)]"></span>
              PostEx V3 Engine Ready
            </span>
            <span className="text-[var(--t3)]">&bull;</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ac)]"></span>
              End-to-End Encrypted
            </span>
            <span className="text-[var(--t3)]">&bull;</span>
            <span>Operational Cities: {operationalCitiesCount}+</span>
          </div>

          <div className="flex items-center gap-3">
            <span>&copy; 2026 Zaynahs POS Logistics Ecosystem</span>
            <span className="text-[var(--t3)]">&bull;</span>
            <a 
              href={typeof window !== 'undefined' ? window.location.origin : 'https://dispatcher.zaynahs.pk'} 
              target="_blank" 
              rel="noreferrer" 
              className="text-[var(--ac)] hover:underline font-semibold"
            >
              {typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'dispatcher.zaynahs.pk'}
            </a>
          </div>
        </footer>

      </div>

      {/* 3. Mobile Native 5-Tab Bar (< 860px) */}
      <BottomTabBar
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSettingsConfigured={isSettingsConfigured}
      />

      {/* 4. User Account, Avatar & Privacy Dropdown Menu (Desktop) */}
      {settings && (
        <UserAccountMenu
          isOpen={userMenuOpen}
          onClose={() => setUserMenuOpen(false)}
          user={user}
          settings={settings}
          updateSetting={updateSetting}
          onLogout={onLogout}
          onNavigateToSettings={() => {
            setUserMenuOpen(false)
            setActiveTab('settings')
          }}
          isAdmin={hasAdminAccess}
          onNavigateToAdmin={() => {
            setUserMenuOpen(false)
            setActiveTab('admin')
          }}
          theme={theme}
          onToggleTheme={onToggleTheme}
          isStandalone={isStandalone}
          isInstallable={isInstallable}
          onInstallApp={onInstallApp}
          onOpenInstallGuide={onOpenInstallGuide}
        />
      )}

    </div>
  )
}
