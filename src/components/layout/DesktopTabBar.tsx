import React from 'react'
import { TabItem } from './BottomTabBar'
import { ScrollableChipsBar } from '../common/ScrollableChipsBar'

interface DesktopTabBarProps {
  tabs: TabItem[]
  activeTab: string
  setActiveTab: (tab: any) => void
}

export const DesktopTabBar: React.FC<DesktopTabBarProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="hidden sm:flex flex-none bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto w-full min-w-0">
        <ScrollableChipsBar
          containerClassName="flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-none"
          fadeColorClass={{
            left: 'from-white via-white/95 to-transparent dark:from-gray-900 dark:via-gray-900/95',
            right: 'from-white via-white/95 to-transparent dark:from-gray-900 dark:via-gray-900/95'
          }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-3.5 text-sm font-semibold border-b-2 transition shrink-0 cursor-pointer flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <tab.Icon
                size={18}
                className={activeTab === tab.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}
              />
              <span>{tab.label}</span>
              {tab.badge !== null && tab.badge !== undefined && tab.badge > 0 && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.id
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </ScrollableChipsBar>
      </div>
    </div>
  )
}
