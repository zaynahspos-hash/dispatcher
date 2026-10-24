import React from 'react'
import { TrashIcon, TruckIcon } from '../Icons'

interface ParcelSelectionBarProps {
  selectedCount: number
  totalCount: number
  onDeselectAll: () => void
  onDeleteSelected: () => void
  onBookSelected?: () => void
  loading?: boolean
}

export const ParcelSelectionBar: React.FC<ParcelSelectionBarProps> = ({
  selectedCount,
  totalCount,
  onDeselectAll,
  onDeleteSelected,
  onBookSelected,
  loading = false
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
        {onBookSelected && selectedCount < totalCount && (
          <button
            type="button"
            onClick={onBookSelected}
            disabled={loading}
            className="shrink-0 h-8 px-2.5 sm:px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <TruckIcon size={12} className="text-white" />
            <span>Book ({selectedCount})</span>
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
