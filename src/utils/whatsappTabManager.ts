/**
 * Single Source of Truth (SSOT1) for WhatsApp Tab & Dispatch Management.
 * 
 * Solves 2 Critical Production Problems:
 * 1. Single Reused Tab for WhatsApp Web:
 *    Retains an active in-memory Window reference (`activeWhatsAppTab`).
 *    When subsequent messages are sent, it updates `activeWhatsAppTab.location.href = url`
 *    and focuses the existing tab instead of opening new duplicate tabs.
 *    Permanently eliminates "WhatsApp is open in another window. Click Use here" alerts.
 * 
 * 2. Mac & Desktop App Support:
 *    - Native App (`whatsapp://`): Directly launches installed WhatsApp desktop app.
 *    - Universal Link (`wa.me`): Pre-resolves contact via Meta's servers to prevent
 *      the macOS Catalyst "Couldn't look up phone number. Check your phone's internet connection"
 *      bug on unsaved numbers.
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
 * NEVER creates duplicate tabs if one is already open.
 */
export function openWhatsAppWebUrl(url: string): Window | null {
  // If a WhatsApp Web tab is already open in this browser session, reuse it!
  if (activeWhatsAppTab && !activeWhatsAppTab.closed) {
    try {
      activeWhatsAppTab.location.href = url
      activeWhatsAppTab.focus()
      return activeWhatsAppTab
    } catch (_) {
      // If detached or restricted, fallback to window.open
    }
  }

  // First time or previous tab was closed: open named window
  const newWin = window.open(url, 'whatsapp_web')
  activeWhatsAppTab = newWin
  if (newWin) {
    try {
      newWin.focus()
    } catch (_) {}
  }
  return newWin
}

export type WhatsAppTarget = 'web' | 'app' | 'universal'

export interface DispatchWhatsAppOptions {
  phone?: string
  text: string
  target?: WhatsAppTarget
  isMobile?: boolean
}

/**
 * Unified dispatch function for all WhatsApp alerts.
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

  // 2. Native Desktop App (whatsapp:// protocol)
  if (target === 'app') {
    const nativeUrl = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`
    window.location.href = nativeUrl
    return
  }

  // 3. Universal Web-to-App link (wa.me)
  // Bypasses Mac desktop contact lookup bug by resolving via Meta servers
  if (target === 'universal') {
    const universalUrl = `https://wa.me/${cleanPhone}?text=${encoded}`
    openWhatsAppWebUrl(universalUrl)
    return
  }

  // 4. WhatsApp Web (Default & Recommended) with 100% Single-Tab Reuse
  const webUrl = `https://web.whatsapp.com/send/?phone=${cleanPhone}&text=${encoded}`
  openWhatsAppWebUrl(webUrl)
}
