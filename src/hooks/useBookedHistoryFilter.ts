import { useMemo } from 'react'
import { 
  BookedParcel, 
  StatusFilterType, 
  SourceFilterType, 
  SearchScopeType,
  getStatusCategory, 
  isUnderReview,
  isOutForDelivery,
  isActionRequired,
  getParcelDateStr
} from '../components/history/types'

interface UseBookedHistoryFilterProps {
  history: BookedParcel[]
  statusFilter: StatusFilterType
  sourceFilter?: SourceFilterType
  searchQuery: string
  searchScope?: SearchScopeType
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
  sourceFilter = 'all',
  searchQuery,
  searchScope = 'all',
  fromDate,
  toDate,
  statusSelect,
  pickupFilter,
  whatsappFilter = 'all',
  isWhatsAppSent
}: UseBookedHistoryFilterProps) {
  // Dynamic counts for status tabs and sources based on history and active date range
  const { counts, sourceCounts } = useMemo(() => {
    // If a date range is active, calculate counts within that date range so the pills match reality
    const dateFilteredHistory = history.filter(h => {
      if (!fromDate && !toDate) return true
      const itemDate = getParcelDateStr(h.bookingDate)
      if (fromDate && (!itemDate || itemDate < fromDate)) return false
      if (toDate && (!itemDate || itemDate > toDate)) return false
      return true
    })

    const all = dateFilteredHistory.length
    let pendingLoadsheet = 0
    let booked = 0
    let inTransit = 0
    let outForDelivery = 0
    let actionRequired = 0
    let delivered = 0
    let returned = 0
    let cancelled = 0
    let waSent = 0
    let waPending = 0

    let srcApp = 0
    let srcPortal = 0

    dateFilteredHistory.forEach(h => {
      // Source counts
      const src = h.source || 'app'
      if (src === 'postex_portal') {
        srcPortal++
      } else {
        srcApp++
      }

      const cat = getStatusCategory(h.status, h.tracking, Boolean(h.hasLoadSheet || (h as any).has_load_sheet))
      if (cat === 'pending_loadsheet') pendingLoadsheet++
      else if (cat === 'booked') booked++
      else if (cat === 'intransit') inTransit++
      else if (cat === 'out_for_delivery') outForDelivery++
      else if (cat === 'action_required') actionRequired++
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

    return { 
      counts: { 
        all, 
        pendingLoadsheet, 
        booked, 
        inTransit, 
        outForDelivery,
        actionRequired, 
        delivered, 
        returned, 
        cancelled, 
        waSent, 
        waPending 
      },
      sourceCounts: {
        all,
        app: srcApp,
        portal: srcPortal
      }
    }
  }, [history, isWhatsAppSent, fromDate, toDate])

  // Filter and sort logic
  const filteredParcels = useMemo(() => {
    return history.filter(item => {
      // 1. Source Origin Filter
      if (sourceFilter !== 'all') {
        const itemSource = item.source || 'app'
        if (sourceFilter === 'app' && itemSource !== 'app') return false
        if (sourceFilter === 'postex_portal' && itemSource !== 'postex_portal') return false
      }

      // 2. Status Milestone Filter
      if (statusFilter !== 'all') {
        const cat = getStatusCategory(item.status, item.tracking, Boolean(item.hasLoadSheet || (item as any).has_load_sheet))
        if (cat !== statusFilter) return false
      }

      // 3. Search Query with Field Scope (all | name | phone | reference | tracking)
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim()
        const cleanDigits = q.replace(/\D/g, '')

        if (searchScope === 'name') {
          if (!item.name.toLowerCase().includes(q)) return false
        } else if (searchScope === 'phone') {
          const itemDigits = item.phone.replace(/\D/g, '')
          const matchesRaw = item.phone.toLowerCase().includes(q)
          const matchesDigits = cleanDigits.length > 0 && itemDigits.includes(cleanDigits)
          if (!matchesRaw && !matchesDigits) return false
        } else if (searchScope === 'reference') {
          if (!item.id.toLowerCase().includes(q)) return false
        } else if (searchScope === 'tracking') {
          if (!item.tracking.toLowerCase().includes(q)) return false
        } else {
          // 'all': Match across order id, tracking, name, phone, city
          const matchesOrder = item.id.toLowerCase().includes(q)
          const matchesTracking = item.tracking.toLowerCase().includes(q)
          const matchesName = item.name.toLowerCase().includes(q)
          const matchesPhone = item.phone.toLowerCase().includes(q)
          const matchesCity = item.city.toLowerCase().includes(q)
          if (!matchesOrder && !matchesTracking && !matchesName && !matchesPhone && !matchesCity) {
            return false
          }
        }
      }

      // 4. Date Range Filter
      const itemDate = getParcelDateStr(item.bookingDate)
      if (fromDate && (!itemDate || itemDate < fromDate)) return false
      if (toDate && (!itemDate || itemDate > toDate)) return false

      // 5. Select dropdown status filter
      if (statusSelect !== 'all') {
        const cat = getStatusCategory(item.status, item.tracking, Boolean(item.hasLoadSheet || (item as any).has_load_sheet))
        if (statusSelect === 'transit') {
          if (cat !== 'intransit') return false
        } else if (statusSelect === 'under_review' || statusSelect === 'action_required') {
          if (cat !== 'action_required') return false
        } else if (statusSelect === 'out_for_delivery') {
          if (cat !== 'out_for_delivery') return false
        } else if (statusSelect === 'pending_loadsheet') {
          if (cat !== 'pending_loadsheet') return false
        } else {
          if (cat !== statusSelect) return false
        }
      }

      // 6. City / Pickup Filter
      if (pickupFilter !== 'all') {
        if (item.city.toUpperCase() !== pickupFilter.toUpperCase()) return false
      }

      // 7. WhatsApp Alert Sent / Pending Filter
      if (whatsappFilter && whatsappFilter !== 'all') {
        const sent = Boolean(item.whatsapp_sent || item.whatsappSent || (isWhatsAppSent && isWhatsAppSent(item.tracking, item.id)))
        if (whatsappFilter === 'sent' && !sent) return false
        if (whatsappFilter === 'pending' && sent) return false
      }

      return true
    }).sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
  }, [history, statusFilter, sourceFilter, searchQuery, searchScope, fromDate, toDate, statusSelect, pickupFilter, whatsappFilter, isWhatsAppSent])

  return { counts, sourceCounts, filteredParcels }
}

