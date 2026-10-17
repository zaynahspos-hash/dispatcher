import { useState } from 'react'
import { SearchIcon, RefreshIcon, FilterIcon, AutoFitIcon, CloseIcon } from '../Icons'
import { SearchableDropdown } from '../SearchableDropdown'
import { StatusFilterType } from './types'

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
  whatsappFilter?: 'all' | 'pending' | 'sent'
  setWhatsappFilter?: (filter: 'all' | 'pending' | 'sent') => void
  onAutoFitColumns?: (e?: React.MouseEvent) => void
  counts: {
    all: number
    pendingLoadsheet: number
    booked: number
    inTransit: number
    delivered: number
    returned: number
    cancelled: number
    waSent?: number
    waPending?: number
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
  whatsappFilter = 'all',
  setWhatsappFilter,
  onAutoFitColumns,
  counts
}: HistoryFilterBarProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const activeFiltersCount = 
    (fromDate ? 1 : 0) + 
    (toDate ? 1 : 0) + 
    (statusSelect !== 'all' ? 1 : 0) + 
    (pickupFilter !== 'all' ? 1 : 0)

  const handleQuickDate = (type: 'today' | 'yesterday' | 'last7' | 'thisMonth') => {
    const now = new Date()
    const formatDate = (d: Date) => d.toISOString().split('T')[0]

    if (type === 'today') {
      setFromDate(formatDate(now))
      setToDate(formatDate(now))
    } else if (type === 'yesterday') {
      const yest = new Date()
      yest.setDate(now.getDate() - 1)
      setFromDate(formatDate(yest))
      setToDate(formatDate(yest))
    } else if (type === 'last7') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(now.getDate() - 7)
      setFromDate(formatDate(sevenDaysAgo))
      setToDate(formatDate(now))
    } else if (type === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      setFromDate(formatDate(firstDay))
      setToDate(formatDate(now))
    }
  }

  const tabs = [
    { id: 'pending_loadsheet', label: 'Pending', count: counts.pendingLoadsheet },
    { id: 'all', label: 'All', count: counts.all },
    { id: 'booked', label: 'Booked', count: counts.booked },
    { id: 'intransit', label: 'In Transit', count: counts.inTransit },
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            {/* From Date */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">From Date</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDate('today')}
                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate('last7')}
                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    7d
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* To Date */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">To Date</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDate('yesterday')}
                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Yest.
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate('thisMonth')}
                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Month
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
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

      {/* Segmented Status Pill Tabs & WhatsApp Filter Tabs (Native Touch Scroll) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar py-0.5 scroll-smooth touch-pan-x">
          {tabs.map(tab => {
            const isActive = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`h-8 flex items-center gap-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-emerald-500/15 dark:text-emerald-400 border-slate-900 dark:border-emerald-500/30 shadow-xs'
                    : 'bg-white dark:bg-[#0c121e] hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 shadow-2xs'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                  isActive
                    ? 'bg-white/20 dark:bg-emerald-400/20 text-white dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* WhatsApp Sent / Pending Quick Filter Toggle */}
        {setWhatsappFilter && (
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shrink-0 self-start md:self-auto shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5">
              WA:
            </span>
            <button
              type="button"
              onClick={() => setWhatsappFilter('all')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                whatsappFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setWhatsappFilter('pending')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                whatsappFilter === 'pending'
                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-amber-600'
              }`}
              title="Show only customers who have not received WhatsApp tracking yet"
            >
              <span>Pending</span>
              <span className="text-[9px] font-mono font-bold px-1 rounded bg-amber-500/25 text-amber-800 dark:text-amber-300">
                {counts.waPending ?? 0}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setWhatsappFilter('sent')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                whatsappFilter === 'sent'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600'
              }`}
              title="Show customers who have already been sent WhatsApp tracking"
            >
              <span>Sent</span>
              <span className={`text-[9px] font-mono font-bold px-1 rounded ${
                whatsappFilter === 'sent' ? 'bg-white/20 text-white' : 'bg-emerald-500/25 text-emerald-700 dark:text-emerald-400'
              }`}>
                {counts.waSent ?? 0}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
