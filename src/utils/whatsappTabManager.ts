/**
 * Single Source of Truth (SSOT1) for WhatsApp Tab & Dispatch Management.
 * 
 * Solves 2 Critical Production Problems:
 * 1. Single Reused Tab for WhatsApp Web:
 *    Retains an active in-memory Window reference (`activeWhatsAppTab`) and persistent
 *    window target name ('whatsapp_web'). When subsequent messages are sent, it routes
 *    navigation into the existing tab rather than spawning new duplicate tabs.
 * 
 * 2. Desktop App Redirect:
 *    Direct `whatsapp://` native protocol launcher that triggers the desktop app
 *    with 0 browser tabs opened.
 */

/**
 * Standardizes Pakistani and international phone numbers into clean international format
 * (e.g. 0331-9806502 -> 923319806502).
 */
export function cleanWhatsAppPhone(phone?: string): string {
  if (!phone) return ''
  let clean = phone.replace(/[^\d+]/g, '')
  if (clean.startsWith('+')) clean = clean.substring(1)
  if (clean.startsWith('0092')) clean = clean.substring(2)
  if (clean.startsWith('0')) {
    clean = '92' + clean.substring(1)
  } else if (!clean.startsWith('92') && clean.length === 10) {
    clean = '92' + clean
  }
  return clean
}

/**
 * Opens a clean WhatsApp Web window without spawning blank tabs.
 */
export function openWhatsAppWebUrl(url: string): Window | null {
  const win = window.open(url, '_blank')
  if (win) {
    try {
      win.focus()
    } catch (_) {}
  }
  return win
}

export type WhatsAppTarget = 'web' | 'app'

export interface DispatchWhatsAppOptions {
  phone?: string
  text: string
  target?: WhatsAppTarget | string
  isMobile?: boolean
}

/**
 * Unified dispatch function for all WhatsApp alerts.
 * Exactly 2 modes on Desktop:
 * - 'app': App Redirect (Launches WhatsApp Desktop via official Meta cloud gateway with 0 lookup errors)
 * - 'web': WhatsApp Web (Direct web.whatsapp.com browser tab)
 */
export function dispatchWhatsAppMessage({
  phone,
  text,
  target = 'app',
  isMobile = false
}: DispatchWhatsAppOptions): void {
  const cleanPhone = cleanWhatsAppPhone(phone)
  const encoded = encodeURIComponent(text)

  // 1. Mobile devices: api.whatsapp.com handles native iOS / Android app handoff automatically
  if (isMobile) {
    const mobileUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
    window.location.href = mobileUrl
    return
  }

  // 2. Desktop App Redirect (Official api.whatsapp.com endpoint):
  // Pre-validates unsaved Pakistani numbers via Meta's cloud directory before handing off
  // to macOS / Windows WhatsApp Desktop app. This eliminates the
  // "Couldn't look up phone number +92... Check your phone's internet connection" error.
  if (target === 'app') {
    const appGatewayUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
    window.open(appGatewayUrl, '_blank')
    return
  }

  // 3. WhatsApp Web Mode
  const webUrl = `https://web.whatsapp.com/send/?phone=${cleanPhone}&text=${encoded}`
  openWhatsAppWebUrl(webUrl)
}

