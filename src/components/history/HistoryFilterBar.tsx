import { SearchIcon, TrashIcon } from '../Icons'
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
  counts: {
    all: number
    pendingLoadsheet: number
    booked: number
    inTransit: number
    delivered: number
    returned: number
    cancelled: number
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
  counts
}: HistoryFilterBarProps) {
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
    { id: 'pending_loadsheet', label: 'Pending for Load Sheet', count: counts.pendingLoadsheet },
    { id: 'all', label: 'All', count: counts.all },
    { id: 'booked', label: 'Booked', count: counts.booked },
    { id: 'intransit', label: 'InTransit', count: counts.inTransit },
    { id: 'delivered', label: 'Delivered', count: counts.delivered },
    { id: 'returned', label: 'Returned', count: counts.returned },
    { id: 'cancelled', label: 'Cancelled', count: counts.cancelled }
  ] as const

  return (
    <div>
      {/* Advanced Search Filter Panel */}
      <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl p-4 md:p-6 mb-6 shadow-sm">
        <h3 className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-4">
          Advanced Search
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4 items-end">
          {/* Query Search */}
          <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-4">
            <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
              Search History
            </label>
            <div className="relative flex items-center border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden focus-within:ring-1 focus-within:ring-slate-400 dark:focus-within:ring-slate-500 focus-within:border-slate-400 dark:focus-within:border-slate-500">
              <span className="pl-3 text-slate-400 dark:text-gray-500 shrink-0">
                <SearchIcon size={14} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Order #, Tracking, Name, Phone..."
                className="w-full pl-2 pr-3 py-2 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-gray-500 font-medium text-slate-800 dark:text-gray-100"
              />
            </div>
          </div>

          {/* From Date */}
          <div className="flex flex-col gap-1.5 md:col-span-1 lg:col-span-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">From</label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDate('today')}
                  className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate('last7')}
                  className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  7d
                </button>
              </div>
            </div>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 text-slate-800 dark:text-gray-100"
            />
          </div>

          {/* To Date */}
          <div className="flex flex-col gap-1.5 md:col-span-1 lg:col-span-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">To</label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDate('yesterday')}
                  className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Yest.
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate('thisMonth')}
                  className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Month
                </button>
              </div>
            </div>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 text-slate-800 dark:text-gray-100"
            />
          </div>

          {/* Status Select */}
          <div className="flex flex-col gap-1.5 md:col-span-1 lg:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Status</label>
            <select
              value={statusSelect}
              onChange={e => setStatusSelect(e.target.value)}
              className="w-full border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 text-slate-800 dark:text-gray-100"
            >
              <option value="all">All</option>
              <option value="booked">Booked</option>
              <option value="under_review">Under Review / Attempted</option>
              <option value="delivered">Delivered</option>
              <option value="returned">Returned</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Pickup Address Select */}
          <div className="flex flex-col gap-1.5 md:col-span-1 lg:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
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

          {/* Buttons Row */}
          <div className="flex items-center justify-end gap-2 md:col-span-4 lg:col-span-12 mt-2">
            <button
              type="button"
              onClick={handleClearFilters}
              className="bg-[#475569] dark:bg-gray-700 hover:bg-[#334155] dark:hover:bg-gray-600 text-[#ffffff] font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <TrashIcon size={12} />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Status Tabs Row */}
      <div className="mb-6 border-b border-slate-200 dark:border-gray-700">
        <div className="flex gap-6 overflow-x-auto whitespace-nowrap scrollbar-none pb-0.5">
          {tabs.map(tab => {
            const isActive = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`pb-3 text-sm font-bold transition-all relative cursor-pointer outline-none border-b-2 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500 font-extrabold'
                    : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive 
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
