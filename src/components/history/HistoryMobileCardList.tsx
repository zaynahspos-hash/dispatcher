import React, { useState, useEffect } from 'react'
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
  isWhatsAppSent?: (tracking: string, id?: string) => boolean
  onMarkWhatsAppSent?: (tracking: string, id?: string) => void
  onToggleWhatsAppSent?: (tracking: string) => void
  autoExpandLines?: boolean
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
  whatsappTemplate,
  isWhatsAppSent,
  onMarkWhatsAppSent,
  onToggleWhatsAppSent,
  autoExpandLines = false
}: HistoryMobileCardListProps) {
  const [cardOverrides, setCardOverrides] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setCardOverrides({})
  }, [autoExpandLines])

  const handleToggleCard = (tracking: string) => {
    setCardOverrides(prev => {
      const current = prev[tracking] !== undefined ? prev[tracking] : !!autoExpandLines
      return { ...prev, [tracking]: !current }
    })
  }

  return (
    <div className="lg:hidden flex flex-col gap-3 w-full max-w-full min-w-0">
      {/* Mobile Unified Selection Bar */}
      {paginatedParcels.length > 0 && selectedIds.length === 0 && (
        <div className="flex items-center justify-between bg-white dark:bg-[#0c121e] px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-1">
          <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={false}
              onChange={() => handleSelectAll(true, paginatedParcels.map(p => p.tracking))}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
            />
            <span>Select All ({paginatedParcels.length})</span>
          </label>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-500/30 shadow-xs flex items-center justify-between gap-2.5 animate-fade-in mb-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {selectedIds.length} of {paginatedParcels.length} Selected
          </span>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold cursor-pointer transition px-2 py-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50"
          >
            Deselect All
          </button>
        </div>
      )}

      {paginatedParcels.map(parcel => {
        const isExpanded = cardOverrides[parcel.tracking] !== undefined
          ? cardOverrides[parcel.tracking]
          : !!autoExpandLines

        return (
          <HistoryMobileCard
            key={parcel.tracking}
            parcel={parcel}
            isSelected={selectedIds.includes(parcel.tracking)}
            isExpanded={isExpanded}
            onToggleExpand={() => handleToggleCard(parcel.tracking)}
            onToggleSelect={handleSelectItem}
            onSyncStatus={handleSyncStatus}
            isSyncing={syncingTracking === parcel.tracking}
            onCancel={handleCancelSingle}
            onOpenAdvice={onOpenAdvice}
            whatsappNote={whatsappNote}
            whatsappTemplate={whatsappTemplate}
            isWhatsAppSent={Boolean(parcel.whatsapp_sent || parcel.whatsappSent || (isWhatsAppSent ? isWhatsAppSent(parcel.tracking, parcel.id) : false))}
            onMarkWhatsAppSent={onMarkWhatsAppSent}
            onToggleWhatsAppSent={onToggleWhatsAppSent}
          />
        )
      })}
    </div>
  )
}
