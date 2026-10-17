import { SearchIcon, RefreshIcon, CloseIcon } from '../Icons'

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
}

export const ResultsFilterBar: React.FC<ResultsFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  counts,
  onClearFilters
}) => {
  const tabs = [
    { id: 'all' as const, label: 'All Dispatched', count: counts.all },
    { id: 'success' as const, label: 'Booked', count: counts.booked },
    { id: 'error' as const, label: 'Failed Bookings', count: counts.failed },
    { id: 'manual' as const, label: 'Drafts', count: counts.drafts },
    { id: 'cancelled' as const, label: 'Cancelled', count: counts.cancelled }
  ]

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all'

  return (
    <div className="space-y-3 mb-2">
      {/* Search Input Bar */}
      <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-2.5 sm:p-3.5 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all">
            <span className="pl-3 text-slate-400 dark:text-slate-500 shrink-0">
              <SearchIcon size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone, tracking, order #, city..."
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

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center gap-1.5 whitespace-nowrap"
              title="Reset all search filters"
            >
              <RefreshIcon size={14} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Segmented Status Pill Tabs (Native Touch Scroll) */}
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
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                  isActive
                    ? 'bg-white/20 dark:bg-emerald-400/20 text-white dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
