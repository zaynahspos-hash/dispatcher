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
      className={`sticky top-0 z-20 py-2 px-3 sm:px-4 rounded-xl border transition-all mb-3 flex flex-wrap items-center justify-between gap-2.5 shadow-xs w-full min-w-0 max-w-full ${
        selectedCount > 0
          ? 'bg-emerald-50/95 dark:bg-[#071813]/95 border-emerald-500/40 shadow-sm'
          : 'bg-white/95 dark:bg-[#0c121e]/95 border-slate-200/90 dark:border-slate-800'
      }`}
    >
      {/* Left: Checkbox, Selection Status & Live COD Amounts */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap min-w-0">
        <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
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
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>{selectedCount} Selected</span>
              </>
            ) : (
              <span>Select All ({totalCount})</span>
            )}
          </span>
        </label>

        {/* Total COD Amount Badge */}
        {filteredTotalCOD !== undefined && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 whitespace-nowrap shrink-0">
            <span className="text-[10px] font-sans font-semibold text-slate-400">Total:</span>
            <span>Rs. {filteredTotalCOD.toLocaleString()}</span>
          </span>
        )}

        {/* Selected COD Amount Badge */}
        {selectedCount > 0 && selectedTotalCOD !== undefined && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 whitespace-nowrap shrink-0 animate-fade-in">
            <span className="text-[10px] font-sans font-semibold text-emerald-600 dark:text-emerald-400">Sel:</span>
            <span>Rs. {selectedTotalCOD.toLocaleString()}</span>
          </span>
        )}

        {selectedCount > 0 && (
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold cursor-pointer transition px-1.5 py-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 whitespace-nowrap shrink-0"
          >
            Deselect
          </button>
        )}
      </div>

      {/* Right: Operational Actions (Report, Sync, Print, Load Sheet, Cancel) */}
      <div className="flex items-center gap-1.5 flex-wrap min-w-0 max-w-full">
        {onGenerateReport && (
          <button
            type="button"
            onClick={onGenerateReport}
            disabled={isLoading || totalCount === 0}
            className="shrink-0 h-8 px-2.5 sm:px-3 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-emerald-500/30 shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
            title="Generate executive PDF/Excel/CSV audit report"
          >
            <FileTextIcon size={12} />
            <span>Report ({selectedCount > 0 ? selectedCount : totalCount})</span>
          </button>
        )}

        {onSyncSelected && (
          <button
            type="button"
            onClick={onSyncSelected}
            disabled={isLoading}
            className="shrink-0 h-8 px-2.5 sm:px-3 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-sky-500/30 shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap disabled:opacity-50"
            title="Sync latest live tracking milestones directly from PostEx"
          >
            <SyncIcon size={12} />
            <span>Sync ({selectedCount > 0 ? selectedCount : totalCount})</span>
          </button>
        )}

        {showPrintButton && (
          <button
            type="button"
            onClick={onPrintSelected}
            disabled={isLoading || selectedCount === 0}
            className={`shrink-0 h-8 px-2.5 sm:px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap ${
              selectedCount > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
            }`}
            title={selectedCount > 0 ? 'Print airway bills for selected parcels' : 'Select parcels to print labels'}
          >
            <PrintIcon size={12} />
            <span>Print ({effectivePrintCount})</span>
          </button>
        )}

        {/* Load Sheet Button - Only show when loadsheetable orders exist */}
        {effectiveLoadSheetCount > 0 && (
          <button
            type="button"
            onClick={onGenerateLoadSheet}
            disabled={isLoading}
            className="shrink-0 h-8 px-2.5 sm:px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap border bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border-emerald-500/50 hover:border-emerald-500 cursor-pointer active:scale-95 ring-1 ring-emerald-500/20"
            title="Generate official PostEx Load Sheet PDF"
          >
            <PrintIcon size={12} className="text-emerald-500" />
            <span>Load Sheet ({effectiveLoadSheetCount})</span>
          </button>
        )}

        {/* Cancel Button - Only show when cancellable orders exist */}
        {showCancelButton && effectiveCancelCount > 0 && (
          <button
            type="button"
            onClick={onCancelSelected}
            disabled={isLoading || isCancellingAll || selectedCount === 0}
            className="shrink-0 h-8 px-2.5 sm:px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 border whitespace-nowrap bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20 cursor-pointer active:scale-95"
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
