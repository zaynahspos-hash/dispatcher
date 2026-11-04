import React from 'react'
import { SearchIcon, AutoFitIcon, TrashIcon, CloseIcon } from '../Icons'
import { ScrollableChipsBar } from '../common/ScrollableChipsBar'

export type ResultsStatusFilter = 'all' | 'success' | 'error' | 'manual' | 'cancelled'

interface ResultsFilterBarProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  statusFilter: ResultsStatusFilter
  setStatusFilter: (filter: ResultsStatusFilter) => void
  counts: {
    all: number
    booked: number
    failed: number
    drafts: number
    cancelled: number
  }
  onClearFilters: () => void
  expandDefaults?: boolean
  onToggleExpandDefaults?: () => void
  onAutoFitColumns?: (e?: React.MouseEvent) => void
  onClearAll?: () => void
}

export const ResultsFilterBar: React.FC<ResultsFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  counts,
  onClearFilters: _onClearFilters,
  expandDefaults,
  onToggleExpandDefaults,
  onAutoFitColumns,
  onClearAll
}) => {
  const tabs = [
    { id: 'all' as const, label: 'All', count: counts.all },
    { id: 'success' as const, label: 'Booked', count: counts.booked },
    { id: 'error' as const, label: 'Failed', count: counts.failed },
    { id: 'manual' as const, label: 'Drafts', count: counts.drafts },
    { id: 'cancelled' as const, label: 'Cancelled', count: counts.cancelled }
  ]

  return (
    <div className="w-full">
      {/* 1. Main Search & Utility Toolbar (.tb from app (1).html) */}
      <div className="tb justify-between gap-2.5">
        <div className="sw">
          <SearchIcon size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search customer, phone, tracking, order #, city"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="sw-clear"
              title="Clear search"
            >
              <CloseIcon size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onToggleExpandDefaults && (
            <button
              type="button"
              onClick={onToggleExpandDefaults}
              className="btn"
              title="Toggle defaults columns on desktop or card expand on mobile"
            >
              <span>{expandDefaults ? 'Collapse defaults' : 'Expand defaults'}</span>
            </button>
          )}

          {onAutoFitColumns && (
            <button
              type="button"
              onClick={onAutoFitColumns}
              className="btn"
              title="Auto-fit columns on desktop"
            >
              <AutoFitIcon size={15} />
              <span>Auto-fit</span>
            </button>
          )}

          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="btn d"
              title="Clear all results"
            >
              <TrashIcon size={15} />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter Tabs with Italic Pill Counts (.filter-tabs-bar wrapped in ScrollableChipsBar) */}
      <div className="border-b border-[var(--bd)] px-3 py-2 bg-[var(--s1)]">
        <ScrollableChipsBar
          containerClassName="flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar py-0.5 scroll-smooth touch-pan-x"
          ariaLabel="Results status filter tabs"
        >
          {tabs.map(tab => {
            const isActive = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`filter-tab ${isActive ? 'on' : ''}`}
              >
                <span>{tab.label}</span>
                <i>{tab.count}</i>
              </button>
            )
          })}
        </ScrollableChipsBar>
      </div>
    </div>
  )
}

