export interface BookedParcel {
  id: string
  name: string
  phone: string
  city: string
  address: string
  total: number
  items: number
  weight: number
  detail: string
  note: string
  tracking: string
  bookingDate: string
  status: string
  orderType?: string
  whatsapp_sent?: boolean
  whatsappSent?: boolean
  whatsapp_booking_sent?: boolean
  whatsapp_status_sent?: boolean
  whatsapp_sent_at?: string
  whatsappSentAt?: string
  loadsheet_generated?: boolean
  hasLoadSheet?: boolean
  source?: 'app' | 'postex_portal'
  updated_at?: string
  whatsapp_milestones?: { [milestone: string]: boolean }
}

export type WhatsAppAlertState = 'none' | 'booking_only' | 'status_only' | 'both'

export type StatusFilterType = 
  | 'pending_loadsheet' 
  | 'all' 
  | 'booked' 
  | 'intransit' 
  | 'out_for_delivery'
  | 'action_required'
  | 'delivered' 
  | 'returned' 
  | 'cancelled'

export type SourceFilterType = 'all' | 'app' | 'postex_portal'

export type WhatsAppMilestone = 'booking' | 'in_transit' | 'out_for_delivery' | 'action_required' | 'delivered'

/**
 * Single source of truth helper to check if a parcel has had a WhatsApp alert sent.
 * Resolves both cloud-synced fields and local reactive tracker without discrepancy.
 */
export const isParcelWhatsAppSent = (
  parcel: {
    whatsapp_sent?: boolean
    whatsappSent?: boolean
    whatsapp_booking_sent?: boolean
    whatsapp_status_sent?: boolean
    tracking?: string
    id?: string
  },
  isTrackerSent?: (key?: string | null) => boolean
): boolean => {
  if (parcel.whatsapp_sent === true || parcel.whatsappSent === true) return true
  if (parcel.whatsapp_booking_sent === true || parcel.whatsapp_status_sent === true) return true
  if (isTrackerSent) {
    if (parcel.tracking && isTrackerSent(parcel.tracking)) return true
    if (parcel.id && isTrackerSent(parcel.id)) return true
  }
  return false
}

export const isFakeOrDemoPhone = (phone?: string, name?: string): boolean => {
  const p = (phone || '').replace(/\D/g, '')
  const n = (name || '').toLowerCase()
  if (!p) return false
  if (/^0+$/.test(p) || p.startsWith('03000000000') || p.startsWith('923000000000')) return true
  if (n.includes('jjjjj') || n.includes('test demo')) return true
  if (p === '03001234567' || p === '923001234567' || p === '03339876543' || p === '923339876543' || p === '03451234567' || p === '923451234567') return true
  return false
}

export const getLocalTodayDate = (): string => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export type DatePresetType = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'last3Months'

export interface DatePresetsInfo {
  todayStr: string
  yestStr: string
  last7Str: string
  thisMonthStr: string
  last3MonthsStr: string
  getRangeForPreset: (preset: DatePresetType) => { fromDate: string; toDate: string }
  detectPreset: (fromDate: string, toDate: string) => DatePresetType | null
}

export const getDatePresetsInfo = (refDate: Date = new Date()): DatePresetsInfo => {
  const formatDate = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const todayStr = formatDate(refDate)

  const yest = new Date(refDate)
  yest.setDate(refDate.getDate() - 1)
  const yestStr = formatDate(yest)

  const d7 = new Date(refDate)
  d7.setDate(refDate.getDate() - 7)
  const last7Str = formatDate(d7)

  const firstMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1)
  const thisMonthStr = formatDate(firstMonth)

  const d90 = new Date(refDate)
  d90.setDate(refDate.getDate() - 90)
  const last3MonthsStr = formatDate(d90)

  const getRangeForPreset = (preset: DatePresetType): { fromDate: string; toDate: string } => {
    switch (preset) {
      case 'today':
        return { fromDate: todayStr, toDate: todayStr }
      case 'yesterday':
        return { fromDate: yestStr, toDate: yestStr }
      case 'last7':
        return { fromDate: last7Str, toDate: todayStr }
      case 'thisMonth':
        return { fromDate: thisMonthStr, toDate: todayStr }
      case 'last3Months':
        return { fromDate: last3MonthsStr, toDate: todayStr }
    }
  }

  const detectPreset = (fromDate: string, toDate: string): DatePresetType | null => {
    if (fromDate === todayStr && toDate === todayStr) return 'today'
    if (fromDate === yestStr && toDate === yestStr) return 'yesterday'
    if (fromDate === last7Str && toDate === todayStr) return 'last7'
    if (fromDate === thisMonthStr && toDate === todayStr) return 'thisMonth'
    if (fromDate === last3MonthsStr && toDate === todayStr) return 'last3Months'
    return null
  }

  return {
    todayStr,
    yestStr,
    last7Str,
    thisMonthStr,
    last3MonthsStr,
    getRangeForPreset,
    detectPreset
  }
}

/**
 * Extracts normalized YYYY-MM-DD date string with absolute zero timezone distortion.
 * Prioritizes direct YYYY-MM-DD substring matching to preserve official courier timestamps.
 */
export const getParcelDateStr = (dateVal?: string): string => {
  if (!dateVal) return ''
  const str = String(dateVal).trim()
  if (!str) return ''

  // 1. Direct YYYY-MM-DD prefix (prevents local/UTC timezone distortion on PKT dates)
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`

  // 2. Direct DD/MM/YYYY or DD-MM-YYYY format
  const matchSlash = str.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/)
  if (matchSlash) return `${matchSlash[3]}-${matchSlash[2]}-${matchSlash[1]}`

  // 3. Fallback for timestamps or arbitrary date formats
  const d = new Date(str)
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return ''
}

export interface ActionStatusState {
  type: 'success' | 'error'
  message: string
  actionLabel?: string
  onAction?: () => void
}

export const isCancelledStatus = (status: string) => {
  if (!status) return false
  const s = status.toLowerCase()
  return s.includes('cancel')
}

export const isBookedStatus = (status: string) => {
  if (!status) return false
  const s = status.toLowerCase()
  return s === 'booked' || s === 'success' || s.includes('unassigned') || s.includes('un-assigned') || s.includes('unasined') || s === 'manifested'
}

export const isDeliveredStatus = (status: string) => {
  if (!status) return false
  const s = status.toLowerCase().trim()
  if (
    s.includes('out for delivery') ||
    s.includes('out-for-delivery') ||
    s.includes('out_for_delivery') ||
    s.includes('waiting for delivery') ||
    s.includes('pending delivery') ||
    s.includes('with rider') ||
    s.includes('assigned to') ||
    s.includes('attempt') ||
    s.includes('return') ||
    s.includes('cancel')
  ) {
    return false
  }
  return s.includes('delivered')
}

export const isOutForDelivery = (status: string) => {
  if (!status) return false
  const s = status.toLowerCase().trim()
  if (
    s.includes('delivered') ||
    s.includes('cancel') ||
    s.includes('failed') ||
    s.includes('unreachable') ||
    s.includes('refused') ||
    s.includes('returned') ||
    s.includes('return to')
  ) {
    return false
  }
  return (
    s.includes('out for delivery') ||
    s.includes('out-for-delivery') ||
    s.includes('out_for_delivery') ||
    s.includes('waiting for delivery') ||
    s.includes('with rider') ||
    s.includes('with courier') ||
    s.includes('assigned to rider') ||
    s.includes('assigned to courier') ||
    s.includes('assigned to delivery') ||
    s.includes('assigned delivery') ||
    s.includes('rider assigned') ||
    s.includes('courier assigned') ||
    s.includes('dispatched for delivery') ||
    s.includes('on vehicle') ||
    s.includes('runsheet') ||
    s.includes('drs') ||
    s === 'ofd' ||
    s.startsWith('ofd ') ||
    s.endsWith(' ofd') ||
    s.includes(' ofd ')
  )
}

export const isActionRequired = (status: string) => {
  if (!status) return false
  const s = status.toLowerCase().trim()
  return (
    s.includes('review') ||
    s.includes('attempt') ||
    s.includes('unreachable') ||
    s.includes('refused') ||
    s.includes('failed') ||
    s.includes('hold') ||
    s.includes('advice') ||
    s.includes('retry') ||
    s.includes('reattempt')
  )
}

export const isUnderReview = (status: string) => {
  return isActionRequired(status)
}

export const isUnbookedStatus = (status: string) => {
  if (!status) return true
  const s = status.toLowerCase().trim()
  return (
    s === 'unbooked' ||
    s.includes('un-assigned') ||
    s.includes('unassigned') ||
    s === 'success' ||
    (s.startsWith('at ') && s.includes('warehouse') && !s.includes('postex'))
  )
}

export const isDetailedMilestone = (status: string): boolean => {
  const s = (status || '').toLowerCase().trim()
  if (!s) return false
  return (
    s.includes('depart') ||
    s.includes('arrive') ||
    s.includes('received') ||
    s.includes('at transit') ||
    s.includes('postex warehouse') ||
    s.includes('warehouse') ||
    s.includes('hub') ||
    s.includes('station')
  )
}

export const getLatestPostExStatus = (dist: any): string => {
  if (!dist) return 'Booked'
  const list = dist.transactionStatusHistory
  if (Array.isArray(list) && list.length > 0) {
    // Sort descending by timestamp so newest milestone is always index 0
    const sorted = [...list].sort((a, b) => {
      const timeA = new Date(a.modifiedDatetime || a.createdDatetime || a.datetime || 0).getTime()
      const timeB = new Date(b.modifiedDatetime || b.createdDatetime || b.datetime || 0).getTime()
      return timeB - timeA
    })
    const msg = sorted[0]?.transactionStatusMessage || sorted[0]?.transactionStatus || sorted[0]?.status || list[0]?.transactionStatusMessage || list[0]?.transactionStatus
    if (typeof msg === 'string' && msg.trim()) {
      return msg.trim()
    }
  }
  return dist.transactionStatus || dist.orderStatus || 'Booked'
}

export const formatMilestoneTitle = (text: string): string => {
  if (!text) return ''
  const knownAcronyms = new Set(['LHE', 'KHI', 'ISB', 'PEW', 'MUX', 'FSD', 'RWP', 'SKT', 'HYD', 'GUJ', 'CN', 'COD', 'PK', 'AI', 'POS', 'HUB', 'WH'])
  const lowercaseWords = new Set(['at', 'in', 'of', 'for', 'to', 'by', 'on', 'from', 'with'])
  
  return text
    .split(/\s+/)
    .map((word, idx) => {
      const upper = word.toUpperCase()
      if (knownAcronyms.has(upper)) return upper
      const lower = word.toLowerCase()
      if (lower === 'postex') return 'PostEx'
      if (idx > 0 && lowercaseWords.has(lower)) return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

export const getDisplayStatus = (status: string, hasLoadSheet?: boolean) => {
  if (!status) return hasLoadSheet ? 'Ready for Pickup' : 'Pending Loadsheet'
  if (isCancelledStatus(status)) return 'Cancelled'
  if (isDeliveredStatus(status)) return 'Delivered'
  if (isOutForDelivery(status)) return 'Out for Delivery'
  if (isActionRequired(status)) return 'Action Required'
  const s = status.toLowerCase().trim()
  if (s.includes('return') && !s.includes('return to sender requested')) return 'Returned'

  // If status is merchant warehouse (e.g. "At Little Mister Kids Clothing Warehouse"):
  if (s.startsWith('at ') && s.includes('warehouse') && !s.includes('postex')) {
    return hasLoadSheet ? 'Ready for Pickup' : 'Pending Loadsheet'
  }

  // If unbooked or generic booked:
  if (isUnbookedStatus(s) || s === 'booked' || s === 'unassigned') {
    return hasLoadSheet ? 'Ready for Pickup' : 'Pending Loadsheet'
  }

  // If PostEx rider picked it up:
  if (s.includes('picked by postex') || s.includes('picked up')) {
    return 'Picked by Courier'
  }

  // If exact generic transit:
  if (s === 'in transit' || s === 'in-transit' || s === 'intransit' || s === 'en route' || s === 'en-route') {
    return 'In Transit'
  }

  // Clean redundant "for CN ..." or "for Tracking ..." suffixes from PostEx timeline entries
  const clean = status.replace(/\s+for\s+(CN|Tracking)\s+[\w\d]+/gi, '').trim()
  if (clean) return formatMilestoneTitle(clean)

  return hasLoadSheet ? 'Ready for Pickup' : 'Pending Loadsheet'
}

export const determineNewStatus = (currentStatus: string, fetchedStatus: string) => {
  if (!fetchedStatus) return currentStatus
  const clean = fetchedStatus.trim()
  const f = clean.toLowerCase()
  if (!clean || f === 'unknown' || f === 'null' || f === 'undefined' || f.includes('not found')) {
    return currentStatus
  }
  if (f.includes('unassigned') || f.includes('un-assigned') || f === 'success') {
    return 'Booked'
  }

  // If current status is a detailed milestone (e.g. "Received at LHE Warehouse") and fetchedStatus is generic "In Transit", preserve detailed milestone!
  if (
    isDetailedMilestone(currentStatus) &&
    (f === 'in transit' || f === 'in-transit' || f === 'intransit' || f === 'en route' || f === 'en-route' || f === 'dispatched')
  ) {
    return currentStatus
  }

  return clean
}

export const getStatusCategory = (status: string, _tracking?: string, hasLoadSheet?: boolean): StatusFilterType => {
  if (isCancelledStatus(status)) return 'cancelled'
  if (isDeliveredStatus(status)) return 'delivered'
  if (isOutForDelivery(status)) return 'out_for_delivery'
  if (isActionRequired(status)) return 'action_required'
  
  const s = (status || '').toLowerCase().trim()
  if (s.includes('return') && !s.includes('return to sender requested')) return 'returned'

  // Real courier transit statuses (moving in courier network)
  if (
    s.includes('postex warehouse') ||
    s.includes('picked by postex') ||
    s.includes('transit') || 
    s.includes('dispatch') || 
    s.includes('depart') ||
    s.includes('ship') || 
    s.includes('arrive') || 
    s.includes('en-route') ||
    s.includes('en route') ||
    s.includes('hub') ||
    s.includes('station') ||
    s.includes('received at') ||
    s.includes('received')
  ) {
    return 'intransit'
  }

  // If loadsheet has been generated, it is manifested / booked
  if (hasLoadSheet) {
    return 'booked'
  }

  // If status is Unbooked, or at merchant warehouse, or has no loadsheet yet, it is pending loadsheet
  if (
    isUnbookedStatus(s) || 
    s === 'booked' || 
    (s.startsWith('at ') && s.includes('warehouse') && !s.includes('postex'))
  ) {
    return 'pending_loadsheet'
  }

  return 'booked'
}

/**
 * Shared SSOT for status badge styling across Desktop table, Mobile cards, and modals.
 * Uses clean Apple-grade alpha opacity in dark mode and subtle pastel borders in light mode.
 */
export const getStatusBadgeStyle = (status: string, tracking?: string, hasLoadSheet?: boolean): string => {
  const cat = getStatusCategory(status, tracking, hasLoadSheet)
  const underReview = isUnderReview(status)

  if (cat === 'delivered' || cat === 'booked' || status === 'success') {
    return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
  }
  if (cat === 'out_for_delivery') {
    return 'bg-purple-500/10 border-purple-500/25 text-purple-700 dark:text-purple-400'
  }
  if (cat === 'intransit') {
    return 'bg-sky-500/10 border-sky-500/25 text-sky-700 dark:text-sky-400'
  }
  if (cat === 'cancelled' || cat === 'returned') {
    return 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-400'
  }
  if (underReview || cat === 'action_required') {
    return 'bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400'
  }
  if (cat === 'pending_loadsheet') {
    return 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
  }
  return 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
}

export const isCancellable = (status: string, hasLoadSheet?: boolean, tracking?: string) => {
  if (!status) return false
  if (hasLoadSheet) return false // CRITICAL: Once a load sheet is generated, PostEx portal blocks cancellation!
  if (isCancelledStatus(status)) return false
  const s = status.toLowerCase().trim()
  if (
    s.includes('deliver') ||
    s.includes('return') ||
    s.includes('transit') ||
    s.includes('depart') ||
    s.includes('arrive') ||
    s.includes('warehouse') ||
    s.includes('hub') ||
    s.includes('station') ||
    s.includes('out for delivery') ||
    s.includes('waiting for delivery') ||
    s.includes('dispatched') ||
    s.includes('picked') ||
    s.includes('review') ||
    s.includes('attempt')
  ) {
    return false
  }
  const cat = getStatusCategory(status, tracking || 'dummy')
  if (cat === 'intransit' || cat === 'out_for_delivery' || cat === 'action_required' || cat === 'delivered' || cat === 'returned' || cat === 'cancelled') return false
  return true
}

export const DEFAULT_MILESTONE_TEMPLATES: Record<WhatsAppMilestone, string> = {
  booking: '📦 postex.pk • Tracking Alert 🚚\n\nDear {customer_name}, aap ka order book ho gaya hai! 🎉\nAap ise yahan live track kar sakti hain:\n🔗 {portal_link}\n\n{note}',
  in_transit: '🚚 postex.pk • Shipment In Transit 🛣️\n\nDear {customer_name}, aap ka parcel courier network mein on the way hai! 📦💨\nLive Status: {live_status}\nTracking CN: {tracking_number}\nLive Link: 🔗 {portal_link}\n\n{note}',
  out_for_delivery: '🛵 postex.pk • Out For Delivery Alert 🚚\n\nDear {customer_name}, aap ka parcel Rider ke sath Out for Delivery nikal chuka hai! 📦💨\nOrder Total: Rs. {order_amount} 💵',
  action_required: '⚠️ postex.pk • Delivery Update Required 📞\n\nDear {customer_name}, rider ne aap ke order (Tracking: {tracking_number}) ki delivery koshish ki thi magar rabta nahi ho saka! 📵\nBarah-e-karam hume yahan WhatsApp par reply kar ke confirm karein ke delivery kis waqt karein 🕒 ya alternate number share karein taake order return na ho. 🙏',
  delivered: '✅ postex.pk • Order Delivered 🎉\n\nDear {customer_name}, aap ka parcel successfully deliver ho chuka hai! 🛍️✨\nThank you for shopping with us! ❤️\nAgar koi feedback ya review ho to zaroor share karein. ⭐⭐⭐⭐⭐'
}

export const detectParcelMilestone = (parcel: BookedParcel): WhatsAppMilestone => {
  if (isDeliveredStatus(parcel.status)) return 'delivered'
  if (isOutForDelivery(parcel.status)) return 'out_for_delivery'
  if (isActionRequired(parcel.status) || isUnderReview(parcel.status)) return 'action_required'
  const cat = getStatusCategory(parcel.status, parcel.tracking, Boolean(parcel.hasLoadSheet || (parcel as any).has_load_sheet))
  if (cat === 'intransit') return 'in_transit'
  return 'booking'
}

export const getMilestoneInfo = (milestone: WhatsAppMilestone) => {
  switch (milestone) {
    case 'delivered':
      return {
        label: 'Delivered',
        iconType: 'check' as const,
        shortLabel: 'Delivered',
        colorClass: 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
      }
    case 'out_for_delivery':
      return {
        label: 'Out for Delivery',
        iconType: 'truck' as const,
        shortLabel: 'Out for Delivery',
        colorClass: 'border-blue-200 dark:border-blue-800/80 bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'
      }
    case 'action_required':
      return {
        label: 'Action Required',
        iconType: 'alert' as const,
        shortLabel: 'Issue Alert',
        colorClass: 'border-amber-200 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50'
      }
    case 'in_transit':
      return {
        label: 'In Transit',
        iconType: 'truck' as const,
        shortLabel: 'In Transit',
        colorClass: 'border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
      }
    case 'booking':
    default:
      return {
        label: 'Ready for Pickup',
        iconType: 'package' as const,
        shortLabel: 'Ready',
        colorClass: 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
      }
  }
}

export const isCorruptText = (txt?: string): boolean => {
  if (!txt) return true
  if (
    txt.includes('\uFFFD') || 
    txt.includes('\uFFFE') || 
    txt.includes('\uFFFF') || 
    txt.includes('%EF%BF%BD') || 
    txt.includes('%ef%bf%bd') ||
    txt.startsWith('?? postex.pk') ||
    txt.startsWith('? postex.pk')
  ) {
    return true
  }
  return false
}

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export type WhatsAppClientTarget = 'auto' | 'web' | 'app'

export const getWhatsAppLink = (
  parcel: BookedParcel, 
  whatsappNote?: string, 
  whatsappTemplate?: string,
  milestone: WhatsAppMilestone | 'auto' = 'booking',
  clientTarget: WhatsAppClientTarget = 'auto'
) => {
  let cleanPhone = parcel.phone.replace(/\D/g, '')
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '92' + cleanPhone.substring(1)
  } else if (!cleanPhone.startsWith('92') && cleanPhone.length === 10) {
    cleanPhone = '92' + cleanPhone
  }

  const trackingUrl = `https://postex.pk/tracking?cn=${parcel.tracking || ''}`
  const defaultNote = 'Meharbani farma kar apna local SIM phone number ON rakhain 📱🔔 taake delivery rider asani se rabta kar sake 🚚💨\n\nReview dejye ga lazmi is number pe ⭐📝 aur agar 2-5 din mein parcel receive nahi hota ⏳ to is number pe rabta karna hai 📞\n\nHappy Shopping! 🛍️😊🎉'
  
  // Clean any broken \uFFFD replacement characters from legacy corrupt strings
  const sanitizeText = (txt: string) => {
    if (!txt) return ''
    return txt.replace(/[\uFFFD\uFFFE\uFFFF]/g, '').trim()
  }

  const noteIsCorrupt = !whatsappNote || isCorruptText(whatsappNote) || !whatsappNote.includes('📱')
  const rawNote = (!noteIsCorrupt && whatsappNote && whatsappNote !== 'Thank you for shopping with us!') 
    ? whatsappNote 
    : defaultNote
  let noteContent = sanitizeText(rawNote)
  if (!noteContent || isCorruptText(noteContent) || !noteContent.includes('📱')) {
    noteContent = defaultNote
  }
  
  const effectiveMilestone: WhatsAppMilestone = milestone === 'auto' ? detectParcelMilestone(parcel) : milestone
  const formattedTotal = Number(parcel.total || 0).toLocaleString('en-PK')
  
  // Use passed template if clean; otherwise fallback to default milestone template
  const templateIsCorrupt = !whatsappTemplate || isCorruptText(whatsappTemplate)
  let template = (!templateIsCorrupt && whatsappTemplate)
    ? whatsappTemplate
    : (DEFAULT_MILESTONE_TEMPLATES[effectiveMilestone] || DEFAULT_MILESTONE_TEMPLATES.booking)

  template = sanitizeText(template)
  if (!template || isCorruptText(template)) {
    template = DEFAULT_MILESTONE_TEMPLATES[effectiveMilestone] || DEFAULT_MILESTONE_TEMPLATES.booking
  }

  template = template
    .replace(/{(?:name|customer_name)}/g, parcel.name || 'Valued Customer')
    .replace(/{(?:url|portal_link)}/g, trackingUrl)
    .replace(/{(?:amount|order_amount|total)}/g, formattedTotal)
    .replace(/{(?:tracking|tracking_number)}/g, parcel.tracking || '')
    .replace(/{city}/g, parcel.city || '')
    .replace(/{(?:status|live_status)}/g, parcel.status || '')
    .replace(/{items}/g, String(parcel.items || 1))
    .replace(/{note}/g, noteContent)

  const encodedText = encodeURIComponent(template)

  // Resolve client preference: explicit argument -> stored localStorage -> auto
  const storedPreference = (typeof window !== 'undefined' ? localStorage.getItem('preferred_wa_client') : null) as WhatsAppClientTarget | null
  const effectiveTarget = clientTarget !== 'auto' ? clientTarget : (storedPreference || 'auto')

  if (effectiveTarget === 'app') {
    return `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`
  }

  if (effectiveTarget === 'web') {
    return `https://web.whatsapp.com/send/?phone=${cleanPhone}&text=${encodedText}`
  }

  // Auto Mode:
  // On mobile: use api.whatsapp.com which mobile OS intercepts via Universal/App Links to open WhatsApp natively
  if (isMobileDevice()) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
  }

  // On Desktop: use web.whatsapp.com directly.
  // CRITICAL FIX: api.whatsapp.com has a known Meta server bug where 4-byte UTF-8 emojis are rendered
  // as diamond question marks (\uFFFD) on the intermediate preview screen.
  // Pointing directly to web.whatsapp.com completely bypasses the preview page and preserves 100% of emojis.
  return `https://web.whatsapp.com/send/?phone=${cleanPhone}&text=${encodedText}`
}

export const isPlaceholder = (val: string) => {
  const v = (val || '').trim().toLowerCase()
  return !v || v === 'customer name' || v === 'customer' || v === 'placeholder' || v === 'undefined' || v === 'null'
}

const POSTEX_PORTAL_STATUS_MAP: Record<string, string> = {
  unbooked: 'Unbooked',
  booked: 'Booked',
  picked: 'Picked by PostEx',
  'picked by postex': 'Picked by PostEx',
  dispatched: 'In Transit',
  'in transit': 'In Transit',
  'in-transit': 'In Transit',
  'in stock': 'In Transit',
  transferred: 'In Transit',
  'under verification': 'Under Review',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
  returned: 'Returned',
  'out for delivery': 'Out for Delivery',
  'out-for-delivery': 'Out for Delivery',
  'out_for_delivery': 'Out for Delivery',
  'waiting for delivery': 'Out for Delivery',
  'pending delivery': 'Out for Delivery',
  'with rider': 'Out for Delivery',
  'with courier': 'Out for Delivery',
  'assigned to rider': 'Out for Delivery',
  'assigned to courier': 'Out for Delivery',
  'assigned to delivery': 'Out for Delivery',
  'dispatched for delivery': 'Out for Delivery',
  'rider assigned': 'Out for Delivery',
  'courier assigned': 'Out for Delivery',
  'on vehicle': 'Out for Delivery',
  ofd: 'Out for Delivery'
}

export const normalizePortalStatus = (raw?: string): string => {
  const value = (raw || '').trim()
  if (!value) return 'Unbooked'
  return POSTEX_PORTAL_STATUS_MAP[value.toLowerCase()] || value
}

/**
 * PostEx sends dates like "2026-10-22T08:41:11.000+0500".
 * The "+0500" offset is not valid ISO-8601 and Safari rejects it, so we
 * normalise it to "+05:00" before parsing.
 */
export const parsePortalDate = (value?: string): string => {
  const raw = (value || '').trim()
  if (!raw) return ''
  const normalized = raw.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
  const dateStr = getParcelDateStr(normalized)
  if (dateStr) {
    // If it contains time and offset, preserve it
    if (normalized.includes('T')) return normalized
    return `${dateStr}T12:00:00.000+05:00`
  }
  const parsed = new Date(normalized)
  return isNaN(parsed.getTime()) ? '' : parsed.toISOString()
}

/**
 * Combines the database-backed history with the direct-from-PostEx list.
 * Database entries always win (they carry the synced status), while external
 * parcels fill in everything that exists only on the PostEx side.
 */
export function mergeParcelLists(base: BookedParcel[], extras: BookedParcel[]): BookedParcel[] {
  const cleanBase = (base || []).filter(p => !isFakeOrDemoPhone(p.phone, p.name))
  const cleanExtras = (extras || []).filter(p => !isFakeOrDemoPhone(p.phone, p.name))
  if (cleanExtras.length === 0) return cleanBase
  const merged = new Map<string, BookedParcel>()

  cleanBase.forEach(parcel => {
    const key = (parcel.tracking || parcel.id || '').trim()
    if (key) merged.set(key, parcel)
  })

  cleanExtras.forEach(parcel => {
    const key = (parcel.tracking || parcel.id || '').trim()
    if (!key) return
    const existing = merged.get(key)
    if (!existing) {
      merged.set(key, parcel)
      return
    }
    const bookingSent = Boolean(existing.whatsapp_booking_sent || parcel.whatsapp_booking_sent)
    const statusSent = Boolean(existing.whatsapp_status_sent || parcel.whatsapp_status_sent)
    merged.set(key, {
      ...parcel,
      ...existing,
      whatsapp_booking_sent: bookingSent,
      whatsapp_status_sent: statusSent,
      whatsapp_sent: Boolean(existing.whatsapp_sent || existing.whatsappSent || parcel.whatsapp_sent || parcel.whatsappSent),
      whatsappSent: Boolean(existing.whatsapp_sent || existing.whatsappSent || parcel.whatsapp_sent || parcel.whatsappSent),
      whatsapp_sent_at: existing.whatsapp_sent_at || parcel.whatsapp_sent_at
    })
  })

  return Array.from(merged.values())
    .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
}

export function mergePostExOrders(history: BookedParcel[], postExOrders: any[]): BookedParcel[] {
  if (!postExOrders || !Array.isArray(postExOrders) || postExOrders.length === 0) return history
  const map = new Map<string, BookedParcel>()

  // 1. Index existing history
  history.forEach(p => {
    const trackKey = (p.tracking || '').trim().toLowerCase()
    const idKey = (p.id || '').trim().toLowerCase()
    if (trackKey) map.set(trackKey, p)
    if (idKey && !map.has(idKey)) map.set(idKey, p)
  })

  // 2. Merge PostEx orders
  postExOrders.forEach(order => {
    const tracking = (order.trackingNumber || '').trim()
    const ref = (order.orderRefNumber || '').trim()
    const trackKey = tracking.toLowerCase()
    const refKey = ref.toLowerCase()

    const existing = (trackKey && map.get(trackKey)) || (refKey && map.get(refKey))
    const rawOrderStatus = normalizePortalStatus(order.transactionStatus || order.orderStatus)
    const isUnbooked = rawOrderStatus.toLowerCase() === 'unbooked'
    const hasLoadSheet = !isUnbooked && rawOrderStatus.toLowerCase() !== 'cancelled'

    if (existing) {
      const rawStatus = rawOrderStatus || existing.status
      const updatedStatus = isUnbooked ? 'UNBOOKED' : determineNewStatus(existing.status, rawStatus)
      const effectiveHasLoadSheet = isUnbooked ? false : (Boolean(existing.hasLoadSheet) || hasLoadSheet)
      const merged: BookedParcel = {
        ...existing,
        tracking: tracking || existing.tracking,
        status: updatedStatus,
        hasLoadSheet: effectiveHasLoadSheet,
        loadsheet_generated: effectiveHasLoadSheet,
        name: isPlaceholder(existing.name) && order.customerName ? order.customerName : existing.name,
        phone: !existing.phone && order.customerPhone ? order.customerPhone : existing.phone,
        city: !existing.city && order.cityName ? order.cityName : existing.city,
        address: !existing.address && order.deliveryAddress ? order.deliveryAddress : existing.address,
        total: (!existing.total || existing.total === 0) && order.invoicePayment ? Number(order.invoicePayment) : existing.total
      }
      if (trackKey) map.set(trackKey, merged)
      if (refKey) map.set(refKey, merged)
    } else if (tracking) {
      const declaredWeight = Number(order.bookingWeight || order.actualWeight || 0)
      const newParcel: BookedParcel = {
        id: ref || tracking,
        name: order.customerName || 'Customer',
        phone: order.customerPhone || '',
        city: order.cityName || '',
        address: order.deliveryAddress || '',
        total: Number(order.invoicePayment || 0),
        items: Number(order.items || 1) || 1,
        weight: declaredWeight > 0 ? declaredWeight : 0.5,
        detail: order.orderDetail || 'Kids Clothes',
        note: order.transactionNotes || '',
        tracking: tracking,
        bookingDate: parsePortalDate(order.orderDate || order.bookingDate || order.transactionDate || order.createdDatetime || order.modifiedDatetime || order.orderDateString),
        status: rawOrderStatus,
        orderType: 'Normal',
        source: 'postex_portal',
        hasLoadSheet,
        loadsheet_generated: hasLoadSheet,
        whatsapp_sent: false,
        whatsappSent: false
      }
      map.set(trackKey, newParcel)
      if (refKey) map.set(refKey, newParcel)
    }
  })

  // Return unique parcels sorted by bookingDate desc
  const uniqueParcels = new Map<string, BookedParcel>()
  map.forEach(parcel => {
    const key = parcel.tracking || parcel.id
    if (key && !uniqueParcels.has(key)) {
      uniqueParcels.set(key, parcel)
    }
  })

  return Array.from(uniqueParcels.values())
    .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
}

/**
 * Single source of truth helper to parse any COD amount into a clean integer/float.
 * Handles numbers, string numbers, currency prefixes ("Rs. 1,949"), commas, and nulls.
 */
export function parseCODAmount(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  if (!val) return 0
  const cleaned = String(val).replace(/[^0-9.-]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : Math.round(num)
}

/**
 * Transforms raw PostEx API orders into BookedParcel objects for a specific date range.
 * Retains existing local metadata (like whatsapp_sent) from previous parcels of that tracking,
 * but only includes parcels present in postExOrders so old dates never leak into the active view.
 */
export function transformPostExOrders(postExOrders: any[], existingParcels: BookedParcel[] = []): BookedParcel[] {
  if (!postExOrders || !Array.isArray(postExOrders) || postExOrders.length === 0) return []
  const existingMap = new Map<string, BookedParcel>()
  existingParcels.forEach(p => {
    const trackKey = (p.tracking || '').trim().toLowerCase()
    const idKey = (p.id || '').trim().toLowerCase()
    if (trackKey) existingMap.set(trackKey, p)
    if (idKey && !existingMap.has(idKey)) existingMap.set(idKey, p)
  })

  const resultMap = new Map<string, BookedParcel>()

  postExOrders.forEach(order => {
    const tracking = (order.trackingNumber || '').trim()
    const ref = (order.orderRefNumber || '').trim()
    const trackKey = tracking.toLowerCase()
    const refKey = ref.toLowerCase()
    if (!tracking && !ref) return

    const existing = (trackKey && existingMap.get(trackKey)) || (refKey && existingMap.get(refKey))
    const rawOrderStatus = normalizePortalStatus(order.transactionStatus || order.orderStatus)
    const isUnbooked = rawOrderStatus.toLowerCase() === 'unbooked'
    const hasLoadSheet = !isUnbooked && rawOrderStatus.toLowerCase() !== 'cancelled'
    const rawDate = order.orderDate || order.bookingDate || order.transactionDate || order.createdDatetime || order.modifiedDatetime || order.orderDateString
    const resolvedBookingDate = parsePortalDate(rawDate) || existing?.bookingDate || ''
    const declaredWeight = Number(order.bookingWeight || order.actualWeight || 0)

    const parcel: BookedParcel = {
      id: ref || tracking,
      name: order.customerName || (existing?.name && !isPlaceholder(existing.name) ? existing.name : 'Customer'),
      phone: order.customerPhone || existing?.phone || '',
      city: order.cityName || existing?.city || '',
      address: order.deliveryAddress || existing?.address || '',
      total: parseCODAmount(order.invoicePayment || order.orderAmount || order.orderDetail?.invoicePayment || existing?.total || 0),
      items: Number(order.items || existing?.items || 1) || 1,
      weight: declaredWeight > 0 ? declaredWeight : (existing?.weight || 0.5),
      detail: order.orderDetail || existing?.detail || 'Kids Clothes',
      note: order.transactionNotes || existing?.note || '',
      tracking: tracking || existing?.tracking || '',
      bookingDate: resolvedBookingDate,
      status: isUnbooked ? 'UNBOOKED' : (existing ? determineNewStatus(existing.status, rawOrderStatus) : rawOrderStatus),
      orderType: 'Normal',
      source: 'postex_portal',
      hasLoadSheet: isUnbooked ? false : (Boolean(existing?.hasLoadSheet) || hasLoadSheet),
      loadsheet_generated: isUnbooked ? false : (Boolean(existing?.loadsheet_generated) || hasLoadSheet),
      whatsapp_sent: Boolean(existing?.whatsapp_sent || existing?.whatsappSent),
      whatsappSent: Boolean(existing?.whatsapp_sent || existing?.whatsappSent),
      whatsapp_booking_sent: Boolean(existing?.whatsapp_booking_sent),
      whatsapp_status_sent: Boolean(existing?.whatsapp_status_sent),
      whatsapp_sent_at: existing?.whatsapp_sent_at
    }

    const key = (tracking || ref).toLowerCase()
    resultMap.set(key, parcel)
  })

  return Array.from(resultMap.values()).sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
}

