import { PrintIcon, CancelIcon, SyncIcon } from '../Icons'

interface HistorySelectionBarProps {
  selectedCount: number
  totalCount: number
  cancellableCount?: number
  printableCount?: number
  loadsheetableCount?: number
  onDeselectAll: () => void
  onPrintSelected: () => void
  onGenerateLoadSheet: () => void
  onCancelSelected: () => void
  onSyncSelected?: () => void
  isLoading: boolean
  isCancellingAll: boolean
  cancelProgress: string
}

export const HistorySelectionBar: React.FC<HistorySelectionBarProps> = ({
  selectedCount,
  totalCount,
  cancellableCount,
  printableCount,
  loadsheetableCount,
  onDeselectAll,
  onPrintSelected,
  onGenerateLoadSheet,
  onCancelSelected,
  onSyncSelected,
  isLoading,
  isCancellingAll,
  cancelProgress
}) => {
  if (selectedCount === 0) return null

  const showCancelButton = cancellableCount === undefined ? true : cancellableCount > 0
  const effectiveCancelCount = cancellableCount !== undefined ? cancellableCount : selectedCount

  const showPrintButton = printableCount === undefined ? true : printableCount > 0
  const effectivePrintCount = printableCount !== undefined ? printableCount : selectedCount

  const showLoadSheetButton = loadsheetableCount === undefined ? true : loadsheetableCount > 0
  const effectiveLoadSheetCount = loadsheetableCount !== undefined ? loadsheetableCount : selectedCount

  return (
    <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-500/30 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-fade-in mb-3.5">
      <div className="flex items-center gap-2.5 w-full sm:w-auto">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {selectedCount} of {totalCount} Selected
        </span>
        <button
          type="button"
          onClick={onDeselectAll}
          className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold cursor-pointer transition px-2 py-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50"
        >
          Deselect All
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        {onSyncSelected && (
          <button
            type="button"
            onClick={onSyncSelected}
            disabled={isLoading}
            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-400 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-sky-500/30 shadow-xs cursor-pointer active:scale-98 whitespace-nowrap"
            title="Sync latest live tracking for selected orders"
          >
            <SyncIcon size={13} />
            <span>Sync Status ({selectedCount})</span>
          </button>
        )}

        {showPrintButton && (
          <button
            type="button"
            onClick={onPrintSelected}
            disabled={isLoading}
            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98 whitespace-nowrap"
          >
            <PrintIcon size={13} />
            <span>Print Labels ({effectivePrintCount})</span>
          </button>
        )}

        {showLoadSheetButton && (
          <button
            type="button"
            onClick={onGenerateLoadSheet}
            disabled={isLoading}
            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer active:scale-98 whitespace-nowrap"
            title="Generate Load Sheet PDF"
          >
            <PrintIcon size={13} />
            <span>Load Sheet ({effectiveLoadSheetCount})</span>
          </button>
        )}


        {showCancelButton && (
          <button
            type="button"
            onClick={onCancelSelected}
            disabled={isLoading || isCancellingAll}
            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-rose-500/20 cursor-pointer disabled:opacity-50 whitespace-nowrap active:scale-98"
            title="Cancel newly booked orders before courier pickup/scan"
          >
            {isCancellingAll ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-rose-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{cancelProgress}</span>
              </>
            ) : (
              <>
                <CancelIcon size={13} />
                <span>Cancel Bookings ({effectiveCancelCount})</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
