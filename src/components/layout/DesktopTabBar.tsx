import React from 'react'
import { TabItem } from './BottomTabBar'

interface DesktopTabBarProps {
  tabs: TabItem[]
  activeTab: string
  setActiveTab: (tab: any) => void
}

export const DesktopTabBar: React.FC<DesktopTabBarProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="hidden sm:flex flex-none bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-5 py-3.5 text-sm font-semibold border-b-2 transition shrink-0 cursor-pointer flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <tab.Icon
              size={18}
              className={activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}
            />
            <span>{tab.label}</span>
            {tab.badge !== null && tab.badge !== undefined && tab.badge > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.id
                  ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
