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
    <div className="py-1.5 px-3 rounded-xl bg-emerald-50/70 dark:bg-[#071813]/90 border border-emerald-500/30 shadow-2xs flex flex-wrap items-center justify-between gap-2 animate-fade-in mb-2.5 w-full max-w-full min-w-0">
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>{selectedCount} of {totalCount} Selected</span>
        </span>
        <button
          type="button"
          onClick={onDeselectAll}
          className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium cursor-pointer transition px-1 py-0.5 rounded whitespace-nowrap shrink-0"
        >
          Clear
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap min-w-0 max-w-full">
        {onBookSelected && selectedCount < totalCount && (
          <button
            type="button"
            onClick={onBookSelected}
            disabled={loading}
            className="shrink-0 h-7.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-[11px] transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <TruckIcon size={12} className="text-white" />
            <span>Book ({selectedCount})</span>
          </button>
        )}

        <button
          type="button"
          onClick={onDeleteSelected}
          className="shrink-0 h-7.5 px-2.5 rounded-lg border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-semibold text-[11px] transition flex items-center justify-center gap-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer active:scale-95 whitespace-nowrap"
        >
          <TrashIcon size={12} />
          <span>Remove ({selectedCount})</span>
        </button>
      </div>
    </div>
  )
}
