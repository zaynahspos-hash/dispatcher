import React from 'react'
import { SearchIcon, RefreshIcon, AutoFitIcon, CloseIcon, CalendarIcon, WhatsAppIcon } from '../Icons'
import { SearchableDropdown } from '../SearchableDropdown'
import { ScrollableChipsBar } from '../common/ScrollableChipsBar'
import { StatusFilterType, SourceFilterType, SearchScopeType, getLocalTodayDate, getDatePresetsInfo, DatePresetType } from './types'

interface HistoryFilterBarProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  searchScope?: SearchScopeType
  setSearchScope?: (scope: SearchScopeType) => void
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
}

export function HistoryFilterBar({
  searchQuery,
  setSearchQuery,
  searchScope = 'all',
  setSearchScope,
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
    searchQuery
  )

  // Apple iOS Segmented Date Presets Boundaries (Shared Single Source of Truth)
  const presetsInfo = getDatePresetsInfo()
  const activePreset = presetsInfo.detectPreset(fromDate, toDate)

  const handleQuickDate = (type: DatePresetType) => {
    const range = presetsInfo.getRangeForPreset(type)
    setFromDate(range.fromDate)
    setToDate(range.toDate)
  }

  const tabs = [
    { id: 'all', label: 'All', shortLabel: 'All', count: counts.all },
    { id: 'pending_loadsheet', label: 'Pending Loadsheet', shortLabel: 'Pending Sheet', count: counts.pendingLoadsheet },
    { id: 'booked', label: 'Booked', shortLabel: 'Booked', count: counts.booked },
    { id: 'intransit', label: 'In Transit', shortLabel: 'In Transit', count: counts.inTransit },
    { id: 'out_for_delivery', label: 'Out for Delivery', shortLabel: 'Out for Del', count: counts.outForDelivery ?? 0, isAttention: false },
    { id: 'action_required', label: 'Action Required', shortLabel: 'Action Req', count: counts.actionRequired ?? 0, isAttention: true },
    { id: 'delivered', label: 'Delivered', shortLabel: 'Delivered', count: counts.delivered },
    { id: 'returned', label: 'Returned', shortLabel: 'Returned', count: counts.returned },
    { id: 'cancelled', label: 'Cancelled', shortLabel: 'Cancelled', count: counts.cancelled }
  ] as const

  return (
    <div className="space-y-3.5 mb-5 w-full max-w-full min-w-0">
      {/* Search & Filter Trigger Bar */}
      <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3.5">
        
        {/* Live PostEx range sync feedback banner (100% identical to Admin tab) */}
        {isSyncing && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/90 dark:bg-emerald-900/25 px-3.5 py-2.5 animate-in fade-in duration-150">
            <svg className="animate-spin h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex-1 min-w-0 truncate">
              {syncProgress || 'Loading parcels directly from PostEx...'}
            </p>
            {typeof syncElapsedSeconds === 'number' && syncElapsedSeconds >= 0 && (
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-600/10 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-300 shrink-0">
                {Math.floor(syncElapsedSeconds / 60)}:{(syncElapsedSeconds % 60).toString().padStart(2, '0')}s
              </span>
            )}
          </div>
        )}

        {/* Main Search Input with Integrated Scope Selector */}
        <div className="relative flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all">
          {/* Integrated Scope Dropdown on Left */}
          {setSearchScope && (
            <div className="relative shrink-0 flex items-center h-full border-r border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60 rounded-l-xl">
              <select
                value={searchScope}
                onChange={e => setSearchScope(e.target.value as SearchScopeType)}
                className="h-full pl-2.5 pr-6 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 bg-transparent border-0 focus:ring-0 cursor-pointer appearance-none outline-none select-none tracking-tight"
                title="Search field filter: All, Name, Phone, Order Ref #, Tracking CN"
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium">All Fields</option>
                <option value="name" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium">Name Only</option>
                <option value="phone" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium">Phone Only</option>
                <option value="reference" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium">Order Ref #</option>
                <option value="tracking" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium">Tracking CN</option>
              </select>
              <span className="pointer-events-none absolute right-1.5 text-slate-400 dark:text-slate-500">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
          )}

          <span className="pl-2.5 text-slate-400 dark:text-slate-500 shrink-0">
            <SearchIcon size={15} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              searchScope === 'name' ? 'Search customer name only...' :
              searchScope === 'phone' ? 'Search phone number only...' :
              searchScope === 'reference' ? 'Search order reference # (e.g. AH858, #307...)' :
              searchScope === 'tracking' ? 'Search PostEx tracking CN only...' :
              'Search order #, tracking, customer, phone...'
            }
            className="w-full pl-2 pr-3 py-2 text-xs sm:text-sm bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-slate-800 dark:text-slate-100"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
            >
              <CloseIcon size={12} />
            </button>
          )}
        </div>

        {/* Native Apple iOS Segmented Date Presets (Matching Admin exactly) */}
        <div className="p-3 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CalendarIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Date Presets</span>
            </span>
            {activePreset ? (
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {activePreset === 'today' && 'Today'}
                {activePreset === 'yesterday' && 'Yesterday'}
                {activePreset === 'last7' && 'Last 7 Days'}
                {activePreset === 'thisMonth' && 'This Month'}
                {activePreset === 'last3Months' && 'Last 3 Months'}
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 px-2 py-0.5 rounded-full">
                Custom Range
              </span>
            )}
          </div>

          {/* Apple iOS Segmented Control */}
          <ScrollableChipsBar
            className="w-full sm:w-auto inline-flex"
            containerClassName="inline-flex p-1 bg-slate-200/70 dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shadow-inner w-full sm:w-auto overflow-x-auto no-scrollbar gap-1"
            fadeColorClass={{
              left: 'from-slate-200 via-slate-200/90 to-transparent dark:from-slate-800 dark:via-slate-800/90',
              right: 'from-slate-200 via-slate-200/90 to-transparent dark:from-slate-800 dark:via-slate-800/90'
            }}
          >
            <button
              type="button"
              onClick={() => handleQuickDate('today')}
              className={`flex-1 sm:flex-initial text-center px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                activePreset === 'today'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/90 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate('yesterday')}
              className={`flex-1 sm:flex-initial text-center px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                activePreset === 'yesterday'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/90 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate('last7')}
              className={`flex-1 sm:flex-initial text-center px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                activePreset === 'last7'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/90 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate('thisMonth')}
              className={`flex-1 sm:flex-initial text-center px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                activePreset === 'thisMonth'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/90 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate('last3Months')}
              className={`flex-1 sm:flex-initial text-center px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                activePreset === 'last3Months'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/90 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              Last 3 Months
            </button>
          </ScrollableChipsBar>
        </div>

        {/* 5-Column Filter Controls Row (Matching Admin's exact 5-column responsive layout with Reset Filters) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* From Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full h-9 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* To Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full h-9 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Status Select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Status Filter
            </label>
            <select
              value={statusSelect}
              onChange={e => setStatusSelect(e.target.value)}
              className="w-full h-9 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending_loadsheet">Pending Loadsheet</option>
              <option value="booked">Booked</option>
              <option value="transit">In Transit / Warehouse</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="under_review">Under Review / Action Required</option>
              <option value="delivered">Delivered</option>
              <option value="returned">Returned</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* City / Destination Select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              City / Destination
            </label>
            <SearchableDropdown
              value={pickupFilter}
              onChange={setPickupFilter}
              options={uniqueCities}
              placeholder="All Cities"
              allOptionLabel={`All Cities (${uniqueCities.length})`}
              allOptionValue="all"
              className="w-full"
            />
          </div>

          {/* Reset Filters & Auto-Fit Action Button (Exact same placement as Admin) */}
          <div className="flex items-center gap-2">
            {isCustomFilterActive && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="h-9 flex-1 px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs transition active:scale-95 cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                title="Reset all filters to defaults"
              >
                <CloseIcon size={12} />
                <span>Reset Filters</span>
              </button>
            )}
            {onAutoFitColumns && (
              <button
                type="button"
                onClick={onAutoFitColumns}
                className="h-9 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center gap-1.5"
                title="Auto-fit column widths"
              >
                <AutoFitIcon size={13} className="text-emerald-500" />
                <span className="hidden sm:inline">Auto-Fit</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. Primary Status Pills (Apple iOS Horizontal Touch Scroll) */}
      <ScrollableChipsBar
        className="w-full"
        containerClassName="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar py-0.5 scroll-smooth touch-pan-x"
      >
        {tabs.map(tab => {
          const isActive = statusFilter === tab.id
          const isAttention = (tab as any).isAttention && tab.count > 0
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`h-8 flex items-center gap-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
                isActive
                  ? isAttention
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-bold'
                    : 'bg-slate-900 text-white dark:bg-emerald-500/20 dark:text-emerald-300 border-slate-900 dark:border-emerald-500/40 shadow-xs font-bold'
                  : isAttention
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-white dark:bg-[#0c121e] hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 shadow-2xs'
              }`}
            >
              <span className="truncate">
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                isActive
                  ? 'bg-white/20 text-white'
                  : isAttention
                    ? 'bg-amber-500/25 text-amber-800 dark:text-amber-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </ScrollableChipsBar>

      {/* 2. Secondary Filter Chips Bar: Origin Source and WhatsApp Status (Matching Admin) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-0.5">
        {/* Source Origin Filter Chips */}
        {sourceCounts && setSourceFilter && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
              Source:
            </span>
            <button
              type="button"
              onClick={() => setSourceFilter('all')}
              className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                sourceFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span>All Sources</span>
              <span className="text-[10px] font-mono opacity-80">{sourceCounts.all}</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('app')}
              className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                sourceFilter === 'app'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span>Booked in App</span>
              <span className="text-[10px] font-mono opacity-80">{sourceCounts.app}</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('postex_portal')}
              className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                sourceFilter === 'postex_portal'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span>External / Portal</span>
              <span className="text-[10px] font-mono opacity-80">{sourceCounts.portal}</span>
            </button>
          </div>
        )}

        {/* WhatsApp Sent / Pending Status Filter Chips */}
        {setWhatsappFilter && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <WhatsAppIcon size={12} className="text-emerald-500" />
              <span>WA:</span>
            </span>
            <button
              type="button"
              onClick={() => setWhatsappFilter('all')}
              className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                whatsappFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span>All</span>
              <span className="text-[10px] font-mono opacity-80">{counts.all}</span>
            </button>
            <button
              type="button"
              onClick={() => setWhatsappFilter('pending')}
              className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                whatsappFilter === 'pending'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              <span>Pending</span>
              <span className="text-[10px] font-mono opacity-90">{counts.waPending ?? 0}</span>
            </button>
            <button
              type="button"
              onClick={() => setWhatsappFilter('sent')}
              className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                whatsappFilter === 'sent'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
              }`}
            >
              <span>Sent</span>
              <span className="text-[10px] font-mono opacity-90">{counts.waSent ?? 0}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
