import { useMemo } from 'react'
import { BookedParcel, StatusFilterType, getStatusCategory, isUnderReview } from '../components/history/types'

interface UseBookedHistoryFilterProps {
  history: BookedParcel[]
  statusFilter: StatusFilterType
  searchQuery: string
  fromDate: string
  toDate: string
  statusSelect: string
  pickupFilter: string
  whatsappFilter?: 'all' | 'pending' | 'sent'
  isWhatsAppSent?: (tracking: string, id?: string) => boolean
}

export function useBookedHistoryFilter({
  history,
  statusFilter,
  searchQuery,
  fromDate,
  toDate,
  statusSelect,
  pickupFilter,
  whatsappFilter = 'all',
  isWhatsAppSent
}: UseBookedHistoryFilterProps) {
  // Dynamic counts for status tabs based on history
  const counts = useMemo(() => {
    const all = history.length
    let pendingLoadsheet = 0
    let booked = 0
    let inTransit = 0
    let delivered = 0
    let returned = 0
    let cancelled = 0
    let waSent = 0
    let waPending = 0

    history.forEach(h => {
      const cat = getStatusCategory(h.status, h.tracking)
      if (cat === 'pending_loadsheet') pendingLoadsheet++
      else if (cat === 'booked') booked++
      else if (cat === 'intransit') inTransit++
      else if (cat === 'delivered') delivered++
      else if (cat === 'returned') returned++
      else if (cat === 'cancelled') cancelled++

      const sent = Boolean(h.whatsapp_sent || h.whatsappSent || (isWhatsAppSent && isWhatsAppSent(h.tracking, h.id)))
      if (sent) {
        waSent++
      } else {
        waPending++
      }
    })

    return { all, pendingLoadsheet, booked, inTransit, delivered, returned, cancelled, waSent, waPending }
  }, [history, isWhatsAppSent])

  // Filter and sort logic
  const filteredParcels = useMemo(() => {
    return history.filter(item => {
      if (statusFilter !== 'all') {
        const cat = getStatusCategory(item.status, item.tracking)
        if (cat !== statusFilter) return false
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim()
        const matchesOrder = item.id.toLowerCase().includes(q)
        const matchesTracking = item.tracking.toLowerCase().includes(q)
        const matchesName = item.name.toLowerCase().includes(q)
        const matchesPhone = item.phone.toLowerCase().includes(q)
        if (!matchesOrder && !matchesTracking && !matchesName && !matchesPhone) {
          return false
        }
      }

      const bDate = new Date(item.bookingDate)
      const itemTime = bDate.getTime()
      if (fromDate) {
        const start = new Date(fromDate)
        start.setHours(0, 0, 0, 0)
        if (itemTime < start.getTime()) return false
      }
      if (toDate) {
        const end = new Date(toDate)
        end.setHours(23, 59, 59, 999)
        if (itemTime > end.getTime()) return false
      }

      if (statusSelect !== 'all') {
        const sel = statusSelect.toLowerCase()
        if (sel === 'under_review') {
          if (!isUnderReview(item.status)) return false
        } else {
          const statusLower = item.status.toLowerCase()
          if (!statusLower.includes(sel)) return false
        }
      }

      if (pickupFilter !== 'all') {
        if (item.city.toUpperCase() !== pickupFilter.toUpperCase()) return false
      }

      if (whatsappFilter && whatsappFilter !== 'all') {
        const sent = Boolean(item.whatsapp_sent || item.whatsappSent || (isWhatsAppSent && isWhatsAppSent(item.tracking, item.id)))
        if (whatsappFilter === 'sent' && !sent) return false
        if (whatsappFilter === 'pending' && sent) return false
      }

      return true
    }).sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
  }, [history, statusFilter, searchQuery, fromDate, toDate, statusSelect, pickupFilter, whatsappFilter, isWhatsAppSent])

  return { counts, filteredParcels }
}
