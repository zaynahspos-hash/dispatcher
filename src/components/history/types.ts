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
  whatsapp_sent_at?: string
  whatsappSentAt?: string
  loadsheet_generated?: boolean
}

export type StatusFilterType = 'pending_loadsheet' | 'all' | 'booked' | 'intransit' | 'delivered' | 'returned' | 'cancelled'

export interface ActionStatusState {
  type: 'success' | 'error'
  message: string
  actionLabel?: string
  onAction?: () => void
}

export const isCancelledStatus = (status: string) => {
  if (!status) return false
  const s = status.toLowerCase()
  return s.includes('cancel') || s === 'unbooked'
}

export const isBookedStatus = (status: string) => {
  if (!status) return false
  const s = status.toLowerCase()
  return s === 'booked' || s === 'success' || s.includes('unassigned') || s.includes('un-assigned') || s.includes('unasined')
}

export const isUnbookedStatus = (status: string) => {
  if (!status) return false
  const s = status.toLowerCase()
  return s === 'unbooked' || s.includes('cancel')
}

export const getDisplayStatus = (status: string, hasLoadSheet?: boolean) => {
  if (isCancelledStatus(status)) return 'Cancelled'
  const s = (status || '').toLowerCase()
  if (s.includes('deliver')) return 'Delivered'
  if (s.includes('return')) return 'Returned'
  if (isUnderReview(status)) return 'Under Review'
  if (
    s.includes('transit') ||
    s.includes('out for delivery') ||
    s.includes('dispatched') ||
    s.includes('route') ||
    s.includes('warehouse') ||
    s.includes('hub') ||
    s.includes('station') ||
    s.includes('arrive') ||
    s.includes('pick')
  ) {
    return status
  }
  if (hasLoadSheet && isBookedStatus(status)) return 'Manifested'
  if (isBookedStatus(status)) return 'Booked'
  return status
}

export const isUnderReview = (status: string) => {
  if (!status) return false
  const s = status.toLowerCase()
  return s.includes('review') || s.includes('under review') || s.includes('attempt')
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
  return clean
}

export const getStatusCategory = (status: string, tracking: string): StatusFilterType => {
  if (isCancelledStatus(status)) return 'cancelled'
  
  const s = (status || '').toLowerCase()
  if (s.includes('deliver')) return 'delivered'
  if (s.includes('return')) return 'returned'
  
  // Transit statuses (courier handling, moving, warehouse, dispatch, review)
  if (
    s.includes('transit') || 
    s.includes('dispatch') || 
    s.includes('ship') || 
    s.includes('arrive') || 
    s.includes('pick') || 
    s.includes('hold') || 
    s.includes('attempt') || 
    s.includes('review') ||
    s.includes('warehouse') ||
    s.includes('route') ||
    s.includes('en-route') ||
    s.includes('en route') ||
    s.includes('out for delivery') ||
    s.includes('hub') ||
    s.includes('station')
  ) {
    return 'intransit'
  }

  if (!tracking) {
    return 'pending_loadsheet'
  }
  
  return 'booked'
}

export const isCancellable = (status: string, hasLoadSheet?: boolean) => {
  if (!status) return false
  if (hasLoadSheet) return false // CRITICAL: Once a load sheet is generated, PostEx portal blocks cancellation!
  if (isCancelledStatus(status)) return false
  const s = status.toLowerCase()
  if (s.includes('deliver') || s.includes('return')) return false
  const cat = getStatusCategory(status, '')
  if (cat === 'intransit' || cat === 'delivered' || cat === 'returned' || cat === 'cancelled') return false
  return true
}

export const getWhatsAppLink = (parcel: BookedParcel, whatsappNote?: string, whatsappTemplate?: string) => {
  let cleanPhone = parcel.phone.replace(/\D/g, '')
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '92' + cleanPhone.substring(1)
  } else if (!cleanPhone.startsWith('92') && cleanPhone.length === 10) {
    cleanPhone = '92' + cleanPhone
  }

  const trackingUrl = `https://postex.pk/tracking?cn=${parcel.tracking || ''}`
  const defaultNote = 'Meharbani farma kar apna local SIM phone number ON rakhain \u{1F4F1}\u{1F514} taake delivery rider asani se rabta kar sake \u{1F69A}\u{1F4A8}\n\nReview dejye ga lazmi is number pe \u2B50\u{1F4DD} aur agar 2-5 din mein parcel receive nahi hota \u23F3 to is number pe rabta karna hai \u260E\uFE0F\n\nHappy Shopping! \u{1F6CD}\uFE0F\u{1F60A}\u{1F389}'
  const noteContent = whatsappNote && whatsappNote !== 'Thank you for shopping with us!' && whatsappNote.includes('\u{1F4F1}') ? whatsappNote : defaultNote
  
  const formattedTotal = Number(parcel.total || 0).toLocaleString('en-PK')
  let template = whatsappTemplate || 'postex.pk \u2022 Tracking Alert \u{1F4E6}\u2728\n\nDear {customer_name}, aap ka order book ho gaya hai \u2705\nAap ise yahan track kar sakti hain \u{1F50D}\u{1F447}\n{portal_link}\n\n{note}'

  // Upgrade legacy default templates to include rich emoji alert
  if (template.includes('Dear {name}, your order has been booked') || !template.includes('\u2705')) {
    template = 'postex.pk \u2022 Tracking Alert \u{1F4E6}\u2728\n\nDear {customer_name}, aap ka order book ho gaya hai \u2705\nAap ise yahan track kar sakti hain \u{1F50D}\u{1F447}\n{portal_link}\n\n{note}'
  }

  template = template
    .replace(/{(?:name|customer_name)}/g, parcel.name)
    .replace(/{(?:url|portal_link)}/g, trackingUrl)
    .replace(/{(?:amount|order_amount|total)}/g, formattedTotal)
    .replace(/{(?:tracking|tracking_number)}/g, parcel.tracking || '')
    .replace(/{note}/g, noteContent)

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(template)}`
}
