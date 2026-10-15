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
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex safe-bottom-padding shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-colors">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative transition-colors active:scale-95 ${
            activeTab === tab.id
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          {/* Active indicator bar */}
          {activeTab === tab.id && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-500 dark:bg-emerald-400 rounded-full" />
          )}
          <tab.Icon
            size={22}
            className={activeTab === tab.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}
          />
          <span className={`text-[10px] font-semibold leading-none ${
            activeTab === tab.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
          }`}>
            {tab.mobileLabel}
          </span>
          {/* Badge */}
          {tab.badge !== null && tab.badge !== undefined && tab.badge > 0 && (
            <span className="absolute top-1 right-[calc(50%-18px)] min-w-[16px] h-4 px-1 bg-emerald-500 text-white text-[9px] rounded-full font-bold flex items-center justify-center leading-none">
              {tab.badge > 99 ? '99+' : tab.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}
