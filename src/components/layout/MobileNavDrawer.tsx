import React from 'react'
import { TabItem } from './BottomTabBar'
import { SunIcon, MoonIcon, RefreshIcon, SmartphoneIcon } from '../Icons'
import { UserAvatar } from '../common/UserAvatar'

interface MobileNavDrawerProps {
  isOpen: boolean
  onClose: () => void
  tabs: TabItem[]
  activeTab: string
  setActiveTab: (tab: any) => void
  user: any
  displayName?: string
  avatarUrl?: string
  isRefreshing: boolean
  onRefreshApp: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onLogout: () => void
  isStandalone?: boolean
  isInstallable?: boolean
  onInstallApp?: () => void
  onOpenInstallGuide?: () => void
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  tabs,
  activeTab,
  setActiveTab,
  user,
  displayName,
  avatarUrl,
  isRefreshing,
  onRefreshApp,
  theme,
  onToggleTheme,
  onLogout,
  isStandalone,
  isInstallable: _isInstallable,
  onInstallApp,
  onOpenInstallGuide
}) => {
  if (!isOpen) return null

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        onClick={onClose}
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
            onClick={onClose}
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
              <UserAvatar email={user.email} avatarUrl={avatarUrl} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {displayName || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}
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
                onClose()
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
          {!isStandalone && (
            <button
              type="button"
              onClick={() => {
                onClose()
                if (onInstallApp) onInstallApp()
                else if (onOpenInstallGuide) onOpenInstallGuide()
              }}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <SmartphoneIcon size={15} />
              <span>Install Courier App</span>
              <span className="text-[9px] bg-emerald-800 text-emerald-100 px-1.5 py-0.5 rounded-full uppercase font-black">App</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose()
              onRefreshApp()
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
              onClose()
              onLogout()
            }}
            className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
