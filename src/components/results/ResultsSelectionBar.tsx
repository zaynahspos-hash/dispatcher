import React from 'react'
import { PrintIcon, TrashIcon } from '../Icons'

interface ResultsSelectionBarProps {
  selectedCount: number
  totalCount: number
  selectedBookedCount: number
  onDeselectAll: () => void
  onPrintSelected: () => void
  onDeleteSelected: () => void
  loadingLabels?: boolean
}

export const ResultsSelectionBar: React.FC<ResultsSelectionBarProps> = ({
  selectedCount,
  totalCount,
  selectedBookedCount,
  onDeselectAll,
  onPrintSelected,
  onDeleteSelected,
  loadingLabels
}) => {
  if (selectedCount === 0) return null

  return (
    <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/95 dark:bg-[#071813]/95 border border-emerald-500/40 shadow-xs flex flex-wrap items-center justify-between gap-2.5 animate-fade-in mb-3 w-full max-w-full min-w-0">
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap min-w-0">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>{selectedCount} of {totalCount} Selected</span>
        </span>
        <button
          type="button"
          onClick={onDeselectAll}
          className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold cursor-pointer transition px-1.5 py-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 whitespace-nowrap shrink-0"
        >
          Deselect
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap min-w-0 max-w-full">
        {selectedBookedCount > 0 && (
          <button
            type="button"
            onClick={onPrintSelected}
            disabled={loadingLabels}
            className="shrink-0 h-8 px-2.5 sm:px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
          >
            {loadingLabels ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <PrintIcon size={12} />
                <span>Print ({selectedBookedCount})</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onDeleteSelected}
          className="shrink-0 h-8 px-2.5 sm:px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-rose-500/20 cursor-pointer active:scale-95 whitespace-nowrap"
        >
          <TrashIcon size={12} />
          <span>Remove ({selectedCount})</span>
        </button>
      </div>
    </div>
  )
}
