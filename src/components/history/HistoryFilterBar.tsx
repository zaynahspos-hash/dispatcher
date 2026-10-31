import React from 'react'
import { SearchIcon, CloseIcon } from '../Icons'
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
      <div className="tb">
        {setSearchScope && (
          <select
            className="in"
            style={{ width: '130px' }}
            value={searchScope}
            onChange={e => setSearchScope(e.target.value as SearchScopeType)}
            title="Search field filter: All, Order #, Tracking, Customer, Phone"
          >
            <option value="all">All fields</option>
            <option value="orderRef">Order #</option>
            <option value="trackingNumber">Tracking</option>
            <option value="customerName">Customer</option>
            <option value="customerPhone">Phone</option>
          </select>
        )}
        <div className="sw">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            className="in"
            type="text"
            placeholder="Search order #, tracking, customer, phone"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Clear search"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
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

      {/* Tier 2: Date presets, custom date range, status select, city select */}
      <div className="tb">
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
        <span className="g"></span>
        <input
          type="date"
          className="in"
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
          title="From date"
        />
        <span className="t3">to</span>
        <input
          type="date"
          className="in"
          value={toDate}
          onChange={e => setToDate(e.target.value)}
          title="To date"
        />
        {daysText && (
          <span className="t3 sm2 mono hidden xl:inline">{daysText}</span>
        )}
        <select
          className="in"
          value={statusSelect}
          onChange={e => setStatusSelect(e.target.value)}
          title="All statuses"
        >
          <option value="all">All statuses</option>
          <option value="Booked">Booked</option>
          <option value="In Transit">In Transit</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
          <option value="Returned">Returned</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select
          className="in"
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

      {/* Tier 3: Status filter tabs */}
      <div className="filter-tabs-bar">
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
      </div>

      {/* Tier 4: Source, WhatsApp, Auto-fit, and Expand all */}
      <div className="tb" style={{ borderBottom: '1px solid var(--bd)' }}>
        {setSourceFilter && (
          <>
            <span className="t3 sm2">SOURCE</span>
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
          </>
        )}

        {setWhatsappFilter && (
          <>
            <span className="t3 sm2" style={{ marginLeft: '8px' }}>WHATSAPP</span>
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
          </>
        )}

        <span className="g"></span>

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
  )
}
