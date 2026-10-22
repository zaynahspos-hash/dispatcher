import React, { useState, useEffect } from 'react'
import { TabItem } from './BottomTabBar'
import { SunIcon, MoonIcon, AlertTriangleIcon, RefreshIcon } from '../Icons'
import { forceAppUpdate } from '../../utils/pwaReload'
import { UserAvatar } from '../common/UserAvatar'
import { UserAccountMenu } from '../common/UserAccountMenu'
import { Settings } from '../../utils/aiParser'
import { DesktopSidebar } from './DesktopSidebar'
import { MobileNavDrawer } from './MobileNavDrawer'

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

  // Mobile Bottom Bar (5 core focused operations tabs)
  const baseBottomTabIds = ['paste', 'table', 'results', 'history', 'vault']
  const mobileBottomTabIds = baseBottomTabIds.includes(activeTab)
    ? baseBottomTabIds
    : [...baseBottomTabIds.slice(0, 4), activeTab]
  const mobileBottomTabs = mobileBottomTabIds.map(id => tabs.find(t => t.id === id)).filter(Boolean) as typeof tabs

  // Find active tab label for header breadcrumb
  const currentTabObj = tabs.find(t => t.id === activeTab) || tabs[0]

  return (
    <div className="h-screen w-full max-w-full flex bg-[#f8fafc] dark:bg-[#070b12] text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-200">
      
      {/* 1. Desktop Sidebar */}
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
        
        {/* Top Header / Portal Navbar */}
        <header className="pt-[max(env(safe-area-inset-top),0.75rem)] pb-2.5 min-h-[calc(3.75rem+max(env(safe-area-inset-top),0.75rem))] px-3.5 sm:px-6 lg:px-8 bg-white dark:bg-[#0c121e] border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2 sm:gap-3 shrink-0 z-20 transition-colors duration-200">
          
          {/* Left: Mobile Menu Trigger + Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-8.5 h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer active:scale-95 shadow-xs"
              aria-label="Open menu"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Mobile Logo Brand */}
            <div className="flex lg:hidden items-center gap-2 cursor-pointer" onClick={() => setActiveTab('paste')}>
              <img 
                src="/apple-touch-icon.png?v=20261014" 
                onError={(e) => { (e.target as HTMLImageElement).src = '/favicon-96x96.png?v=20261014' }} 
                className="w-7 h-7 rounded-lg object-contain shadow-xs" 
                alt="Logo" 
              />
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                Zaynahs
              </span>
            </div>

            {/* Desktop Breadcrumbs */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer" onClick={() => setActiveTab('paste')}>
                Dispatcher
              </span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                <currentTabObj.Icon size={14} className="text-emerald-500" />
                {currentTabObj.label}
              </span>
            </div>
          </div>

          {/* Right: Actions & User Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Settings Alert if not configured */}
            {!isSettingsConfigured && (
              <button
                onClick={() => setActiveTab('settings')}
                className="h-9 px-3 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5 text-xs font-bold hover:bg-amber-500/25 transition cursor-pointer active:scale-98 shadow-xs"
                title="Configure Settings"
              >
                <AlertTriangleIcon size={14} className="text-amber-500 shrink-0" />
                <span className="hidden sm:inline">Setup</span>
              </button>
            )}

            {/* PWA App Hard Refresh / Cache Buster */}
            <button
              type="button"
              onClick={handleRefreshApp}
              disabled={isRefreshing}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50 shadow-xs"
              title="Refresh app & fetch latest updates"
              aria-label="Refresh app"
            >
              <RefreshIcon size={14} className={isRefreshing ? 'animate-spin text-emerald-500' : 'text-slate-500 dark:text-slate-400'} />
              <span className="hidden sm:inline text-xs font-semibold">
                {isRefreshing ? 'Updating...' : 'Refresh'}
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer active:scale-98 shadow-xs"
              title="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon size={15} className="text-amber-400" /> : <MoonIcon size={15} className="text-indigo-400" />}
            </button>

            {/* User Avatar Pill - Opens Profile / Security / Settings Menu */}
            {user && (
              <button 
                type="button"
                onClick={() => setUserMenuOpen(prev => !prev)}
                className="h-9 px-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 flex items-center gap-2 transition cursor-pointer active:scale-98 shadow-xs"
                title="Account, Security & Settings"
                aria-label="Open User Account Menu"
              >
                <UserAvatar email={user.email} avatarUrl={settings?.avatar_url || avatarUrl} size="xs" />
                <span className="hidden sm:inline text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                  {userDisplayName}
                </span>
                <svg className={`hidden sm:block w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180 text-emerald-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>

        </header>

        {/* Scrollable Main Application Canvas (Generous mobile pb to clear bottom bar) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-none min-w-0 max-w-full px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-6 pb-[calc(110px+max(env(safe-area-inset-bottom),20px))] lg:pb-12 bg-[#f8fafc] dark:bg-[#070b12] transition-colors duration-200">
          <div className={`w-full min-w-0 max-w-full space-y-5 transition-all duration-200 ${
            isSidebarCollapsed ? 'max-w-none' : 'max-w-[1720px] 2xl:max-w-none'
          }`}>
            {children}
          </div>
        </main>

        {/* Desktop Portal Footer Status Bar */}
        <footer className="hidden lg:flex h-8 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0c121e] border-t border-slate-200/80 dark:border-slate-800/80 items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 select-none shrink-0 z-20">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              PostEx V3 Engine Ready
            </span>
            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              End-to-End Encrypted
            </span>
            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
            <span>Operational Cities: {operationalCitiesCount}+</span>
          </div>

          <div className="flex items-center gap-3">
            <span>&copy; 2026 Zaynahs POS Logistics Ecosystem</span>
            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
            <a 
              href={typeof window !== 'undefined' ? window.location.origin : 'https://dispatcher.zaynahs.pk'} 
              target="_blank" 
              rel="noreferrer" 
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              {typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'dispatcher.zaynahs.pk'}
            </a>
          </div>
        </footer>

      </div>

      {/* ========================================================
          3. MOBILE NATIVE BOTTOM NAVIGATION BAR (Apple iOS Style)
          ======================================================== */}
      <nav 
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 w-full max-w-full bg-white dark:bg-[#0c121e] border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-around pb-[max(env(safe-area-inset-bottom),6px)] h-[calc(60px+max(env(safe-area-inset-bottom),6px))] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)] select-none"
      >
        {mobileBottomTabs.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 min-w-0 flex flex-col items-center justify-center py-1 gap-1 relative cursor-pointer active:scale-95 transition-transform"
            >
              <div className="relative inline-flex items-center justify-center">
                <div className={`p-1 rounded-xl transition-colors ${
                  isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  <tab.Icon size={21} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
                </div>

                {tab.badge !== null && tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-0.5 -right-2.5 min-w-[18px] h-[18px] px-1 text-[10px] font-black rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center ring-2 ring-white dark:ring-[#0c121e] shadow-xs">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] tracking-tight leading-none truncate px-1 max-w-full ${
                isActive ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-medium text-slate-500 dark:text-slate-400'
              }`}>
                {tab.mobileLabel}
              </span>
            </button>
          )
        })}
      </nav>

      {/* 4. Mobile Full-Screen Navigation Drawer */}
      <MobileNavDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        displayName={userDisplayName}
        avatarUrl={avatarUrl}
        isRefreshing={isRefreshing}
        onRefreshApp={handleRefreshApp}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
        isStandalone={isStandalone}
        isInstallable={isInstallable}
        onInstallApp={onInstallApp}
        onOpenInstallGuide={onOpenInstallGuide}
      />

      {/* 5. User Account, Avatar & Privacy Dropdown Menu */}
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
