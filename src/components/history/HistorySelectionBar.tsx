import React from 'react'
import { PrintIcon, CancelIcon, SyncIcon, FileTextIcon } from '../Icons'

interface HistorySelectionBarProps {
  selectedCount: number
  totalCount: number
  filteredTotalCOD?: number
  selectedTotalCOD?: number
  cancellableCount?: number
  printableCount?: number
  loadsheetableCount?: number
  onSelectAll?: () => void
  onDeselectAll: () => void
  onPrintSelected: () => void
  onGenerateLoadSheet: () => void
  onCancelSelected: () => void
  onSyncSelected?: () => void
  onGenerateReport?: () => void
  isLoading: boolean
  isCancellingAll: boolean
  cancelProgress: string
}

export const HistorySelectionBar: React.FC<HistorySelectionBarProps> = ({
  selectedCount,
  totalCount,
  filteredTotalCOD,
  selectedTotalCOD,
  cancellableCount,
  printableCount,
  loadsheetableCount,
  onSelectAll,
  onDeselectAll,
  onPrintSelected,
  onGenerateLoadSheet,
  onCancelSelected,
  onSyncSelected,
  onGenerateReport,
  isLoading,
  isCancellingAll,
  cancelProgress
}) => {
  if (totalCount === 0) return null

  const isAllSelected = selectedCount > 0 && selectedCount === totalCount
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount

  const showCancelButton = cancellableCount === undefined ? true : cancellableCount > 0
  const effectiveCancelCount = cancellableCount !== undefined ? cancellableCount : selectedCount

  const showPrintButton = printableCount === undefined ? true : printableCount > 0
  const effectivePrintCount = printableCount !== undefined ? printableCount : selectedCount

  const effectiveLoadSheetCount = selectedCount > 0
    ? (loadsheetableCount !== undefined ? loadsheetableCount : selectedCount)
    : (loadsheetableCount || 0)

  return (
    <div
      className={`sticky top-[58px] sm:top-[64px] z-20 p-2.5 sm:p-3 rounded-2xl border transition-all mb-3.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-xs ${
        selectedCount > 0
          ? 'bg-emerald-50/95 dark:bg-[#071813]/95 border-emerald-500/40 shadow-sm'
          : 'bg-slate-50/95 dark:bg-[#0c121e]/95 border-slate-200/90 dark:border-slate-800'
      }`}
    >
      {/* Left: Checkbox, Selection Status & Live COD Amounts */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-3 flex-wrap sm:flex-nowrap">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={el => {
              if (el) el.indeterminate = isPartiallySelected
            }}
            onChange={() => {
              if (selectedCount > 0) {
                onDeselectAll()
              } else if (onSelectAll) {
                onSelectAll()
              }
            }}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 whitespace-nowrap">
            {selectedCount > 0 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{selectedCount} of {totalCount} Selected</span>
              </>
            ) : (
              <span>Select All ({totalCount})</span>
            )}
          </span>
        </label>

        {/* Filtered & Selected COD Volume Badges */}
        <div className="flex items-center gap-2">
          {filteredTotalCOD !== undefined && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 whitespace-nowrap">
              <span className="text-[10px] font-sans font-semibold text-slate-400">Total COD:</span>
              <span>Rs. {filteredTotalCOD.toLocaleString()}</span>
            </span>
          )}

          {selectedCount > 0 && selectedTotalCOD !== undefined && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 whitespace-nowrap animate-fade-in">
              <span className="text-[10px] font-sans font-semibold text-emerald-600 dark:text-emerald-400">Selected:</span>
              <span>Rs. {selectedTotalCOD.toLocaleString()}</span>
            </span>
          )}
        </div>

        {selectedCount > 0 && (
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold cursor-pointer transition px-2 py-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 whitespace-nowrap"
          >
            Deselect All
          </button>
        )}
      </div>

      {/* Right: Operational Actions (Report, Sync, Print, Load Sheet, Cancel) */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        {onGenerateReport && (
          <button
            type="button"
            onClick={onGenerateReport}
            disabled={isLoading || totalCount === 0}
            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-emerald-500/30 shadow-xs cursor-pointer active:scale-98 whitespace-nowrap"
            title="Generate executive PDF/Excel/CSV audit report"
          >
            <FileTextIcon size={13} />
            <span>Report ({selectedCount > 0 ? selectedCount : totalCount})</span>
          </button>
        )}

        {onSyncSelected && (
          <button
            type="button"
            onClick={onSyncSelected}
            disabled={isLoading}
            className="flex-1 sm:flex-initial h-9 px-3 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-sky-500/30 shadow-xs cursor-pointer active:scale-98 whitespace-nowrap disabled:opacity-50"
            title="Sync latest live tracking milestones directly from PostEx"
          >
            <SyncIcon size={13} />
            <span>Sync Status ({selectedCount > 0 ? selectedCount : totalCount})</span>
          </button>
        )}

        {showPrintButton && (
          <button
            type="button"
            onClick={onPrintSelected}
            disabled={isLoading || selectedCount === 0}
            className={`flex-1 sm:flex-initial h-9 px-3.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap ${
              selectedCount > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98'
                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
            }`}
            title={selectedCount > 0 ? 'Print airway bills for selected parcels' : 'Select parcels to print labels'}
          >
            <PrintIcon size={13} />
            <span>Print Labels ({effectivePrintCount})</span>
          </button>
        )}

        {/* Load Sheet Button - Always visible and actionable */}
        <button
          type="button"
          onClick={onGenerateLoadSheet}
          disabled={isLoading || (selectedCount === 0 && effectiveLoadSheetCount === 0)}
          className={`flex-1 sm:flex-initial h-9 px-3.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap border ${
            effectiveLoadSheetCount > 0
              ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border-emerald-500/50 hover:border-emerald-500 cursor-pointer active:scale-98 ring-1 ring-emerald-500/20'
              : 'bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60'
          }`}
          title="Generate official PostEx Load Sheet PDF"
        >
          <PrintIcon size={13} className={effectiveLoadSheetCount > 0 ? 'text-emerald-500' : ''} />
          <span>Load Sheet ({effectiveLoadSheetCount})</span>
        </button>

        {showCancelButton && (
          <button
            type="button"
            onClick={onCancelSelected}
            disabled={isLoading || isCancellingAll || selectedCount === 0}
            className={`flex-1 sm:flex-initial h-9 px-3.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 border whitespace-nowrap ${
              selectedCount > 0 && effectiveCancelCount > 0
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20 cursor-pointer active:scale-98'
                : 'bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-50'
            }`}
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
