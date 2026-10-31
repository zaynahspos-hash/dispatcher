import React from 'react'
import { SearchIcon, AutoFitIcon, TrashIcon, CloseIcon } from '../Icons'

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
  onClearFilters,
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
      <div className="tb">
        <div className="sw">
          <SearchIcon size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search customer, phone, tracking, order #, city"
            className="in"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <CloseIcon size={14} />
            </button>
          )}
        </div>

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

      {/* 2. Filter Tabs with Italic Pill Counts (.filter-tabs-bar from app (1).html) */}
      <div className="filter-tabs-bar">
        {tabs.map(tab => {
          const isActive = statusFilter === tab.id
          return (
            <span
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`filter-tab ${isActive ? 'on' : ''}`}
            >
              {tab.label} <i>{tab.count}</i>
            </span>
          )
        })}
      </div>
    </div>
  )
}

