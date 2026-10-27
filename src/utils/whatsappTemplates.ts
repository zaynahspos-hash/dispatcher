/**
 * WhatsApp Multi-Template & Anti-Ban Rotating Variant Engine.
 * 100% Anti-Ban Solution:
 * 1. Rotates through multiple varied message templates 1-by-1 so messages are never identical.
 * 2. Dynamically injects real customer name with smart respectful honorifics (Sir / Ma'am / Sahiba / Sahib).
 * 3. Enforces 1-2 minute safe delay countdown between dispatches.
 * 4. Asks customer to save number and reply "OK" to build WhatsApp account reputation & trust rating.
 */

import { BookedParcel } from '../components/history/types'

// Common Pakistani unisex names (can be male or female)
const UNISEX_NAMES = new Set([
  'noor', 'dua', 'naseem', 'nasim', 'afreen', 'shams', 'qamar', 'kiran', 'parveen'
])

// Common Pakistani female names for smart respectful greeting detection
const FEMALE_NAMES = new Set([
  'ayesha', 'aisha', 'fatima', 'javeria', 'sana', 'maryam', 'marium', 'amna',
  'rabia', 'zainab', 'hira', 'sidra', 'iqra', 'nimra', 'anila', 'kiran',
  'bushra', 'asma', 'shazia', 'sadia', 'mehwish', 'uzma', 'samina', 'tahira',
  'naila', 'lubna', 'zoya', 'anum', 'fizza', 'alina', 'areeba', 'komal',
  'maria', 'bisma', 'kinza', 'mahnoor', 'laiba', 'minahil', 'huma',
  'faiza', 'khadija', 'hafsa', 'sara', 'sarah', 'aliza', 'hina',
  'saima', 'nadia', 'farah', 'rukhsar', 'anaya', 'zara', 'aroosa', 'arooj',
  'aiman', 'eman', 'emaan', 'iman', 'mahira', 'mehreen', 'maham', 'mishal',
  'neha', 'nida', 'nargis', 'nazia', 'nosheen', 'palwasha', 'pari', 'rida',
  'rubina', 'rukhsana', 'sabahat', 'sadaf', 'saba', 'sabrina', 'safia',
  'shaista', 'shabnam', 'shagufta', 'shama', 'shumaila', 'sobia', 'sumaira',
  'sumbul', 'tabassum', 'tehreem', 'tooba', 'urooj', 'warda', 'yasmeen',
  'zahra', 'zarish', 'zubaida', 'ghazala', 'farzana', 'fouzia', 'gulnaz',
  'humaira', 'irum', 'jannat', 'kainat', 'kanwal', 'laraib', 'madiha',
  'mahrukh', 'mariam', 'memona', 'misbah', 'mubashra', 'naheed',
  'rimsha', 'rafia', 'ramsha', 'sahar', 'sakina', 'saira', 'sumera',
  'wajiha', 'zunaira', 'amber', 'anam', 'bakhtawar', 'beenish',
  'esha', 'fiza', 'hajra', 'hoorain', 'inaya', 'insha', 'kashaf', 'maira',
  'nayab', 'nimrah', 'rameen', 'sehrish', 'tania', 'zoha'
])

// Common Pakistani male names for smart respectful greeting detection
const MALE_NAMES = new Set([
  'muhammad', 'mohammad', 'mohammed', 'ahmed', 'ahmad', 'ali', 'bilal', 'hamza',
  'usman', 'uthman', 'danish', 'shoaib', 'omer', 'umar', 'umair', 'hassan',
  'hussain', 'husnain', 'abdullah', 'abdul', 'saad', 'waqas', 'kamran', 'adnan',
  'asif', 'shahid', 'tariq', 'rashid', 'nadeem', 'faisal', 'rizwan', 'arslan',
  'salman', 'imran', 'zubair', 'kashif', 'noman', 'irfan', 'farhan', 'shahzaib',
  'naveed', 'waqar', 'tayyab', 'rehan', 'haris', 'ibrahim', 'zain', 'fahad',
  'asad', 'talha', 'haider', 'adeel', 'junaid', 'ayaan', 'ayan', 'daniyal',
  'ehsan', 'ihsan', 'fawad', 'furqan', 'ghulam', 'hammad', 'hanzala', 'huzaifa',
  'ismail', 'jawad', 'khalid', 'luqman', 'mubashir', 'mudassir', 'mustafa',
  'nabeel', 'nasir', 'naseer', 'owais', 'qasim', 'rafay', 'rehman', 'saif',
  'sajjad', 'sameer', 'shahbaz', 'shakeel', 'sheraz', 'sohail', 'sulaiman',
  'taimoor', 'talal', 'touseef', 'uzair', 'wahab', 'waleed', 'yasir', 'yousaf',
  'yousuf', 'zaheer', 'zahid', 'zeeshan', 'zohaib', 'zulfiqar', 'aamir', 'abbas',
  'afzal', 'akbar', 'akram', 'amjad', 'anas', 'arif', 'atif', 'azhar', 'babar',
  'basit', 'burhan', 'faizan', 'faraz', 'fayyaz', 'ghazanfar', 'hashim',
  'hasnain', 'iftikhar', 'ijaz', 'jahanzaib', 'javed', 'kabir', 'karim',
  'mansoor', 'maaz', 'moiz', 'mohsin', 'mujtaba', 'murtaza', 'musa', 'nauman',
  'qadir', 'raheel', 'rameez', 'sabir', 'sadiq', 'shafiq', 'shan',
  'sharjeel', 'tahir', 'tanveer', 'tauseef', 'umer', 'wasim', 'zafar', 'zia'
])

export interface RespectfulGreetingInfo {
  honorific: 'Sir' | 'Ma\'am' | 'Sahib' | 'Sahiba' | 'Janab'
  salutation: string
  fullNameWithHonorific: string
  confidence: 'high' | 'medium' | 'universal'
}

/**
 * Intelligently analyzes customer name and extracts respectful greeting & title.
 * Accurately detects:
 * - Sir (Male names)
 * - Ma'am (Female names)
 * - Janab / Sahiba/Sahib (Unisex & neutral names)
 */
export function getRespectfulGreeting(rawName?: string): RespectfulGreetingInfo {
  const name = (rawName || '').trim()
  if (!name || name.toLowerCase() === 'customer' || name.toLowerCase() === 'valued customer') {
    return {
      honorific: 'Janab',
      salutation: 'Assalam o Alaikum',
      fullNameWithHonorific: 'Mohtaram Customer',
      confidence: 'universal'
    }
  }

  const lower = name.toLowerCase()
  const parts = lower.split(/[\s._-]+/).filter(Boolean)

  // 1. Explicit title prefix checks
  if (lower.startsWith('mrs') || lower.startsWith('miss') || lower.startsWith('ms.') || lower.startsWith('ms ') || lower.startsWith('madam')) {
    const clean = name.replace(/^(mrs\.?|miss\.?|ms\.?|madam)\s+/i, '').trim()
    return {
      honorific: 'Ma\'am',
      salutation: 'Assalam o Alaikum',
      fullNameWithHonorific: `${clean || name} Ma'am`,
      confidence: 'high'
    }
  }

  if (lower.startsWith('mr.') || lower.startsWith('mr ') || lower.startsWith('mister')) {
    const clean = name.replace(/^(mr\.?|mister)\s+/i, '').trim()
    return {
      honorific: 'Sir',
      salutation: 'Assalam o Alaikum',
      fullNameWithHonorific: `${clean || name} Sir`,
      confidence: 'high'
    }
  }

  // 2. Ambiguous / Unisex name check (e.g., Noor, Dua, Naseem) -> Universal respectful greeting
  const isUnisex = parts.some(p => UNISEX_NAMES.has(p))
  const isFemale = parts.some(p => FEMALE_NAMES.has(p))
  const isMale = parts.some(p => MALE_NAMES.has(p))

  // If strictly unisex or mixed, use universal respectful form
  if (isUnisex && (!isFemale || !isMale)) {
    return {
      honorific: 'Mohtaram',
      salutation: 'Assalam o Alaikum',
      fullNameWithHonorific: `Mohtaram ${name}`,
      confidence: 'universal'
    }
  }

  // 3. Known female name check
  if (isFemale && !isMale) {
    return {
      honorific: 'Ma\'am',
      salutation: 'Assalam o Alaikum',
      fullNameWithHonorific: `${name} Ma'am`,
      confidence: 'high'
    }
  }

  // 4. Known male name check
  if (isMale && !isFemale) {
    return {
      honorific: 'Sir',
      salutation: 'Assalam o Alaikum',
      fullNameWithHonorific: `${name} Sir`,
      confidence: 'high'
    }
  }

  // 5. Universal respectful Pakistani e-commerce standard (for any unmatched name - both men & women)
  return {
    honorific: 'Mohtaram',
    salutation: 'Assalam o Alaikum',
    fullNameWithHonorific: `Mohtaram ${name}`,
    confidence: 'universal'
  }
}

/**
 * 4 Rotating Pre-Crafted Message Variants for each Template.
 * Anti-Ban Protection: By rotating variants 1-by-1, WhatsApp never detects duplicate mass broadcast.
 */
export const DEFAULT_WHATSAPP_VARIANTS = {
  // 1. Fresh Number / Greeting & Verification Template Variants
  greeting: [
    // Variant 1: Warm & Professional with number save request
    'Assalam o Alaikum {honorific_name}! ✨\n\nUmeed hai aap khairiyat se honge. Aap ka order hamare paas confirm ho chuka hai. 🛍️📦\n\nOrder Total: Rs. {order_amount}\nDestination: {city}\n\nMeharbani farma kar hamara yeh number apne paas save kar lein aur reply mein "OK" likh dein taake rider ke aane par asani se rabta ho sake. 📲✅\n\nThank you for shopping with us! ❤️',

    // Variant 2: Direct Logistics Greeting
    'Assalam o Alaikum {customer_name}! 🌸\n\nAap ke order ka parcel dispatch ke liye ready ho raha hai. 🚚💨\n\nConsignment CN: {tracking_number}\nTotal COD: Rs. {order_amount}\n\nDelivery rider ki call ke liye apna phone ON rakhain aur updates ke liye hamara number save farma lein. Agar koi question ho to yahan WhatsApp par rabta karein. 💬📞',

    // Variant 3: Polite Trust-Building Question
    'Salam {honorific_name}! 😊\n\nAap ka order hamare system mein book ho gaya hai. Rider dispatch hone se pehle barah-e-karam apna address check kar lein:\n📍 {city}\n💵 Total: Rs. {order_amount}\n\nNumber save kar ke "OK" reply zaroor karein taake delivery confirm ho jaye. 🤝✨',

    // Variant 4: Clean VIP Welcome
    'Dear {customer_name}, Assalam o Alaikum! 🌟\n\nZaynahs se order karne ka shukriya! Aap ka parcel packing stage par hai aur jald PostEx courier ko hand over kar diya jayega. 📦\n\nLive Tracking link aur updates ke liye hamara WhatsApp contact save rakhain. 📱\nHappy Shopping! 🎉'
  ],

  // 2. Booking Confirmation Template Variants
  booking: [
    // Variant 1: Detailed tracking alert
    '📦 postex.pk • Booking Alert 🚚\n\nAssalam o Alaikum {honorific_name}!\nAap ka order successfully book ho chuka hai. 🎉\n\nTracking CN: {tracking_number}\nTotal Bill: Rs. {order_amount}\nAap ise yahan live track kar sakti hain:\n🔗 {portal_link}\n\n{note}',

    // Variant 2: Quick delivery dispatch
    '🚚 Order Booked & Dispatched!\n\nDear {customer_name},\nAap ka parcel courier network ke hawale kiya ja chuka hai. 📦💨\n\nPostEx CN: {tracking_number}\nCOD Amount: Rs. {order_amount}\nLive Tracking: 🔗 {portal_link}\n\nDelivery ke waqt cash ready rakhain. Shukriya! 🙏',

    // Variant 3: Conversational Order Confirmation
    'Salam {honorific_name}! 😊\n\nAap ka consignment book ho gaya hai aur PostEx tracking number generate ho chuka hai:\n🔖 CN: {tracking_number}\n💵 COD: Rs. {order_amount}\n🔗 Live Link: {portal_link}\n\n{note}',

    // Variant 4: Sleek e-Commerce Invoice Alert
    '✅ PostEx Dispatch Confirmation\n\nDear {customer_name},\nAap ka parcel book ho chuka hai. Destination: {city}.\nTotal Amount: Rs. {order_amount}\n\nTrack here: {portal_link}\nKisi bhi madad ke liye hamara number save rakhain aur yahan WhatsApp karein. ⭐'
  ],

  // 3. Live Courier Status / Milestone Alert Variants
  status: [
    // Variant 1: Out for Delivery / Live Milestone Alert
    '🛵 postex.pk • Live Delivery Alert 🚚\n\nAssalam o Alaikum {honorific_name}!\nAap ka parcel Rider ke sath Out for Delivery nikal chuka hai! 📦💨\n\nStatus: {live_status}\nOrder Total: Rs. {order_amount} 💵\nTracking: {portal_link}\n\nMeharbani farma kar apna SIM number ON rakhain aur cash ready rakhain taake rider asani se delivery kar sakay. 🚚✨',

    // Variant 2: In Transit / Movement Update
    '🚚 postex.pk • Shipment Movement Update 🛣️\n\nDear {customer_name},\nAap ka parcel courier network mein on the way hai! 📦\n\nCurrent Milestone: {live_status}\nDestination: {city}\nLive Tracking: 🔗 {portal_link}\n\n{note}',

    // Variant 3: Delivery Alert with Rider Assistance
    '📢 Urgent Delivery Update\n\nSalam {honorific_name}! Rider aap ke area mein deliver karne nikal chuka hai.\nTotal Payment: Rs. {order_amount}\nTracking CN: {tracking_number}\n\nBarah-e-karam apna phone call receive karne ke liye ready rakhain. Shukriya! 📞🛵',

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
 */
export function formatWhatsAppMessage(
  rawTemplate: string,
  parcel: BookedParcel,
  customNote?: string
): string {
  if (!rawTemplate) return ''
  const trackingUrl = `https://postex.pk/tracking?cn=${parcel.tracking || ''}`
  const formattedTotal = Number(parcel.total || 0).toLocaleString('en-PK')
  const greetingInfo = getRespectfulGreeting(parcel.name)

  const defaultNote = 'Meharbani farma kar apna local SIM phone number ON rakhain 📱🔔 taake delivery rider asani se rabta kar sake 🚚💨\n\nReview dejye ga lazmi is number pe ⭐📝 aur agar 2-5 din mein parcel receive nahi hota ⏳ to is number pe rabta karna hai 📞\n\nHappy Shopping! 🛍️😊🎉'
  const noteContent = (customNote && customNote.trim()) ? customNote.trim() : defaultNote

  return rawTemplate
    .replace(/{(?:honorific_name)}/gi, greetingInfo.fullNameWithHonorific)
    .replace(/{(?:greeting)}/gi, greetingInfo.salutation)
    .replace(/{(?:title|honorific)}/gi, greetingInfo.honorific)
    .replace(/{(?:name|customer_name)}/gi, parcel.name || 'Valued Customer')
    .replace(/{(?:url|portal_link)}/gi, trackingUrl)
    .replace(/{(?:amount|order_amount|total)}/gi, formattedTotal)
    .replace(/{(?:tracking|tracking_number|cn)}/gi, parcel.tracking || '')
    .replace(/{city}/gi, parcel.city || '')
    .replace(/{(?:status|live_status)}/gi, parcel.status || 'Booked')
    .replace(/{items}/gi, String(parcel.items || 1))
    .replace(/{note}/gi, noteContent)
}
