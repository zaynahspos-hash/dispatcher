import React from 'react'
import { SearchIcon, CloseIcon } from '../Icons'
import { ScrollableChipsBar } from '../common/ScrollableChipsBar'
import { StatusFilterType, SourceFilterType, SearchScopeType, getLocalTodayDate, getDatePresetsInfo, DatePresetType } from './types'
import { formatDaysCount } from '../../utils/report/analytics'

interface HistoryFilterBarProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  searchScope?: SearchScopeType
  setSearchScope?: (scope: SearchScopeType) => void
  searchExclude?: boolean
  setSearchExclude?: (val: boolean) => void
  fromDate: string
  setFromDate: (val: string) => void
  toDate: string
  setToDate: (val: string) => void
  statusSelect: string
  setStatusSelect: (val: string) => void
  pickupFilter: string
  setPickupFilter: (val: string) => void
  uniqueCities: string[]
  handleClearFilters: () => void
  statusFilter: StatusFilterType
  setStatusFilter: (filter: StatusFilterType) => void
  sourceFilter?: SourceFilterType
  setSourceFilter?: (filter: SourceFilterType) => void
  whatsappFilter?: 'all' | 'pending' | 'sent'
  setWhatsappFilter?: (filter: 'all' | 'pending' | 'sent') => void
  onAutoFitColumns?: (e?: React.MouseEvent) => void
  isSyncing?: boolean
  syncProgress?: string
  syncElapsedSeconds?: number
  counts: {
    all: number
    pendingLoadsheet: number
    booked: number
    inTransit: number
    outForDelivery?: number
    actionRequired?: number
    delivered: number
    returned: number
    cancelled: number
    waSent?: number
    waPending?: number
  }
  sourceCounts?: {
    all: number
    app: number
    portal: number
  }
  autoExpandLines?: boolean
  onToggleAutoExpandLines?: () => void
}

export function HistoryFilterBar({
  searchQuery,
  setSearchQuery,
  searchScope = 'all',
  setSearchScope,
  searchExclude = false,
  setSearchExclude,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  statusSelect,
  setStatusSelect,
  pickupFilter,
  setPickupFilter,
  uniqueCities,
  handleClearFilters,
  statusFilter,
  setStatusFilter,
  sourceFilter = 'all',
  setSourceFilter,
  whatsappFilter = 'all',
  setWhatsappFilter,
  onAutoFitColumns,
  autoExpandLines,
  onToggleAutoExpandLines,
  isSyncing = false,
  syncProgress = '',
  syncElapsedSeconds = 0,
  counts,
  sourceCounts
}: HistoryFilterBarProps) {
  const today = getLocalTodayDate()
  const isCustomFilterActive = Boolean(
    (fromDate && fromDate !== today) || 
    (toDate && toDate !== today) ||
    (statusSelect && statusSelect !== 'all') ||
    (pickupFilter && pickupFilter !== 'all') ||
    (whatsappFilter && whatsappFilter !== 'all') ||
    (sourceFilter && sourceFilter !== 'all') ||
    (statusFilter && statusFilter !== 'all') ||
    (searchScope && searchScope !== 'all') ||
    (searchQuery && searchExclude) ||
    searchQuery
  )

  const presetsInfo = getDatePresetsInfo()
  const activePreset = presetsInfo.detectPreset(fromDate, toDate)
  const daysText = formatDaysCount(fromDate, toDate)

  const handleQuickDate = (type: DatePresetType) => {
    const range = presetsInfo.getRangeForPreset(type)
    setFromDate(range.fromDate)
    setToDate(range.toDate)
  }

  const tabs = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'pending_loadsheet', label: 'Pending loadsheet', count: counts.pendingLoadsheet },
    { id: 'booked', label: 'Booked', count: counts.booked },
    { id: 'intransit', label: 'In transit', count: counts.inTransit },
    { id: 'out_for_delivery', label: 'Out for delivery', count: counts.outForDelivery ?? 0 },
    { id: 'action_required', label: 'Action required', count: counts.actionRequired ?? 0 },
    { id: 'delivered', label: 'Delivered', count: counts.delivered },
    { id: 'returned', label: 'Returned', count: counts.returned },
    { id: 'cancelled', label: 'Cancelled', count: counts.cancelled }
  ] as const

  return (
    <div className="w-full">
      {/* Live PostEx range sync feedback banner */}
      {isSyncing && (
        <div className="tb" style={{ background: 'var(--acs)', color: 'var(--ac)', fontWeight: 600 }}>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="sm2">{syncProgress || 'Loading parcels directly from PostEx...'}</span>
          {typeof syncElapsedSeconds === 'number' && syncElapsedSeconds >= 0 && (
            <span className="mono sm2" style={{ marginLeft: 'auto' }}>
              {Math.floor(syncElapsedSeconds / 60)}:{(syncElapsedSeconds % 60).toString().padStart(2, '0')}s
            </span>
          )}
        </div>
      )}

      {/* Tier 1: Search scope dropdown, search input, exclude, and reset */}
      <div className="tb justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:w-auto">
          {setSearchScope && (
            <select
              className="in shrink-0 text-xs sm:text-sm"
              style={{ width: '120px' }}
              value={searchScope}
              onChange={e => setSearchScope(e.target.value as SearchScopeType)}
              title="Search field filter: All, Order #, Tracking, Customer, Phone"
            >
              <option value="all">All fields</option>
              <option value="reference">Order #</option>
              <option value="tracking">Tracking</option>
              <option value="name">Customer</option>
              <option value="phone">Phone</option>
            </select>
          )}
          <div className="sw">
            <SearchIcon className="w-4 h-4 shrink-0 pointer-events-none" />
            <input
              type="text"
              placeholder="Search order #, tracking, customer, phone"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="sw-clear"
                title="Clear search"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {setSearchExclude && (
            <button
              type="button"
              className={`btn sm ${searchExclude ? 'p' : ''}`}
              onClick={() => setSearchExclude(!searchExclude)}
              title="Exclude matching results from display"
            >
              Exclude
            </button>
          )}
          {isCustomFilterActive && (
            <button
              type="button"
              className="btn sm"
              onClick={handleClearFilters}
              title="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Tier 2: Date presets, custom date range, status select, city select */}
      <div className="tb justify-between gap-2.5">
        {/* Date presets with smooth horizontal scroll */}
        <div className="seg-bar">
          <button
            type="button"
            className={activePreset === 'today' ? 'on' : ''}
            onClick={() => handleQuickDate('today')}
          >
            Today
          </button>
          <button
            type="button"
            className={activePreset === 'yesterday' ? 'on' : ''}
            onClick={() => handleQuickDate('yesterday')}
          >
            Yesterday
          </button>
          <button
            type="button"
            className={activePreset === 'last7' ? 'on' : ''}
            onClick={() => handleQuickDate('last7')}
          >
            Last 7 days
          </button>
          <button
            type="button"
            className={activePreset === 'last30' ? 'on' : ''}
            onClick={() => handleQuickDate('last30')}
          >
            Last 30 days
          </button>
          <button
            type="button"
            className={activePreset === 'thisMonth' ? 'on' : ''}
            onClick={() => handleQuickDate('thisMonth')}
          >
            This month
          </button>
          <button
            type="button"
            className={activePreset === 'last3Months' ? 'on' : ''}
            onClick={() => handleQuickDate('last3Months')}
          >
            Last 3 months
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Custom Date Range atomic group (never splits across lines) */}
          <div className="inline-flex items-center gap-1.5 shrink-0 bg-slate-50/50 dark:bg-slate-900/40 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <input
              type="date"
              className="in text-xs sm:text-sm !h-8 !px-2"
              style={{ width: '130px' }}
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              title="From date"
            />
            <span className="t3 text-xs font-semibold px-0.5">to</span>
            <input
              type="date"
              className="in text-xs sm:text-sm !h-8 !px-2"
              style={{ width: '130px' }}
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              title="To date"
            />
            {daysText && (
              <span className="t3 text-[11px] mono hidden sm:inline px-1 font-semibold">{daysText}</span>
            )}
          </div>

          {/* Status & City Selectors */}
          <div className="inline-flex items-center gap-1.5 shrink-0">
            <select
              className="in text-xs sm:text-sm !h-8 !px-2"
              style={{ minWidth: '120px' }}
              value={statusSelect}
              onChange={e => setStatusSelect(e.target.value)}
              title="All statuses"
            >
              <option value="all">All statuses</option>
              <option value="pending_loadsheet">Pending loadsheet</option>
              <option value="booked">Booked</option>
              <option value="intransit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="action_required">Action Required</option>
              <option value="delivered">Delivered</option>
              <option value="returned">Returned</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="in text-xs sm:text-sm !h-8 !px-2"
              style={{ minWidth: '125px' }}
              value={pickupFilter}
              onChange={e => setPickupFilter(e.target.value)}
              title="All cities"
            >
              <option value="all">All cities ({uniqueCities.length})</option>
              {uniqueCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tier 3: Status filter tabs wrapped in ScrollableChipsBar */}
      <div className="border-b border-[var(--bd)] px-3 py-2 bg-[var(--s1)]">
        <ScrollableChipsBar
          containerClassName="flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar py-0.5 scroll-smooth touch-pan-x"
          ariaLabel="Status filter tabs"
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`filter-tab ${statusFilter === tab.id ? 'on' : ''}`}
              onClick={() => setStatusFilter(tab.id as StatusFilterType)}
            >
              <span>{tab.label}</span>
              <i>{tab.count}</i>
            </button>
          ))}
        </ScrollableChipsBar>
      </div>

      {/* Tier 4: Source, WhatsApp, Auto-fit, and Expand all */}
      <div className="tb justify-between gap-2.5" style={{ borderBottom: '1px solid var(--bd)' }}>
        <div className="flex items-center gap-3 flex-wrap">
          {setSourceFilter && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="t3 text-[11px] font-bold tracking-wider">SOURCE</span>
              <div className="seg-bar">
                <button
                  type="button"
                  className={sourceFilter === 'all' ? 'on' : ''}
                  onClick={() => setSourceFilter('all')}
                >
                  All {sourceCounts?.all ?? counts.all}
                </button>
                <button
                  type="button"
                  className={sourceFilter === 'app' ? 'on' : ''}
                  onClick={() => setSourceFilter('app')}
                >
                  Booked in app {sourceCounts?.app ?? 0}
                </button>
                <button
                  type="button"
                  className={sourceFilter === 'portal' ? 'on' : ''}
                  onClick={() => setSourceFilter('portal')}
                >
                  External / portal {sourceCounts?.portal ?? 0}
                </button>
              </div>
            </div>
          )}

          {setWhatsappFilter && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="t3 text-[11px] font-bold tracking-wider">WHATSAPP</span>
              <div className="seg-bar">
                <button
                  type="button"
                  className={whatsappFilter === 'all' ? 'on' : ''}
                  onClick={() => setWhatsappFilter('all')}
                >
                  All {counts.all}
                </button>
                <button
                  type="button"
                  className={whatsappFilter === 'pending' ? 'on' : ''}
                  onClick={() => setWhatsappFilter('pending')}
                >
                  Pending {counts.waPending ?? 0}
                </button>
                <button
                  type="button"
                  className={whatsappFilter === 'sent' ? 'on' : ''}
                  onClick={() => setWhatsappFilter('sent')}
                >
                  Sent {counts.waSent ?? 0}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {onAutoFitColumns && (
            <button
              type="button"
              className="btn sm"
              onClick={onAutoFitColumns}
              title="Auto-fit table column widths"
            >
              Auto-fit
            </button>
          )}

          {onToggleAutoExpandLines && (
            <button
              type="button"
              className="btn sm"
              onClick={onToggleAutoExpandLines}
              title="Toggle multi-line expansion on addresses and notes"
            >
              {autoExpandLines ? 'Collapse all' : 'Expand all'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
