import React from 'react'

export interface TabItem {
  id: string
  label: string
  mobileLabel: string
  Icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: number | null
}

interface BottomTabBarProps {
  tabs: TabItem[]
  activeTab: string
  setActiveTab: (tab: any) => void
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#0c121e] border-t border-slate-200/90 dark:border-slate-800 flex items-stretch h-[60px] pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-colors select-none">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 gap-1 relative transition-colors active:scale-95 ${
            activeTab === tab.id
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          {/* Active indicator bar */}
          {activeTab === tab.id && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 dark:bg-emerald-400 rounded-full" />
          )}

          <div className="relative flex items-center justify-center">
            <tab.Icon
              size={20}
              className={activeTab === tab.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}
            />
            {/* Badge anchored to icon */}
            {tab.badge !== null && tab.badge !== undefined && tab.badge > 0 && (
              <span className="absolute -top-1 -right-2.5 min-w-[15px] h-3.5 px-0.5 bg-emerald-500 text-white text-[9px] rounded-full font-bold flex items-center justify-center leading-none ring-2 ring-white dark:ring-[#0c121e]">
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </div>

          <span className={`text-[10px] font-semibold leading-tight ${
            activeTab === tab.id ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}>
            {tab.mobileLabel}
          </span>
        </button>
      ))}
    </nav>
  )
}
