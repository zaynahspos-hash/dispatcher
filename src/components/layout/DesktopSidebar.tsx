import React from 'react'
import { TabItem } from './BottomTabBar'

interface DesktopSidebarProps {
  tabs: TabItem[]
  activeTab: string
  setActiveTab: (tab: any) => void
  isSettingsConfigured: boolean
  operationalCitiesCount?: number
  dailyRequests?: number
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  tabs,
  activeTab,
  setActiveTab,
  isSettingsConfigured,
  operationalCitiesCount = 500,
  dailyRequests = 0
}) => {
  const operationsTabIds = ['paste', 'table', 'results', 'history']
  const operationsTabs = tabs.filter(t => operationsTabIds.includes(t.id))
  const systemTabs = tabs.filter(t => !operationsTabIds.includes(t.id))

  return (
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
          <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
            Zaynahs Courier
          </h1>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
            PostEx &bull; AI Dispatcher
          </p>
        </div>
      </div>

      {/* Scrollable Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 overscroll-y-none scrollbar-none">
        
        {/* Group 1: Operations */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Operations
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
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              PostEx V3 Engine
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
              Live
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>Cities Coverage</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-bold text-[10px]">
              {operationalCitiesCount}+ Active
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>Free AI Quota</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-bold text-[10px]">
              {Math.max(0, 1500 - dailyRequests)} left
            </span>
          </div>
        </div>

      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#080d17]/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>v2026.10</span>
        <span>Zaynahs POS</span>
      </div>

    </aside>
  )
}
