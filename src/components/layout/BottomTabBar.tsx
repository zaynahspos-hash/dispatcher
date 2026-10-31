import React from 'react'
import { PasteIcon, TableIcon, ResultsIcon, HistoryIcon, MoreIcon } from '../Icons'

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
  isSettingsConfigured?: boolean
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ tabs, activeTab, setActiveTab, isSettingsConfigured = true }) => {
  const parcelsTab = tabs.find(t => t.id === 'table')
  const resultsTab = tabs.find(t => t.id === 'results')

  // Check if we are in one of the sub-pages belonging to "More"
  const isMoreActive = ['more', 'vault', 'settings', 'admin', 'apps'].includes(activeTab)

  const items = [
    { id: 'paste', label: 'Paste', Icon: PasteIcon, badge: null, isActive: activeTab === 'paste' },
    { id: 'table', label: 'Parcels', Icon: TableIcon, badge: parcelsTab?.badge, isActive: activeTab === 'table' },
    { id: 'results', label: 'Results', Icon: ResultsIcon, badge: resultsTab?.badge, isActive: activeTab === 'results' },
    { id: 'history', label: 'History', Icon: HistoryIcon, badge: null, isActive: activeTab === 'history' },
    { id: 'more', label: 'More', Icon: MoreIcon, badge: !isSettingsConfigured ? 1 : null, isActive: isMoreActive },
  ]

  return (
    <nav className="min-[860px]:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--s1)] border-t border-[var(--bd)] flex items-stretch h-[56px] pb-[max(6px,env(safe-area-inset-bottom))] select-none transition-colors">
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          onClick={() => setActiveTab(item.id)}
          className={`flex-1 flex flex-col items-center justify-center pt-1.5 pb-1 gap-1 relative transition-colors active:opacity-70 ${
            item.isActive
              ? 'text-[var(--ac)] font-semibold'
              : 'text-[var(--t2)] hover:text-[var(--tx)]'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <item.Icon
              size={20}
              className={item.isActive ? 'text-[var(--ac)]' : 'text-[var(--t2)]'}
            />
            {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
              <span className="absolute -top-1.5 -right-3 min-w-[16px] h-4 px-1 bg-[var(--ac)] text-white text-[10px] rounded-full font-bold flex items-center justify-center leading-none shadow-xs">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </div>

          <span className={`text-[11px] leading-tight ${item.isActive ? 'text-[var(--ac)] font-semibold' : 'text-[var(--t2)]'}`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  )
}

