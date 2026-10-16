import { PlusIcon, UploadIcon, SyncIcon, TrashIcon } from '../Icons'

interface ParcelKPIBarProps {
  totalParcels: number
  selectedCount: number
  totalCOD: number
  invalidPhonesCount: number
  unverifiedCitiesCount: number
  onAddRow: () => void
  onExportExcel: () => void
  onClearAll: () => void
  onBookSelected: () => void
  onBookAll: () => void
  loading: boolean
}

export function ParcelKPIBar({
  totalParcels,
  selectedCount,
  totalCOD,
  invalidPhonesCount,
  unverifiedCitiesCount,
  onAddRow,
  onExportExcel,
  onClearAll,
  onBookSelected,
  onBookAll,
  loading
}: ParcelKPIBarProps) {
  return (
    <div className="space-y-3.5">
      {/* Sleek Integrated KPI Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/80 shadow-xs">
        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Staged Parcels
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
              {totalParcels}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ({selectedCount} selected)
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total COD Value
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs font-bold text-slate-400">Rs.</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {totalCOD.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Phone Format
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold">
            {invalidPhonesCount === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                100% Valid
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {invalidPhonesCount} Invalid
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            PostEx Coverage
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold">
            {unverifiedCitiesCount === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                All Cities Matched
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {unverifiedCitiesCount} Unverified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Secondary Utilities: Add Row, Export, Clear All */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onAddRow}
            className="flex-1 sm:flex-initial h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 whitespace-nowrap"
          >
            <PlusIcon size={14} className="text-emerald-500 shrink-0" />
            <span>Add Row</span>
          </button>

          <button
            onClick={onExportExcel}
            className="flex-1 sm:flex-initial h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 whitespace-nowrap"
          >
            <UploadIcon size={14} className="text-emerald-500 shrink-0" />
            <span>Export XLSX</span>
          </button>

          <button
            onClick={onClearAll}
            className="h-10 px-3.5 rounded-xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100/80 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 whitespace-nowrap"
            title="Clear all staged rows"
          >
            <TrashIcon size={14} className="shrink-0" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>

        {/* Primary Dispatch Actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {selectedCount > 0 && selectedCount < totalParcels && (
            <button
              onClick={onBookSelected}
              disabled={loading}
              className="flex-1 sm:flex-initial h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 whitespace-nowrap shadow-xs"
            >
              <SyncIcon size={14} className="shrink-0 text-slate-400" />
              <span>Book Selected ({selectedCount})</span>
            </button>
          )}

          <button
            onClick={onBookAll}
            disabled={loading || totalParcels === 0}
            className={`${selectedCount > 0 && selectedCount < totalParcels ? 'flex-1' : 'w-full'} sm:flex-initial h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-tight shadow-sm shadow-emerald-600/20 transition disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer active:scale-98 whitespace-nowrap`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Dispatching...</span>
              </>
            ) : (
              <span>Book All ({totalParcels}) &rarr;</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
