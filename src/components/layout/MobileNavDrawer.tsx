import React from 'react'
import { TabItem } from './BottomTabBar'
import { CloseIcon, SunIcon, MoonIcon, DownloadIcon, SmartphoneIcon } from '../Icons'

interface MobileNavDrawerProps {
  isOpen: boolean
  onClose: () => void
  tabs: TabItem[]
  activeTab: string
  setActiveTab: (tab: any) => void
  user: any
  dailyTokens: number
  monthlyTokens: number
  onLogout: () => void
  onOpenAuthModal: () => void
  theme: string
  onToggleTheme: () => void
  isInstallable: boolean
  isStandalone: boolean
  onInstallApp: () => void
  onOpenInstallGuide: () => void
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  tabs,
  activeTab,
  setActiveTab,
  user,
  dailyTokens,
  monthlyTokens,
  onLogout,
  onOpenAuthModal,
  theme,
  onToggleTheme,
  isInstallable,
  isStandalone,
  onInstallApp,
  onOpenInstallGuide,
}) => {
  return (
    <div 
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      
      {/* Sidebar panel */}
      <aside 
        className={`absolute inset-y-0 left-0 max-w-[280px] sm:max-w-xs w-full bg-white dark:bg-gray-900 flex flex-col transform safe-top-padding safe-bottom-padding border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ willChange: 'transform' }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <img 
              src="/favicon-96x96.png?v=20261014" 
              onError={(e) => { (e.target as HTMLImageElement).src = '/apple-touch-icon.png?v=20261014' }} 
              className="w-8 h-8 object-contain shrink-0" 
              alt="Logo" 
            />
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">Zaynahs Courier</h2>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">Courier Manager App</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition cursor-pointer flex items-center justify-center"
            aria-label="Close menu"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Navigation</p>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  onClose()
                }}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.Icon size={18} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-300'} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== null && tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Quick Actions / Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="border-b border-gray-200 dark:border-gray-800 pb-3 mb-1">
            {user ? (
              <div className="space-y-1.5">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                  Logged in as: <br />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xs">{user.email}</span>
                </div>
                {/* AI Token Usage */}
                <div className="sm:hidden flex items-center gap-2 bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 px-2.5 py-2 rounded-xl overflow-hidden">
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-700 dark:text-gray-300 font-medium flex-1 whitespace-nowrap overflow-hidden">
                    <span className="text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider shrink-0">AI</span>
                    <span className="text-slate-300 dark:text-gray-600 shrink-0">·</span>
                    <span className="text-slate-500 dark:text-gray-400 shrink-0">Today</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white shrink-0">
                      {dailyTokens >= 1000 ? `${(dailyTokens / 1000).toFixed(1)}k` : dailyTokens}
                    </span>
                    <span className="text-slate-300 dark:text-gray-600 shrink-0">|</span>
                    <span className="text-slate-500 dark:text-gray-400 shrink-0">Month</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white shrink-0">
                      {monthlyTokens >= 1000000 ? `${(monthlyTokens / 1000000).toFixed(2)}M` : monthlyTokens >= 1000 ? `${(monthlyTokens / 1000).toFixed(1)}k` : monthlyTokens}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onLogout()
                    onClose()
                  }}
                  className="w-full text-center text-xs py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-semibold rounded-xl transition cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuthModal()
                  onClose()
                }}
                className="w-full text-center text-xs py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                Sign In / Register
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Dark Theme</span>
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition cursor-pointer flex items-center justify-center w-8 h-8 touch-manipulation"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <SunIcon size={15} className="text-amber-500" /> : <MoonIcon size={15} className="text-gray-700" />}
            </button>
          </div>
          
          {isInstallable ? (
            <button
              onClick={() => {
                onInstallApp()
                onClose()
              }}
              className="w-full flex items-center justify-center gap-1.5 text-xs py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer animate-pulse shrink-0"
            >
              <DownloadIcon size={14} />
              <span>Install App</span>
            </button>
          ) : !isStandalone ? (
            <button
              onClick={() => {
                onOpenInstallGuide()
                onClose()
              }}
              className="w-full flex items-center justify-center gap-1.5 text-xs py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0 animate-pulse"
            >
              <SmartphoneIcon size={14} />
              <span>Install App (Guide)</span>
            </button>
          ) : null}

          <div className="text-[10px] text-gray-400 text-center">
            Zaynahs Courier v1.0.0
          </div>
        </div>
      </aside>
    </div>
  )
}
