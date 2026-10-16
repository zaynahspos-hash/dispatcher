import React from 'react'
import { BookedParcel } from './types'
import { HistoryMobileCard } from './HistoryMobileCard'

interface HistoryMobileCardListProps {
  paginatedParcels: BookedParcel[]
  selectedIds: string[]
  handleSelectAll: (checked: boolean, trackings: string[]) => void
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  handleSelectItem: (tracking: string, checked: boolean) => void
  handleSyncStatus: (tracking: string) => void
  syncingTracking: string | null
  handleCancelSingle: (tracking: string) => void
  onOpenAdvice: (parcel: BookedParcel) => void
  whatsappNote?: string
  whatsappTemplate?: string
}

export function HistoryMobileCardList({
  paginatedParcels,
  selectedIds,
  handleSelectAll,
  setSelectedIds,
  handleSelectItem,
  handleSyncStatus,
  syncingTracking,
  handleCancelSingle,
  onOpenAdvice,
  whatsappNote,
  whatsappTemplate
}: HistoryMobileCardListProps) {
  return (
    <div className="lg:hidden flex flex-col gap-3">
      {/* Mobile Select All Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-[#0c121e] px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-1">
        <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 select-none">
          <input
            type="checkbox"
            ref={el => {
              if (el) {
                el.indeterminate = selectedIds.length > 0 && selectedIds.length < paginatedParcels.length
              }
            }}
            checked={selectedIds.length === paginatedParcels.length && paginatedParcels.length > 0}
            onChange={() => {
              if (selectedIds.length > 0) {
                handleSelectAll(false, [])
              } else {
                handleSelectAll(true, paginatedParcels.map(p => p.tracking))
              }
            }}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
          />
          <span>Select All ({selectedIds.length}/{paginatedParcels.length} selected)</span>
        </label>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 font-extrabold cursor-pointer transition"
          >
            Deselect All
          </button>
        )}
      </div>

      {paginatedParcels.map(parcel => (
        <HistoryMobileCard
          key={parcel.tracking}
          parcel={parcel}
          isSelected={selectedIds.includes(parcel.tracking)}
          onToggleSelect={handleSelectItem}
          onSyncStatus={handleSyncStatus}
          isSyncing={syncingTracking === parcel.tracking}
          onCancel={handleCancelSingle}
          onOpenAdvice={onOpenAdvice}
          whatsappNote={whatsappNote}
          whatsappTemplate={whatsappTemplate}
        />
      ))}
    </div>
  )
}
