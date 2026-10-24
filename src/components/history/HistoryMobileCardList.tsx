import React, { useState, useEffect } from 'react'
import { BookedParcel, WhatsAppAlertState } from './types'
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
  onOpenWhatsApp: (parcel: BookedParcel) => void
  whatsappNote?: string
  whatsappTemplate?: string
  isWhatsAppSent?: (tracking: string, id?: string) => boolean
  getAlertState?: (tracking?: string | null, id?: string | null) => WhatsAppAlertState
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
  onOpenWhatsApp,
  whatsappNote,
  whatsappTemplate,
  isWhatsAppSent,
  getAlertState,
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
            onOpenWhatsApp={onOpenWhatsApp}
            whatsappNote={whatsappNote}
            whatsappTemplate={whatsappTemplate}
            isWhatsAppSent={Boolean(parcel.whatsapp_sent || parcel.whatsappSent || (isWhatsAppSent ? isWhatsAppSent(parcel.tracking, parcel.id) : false))}
            alertState={getAlertState ? getAlertState(parcel.tracking, parcel.id) : undefined}
            onMarkWhatsAppSent={onMarkWhatsAppSent}
            onToggleWhatsAppSent={onToggleWhatsAppSent}
          />
        )
      })}
    </div>
  )
}
