import React, { useState } from 'react'
import { TabItem } from './BottomTabBar'
import { SunIcon, MoonIcon, AlertTriangleIcon, SmartphoneIcon, RefreshIcon } from '../Icons'
import { forceAppUpdate } from '../../utils/pwaReload'
import { UserAvatar } from '../common/UserAvatar'

interface AppLayoutProps {
  children: React.ReactNode
  tabs: TabItem[]
  activeTab: string
  setActiveTab: (tab: any) => void
  user: any
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
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  tabs,
  activeTab,
  setActiveTab,
  user,
  dailyTokens,
  monthlyTokens,
  dailyRequests = 0,
  onLogout,
  isSettingsConfigured,
  isInstallable,
  isStandalone,
  onInstallApp,
  theme,
  onToggleTheme,
  operationalCitiesCount = 500
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshApp = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    await forceAppUpdate()
  }

  // Tab categorization
  const operationsTabIds = ['paste', 'table', 'results', 'history']
  const operationsTabs = tabs.filter(t => operationsTabIds.includes(t.id))
  const systemTabs = tabs.filter(t => !operationsTabIds.includes(t.id))

  // Mobile Bottom Bar (All primary workflow tabs + apps + settings)
  const mobileBottomTabIds = ['paste', 'table', 'results', 'history', 'apps', 'settings']
  const mobileBottomTabs = tabs.filter(t => mobileBottomTabIds.includes(t.id))

  // Find active tab label for header breadcrumb
  const currentTabObj = tabs.find(t => t.id === activeTab) || tabs[0]

  return (
    <div className="h-screen w-screen flex bg-[#f8fafc] dark:bg-[#070b12] text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-200">
      
      {/* ========================================================
          1. DESKTOP SIDEBAR (Supabase / Proton / Linear Style)
          ======================================================== */}
      <aside className="hidden lg:flex w-64 xl:w-72 flex-col bg-white dark:bg-[#0c121e] border-r border-slate-200/80 dark:border-slate-800/80 select-none shrink-0 z-30 transition-all duration-200">
        
        {/* Brand Header */}
        <div className="p-4 xl:p-5 border-b border-slate-200/70 dark:border-slate-800/80 flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => setActiveTab('paste')}>
            <img 
              src="/apple-touch-icon.png?v=20261014" 
              onError={(e) => { (e.target as HTMLImageElement).src = '/favicon-96x96.png?v=20261014' }} 
              className="w-10 h-10 rounded-xl object-contain shadow-md shadow-emerald-500/10 border border-slate-200 dark:border-slate-700/60 group-hover:scale-105 transition-transform" 
              alt="Dispatcher Logo" 
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0c121e] rounded-full" title="PostEx V3 Engine Ready" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
                Zaynahs Courier
              </h1>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold px-1.5 py-0.2 rounded-md">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              PostEx &bull; AI Dispatcher
            </p>
          </div>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 overscroll-y-none scrollbar-none">
          
          {/* Group 1: Operations */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase">
                Operations
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                LIVE
              </span>
            </div>

            <nav className="space-y-1">
              {operationsTabs.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <tab.Icon
                        size={17}
                        className={`transition-colors shrink-0 ${
                          isActive
                            ? 'text-emerald-400'
                            : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                        }`}
                      />
                      <span className="truncate">{tab.label}</span>
                    </div>

                    {tab.badge !== null && tab.badge !== undefined && tab.badge > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Group 2: Management & Settings */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase">
                System & Config
              </span>
            </div>

            <nav className="space-y-1">
              {systemTabs.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <tab.Icon
                        size={17}
                        className={`transition-colors shrink-0 ${
                          isActive
                            ? 'text-emerald-400'
                            : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                        }`}
                      />
                      <span className="truncate">{tab.label}</span>
                    </div>

                    {tab.id === 'settings' && !isSettingsConfigured && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Configuration Needed" />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Operational Engine Quick Summary */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">PostEx V3</span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Connected
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Cities Sync</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                {operationalCitiesCount}+ Active
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Free AI Quota</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                {Math.max(0, 1500 - dailyRequests).toLocaleString()} free left
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">AI Usage Today</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                {dailyRequests} reqs &bull; {dailyTokens.toLocaleString()} tok
              </span>
            </div>
          </div>

        </div>

        {/* Sidebar Footer: User Card, Theme & Logout */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#080d17]/60 space-y-2">
          {user && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 shadow-xs">
              <div className="flex items-center gap-2 min-w-0 pr-1">
                <UserAvatar email={user.email} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {user.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition shrink-0 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between px-1">
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <SunIcon size={14} className="text-amber-400" /> Light Mode
                </>
              ) : (
                <>
                  <MoonIcon size={14} className="text-indigo-400" /> Dark Mode
                </>
              )}
            </button>

            {isInstallable && !isStandalone && (
              <button
                onClick={onInstallApp}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <SmartphoneIcon size={13} className="text-emerald-500" /> Install App
              </button>
            )}
          </div>
        </div>

      </aside>

      {/* ========================================================
          2. MAIN CONTENT WRAPPER
          ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
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

          {/* Right: Quick Indicators & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Live PostEx Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              PostEx V3 Live
            </div>

            {/* AI Token Counter */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-medium">
              <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">AI:</span>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400" title="Requests used today">
                {dailyRequests} reqs
              </span>
              <span className="text-slate-400 dark:text-slate-600">|</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono" title="Tokens used today">
                {dailyTokens >= 1000 ? `${(dailyTokens / 1000).toFixed(1)}k` : dailyTokens} tok
              </span>
            </div>

            {/* Settings Alert if not configured */}
            {!isSettingsConfigured && (
              <button
                onClick={() => setActiveTab('settings')}
                className="w-8.5 h-8.5 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center justify-center gap-1.5 text-xs font-bold hover:bg-amber-500/25 transition cursor-pointer active:scale-95 shadow-xs"
                title="Configure Settings"
              >
                <AlertTriangleIcon size={15} className="text-amber-500 shrink-0" />
                <span className="hidden sm:inline">Setup</span>
              </button>
            )}

            {/* PWA App Hard Refresh / Cache Buster */}
            <button
              type="button"
              onClick={handleRefreshApp}
              disabled={isRefreshing}
              className="w-8.5 h-8.5 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 shadow-xs"
              title="Refresh app & fetch latest updates"
              aria-label="Refresh app"
            >
              <RefreshIcon size={15} className={isRefreshing ? 'animate-spin text-emerald-500' : 'text-slate-500 dark:text-slate-400'} />
              <span className="hidden sm:inline text-xs font-bold">
                {isRefreshing ? 'Updating...' : 'Refresh'}
              </span>
            </button>

            {/* Theme Toggle (Mobile & Tablet) */}
            <button
              onClick={onToggleTheme}
              className="w-8.5 h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer active:scale-95 shadow-xs"
              title="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon size={15} className="text-amber-400" /> : <MoonIcon size={15} className="text-indigo-400" />}
            </button>

            {/* User Avatar Pill */}
            {user && (
              <div 
                onClick={() => setActiveTab('settings')}
                className="w-8.5 h-8.5 sm:w-auto sm:p-1 sm:pl-1.5 sm:pr-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-center sm:justify-start gap-2 transition cursor-pointer active:scale-95 shadow-xs"
                title={user.email}
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center">
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                  {user.email?.split('@')[0]}
                </span>
              </div>
            )}
          </div>

        </header>

        {/* Scrollable Main Application Canvas (Generous mobile pb to clear bottom bar) */}
        <main className="flex-1 overflow-y-auto overscroll-y-none px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-6 pb-[calc(110px+max(env(safe-area-inset-bottom),20px))] lg:pb-12 bg-[#f8fafc] dark:bg-[#070b12] transition-colors duration-200">
          <div className="w-full max-w-[1440px] space-y-6">
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
              href="https://dispatcher.zaynahspos.com" 
              target="_blank" 
              rel="noreferrer" 
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              dispatcher.zaynahspos.com
            </a>
          </div>
        </footer>

      </div>

      {/* ========================================================
          3. MOBILE NATIVE BOTTOM NAVIGATION BAR (Apple iOS Style)
          ======================================================== */}
      <nav 
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090d16]/95 border-t border-slate-200 dark:border-slate-800/90 flex pb-[max(env(safe-area-inset-bottom),8px)] h-[calc(56px+max(env(safe-area-inset-bottom),8px))] shadow-[0_-8px_25px_rgba(0,0,0,0.12)] transition-colors"
      >
        {mobileBottomTabs.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 gap-0.5 relative transition-all active:scale-95 cursor-pointer ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {/* Active Pill Bar */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              )}
              
              <tab.Icon
                size={20}
                className={isActive ? 'text-emerald-600 dark:text-emerald-400 scale-105 transition-transform' : 'text-slate-600 dark:text-slate-400'}
              />
              
              <span className={`text-[10px] leading-tight truncate px-0.5 max-w-full ${
                isActive ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-400'
              }`}>
                {tab.mobileLabel}
              </span>

              {/* Notification Badge */}
              {tab.badge !== null && tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute top-1 right-[calc(50%-16px)] min-w-[15px] h-3.5 px-1 bg-emerald-500 text-slate-950 text-[9px] rounded-full font-black flex items-center justify-center leading-none shadow-xs">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* ========================================================
          4. MOBILE FULL-SCREEN DRAWER (When hamburger clicked)
          ======================================================== */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 transition-opacity animate-in fade-in"
          />

          {/* Drawer Menu */}
          <div className="relative w-80 max-w-[85vw] bg-white dark:bg-[#0c121e] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Safe Area Notch/Dynamic Island Clearance Header */}
            <div className="pt-[max(env(safe-area-inset-top),1.25rem)] pb-3 px-4 border-b border-slate-200/90 dark:border-slate-800/90 flex items-center justify-between bg-white dark:bg-[#0c121e] shrink-0">
              <div className="flex items-center gap-2.5">
                <img 
                  src="/favicon-96x96.png?v=20261014" 
                  className="w-8 h-8 rounded-xl object-contain shadow-xs border border-slate-100 dark:border-slate-800" 
                  alt="Logo" 
                />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Zaynahs Dispatcher</h2>
                  <p className="text-[10px] text-emerald-500 font-bold tracking-wide">PostEx Logistics AI</p>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Close menu"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Profile Mini Card in Drawer */}
            {user && (
              <div className="mx-3 mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                    {user.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {user.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                  Active
                </span>
              </div>
            )}

            {/* Navigation Tabs List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold cursor-pointer transition ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white dark:bg-emerald-500/15 dark:text-emerald-400 font-bold border border-emerald-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.Icon size={19} className={activeTab === tab.id ? 'text-emerald-400' : 'text-slate-400'} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== null && tab.badge !== undefined && tab.badge > 0 && (
                    <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-black">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Footer with Hard Refresh, Theme Toggle & Sign Out */}
            <div className="p-3.5 pb-[max(env(safe-area-inset-bottom),1.25rem)] border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 space-y-2 shrink-0">
              {/* Hard Refresh / Update Button in Mobile Drawer */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleRefreshApp()
                }}
                disabled={isRefreshing}
                className="w-full py-2.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <RefreshIcon size={15} className={isRefreshing ? 'animate-spin text-emerald-500' : 'text-emerald-500'} />
                <span>{isRefreshing ? 'Updating App...' : 'Refresh & Check Updates'}</span>
              </button>

              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 px-1 py-1">
                <span>Theme</span>
                <button onClick={onToggleTheme} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-emerald-500/10 transition">
                  {theme === 'dark' ? <><SunIcon size={14} className="text-amber-400" /> Light Mode</> : <><MoonIcon size={14} className="text-indigo-400" /> Dark Mode</>}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onLogout()
                }}
                className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
