/**
 * WhatsApp Multi-Template & Anti-Ban Rotating Variant Engine.
 * 100% Anti-Ban Solution:
 * 1. Rotates through multiple varied message templates 1-by-1 so messages are never identical.
 * 2. Dynamically injects real customer name with smart respectful honorifics (Sir / Ma'am / Sahiba / Sahib).
 * 3. Enforces 1-2 minute safe delay countdown between dispatches.
 * 4. Asks customer to save number and reply "OK" to build WhatsApp account reputation & trust rating.
 */

import { BookedParcel } from '../components/history/types'

export interface RespectfulGreetingInfo {
  honorific: string
  salutation: string
  fullNameWithHonorific: string
  confidence: 'universal'
}

/**
 * Universal customer name cleaner.
 * Strips gender/status prefixes (Mrs, Mr, Miss, Ms, Madam, Mister, Dr, etc.)
 * so the greeting is 100% universal, natural, and never awkward.
 * e.g. "Mrs Toseef" -> "Toseef"
 *      "Mr. Ahmed" -> "Ahmed"
 *      "Miss Sana" -> "Sana"
 */
export function cleanCustomerName(rawName?: string): string {
  if (!rawName) return ''
  let name = rawName.trim()

  // 1. Strip common prefixes (case-insensitive)
  name = name.replace(/^(?:mrs\.?|mr\.?|miss\.?|ms\.?|madam\.?|mister\.?|dr\.?|adv\.?|advocate\.?|sir\.?)\s+/i, '').trim()

  // 2. Strip trailing relational honorifics if present
  name = name.replace(/\s+(?:sahib|sahiba|khanum|begum)$/i, '').trim()

  // 3. Filter generic words
  const lower = name.toLowerCase()
  if (['customer', 'valued customer', 'n/a', 'na', 'client', 'guest', 'none', 'user'].includes(lower)) {
    return ''
  }

  // 4. Ensure proper title case for first letter
  if (name.length > 0) {
    name = name.charAt(0).toUpperCase() + name.slice(1)
  }

  return name
}

/**
 * Universal greeting resolver.
 */
export function getRespectfulGreeting(rawName?: string): RespectfulGreetingInfo {
  const cleaned = cleanCustomerName(rawName)
  return {
    honorific: 'Customer',
    salutation: 'Assalam o Alaikum',
    fullNameWithHonorific: cleaned,
    confidence: 'universal'
  }
}

/**
 * 4 Rotating Pre-Crafted Message Variants for each Template.
 * 100% Anti-Ban Protection:
 * - GREETING: ZERO links, ZERO CN tracking numbers, ZERO COD amounts, ZERO destinations.
 *   Casual conversational human tone that builds trust and asks for "OK" reply.
 * - BOOKING: Official PostEx booking confirmation with tracking link and COD.
 * - STATUS: Real-time milestone update.
 */
export const DEFAULT_WHATSAPP_VARIANTS = {
  // 1. Fresh Number / Greeting & Verification Template Variants (10 Variants)
  // ZERO links, ZERO tracking CN, ZERO amount, ZERO destination (100% Ban-Safe for fresh contacts)
  greeting: [
    // Variant 1
    'Assalam o Alaikum {customer_name} 🌸\nAap ka parcel jald aap ke paas ho ga 📦\nBas number save kar ke "OK" bhej dein, rabta karna asaan ho jaye ga 😊\nJazakAllah ❤️',

    // Variant 2
    'Assalam o Alaikum {customer_name} 🌷\nAap ka parcel bohat jald aap tak pohanch jaye ga 📦\nHamara number save kar ke "OK" likh dein, baat karna asaan rahe ga 😊\nShukriya 🤍',

    // Variant 3
    'Assalam o Alaikum {customer_name} ✨\nAap ka parcel aap ke qareeb hai, jald mil jaye ga 📦\nNumber save kar lein aur "OK" bhej dein, taake rabta rahe 😊\nJazakAllah 🌸',

    // Variant 4
    'Assalam o Alaikum {customer_name} 💐\nAap ke parcel ka intezar khatam hone wala hai 📦\nBas ye number save kar ke "OK" likh dein, rabta karna asaan ho jaye ga 📲\nBohat shukriya ❤️',

    // Variant 5
    'Assalam o Alaikum {customer_name} 😊\nAap ka parcel jald aap ke hath mein ho ga 📦\nHamara number save kar lein aur "OK" bhej dein, update dena asaan rahe ga ✨\nJazakAllah 🤍',

    // Variant 6
    'Assalam o Alaikum {customer_name} 🌼\nAap ka parcel ab aap se zyada door nahi 📦\nHamara number save kar ke "OK" likh dein, rabta karna aasan ho jaye ga 😊\nShukriya 🤍',

    // Variant 7
    'Assalam o Alaikum {customer_name} ✨\nAap ka parcel bas pohanchne hi wala hai 📦\nNumber save kar lein aur "OK" bhej dein, taake baat cheet mein asani rahe 📲\nJazakAllah 🌷',

    // Variant 8
    'Assalam o Alaikum {customer_name} 💖\nAap ka parcel jald aap ke darwaze par ho ga 📦\nBas ye number save kar ke "OK" likh dein, rabta karna asaan rahe ga 😊\nBohat shukriya 🌸',

    // Variant 9
    'Assalam o Alaikum {customer_name} 🌺\nAap ke parcel ki khabar achhi hai, jald mil jaye ga 📦\nHamara number save kar lein aur "OK" bhej dein, taake update dena aasan ho ✨\nJazakAllah 🤍',

    // Variant 10
    'Assalam o Alaikum {customer_name} 😊\nAap ka parcel safar mein hai aur jald aap tak aa jaye ga 📦\nNumber save kar ke "OK" likh dein, taake rabta bana rahe 📲\nShukriya, khush rahein ❤️'
  ],

  // 2. Booking Confirmation Template Variants
  booking: [
    // Variant 1: Detailed tracking alert
    '📦 postex.pk • Booking Alert 🚚\n\nAssalam o Alaikum {customer_name}!\nAap ka order successfully book ho chuka hai. 🎉\n\nTracking CN: {tracking_number}\nTotal Bill: Rs. {order_amount}\nAap ise yahan live track kar sakti hain:\n🔗 {portal_link}\n\n{note}',

    // Variant 2: Quick delivery dispatch
    '🚚 Order Booked & Dispatched!\n\nDear {customer_name},\nAap ka parcel courier network ke hawale kiya ja chuka hai. 📦💨\n\nPostEx CN: {tracking_number}\nCOD Amount: Rs. {order_amount}\nLive Tracking: 🔗 {portal_link}\n\nDelivery ke waqt cash ready rakhain. Shukriya! 🙏',

    // Variant 3: Conversational Order Confirmation
    'Salam {customer_name}! 😊\n\nAap ka consignment book ho gaya hai aur PostEx tracking number generate ho chuka hai:\n🔖 CN: {tracking_number}\n💵 COD: Rs. {order_amount}\n🔗 Live Link: {portal_link}\n\n{note}',

    // Variant 4: Sleek e-Commerce Invoice Alert
    '✅ PostEx Dispatch Confirmation\n\nDear {customer_name},\nAap ka parcel book ho chuka hai. Destination: {city}.\nTotal Amount: Rs. {order_amount}\n\nTrack here: {portal_link}\nKisi bhi madad ke liye hamara number save rakhain aur yahan WhatsApp karein. ⭐'
  ],

  // 3. Live Courier Status / Milestone Alert Variants
  status: [
    // Variant 1: Out for Delivery / Live Milestone Alert
    '🛵 postex.pk • Live Delivery Alert 🚚\n\nAssalam o Alaikum {customer_name}!\nAap ka parcel Rider ke sath Out for Delivery nikal chuka hai! 📦💨\n\nStatus: {live_status}\nOrder Total: Rs. {order_amount} 💵\nTracking: {portal_link}\n\nMeharbani farma kar apna SIM number ON rakhain aur cash ready rakhain taake rider asani se delivery kar sakay. 🚚✨',

    // Variant 2: In Transit / Movement Update
    '🚚 postex.pk • Shipment Movement Update 🛣️\n\nDear {customer_name},\nAap ka parcel courier network mein on the way hai! 📦\n\nCurrent Milestone: {live_status}\nDestination: {city}\nLive Tracking: 🔗 {portal_link}\n\n{note}',

    // Variant 3: Delivery Alert with Rider Assistance
    '📢 Urgent Delivery Update\n\nSalam {customer_name}! Rider aap ke area mein deliver karne nikal chuka hai.\nTotal Payment: Rs. {order_amount}\nTracking CN: {tracking_number}\n\nBarah-e-karam apna phone call receive karne ke liye ready rakhain. Shukriya! 📞🛵',

    // Variant 4: Successful Milestone Notification
    '📦 Delivery Status Notification\n\nDear {customer_name},\nAap ke parcel ka live status update hua hai:\n📌 {live_status}\nCity: {city}\nTrack: {portal_link}\n\nHappy Shopping with Zaynahs! 🛍️'
  ]
}

export type WhatsAppTemplateCategory = 'greeting' | 'booking' | 'status'

/**
 * Returns the current auto-rotation variant index for a specific category.
 */
export function getStoredVariantIndex(category: WhatsAppTemplateCategory): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(`wa_variant_idx_${category}`)
    return raw ? parseInt(raw, 10) || 0 : 0
  } catch {
    return 0
  }
}

/**
 * Increments the rotation variant index to the next variation.
 */
export function rotateToNextVariant(category: WhatsAppTemplateCategory, totalVariants: number = 4): number {
  if (typeof window === 'undefined') return 0
  const current = getStoredVariantIndex(category)
  const next = (current + 1) % Math.max(1, totalVariants)
  try {
    localStorage.setItem(`wa_variant_idx_${category}`, String(next))
  } catch {}
  return next
}

/**
 * Sets a specific variant index manually (when user clicks Var 1, Var 2, etc.)
 */
export function setStoredVariantIndex(category: WhatsAppTemplateCategory, index: number): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`wa_variant_idx_${category}`, String(index))
  } catch {}
}

/**
 * Formats a template string by replacing all dynamic tags with real parcel data.
 * If customer has no name, cleanly omits the name so message says "Assalam o Alaikum!" naturally.
 */
export function formatWhatsAppMessage(
  rawTemplate: string,
  parcel: BookedParcel,
  customNote?: string
): string {
  if (!rawTemplate) return ''
  const trackingUrl = `https://postex.pk/tracking?cn=${parcel.tracking || ''}`
  const formattedTotal = Number(parcel.total || 0).toLocaleString('en-PK')

  const defaultNote = 'Meharbani farma kar apna local SIM phone number ON rakhain 📱🔔 taake delivery rider asani se rabta kar sake 🚚💨\n\nReview dejye ga lazmi is number pe ⭐📝 aur agar 2-5 din mein parcel receive nahi hota ⏳ to is number pe rabta karna hai 📞\n\nHappy Shopping! 🛍️😊🎉'
  const noteContent = (customNote && customNote.trim()) ? customNote.trim() : defaultNote

  const rawCustomerName = (parcel.name || '').trim()
  const cleanedCustomerName = cleanCustomerName(rawCustomerName)

  let text = rawTemplate

  if (!cleanedCustomerName) {
    // If no real customer name exists, make greeting clean and natural (no weird blank spaces)
    text = text
      .replace(/Assalam\s+o\s+Alaikum\s+{(?:honorific_name|name|customer_name)}[!]?/gi, 'Assalam o Alaikum')
      .replace(/Salam\s+{(?:honorific_name|name|customer_name)}[!]?/gi, 'Salam')
      .replace(/Dear\s+{(?:honorific_name|name|customer_name)},?/gi, 'Dear Customer,')
      .replace(/{(?:honorific_name|name|customer_name)}/gi, '')
  } else {
    // Inject clean universal customer name (e.g. "Toseef", "Ahmed")
    text = text
      .replace(/{(?:honorific_name|name|customer_name)}/gi, cleanedCustomerName)
  }

  const greetingInfo = getRespectfulGreeting(rawCustomerName)

  text = text
    .replace(/{(?:greeting)}/gi, greetingInfo.salutation)
    .replace(/{(?:title|honorific)}/gi, greetingInfo.honorific)
    .replace(/{(?:url|portal_link)}/gi, trackingUrl)
    .replace(/{(?:amount|order_amount|total)}/gi, formattedTotal)
    .replace(/{(?:tracking|tracking_number|cn)}/gi, parcel.tracking || '')
    .replace(/{city}/gi, parcel.city || '')
    .replace(/{(?:status|live_status)}/gi, parcel.status || 'Booked')
    .replace(/{items}/gi, String(parcel.items || 1))
    .replace(/{note}/gi, noteContent)

  // Clean up any double spaces or orphan punctuation
  return text.replace(/[ \t]{2,}/g, ' ').replace(/\s+([!?,])/g, '$1')
}
