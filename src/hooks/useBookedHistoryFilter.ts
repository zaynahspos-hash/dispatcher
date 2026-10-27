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
  searchExclude?: boolean
  fromDate: string
  toDate: string
  statusSelect: string
  pickupFilter: string
  whatsappFilter?: 'all' | 'pending' | 'sent'
  isWhatsAppSent?: (tracking: string, id?: string) => boolean
}

// Reusable scope predicates
function matchesSearchCriteria(item: BookedParcel, query?: string, scope: SearchScopeType = 'all', exclude: boolean = false): boolean {
  if (!query || !query.trim()) return true
  const q = query.toLowerCase().trim()
  const cleanDigits = q.replace(/\D/g, '')

  let isMatch = false
  if (scope === 'name') {
    isMatch = (item.name || '').toLowerCase().includes(q)
  } else if (scope === 'phone') {
    const itemDigits = (item.phone || '').replace(/\D/g, '')
    const matchesRaw = (item.phone || '').toLowerCase().includes(q)
    const matchesDigits = cleanDigits.length > 0 && itemDigits.includes(cleanDigits)
    isMatch = matchesRaw || matchesDigits
  } else if (scope === 'reference') {
    isMatch = (item.id || '').toLowerCase().includes(q)
  } else if (scope === 'tracking') {
    isMatch = (item.tracking || '').toLowerCase().includes(q)
  } else {
    // 'all': match order id, tracking, customer name, phone, or destination city
    isMatch = (
      (item.id || '').toLowerCase().includes(q) ||
      (item.tracking || '').toLowerCase().includes(q) ||
      (item.name || '').toLowerCase().includes(q) ||
      (item.phone || '').toLowerCase().includes(q) ||
      (item.city || '').toLowerCase().includes(q)
    )
  }

  return exclude ? !isMatch : isMatch
}

function matchesDateRange(bookingDate?: string, fromDate?: string, toDate?: string): boolean {
  if (!fromDate && !toDate) return true
  const itemDate = getParcelDateStr(bookingDate)
  if (fromDate && (!itemDate || itemDate < fromDate)) return false
  if (toDate && (!itemDate || itemDate > toDate)) return false
  return true
}

function matchesCity(city?: string, pickupFilter?: string): boolean {
  if (!pickupFilter || pickupFilter === 'all') return true
  return (city || '').toUpperCase().trim() === pickupFilter.toUpperCase().trim()
}

function matchesSource(source?: string, sourceFilter?: SourceFilterType): boolean {
  if (!sourceFilter || sourceFilter === 'all') return true
  const itemSource = source || 'app'
  return itemSource === sourceFilter
}

function matchesSelectStatus(status: string, tracking: string, hasLoadSheet: boolean, statusSelect?: string): boolean {
  if (!statusSelect || statusSelect === 'all') return true
  const cat = getStatusCategory(status, tracking, hasLoadSheet)
  if (statusSelect === 'transit') return cat === 'intransit'
  if (statusSelect === 'under_review' || statusSelect === 'action_required') return cat === 'action_required'
  if (statusSelect === 'out_for_delivery') return cat === 'out_for_delivery'
  if (statusSelect === 'pending_loadsheet') return cat === 'pending_loadsheet'
  return cat === statusSelect
}

function matchesWhatsApp(h: BookedParcel, whatsappFilter?: 'all' | 'pending' | 'sent', isWhatsAppSent?: (tracking: string, id?: string) => boolean): boolean {
  if (!whatsappFilter || whatsappFilter === 'all') return true
  const sent = Boolean(h.whatsapp_sent || h.whatsappSent || (isWhatsAppSent && isWhatsAppSent(h.tracking, h.id)))
  if (whatsappFilter === 'sent' && !sent) return false
  if (whatsappFilter === 'pending' && sent) return false
  return true
}

export function useBookedHistoryFilter({
  history,
  statusFilter,
  sourceFilter = 'all',
  searchQuery,
  searchScope = 'all',
  searchExclude = false,
  fromDate,
  toDate,
  statusSelect,
  pickupFilter,
  whatsappFilter = 'all',
  isWhatsAppSent
}: UseBookedHistoryFilterProps) {
  // Dynamic counts for status tabs, source origins, and WhatsApp alerts
  // Fully reactive to the active search query, date scope, pickup city, and peer filters
  const { counts, sourceCounts } = useMemo(() => {
    // 1. Status Tabs Scope: Filtered by date range, search query/scope, city, source, and WhatsApp
    const statusScopedHistory = history.filter(h => {
      if (!matchesDateRange(h.bookingDate, fromDate, toDate)) return false
      if (!matchesSearchCriteria(h, searchQuery, searchScope, searchExclude)) return false
      if (!matchesCity(h.city, pickupFilter)) return false
      if (!matchesSource(h.source, sourceFilter)) return false
      if (!matchesWhatsApp(h, whatsappFilter, isWhatsAppSent)) return false
      return true
    })

    const all = statusScopedHistory.length
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

    statusScopedHistory.forEach(h => {
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

    // 2. Source Counts Scope: Filtered by date range, search query/scope, city, status, and WhatsApp
    const sourceScopedHistory = history.filter(h => {
      if (!matchesDateRange(h.bookingDate, fromDate, toDate)) return false
      if (!matchesSearchCriteria(h, searchQuery, searchScope, searchExclude)) return false
      if (!matchesCity(h.city, pickupFilter)) return false
      if (!matchesWhatsApp(h, whatsappFilter, isWhatsAppSent)) return false

      if (statusFilter !== 'all') {
        const cat = getStatusCategory(h.status, h.tracking, Boolean(h.hasLoadSheet || (h as any).has_load_sheet))
        if (cat !== statusFilter) return false
      }
      if (!matchesSelectStatus(h.status, h.tracking, Boolean(h.hasLoadSheet || (h as any).has_load_sheet), statusSelect)) return false
      return true
    })

    let srcApp = 0
    let srcPortal = 0
    sourceScopedHistory.forEach(h => {
      const src = h.source || 'app'
      if (src === 'postex_portal') {
        srcPortal++
      } else {
        srcApp++
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
        all: sourceScopedHistory.length,
        app: srcApp,
        portal: srcPortal
      }
    }
  }, [history, fromDate, toDate, searchQuery, searchScope, searchExclude, pickupFilter, sourceFilter, statusFilter, statusSelect, whatsappFilter, isWhatsAppSent])

  // Filter and sort logic for displayed parcels manifest
  const filteredParcels = useMemo(() => {
    return history.filter(item => {
      // 1. Source Origin Filter
      if (!matchesSource(item.source, sourceFilter)) return false

      // 2. Status Milestone Filter
      if (statusFilter !== 'all') {
        const cat = getStatusCategory(item.status, item.tracking, Boolean(item.hasLoadSheet || (item as any).has_load_sheet))
        if (cat !== statusFilter) return false
      }

      // 3. Search Query with Field Scope (all | name | phone | reference | tracking) & Exclude mode
      if (!matchesSearchCriteria(item, searchQuery, searchScope, searchExclude)) return false

      // 4. Date Range Filter
      if (!matchesDateRange(item.bookingDate, fromDate, toDate)) return false

      // 5. Select dropdown status filter
      if (!matchesSelectStatus(item.status, item.tracking, Boolean(item.hasLoadSheet || (item as any).has_load_sheet), statusSelect)) return false

      // 6. City / Pickup Filter
      if (!matchesCity(item.city, pickupFilter)) return false

      // 7. WhatsApp Alert Sent / Pending Filter
      if (!matchesWhatsApp(item, whatsappFilter, isWhatsAppSent)) return false

      return true
    }).sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
  }, [history, statusFilter, sourceFilter, searchQuery, searchScope, searchExclude, fromDate, toDate, statusSelect, pickupFilter, whatsappFilter, isWhatsAppSent])

  return { counts, sourceCounts, filteredParcels }
}

