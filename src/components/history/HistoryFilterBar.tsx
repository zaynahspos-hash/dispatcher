import { useState } from 'react'
import { SearchIcon, RefreshIcon, FilterIcon, AutoFitIcon, CloseIcon, CalendarIcon, WhatsAppIcon } from '../Icons'
import { SearchableDropdown } from '../SearchableDropdown'
import { ScrollableChipsBar } from '../common/ScrollableChipsBar'
import { StatusFilterType, SourceFilterType, getLocalTodayDate } from './types'

interface HistoryFilterBarProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
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
  counts,
  sourceCounts
}: HistoryFilterBarProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const today = getLocalTodayDate()
  const isCustomDate = Boolean((fromDate && fromDate !== today) || (toDate && toDate !== today))

  const activeFiltersCount = 
    (isCustomDate ? 1 : 0) + 
    (statusSelect !== 'all' ? 1 : 0) + 
    (pickupFilter !== 'all' ? 1 : 0) +
    (whatsappFilter !== 'all' ? 1 : 0) +
    (sourceFilter !== 'all' ? 1 : 0)

  // Apple iOS Segmented Date Presets Boundaries
  const now = new Date()
  const formatDate = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const todayStr = formatDate(now)
  const yestDate = new Date()
  yestDate.setDate(now.getDate() - 1)
  const yestStr = formatDate(yestDate)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(now.getDate() - 7)
  const last7Str = formatDate(sevenDaysAgo)

  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthStr = formatDate(firstDayOfMonth)

  const activePreset: 'today' | 'yesterday' | 'last7' | 'thisMonth' | null =
    fromDate === todayStr && toDate === todayStr ? 'today' :
    fromDate === yestStr && toDate === yestStr ? 'yesterday' :
    fromDate === last7Str && toDate === todayStr ? 'last7' :
    fromDate === thisMonthStr && toDate === todayStr ? 'thisMonth' :
    null

  const handleQuickDate = (type: 'today' | 'yesterday' | 'last7' | 'thisMonth') => {
    if (type === 'today') {
      setFromDate(todayStr)
      setToDate(todayStr)
    } else if (type === 'yesterday') {
      setFromDate(yestStr)
      setToDate(yestStr)
    } else if (type === 'last7') {
      setFromDate(last7Str)
      setToDate(todayStr)
    } else if (type === 'thisMonth') {
      setFromDate(thisMonthStr)
      setToDate(todayStr)
    }
  }

  const tabs = [
    { id: 'pending_loadsheet', label: 'Pending', count: counts.pendingLoadsheet },
    { id: 'all', label: 'All', count: counts.all },
    { id: 'booked', label: 'Booked', count: counts.booked },
    { id: 'intransit', label: 'In Transit', count: counts.inTransit },
    { id: 'out_for_delivery', label: 'Out for Delivery', count: counts.outForDelivery ?? 0, isAttention: false },
    { id: 'action_required', label: 'Action Required', count: counts.actionRequired ?? 0, isAttention: true },
    { id: 'delivered', label: 'Delivered', count: counts.delivered },
    { id: 'returned', label: 'Returned', count: counts.returned },
    { id: 'cancelled', label: 'Cancelled', count: counts.cancelled }
  ] as const


  return (
    <div className="space-y-3.5 mb-5 w-full max-w-full min-w-0">
      {/* Search & Filter Trigger Bar */}
      <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-2.5 sm:p-4 shadow-xs">
        <div className="flex items-center gap-2">
          {/* Main Search Input */}
          <div className="relative flex-1 min-w-0 flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all">
            <span className="pl-3 text-slate-400 dark:text-slate-500 shrink-0">
              <SearchIcon size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search order #, tracking, customer, phone..."
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

          {/* Toggle Filter Panel (Mobile & Tablet) */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className={`h-10 flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer shrink-0 whitespace-nowrap ${
              mobileFiltersOpen || activeFiltersCount > 0
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <FilterIcon size={14} className={activeFiltersCount > 0 ? 'text-emerald-500' : 'text-slate-500'} />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center leading-none">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Quick Clear Filter Button */}
          {(searchQuery || activeFiltersCount > 0) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="h-10 flex items-center justify-center gap-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 whitespace-nowrap"
              title="Clear all filters"
            >
              <RefreshIcon size={14} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* Excel Auto-Fit Columns */}
          {onAutoFitColumns && (
            <button
              type="button"
              onClick={onAutoFitColumns}
              className="h-10 hidden sm:flex items-center justify-center gap-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 whitespace-nowrap active:scale-98"
              title="Auto-fit all column widths to maximum text length • Alt+Click to reset defaults"
            >
              <AutoFitIcon size={14} className="text-emerald-500" />
              <span>Auto-Fit</span>
            </button>
          )}
        </div>

        {/* Collapsible Filter Details */}
        <div className={`mt-3.5 pt-3.5 border-t border-slate-200/80 dark:border-slate-800/80 ${mobileFiltersOpen ? 'block' : 'hidden md:block'}`}>
          {/* Native Apple iOS Segmented Date Presets */}
          <div className="mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2 sm:p-2.5 bg-slate-50/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200/70 dark:border-slate-800/70">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Date Presets</span>
              </span>
              {activePreset ? (
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {activePreset === 'today' && 'Today'}
                  {activePreset === 'yesterday' && 'Yesterday'}
                  {activePreset === 'last7' && 'Last 7 Days'}
                  {activePreset === 'thisMonth' && 'This Month'}
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
            </ScrollableChipsBar>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            {/* From Date */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 h-9 font-medium"
              />
            </div>

            {/* To Date */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 h-9 font-medium"
              />
            </div>

            {/* Status Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status Filter</label>
              <select
                value={statusSelect}
                onChange={e => setStatusSelect(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 h-9"
              >
                <option value="all">All Statuses</option>
                <option value="booked">Booked</option>
                <option value="transit">In Transit / Warehouse</option>
                <option value="under_review">Under Review / Attempted</option>
                <option value="delivered">Delivered</option>
                <option value="returned">Returned</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Pickup Address Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Pickup Address / City
              </label>
              <SearchableDropdown
                value={pickupFilter}
                onChange={setPickupFilter}
                options={uniqueCities}
                placeholder="All Cities"
                allOptionLabel="All Cities"
                allOptionValue="all"
              />
            </div>
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
              <span>{tab.label}</span>
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

      {/* 2. Secondary Filter Pills: Source & WhatsApp (Uniform h-8, perfectly aligned) */}
      <div className="flex flex-wrap items-center gap-2">
        {setSourceFilter && (
          <ScrollableChipsBar
            className="flex-1 min-w-0"
            containerClassName="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar py-0.5 scroll-smooth touch-pan-x"
          >
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 shrink-0">
              Source:
            </span>
            <button
              type="button"
              onClick={() => setSourceFilter('all')}
              className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 border ${
                sourceFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-emerald-500/20 dark:text-emerald-300 border-slate-900 dark:border-emerald-500/40 shadow-xs font-bold'
                  : 'bg-white dark:bg-[#0c121e] hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 shadow-2xs'
              }`}
            >
              <span>All Sources</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                sourceFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {sourceCounts?.all ?? counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSourceFilter('app')}
              className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 border ${
                sourceFilter === 'app'
                  ? 'bg-slate-900 text-white dark:bg-emerald-500/20 dark:text-emerald-300 border-slate-900 dark:border-emerald-500/40 shadow-xs font-bold'
                  : 'bg-white dark:bg-[#0c121e] hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 shadow-2xs'
              }`}
            >
              <span>Booked in App</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                sourceFilter === 'app' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {sourceCounts?.app ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSourceFilter('postex_portal')}
              className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 border ${
                sourceFilter === 'postex_portal'
                  ? 'bg-slate-900 text-white dark:bg-emerald-500/20 dark:text-emerald-300 border-slate-900 dark:border-emerald-500/40 shadow-xs font-bold'
                  : 'bg-white dark:bg-[#0c121e] hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 shadow-2xs'
              }`}
            >
              <span>External / Portal</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                sourceFilter === 'postex_portal' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {sourceCounts?.portal ?? 0}
              </span>
            </button>
          </ScrollableChipsBar>
        )}

        {/* WhatsApp Sent / Pending Quick Filter — same pill style as every other filter tab */}
        {setWhatsappFilter && (
          <ScrollableChipsBar
            className="shrink-0"
            containerClassName="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar py-0.5 scroll-smooth touch-pan-x"
          >
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 shrink-0 flex items-center gap-1">
              <WhatsAppIcon size={12} className="text-[#25D366] fill-current shrink-0" />
              <span>WA:</span>
            </span>
            <button
              type="button"
              onClick={() => setWhatsappFilter('all')}
              className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 border ${
                whatsappFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-emerald-500/20 dark:text-emerald-300 border-slate-900 dark:border-emerald-500/40 shadow-xs font-bold'
                  : 'bg-white dark:bg-[#0c121e] hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 shadow-2xs'
              }`}
            >
              <span>All</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                whatsappFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {counts.all}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setWhatsappFilter('pending')}
              className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 border ${
                whatsappFilter === 'pending'
                  ? 'bg-slate-900 text-white dark:bg-emerald-500/20 dark:text-emerald-300 border-slate-900 dark:border-emerald-500/40 shadow-xs font-bold'
                  : 'bg-white dark:bg-[#0c121e] hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 shadow-2xs'
              }`}
              title="Show only customers who have not received WhatsApp tracking yet"
            >
              <span>Pending</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                whatsappFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {counts.waPending ?? 0}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setWhatsappFilter('sent')}
              className={`h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 border ${
                whatsappFilter === 'sent'
                  ? 'bg-slate-900 text-white dark:bg-emerald-500/20 dark:text-emerald-300 border-slate-900 dark:border-emerald-500/40 shadow-xs font-bold'
                  : 'bg-white dark:bg-[#0c121e] hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 shadow-2xs'
              }`}
              title="Show customers who have already been sent WhatsApp tracking"
            >
              <span>Sent</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                whatsappFilter === 'sent' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {counts.waSent ?? 0}
              </span>
            </button>
          </ScrollableChipsBar>
        )}
      </div>
    </div>
  )
}
