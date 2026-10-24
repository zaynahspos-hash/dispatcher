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
      className={`sticky top-0 z-20 py-1.5 px-3 sm:px-3.5 rounded-xl border transition-all mb-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs w-full min-w-0 max-w-full ${
        selectedCount > 0
          ? 'bg-emerald-50/70 dark:bg-[#071813]/90 border-emerald-500/30'
          : 'bg-white dark:bg-[#0c121e] border-slate-200/80 dark:border-slate-800'
      }`}
    >
      {/* Left: Checkbox, Selection Status & Compact COD Amounts */}
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
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
            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
          />
          <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 whitespace-nowrap">
            {selectedCount > 0 ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>{selectedCount} Selected</span>
              </>
            ) : (
              <span>Select All ({totalCount})</span>
            )}
          </span>
        </label>

        {/* Total COD Amount Badge */}
        {filteredTotalCOD !== undefined && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 whitespace-nowrap shrink-0">
            <span className="text-[9.5px] font-sans font-semibold text-slate-400 uppercase tracking-wider">Total:</span>
            <span className="font-bold">Rs. {filteredTotalCOD.toLocaleString()}</span>
          </span>
        )}

        {/* Selected COD Amount Badge */}
        {selectedCount > 0 && selectedTotalCOD !== undefined && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap shrink-0 animate-fade-in">
            <span className="text-[9.5px] font-sans font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Sel:</span>
            <span>Rs. {selectedTotalCOD.toLocaleString()}</span>
          </span>
        )}

        {selectedCount > 0 && (
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium cursor-pointer transition px-1 py-0.5 rounded whitespace-nowrap shrink-0"
          >
            Clear
          </button>
        )}
      </div>

      {/* Right: Disciplined Apple-Grade Actions (Report, Sync, Print, Load Sheet, Cancel) */}
      <div className="flex items-center gap-1.5 flex-wrap min-w-0 max-w-full">
        {onGenerateReport && (
          <button
            type="button"
            onClick={onGenerateReport}
            disabled={isLoading || totalCount === 0}
            className="shrink-0 h-7.5 px-2.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
            title="Generate executive PDF/Excel/CSV audit report"
          >
            <FileTextIcon size={12} className="text-slate-500 dark:text-slate-400" />
            <span>Report ({selectedCount > 0 ? selectedCount : totalCount})</span>
          </button>
        )}

        {onSyncSelected && (
          <button
            type="button"
            onClick={onSyncSelected}
            disabled={isLoading}
            className="shrink-0 h-7.5 px-2.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap disabled:opacity-50"
            title="Sync latest live tracking milestones directly from PostEx"
          >
            <SyncIcon size={12} className="text-sky-500" />
            <span>Sync ({selectedCount > 0 ? selectedCount : totalCount})</span>
          </button>
        )}

        {showPrintButton && (
          <button
            type="button"
            onClick={onPrintSelected}
            disabled={isLoading || selectedCount === 0}
            className={`shrink-0 h-7.5 px-2.5 rounded-lg font-bold text-[11px] transition flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap ${
              selectedCount > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60 border border-slate-200/60 dark:border-slate-700/60'
            }`}
            title={selectedCount > 0 ? 'Print airway bills for selected parcels' : 'Select parcels to print labels'}
          >
            <PrintIcon size={12} />
            <span>Print ({effectivePrintCount})</span>
          </button>
        )}

        {/* Load Sheet Button - STRICTLY HIDDEN when count is 0 */}
        {effectiveLoadSheetCount > 0 && (
          <button
            type="button"
            onClick={onGenerateLoadSheet}
            disabled={isLoading}
            className="shrink-0 h-7.5 px-2.5 rounded-lg font-bold text-[11px] transition flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer active:scale-95"
            title="Generate official PostEx Load Sheet PDF"
          >
            <PrintIcon size={12} className="text-emerald-500" />
            <span>Load Sheet ({effectiveLoadSheetCount})</span>
          </button>
        )}

        {/* Cancel Button - STRICTLY HIDDEN when count is 0 */}
        {showCancelButton && effectiveCancelCount > 0 && (
          <button
            type="button"
            onClick={onCancelSelected}
            disabled={isLoading || isCancellingAll || selectedCount === 0}
            className="shrink-0 h-7.5 px-2.5 rounded-lg font-semibold text-[11px] transition flex items-center justify-center gap-1.5 border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer active:scale-95 whitespace-nowrap"
            title="Cancel newly booked orders before courier pickup/scan"
          >
            {isCancellingAll ? (
              <>
                <svg className="animate-spin h-3 w-3 text-rose-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{cancelProgress}</span>
              </>
            ) : (
              <>
                <CancelIcon size={12} />
                <span>Cancel ({effectiveCancelCount})</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
