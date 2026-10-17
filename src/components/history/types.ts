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
  return s.includes('cancel')
}

export const isUnbookedStatus = (status: string) => {
  if (!status) return false
  const s = status.toLowerCase()
  return s.includes('unbooked') || s.includes('un-assigned') || s.includes('unassigned') || s.includes('unasined') || s === 'success'
}

export const isBookedStatus = (status: string) => {
  if (!status) return false
  const s = status.toLowerCase()
  return s === 'booked'
}

export const getDisplayStatus = (status: string) => {
  if (isCancelledStatus(status)) return 'Cancelled'
  if (isUnbookedStatus(status)) return 'UNBOOKED'
  if (isBookedStatus(status)) return 'BOOKED'
  return status
}

export const isUnderReview = (status: string) => {
  if (!status) return false
  const s = status.toLowerCase()
  return s.includes('review') || s.includes('under review') || s.includes('attempt')
}

export const determineNewStatus = (currentStatus: string, fetchedStatus: string) => {
  if (isUnbookedStatus(fetchedStatus)) {
    if (isCancelledStatus(currentStatus)) return currentStatus
    if (isBookedStatus(currentStatus)) return currentStatus
  }
  return fetchedStatus
}

export const getStatusCategory = (status: string, tracking: string): StatusFilterType => {
  if (isCancelledStatus(status)) return 'cancelled'
  
  const s = status.toLowerCase()
  if (s.includes('deliver')) return 'delivered'
  if (s.includes('return')) return 'returned'
  
  // Transit statuses
  if (
    s.includes('transit') || 
    s.includes('dispatch') || 
    s.includes('ship') || 
    s.includes('arrive') || 
    s.includes('pick') || 
    s.includes('hold') || 
    s.includes('attempt') || 
    s.includes('review')
  ) {
    return 'intransit'
  }

  if (isUnbookedStatus(status) || !tracking) {
    return 'pending_loadsheet'
  }
  
  return 'booked'
}

export const isCancellable = (status: string) => {
  if (!status) return false
  const s = status.toLowerCase()
  const cat = getStatusCategory(status, '')
  return !isCancelledStatus(status) && !s.includes('deliver') && !s.includes('return') && cat !== 'intransit'
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
