import { useState } from 'react'
import { Settings } from '../utils/aiParser'
import { printLabels, cancelOrder, generateLoadSheet, trackOrder, saveShipperAdvice } from '../utils/postexApi'
import { saveAirwayDocument, saveLoadSheetDocument } from '../utils/localPdfVault'
import {
  BookedParcel,
  ActionStatusState,
  getStatusCategory,
  determineNewStatus,
  isCancellable,
  isPlaceholder,
  getLatestPostExStatus
} from '../components/history/types'

interface UseBookedHistoryOperationsProps {
  settings: Settings
  history: BookedParcel[]
  onUpdateHistory: (updated: BookedParcel[]) => void
  filteredParcels: BookedParcel[]
  userId?: string
}

export function useBookedHistoryOperations({
  settings,
  history,
  onUpdateHistory,
  filteredParcels: _filteredParcels,
  userId
}: UseBookedHistoryOperationsProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [actionStatus, setActionStatus] = useState<ActionStatusState | null>(null)
  const [syncingTracking, setSyncingTracking] = useState<string | null>(null)
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false)
  const [syncProgress, setSyncProgress] = useState<string>('')
  const [isCancellingAll, setIsCancellingAll] = useState<boolean>(false)
  const [cancelProgress, setCancelProgress] = useState<string>('')
  const [adviceParcel, setAdviceParcel] = useState<BookedParcel | null>(null)
  const [adviceStatusId, setAdviceStatusId] = useState<number>(2) // 2 = Retry, 1 = Return
  const [adviceRemarks, setAdviceRemarks] = useState<string>('')
  const [isSubmittingAdvice, setIsSubmittingAdvice] = useState<boolean>(false)
  const [adviceError, setAdviceError] = useState<string | null>(null)

  const handleSelectAll = (checked: boolean, targetIds: string[]) => setSelectedIds(checked ? targetIds : [])
  const handleSelectItem = (tracking: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, tracking] : prev.filter(id => id !== tracking))
  }

  const handlePrintSelected = async () => {
    if (selectedIds.length === 0) return
    setIsLoading(true)
    setActionStatus(null)
    try {
      const success = await printLabels(settings.postex_token, selectedIds)
      if (success) {
        saveAirwayDocument(userId, {
          batchName: `PostEx Airway Bill (${selectedIds.length} Parcels)`,
          trackingNumbers: selectedIds,
          totalCOD: history.filter(p => selectedIds.includes(p.tracking)).reduce((s, p) => s + (p.total || 0), 0)
        })
        setActionStatus({ type: 'success', message: `PDF airway bills downloaded & saved to Vault (${selectedIds.length} CNs)!` })
      } else {
        setActionStatus({ type: 'error', message: 'Failed to generate labels. Verify your PostEx token.' })
      }
    } catch (err: any) {
      setActionStatus({ type: 'error', message: err.message || 'Error printing airway bills.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateLoadSheet = async () => {
    if (selectedIds.length === 0) return
    
    // Check if any selected parcel is cancelled or already in transit/delivered/returned
    const selectedParcels = history.filter(p => selectedIds.includes(p.tracking))
    const invalidParcels = selectedParcels.filter(p => {
      const cat = getStatusCategory(p.status, p.tracking)
      return cat === 'cancelled' || cat === 'intransit' || cat === 'delivered' || cat === 'returned'
    })
    
    if (invalidParcels.length > 0) {
      setActionStatus({
        type: 'error',
        message: `Cannot generate load sheet for cancelled or shipped/delivered orders (${invalidParcels.map(p => p.name).join(', ')}).`,
        actionLabel: 'Deselect Invalid Orders',
        onAction: () => {
          setSelectedIds(prev => prev.filter(id => !invalidParcels.some(ip => ip.tracking === id)))
          setActionStatus(null)
        }
      })
      return
    }

    setIsLoading(true)
    setActionStatus(null)
    try {
      const totalCODVal = history.filter(p => selectedIds.includes(p.tracking)).reduce((s, p) => s + (p.total || 0), 0)
      const res = await generateLoadSheet(
        settings.postex_token,
        settings.postex_pickup || '',
        selectedIds,
        {
          batchName: `Load Sheet (${selectedIds.length} Parcels)`,
          totalCOD: totalCODVal
        }
      )
      if (res.success) {
        saveLoadSheetDocument(userId, {
          pickupCode: settings.postex_pickup || '',
          batchName: `Load Sheet (${selectedIds.length} Parcels)`,
          trackingNumbers: selectedIds,
          totalCOD: totalCODVal,
          pdfBase64: res.base64
        })
        const updatedHistory = history.map(item => {
          if (selectedIds.includes(item.tracking)) {
            return { ...item, status: 'BOOKED', hasLoadSheet: true, loadsheet_generated: true }
          }
          return item
        })
        onUpdateHistory(updatedHistory)
        setSelectedIds([])
        setActionStatus({
          type: 'success',
          message: `Load sheet PDF generated & saved to Vault for ${selectedIds.length} parcels! Status updated to BOOKED.`
        })
      } else {
        setActionStatus({ type: 'error', message: 'Failed to generate load sheet. Check token and pickup address.' })
      }
    } catch (err: any) {
      setActionStatus({ type: 'error', message: err.message || 'Error generating load sheet.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSelected = async () => {
    if (selectedIds.length === 0) return
    const cancellable = history.filter(p => selectedIds.includes(p.tracking) && isCancellable(p.status, p.loadsheet_generated, p.tracking))
    if (cancellable.length === 0) {
      setActionStatus({ type: 'error', message: 'None of the selected parcels can be cancelled (already in-transit, manifested, or dispatched).' })
      return
    }
    if (!window.confirm(`Cancel ${cancellable.length} eligible booking(s)? (Dispatched & in-transit orders will be skipped)`)) return
    setIsLoading(true); setIsCancellingAll(true); setCancelProgress(`Cancelling 0/${cancellable.length}...`); setActionStatus(null)
    let successCount = 0, failCount = 0, current = 0
    const updatedHistory = [...history]
    for (const parcel of cancellable) {
      current++; setCancelProgress(`Cancelling ${current}/${cancellable.length}...`)
      try {
        const res = await cancelOrder(settings.postex_token, parcel.tracking)
        if (res.statusCode === '200' || res.statusCode === 200 || res.statusCode === '0200' || res.statusMessage === 'SUCCESSFULLY OPERATED' || res.statusMessage === 'Success') {
          successCount++
          const idx = updatedHistory.findIndex(p => p.tracking === parcel.tracking)
          if (idx !== -1) updatedHistory[idx] = { ...updatedHistory[idx], status: 'cancelled' }
        } else { failCount++ }
      } catch { failCount++ }
    }
    onUpdateHistory(updatedHistory); setSelectedIds([])
    setActionStatus({
      type: successCount > 0 ? 'success' : 'error',
      message: `Cancelled ${successCount} booking(s) successfully.${failCount > 0 ? ` Failed to cancel ${failCount} bookings.` : ''}`
    })
    setIsLoading(false); setIsCancellingAll(false); setCancelProgress('')
  }

  const handleCancelSingle = async (tracking: string) => {
    if (!window.confirm(`Are you sure you want to cancel booking for CN ${tracking}?`)) return
    setSyncingTracking(tracking)
    setActionStatus(null)
    try {
      const res = await cancelOrder(settings.postex_token, tracking)
      if (res.statusCode === '200' || res.statusCode === 200 || res.statusCode === '0200' || res.statusMessage === 'SUCCESSFULLY OPERATED' || res.statusMessage === 'Success') {
        const updatedHistory = history.map(item => {
          if (item.tracking === tracking) {
            return { ...item, status: 'cancelled' }
          }
          return item
        })
        onUpdateHistory(updatedHistory)
        setActionStatus({ type: 'success', message: `Booking cancelled successfully. Status set to cancelled.` })
      } else {
        setActionStatus({ type: 'error', message: res.message || res.statusMessage || 'Cancellation request rejected by PostEx.' })
      }
    } catch (err: any) {
      setActionStatus({ type: 'error', message: err.message || 'Error cancelling booking.' })
    } finally {
      setSyncingTracking(null)
    }
  }

  const handleSyncStatus = async (tracking: string) => {
    setSyncingTracking(tracking)
    setActionStatus(null)
    try {
      const res = await trackOrder(settings.postex_token, tracking)
      if (res.statusCode === 200 || res.statusCode === '200' || res.statusCode === '0200') {
        const rawStatus = getLatestPostExStatus(res.dist)
        const customerName = res.dist?.customerName || ''
        const customerPhone = res.dist?.customerPhone || ''
        const cityName = res.dist?.cityName || ''
        const deliveryAddress = res.dist?.deliveryAddress || ''
        const invoicePayment = Number(res.dist?.invoicePayment ?? res.dist?.orderAmount ?? res.dist?.orderDetail?.invoicePayment ?? 0) || 0

        const updatedHistory = history.map(item => {
          if (item.tracking === tracking) {
            const rawLower = rawStatus.toLowerCase().trim()
            const isUnbooked = rawLower === 'unbooked'
            const isManifested = !isUnbooked && rawLower !== 'cancelled'
            return {
              ...item,
              status: determineNewStatus(item.status, rawStatus),
              hasLoadSheet: isUnbooked ? false : (item.hasLoadSheet || isManifested),
              loadsheet_generated: isUnbooked ? false : (item.loadsheet_generated || isManifested),
              name: isPlaceholder(item.name) && !isPlaceholder(customerName) ? customerName : item.name,
              phone: !item.phone && customerPhone ? customerPhone : item.phone,
              city: !item.city && cityName ? cityName : item.city,
              address: !item.address && deliveryAddress ? deliveryAddress : item.address,
              total: (!item.total || item.total === 0) && invoicePayment ? invoicePayment : item.total
            }
          }
          return item
        })
        onUpdateHistory(updatedHistory)
        setActionStatus({ type: 'success', message: `Status synchronized: ${rawStatus} for CN ${tracking}` })
      } else {
        setActionStatus({ type: 'error', message: res.statusMessage || 'Failed to fetch status.' })
      }
    } catch (err: any) {
      setActionStatus({ type: 'error', message: err.message || 'Error syncing status.' })
    } finally {
      setSyncingTracking(null)
    }
  }

  const handleSyncSelected = async () => {
    if (selectedIds.length === 0) return
    if (!settings.postex_token) {
      setActionStatus({ type: 'error', message: 'PostEx API token is missing in Settings.' })
      return
    }

    setIsLoading(true)
    setIsSyncingAll(true)
    setActionStatus(null)
    setSyncProgress(`Syncing ${selectedIds.length} orders...`)

    let mergedHistory = [...history]
    let completedCount = 0

    for (const tracking of selectedIds) {
      try {
        const res = await trackOrder(settings.postex_token, tracking)
        if (res.statusCode === 200 || res.statusCode === '200' || res.statusCode === '0200') {
          const rawStatus = getLatestPostExStatus(res.dist)
          const customerName = res.dist?.customerName || ''
          const customerPhone = res.dist?.customerPhone || ''
          const cityName = res.dist?.cityName || ''
          const deliveryAddress = res.dist?.deliveryAddress || ''
          const invoicePayment = Number(res.dist?.invoicePayment ?? res.dist?.orderAmount ?? res.dist?.orderDetail?.invoicePayment ?? 0) || 0

          const idx = mergedHistory.findIndex(p => p.tracking === tracking)
          if (idx !== -1) {
            const currentItem = mergedHistory[idx]
            const rawLower = rawStatus.toLowerCase().trim()
            const isUnbooked = rawLower === 'unbooked'
            const isManifested = !isUnbooked && rawLower !== 'cancelled'
            mergedHistory[idx] = {
              ...currentItem,
              status: determineNewStatus(currentItem.status, rawStatus),
              hasLoadSheet: isUnbooked ? false : (currentItem.hasLoadSheet || isManifested),
              loadsheet_generated: isUnbooked ? false : (currentItem.loadsheet_generated || isManifested),
              name: isPlaceholder(currentItem.name) && !isPlaceholder(customerName) ? customerName : currentItem.name,
              phone: !currentItem.phone && customerPhone ? customerPhone : currentItem.phone,
              city: !currentItem.city && cityName ? cityName : currentItem.city,
              address: !currentItem.address && deliveryAddress ? deliveryAddress : currentItem.address,
              total: (!currentItem.total || currentItem.total === 0) && invoicePayment ? invoicePayment : currentItem.total
            }
          }
        }
      } catch (err) {
        console.error(`Error syncing CN ${tracking}:`, err)
      } finally {
        completedCount++
        setSyncProgress(`Synced ${completedCount}/${selectedIds.length}...`)
      }
    }

    onUpdateHistory(mergedHistory)
    setIsLoading(false)
    setIsSyncingAll(false)
    setSyncProgress('')
    setActionStatus({
      type: 'success',
      message: `Successfully synchronized ${selectedIds.length} selected orders!`
    })
  }

  const handleSubmitAdvice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adviceParcel) return
    if (!adviceRemarks.trim()) {
      setAdviceError('Remarks/Notes are required.')
      return
    }
    setIsSubmittingAdvice(true)
    setAdviceError(null)
    try {
      const res = await saveShipperAdvice(
        settings.postex_token,
        adviceParcel.tracking,
        adviceStatusId,
        adviceRemarks
      )
      if (res.statusCode === 200 || res.statusCode === '200' || res.statusCode === '0200' || res.statusMessage === 'SUCCESSFULLY OPERATED' || res.statusMessage === 'Success') {
        const updatedHistory = history.map(item => {
          if (item.tracking === adviceParcel.tracking) {
            return { ...item, status: adviceStatusId === 2 ? 'Retry Requested' : 'Return Requested' }
          }
          return item
        })
        onUpdateHistory(updatedHistory)
        setActionStatus({
          type: 'success',
          message: `Shipper advice successfully submitted for CN ${adviceParcel.tracking}!`
        })
        setAdviceParcel(null)
        setAdviceRemarks('')
      } else {
        setAdviceError(res.statusMessage || 'Failed to submit shipper advice.')
      }
    } catch (err: any) {
      setAdviceError(err.message || 'Error submitting shipper advice.')
    } finally {
      setIsSubmittingAdvice(false)
    }
  }

  return {
    selectedIds,
    setSelectedIds,
    handleSelectAll,
    handleSelectItem,
    isLoading,
    actionStatus,
    setActionStatus,
    syncingTracking,
    isSyncingAll,
    syncProgress,
    isCancellingAll,
    cancelProgress,
    adviceParcel,
    setAdviceParcel,
    adviceStatusId,
    setAdviceStatusId,
    adviceRemarks,
    setAdviceRemarks,
    isSubmittingAdvice,
    adviceError,
    setAdviceError,
    handlePrintSelected,
    handleGenerateLoadSheet,
    handleCancelSelected,
    handleCancelSingle,
    handleSyncStatus,
    handleSyncSelected,
    handleSubmitAdvice
  }
}
