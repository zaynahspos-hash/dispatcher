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

let activeWhatsAppTab: Window | null = null

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
 * Opens or reuses a single active WhatsApp Web tab.
 * Uses persistent named target 'whatsapp_web' so subsequent sends route into
 * the same tab rather than creating duplicate tabs.
 */
export function openWhatsAppWebUrl(url: string): Window | null {
  // 1. If we have a retained handle, attempt in-place navigation
  // Note: Avoid relying solely on .closed check as COOP can report true while tab is active
  if (activeWhatsAppTab) {
    try {
      activeWhatsAppTab.location.href = url
      activeWhatsAppTab.focus()
      return activeWhatsAppTab
    } catch (_) {
      // Cross-origin boundary security restriction on direct property write
    }
  }

  // 2. Named window probe: if target 'whatsapp_web' exists, reuse it without spawning
  try {
    const existing = window.open('', 'whatsapp_web')
    if (existing) {
      existing.location.href = url
      existing.focus()
      activeWhatsAppTab = existing
      return existing
    }
  } catch (_) {}

  // 3. Fallback: Standard window.open with persistent target name
  const newWin = window.open(url, 'whatsapp_web')
  activeWhatsAppTab = newWin
  if (newWin) {
    try {
      newWin.focus()
    } catch (_) {}
  }
  return newWin
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
 * - 'web': WhatsApp Web (1 reused tab)
 * - 'app': App Redirect (Direct Desktop App via whatsapp://)
 */
export function dispatchWhatsAppMessage({
  phone,
  text,
  target = 'web',
  isMobile = false
}: DispatchWhatsAppOptions): void {
  const cleanPhone = cleanWhatsAppPhone(phone)
  const encoded = encodeURIComponent(text)

  // 1. Mobile devices: api.whatsapp.com handles native app handoff automatically
  if (isMobile) {
    const mobileUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
    window.location.href = mobileUrl
    return
  }

  // 2. Desktop App Redirect (whatsapp:// protocol handler - 0 browser tabs opened)
  if (target === 'app') {
    const nativeUrl = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`
    window.location.href = nativeUrl
    return
  }

  // 3. WhatsApp Web (Default & Single Reused Tab)
  const webUrl = `https://web.whatsapp.com/send/?phone=${cleanPhone}&text=${encoded}`
  openWhatsAppWebUrl(webUrl)
}
