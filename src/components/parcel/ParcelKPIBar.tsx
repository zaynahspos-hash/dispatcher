import { PlusIcon, UploadIcon, SyncIcon, TrashIcon, RefreshIcon } from '../Icons'

interface ParcelKPIBarProps {
  totalParcels: number
  selectedCount: number
  totalCOD: number
  invalidPhonesCount: number
  unverifiedCitiesCount: number
  duplicateSerialsCount?: number
  onResolveDuplicates?: () => void
  expandDefaults?: boolean
  onToggleExpandDefaults?: () => void
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
  duplicateSerialsCount = 0,
  onResolveDuplicates,
  expandDefaults,
  onToggleExpandDefaults,
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

      {/* Duplicate / Already in DB Serials Alert Banner */}
      {duplicateSerialsCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 sm:px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>
              <strong>{duplicateSerialsCount} parcel(s)</strong> have Ref IDs that already exist in database or duplicate in table.
            </span>
          </div>
          {onResolveDuplicates && (
            <button
              type="button"
              onClick={onResolveDuplicates}
              className="h-8 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap active:scale-98 shrink-0"
              title="Automatically reassign next sequential available serials"
            >
              <RefreshIcon size={13} />
              <span>Auto-Assign Next Available</span>
            </button>
          )}
        </div>
      )}

      {/* Action Toolbar */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Secondary Utilities: Add Row, Export, Clear All */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onAddRow}
            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-xs whitespace-nowrap"
          >
            <PlusIcon size={14} className="text-emerald-500 shrink-0" />
            <span>Add Row</span>
          </button>

          <button
            onClick={onExportExcel}
            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-xs whitespace-nowrap"
          >
            <UploadIcon size={14} className="text-emerald-500 shrink-0" />
            <span>Export XLSX</span>
          </button>

          {onToggleExpandDefaults && (
            <button
              type="button"
              onClick={onToggleExpandDefaults}
              className={`flex-1 sm:flex-initial h-9 px-3 rounded-lg border text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-xs whitespace-nowrap ${
                expandDefaults
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Toggle display of logistics defaults: Weight, Product Detail, Transaction Note, and Copies"
            >
              <span>{expandDefaults ? 'Defaults Expanded' : 'Expand Defaults'}</span>
              <span className="text-[10px] font-mono">{expandDefaults ? '▲' : '▼'}</span>
            </button>
          )}

          <button
            onClick={onClearAll}
            className="h-9 px-3.5 rounded-lg border border-rose-200/80 dark:border-rose-900/50 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-semibold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-xs whitespace-nowrap"
            title="Clear all staged rows"
          >
            <TrashIcon size={14} className="shrink-0" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>

        {/* Primary Dispatch Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedCount > 0 && selectedCount < totalParcels && (
            <button
              onClick={onBookSelected}
              disabled={loading}
              className="flex-1 sm:flex-initial h-9 px-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 whitespace-nowrap shadow-xs"
            >
              <SyncIcon size={13} className="shrink-0 text-slate-400" />
              <span>Book Selected ({selectedCount})</span>
            </button>
          )}

          <button
            onClick={onBookAll}
            disabled={loading || totalParcels === 0}
            className={`${selectedCount > 0 && selectedCount < totalParcels ? 'flex-1' : 'w-full'} sm:flex-initial h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer active:scale-98 whitespace-nowrap`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
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
