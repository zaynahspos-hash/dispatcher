import React from 'react'
import { TabItem } from './BottomTabBar'
import { ChevronLeftIcon, ChevronRightIcon } from '../Icons'

interface DesktopSidebarProps {
  tabs: TabItem[]
  activeTab: string
  setActiveTab: (tab: any) => void
  isSettingsConfigured: boolean
  operationalCitiesCount?: number
  dailyRequests?: number
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  tabs,
  activeTab,
  setActiveTab,
  isSettingsConfigured,
  operationalCitiesCount = 500,
  dailyRequests = 0,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const operationsTabIds = ['paste', 'table', 'results', 'history', 'vault']
  const operationsTabs = tabs.filter(t => operationsTabIds.includes(t.id))
  const systemTabs = tabs.filter(t => !operationsTabIds.includes(t.id))

  return (
    <aside
      className={`hidden lg:flex flex-col bg-white dark:bg-[#0c121e] border-r border-slate-200/80 dark:border-slate-800/80 select-none shrink-0 z-30 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64 xl:w-72'
      }`}
    >
      {/* Brand Header */}
      <div className={`border-b border-slate-200/70 dark:border-slate-800/80 transition-all ${
        isCollapsed ? 'p-2.5 flex flex-col items-center gap-2' : 'p-4 xl:p-5 flex items-center justify-between gap-3'
      }`}>
        <div 
          className="relative group cursor-pointer flex items-center gap-3 min-w-0" 
          onClick={() => setActiveTab('paste')}
          title="Zaynahs Courier • PostEx AI Dispatcher"
        >
          <div className="relative shrink-0">
            <img 
              src="/apple-touch-icon.png?v=20261014" 
              onError={(e) => { (e.target as HTMLImageElement).src = '/favicon-96x96.png?v=20261014' }} 
              className={`${isCollapsed ? 'w-9 h-9' : 'w-10 h-10'} rounded-xl object-contain shadow-md shadow-emerald-500/10 border border-slate-200 dark:border-slate-700/60 group-hover:scale-105 transition-transform`} 
              alt="Dispatcher Logo" 
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#0c121e] rounded-full" title="PostEx V3 Engine Ready" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
                Zaynahs Courier
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                PostEx &bull; AI Dispatcher
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Collapse/Expand Toggle Button (< / >) */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition active:scale-95 shrink-0 shadow-2xs ${
              isCollapsed ? 'w-8 h-8 mt-0.5' : 'w-7.5 h-7.5'
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar to maximize screen space'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRightIcon size={14} /> : <ChevronLeftIcon size={14} />}
          </button>
        )}
      </div>

      {/* Scrollable Navigation Groups */}
      <div className={`flex-1 overflow-y-auto space-y-5 overscroll-y-none scrollbar-none ${
        isCollapsed ? 'px-2 py-3' : 'px-3 py-4'
      }`}>
        
        {/* Group 1: Operations */}
        <div>
          {!isCollapsed && (
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                Operations
              </span>
            </div>
          )}

          <nav className="space-y-1.5">
            {operationsTabs.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                  className={`transition-all group cursor-pointer relative ${
                    isCollapsed
                      ? `w-11 h-11 mx-auto rounded-xl flex items-center justify-center ${
                          isActive
                            ? 'bg-slate-900 text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/40 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`
                      : `w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                          isActive
                            ? 'bg-slate-900 text-white dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`
                  }`}
                >
                  <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                    <tab.Icon
                      size={isCollapsed ? 19 : 17}
                      className={`transition-colors shrink-0 ${
                        isActive
                          ? 'text-emerald-400'
                          : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{tab.label}</span>}
                  </div>

                  {tab.badge !== null && tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`font-black shrink-0 shadow-xs ${
                        isCollapsed
                          ? 'absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 text-[9px] rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center ring-2 ring-white dark:ring-[#0c121e]'
                          : `text-[10px] px-2 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`
                      }`}
                    >
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Separator in collapsed mode */}
        {isCollapsed && <div className="border-t border-slate-200/70 dark:border-slate-800/80 my-2" />}

        {/* Group 2: Management & Settings */}
        <div>
          {!isCollapsed && (
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase">
                System & Config
              </span>
            </div>
          )}

          <nav className="space-y-1.5">
            {systemTabs.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                  className={`transition-all group cursor-pointer relative ${
                    isCollapsed
                      ? `w-11 h-11 mx-auto rounded-xl flex items-center justify-center ${
                          isActive
                            ? 'bg-slate-900 text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/40 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`
                      : `w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                          isActive
                            ? 'bg-slate-900 text-white dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`
                  }`}
                >
                  <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                    <tab.Icon
                      size={isCollapsed ? 19 : 17}
                      className={`transition-colors shrink-0 ${
                        isActive
                          ? 'text-emerald-400'
                          : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{tab.label}</span>}
                  </div>

                  {tab.id === 'settings' && !isSettingsConfigured && (
                    <span
                      className={`rounded-full bg-amber-500 animate-pulse ${
                        isCollapsed ? 'absolute top-1 right-1 w-2.5 h-2.5' : 'w-2 h-2'
                      }`}
                      title="Configuration Needed"
                    />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Operational Engine Quick Summary */}
        {isCollapsed ? (
          <div
            className="w-11 h-11 mx-auto rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center cursor-help transition hover:scale-105"
            title={`PostEx V3 Live • ${operationalCitiesCount}+ Active Cities • ${Math.max(0, 1500 - dailyRequests)} AI Quota Left`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        ) : (
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
        )}

      </div>

      {/* Sidebar Footer */}
      <div className={`border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#080d17]/60 text-slate-400 ${
        isCollapsed ? 'p-2.5 text-center text-[10px] font-mono' : 'p-3 flex items-center justify-between text-[11px]'
      }`}>
        {isCollapsed ? (
          <span title="v2026.10 • Zaynahs POS">v26</span>
        ) : (
          <>
            <span>v2026.10</span>
            <span>Zaynahs POS</span>
          </>
        )}
      </div>

    </aside>
  )
}
