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
    <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-500/30 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-fade-in mb-3">
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
        {selectedBookedCount > 0 && (
          <button
            type="button"
            onClick={onPrintSelected}
            disabled={loadingLabels}
            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98 whitespace-nowrap"
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
                <PrintIcon size={13} />
                <span>Print Labels ({selectedBookedCount})</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onDeleteSelected}
          className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-rose-500/20 cursor-pointer active:scale-98 whitespace-nowrap"
        >
          <TrashIcon size={13} />
          <span>Remove ({selectedCount})</span>
        </button>
      </div>
    </div>
  )
}
