import React, { useState, useMemo } from 'react'
import { 
  CloseIcon, 
  WhatsAppIcon, 
  ClockIcon,
  CheckCircleIcon
} from '../Icons'
import { 
  BookedParcel, 
  detectParcelMilestone, 
  getMilestoneInfo, 
  getDisplayStatus, 
  WhatsAppClientTarget,
  isMobileDevice
} from './types'
import { 
  getRespectfulGreeting, 
  formatWhatsAppMessage, 
  DEFAULT_WHATSAPP_VARIANTS, 
  WhatsAppTemplateCategory,
  getStoredVariantIndex,
  setStoredVariantIndex,
  rotateToNextVariant
} from '../../utils/whatsappTemplates'
import { useWhatsAppCooldown } from '../../utils/whatsappAntiBanTimer'
import { dispatchWhatsAppMessage } from '../../utils/whatsappTabManager'

interface WhatsAppSelectModalProps {
  parcel: BookedParcel | null
  onClose: () => void
  whatsappNote?: string
  whatsappTemplate?: string
  whatsappTemplateGreeting?: string
  whatsappGreetingVariants?: string[]
  whatsappBookingVariants?: string[]
  whatsappStatusVariants?: string[]
  whatsappTemplateOutForDelivery?: string
  whatsappTemplateActionRequired?: string
  whatsappTemplateDelivered?: string
  antibanDelaySec?: number
  isBookingSent?: boolean
  isStatusSent?: boolean
  onMarkSent?: (tracking: string, id: string | undefined, type: 'booking' | 'status' | 'greeting') => void
}

/**
 * Apple Modern Minimalist WhatsApp Dispatch Modal (Rule APPLE-UI / DS1 / DS6 / MODAL1).
 * Disciplined aesthetics:
 * - Exactly ONE primary action button (Rule DS1).
 * - Restrained palette: Neutral slate foundation with authentic WhatsApp green (#25D366).
 * - Zero rainbow buttons or repetitive multi-card clutter.
 * - Interactive single-message editor with real data formatting and anti-ban rotation.
 */
export const WhatsAppSelectModal: React.FC<WhatsAppSelectModalProps> = ({
  parcel,
  onClose,
  whatsappNote,
  whatsappTemplate,
  whatsappTemplateGreeting,
  whatsappGreetingVariants,
  whatsappBookingVariants,
  whatsappStatusVariants,
  whatsappTemplateOutForDelivery,
  whatsappTemplateActionRequired,
  whatsappTemplateDelivered,
  antibanDelaySec = 120,
  isBookingSent = false,
  isStatusSent = false,
  onMarkSent
}) => {
  if (!parcel) return null

  const isMobile = isMobileDevice()
  const cooldown = useWhatsAppCooldown()

  const [waTarget, setWaTarget] = useState<WhatsAppClientTarget>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('preferred_wa_client') as WhatsAppClientTarget
      if (saved === 'app' || saved === 'web' || saved === 'universal') return saved
    }
    return 'web'
  })

  // Customer honorific detection (Sir / Ma'am / Mohtaram)
  const greetingInfo = useMemo(() => getRespectfulGreeting(parcel.name), [parcel.name])

  // Milestone detection for Status alerts
  const realMilestone = detectParcelMilestone(parcel)
  const milestoneInfo = getMilestoneInfo(realMilestone)

  // Selected Category: 'greeting' | 'booking' | 'status'
  // Auto-default: if booking already sent, pick status; otherwise greeting for fresh, or booking.
  const [selectedCategory, setSelectedCategory] = useState<WhatsAppTemplateCategory>(() => {
    if (isBookingSent && !isStatusSent) return 'status'
    return 'greeting'
  })

  // Active variant index per category
  const [variantIndices, setVariantIndices] = useState<Record<WhatsAppTemplateCategory, number>>(() => ({
    greeting: getStoredVariantIndex('greeting'),
    booking: getStoredVariantIndex('booking'),
    status: getStoredVariantIndex('status')
  }))

  // Custom text edits per category
  const [customText, setCustomText] = useState<Partial<Record<WhatsAppTemplateCategory, string>>>({})

  // Variant sources
  const greetingList = (whatsappGreetingVariants && whatsappGreetingVariants.length > 0)
    ? whatsappGreetingVariants
    : DEFAULT_WHATSAPP_VARIANTS.greeting

  const bookingList = (whatsappBookingVariants && whatsappBookingVariants.length > 0)
    ? whatsappBookingVariants
    : DEFAULT_WHATSAPP_VARIANTS.booking

  const statusList = (whatsappStatusVariants && whatsappStatusVariants.length > 0)
    ? whatsappStatusVariants
    : DEFAULT_WHATSAPP_VARIANTS.status

  const activeVariantList = selectedCategory === 'greeting'
    ? greetingList
    : selectedCategory === 'booking'
      ? bookingList
      : statusList

  const currentVariantIdx = variantIndices[selectedCategory] || 0

  // Resolve current message string
  const resolvedMessage = useMemo(() => {
    if (customText[selectedCategory] !== undefined) {
      return customText[selectedCategory]!
    }

    let rawTemplate = ''
    if (selectedCategory === 'greeting') {
      rawTemplate = greetingList[currentVariantIdx] || greetingList[0] || (whatsappTemplateGreeting || DEFAULT_WHATSAPP_VARIANTS.greeting[0])
    } else if (selectedCategory === 'booking') {
      rawTemplate = bookingList[currentVariantIdx] || bookingList[0] || (whatsappTemplate || DEFAULT_WHATSAPP_VARIANTS.booking[0])
    } else {
      rawTemplate = statusList[currentVariantIdx] || statusList[0] || (
        realMilestone === 'out_for_delivery' ? (whatsappTemplateOutForDelivery || DEFAULT_WHATSAPP_VARIANTS.status[0]) :
        realMilestone === 'action_required' ? (whatsappTemplateActionRequired || DEFAULT_WHATSAPP_VARIANTS.status[2]) :
        realMilestone === 'delivered' ? (whatsappTemplateDelivered || DEFAULT_WHATSAPP_VARIANTS.status[3]) :
        DEFAULT_WHATSAPP_VARIANTS.status[0]
      )
    }

    return formatWhatsAppMessage(rawTemplate, parcel, whatsappNote)
  }, [selectedCategory, currentVariantIdx, customText, parcel, whatsappNote, greetingList, bookingList, statusList, whatsappTemplateGreeting, whatsappTemplate, realMilestone, whatsappTemplateOutForDelivery, whatsappTemplateActionRequired, whatsappTemplateDelivered])

  const handleSelectVariant = (idx: number) => {
    setVariantIndices(prev => ({ ...prev, [selectedCategory]: idx }))
    setStoredVariantIndex(selectedCategory, idx)
    // Clear manual edit so the selected variant template loads cleanly
    setCustomText(prev => {
      const copy = { ...prev }
      delete copy[selectedCategory]
      return copy
    })
  }

  // Format clean Pakistan phone digits
  const getCleanPhone = (phone: string): string => {
    let clean = (phone || '').replace(/\D/g, '')
    if (clean.startsWith('0')) {
      clean = '92' + clean.substring(1)
    } else if (!clean.startsWith('92') && clean.length === 10) {
      clean = '92' + clean
    }
    return clean
  }

  // Unified Single Primary Dispatch Handler
  const handleDispatch = () => {
    // STRICT: Timer skip click kiye bina next msg send na ho sake
    if (cooldown.isCooling) {
      return
    }

    const textToSend = resolvedMessage

    // 1. Mark sent in tracking
    onMarkSent?.(parcel.tracking, parcel.id, selectedCategory)

    // 2. Start Anti-Ban safe cooling delay (120s)
    cooldown.triggerCooldown(antibanDelaySec || 120)

    // 3. Advance to next rotational variant for this category
    rotateToNextVariant(selectedCategory, activeVariantList.length)

    // 4. Open WhatsApp via Single-Tab Reused Manager (0 Duplicate Tabs)
    dispatchWhatsAppMessage({
      phone: parcel.phone,
      text: textToSend,
      target: waTarget === 'auto' ? 'web' : waTarget,
      isMobile
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-[#0c121e] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-4 sm:p-6 z-10 animate-in zoom-in-95 duration-150 space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar">
        
        {/* Top Header - Apple Minimalist Sheet Style */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center border border-[#25D366]/20 shrink-0">
              <WhatsAppIcon size={16} className="fill-current text-[#25D366]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Send WhatsApp Alert
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Anti-ban rotating templates with customer honorific
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition flex items-center justify-center cursor-pointer shrink-0"
            title="Close"
          >
            <CloseIcon size={13} />
          </button>
        </div>

        {/* Customer Logistics Summary - Apple Inset List */}
        <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 p-3 divide-y divide-slate-200/60 dark:divide-slate-800/60 text-xs">
          <div className="pb-2 flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Customer</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate">{parcel.name || 'Valued Customer'}</span>
            </div>
            <span className="font-mono text-slate-600 dark:text-slate-300 font-medium text-xs shrink-0">
              {parcel.phone}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">PostEx CN:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 select-all truncate">
                {parcel.tracking || 'Unbooked'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-right shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                {getDisplayStatus(parcel.status, parcel.loadsheet_generated)}
              </span>
            </div>
          </div>
        </div>

        {/* Template Category Segmented Selector - Apple Segmented Control (NO RAINBOW) */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
            Select Template Category
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs">
            {[
              { id: 'greeting', label: 'Greeting', badge: 'Fresh' },
              { id: 'booking', label: 'Booking', badge: isBookingSent ? 'Sent' : 'CN' },
              { id: 'status', label: 'Live Status', badge: milestoneInfo.label }
            ].map(tab => {
              const isSelected = selectedCategory === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id as WhatsAppTemplateCategory)}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[9px] font-semibold px-1 py-0.1 rounded ${
                    isSelected
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Variant Selector - Scrollable Horizontal Row */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Anti-Ban Variant (Auto-Rotating 1-by-1):
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {currentVariantIdx + 1} of {activeVariantList.length}
            </span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {activeVariantList.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectVariant(idx)}
                className={`h-6 px-2.5 rounded-md text-[10px] font-bold transition shrink-0 cursor-pointer ${
                  currentVariantIdx === idx
                    ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                }`}
              >
                Var {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Message Preview & Inline Editor - Real WhatsApp Bubble Look */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Message Preview (Editable)
            </span>
            {customText[selectedCategory] && (
              <button
                type="button"
                onClick={() => setCustomText(prev => {
                  const copy = { ...prev }
                  delete copy[selectedCategory]
                  return copy
                })}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Reset to Template
              </button>
            )}
          </div>

          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-3 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
            <textarea
              rows={5}
              value={resolvedMessage}
              onChange={e => setCustomText(prev => ({ ...prev, [selectedCategory]: e.target.value }))}
              placeholder="Type or customize your WhatsApp message..."
              className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 font-sans leading-relaxed focus:outline-none resize-none"
            />
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>{resolvedMessage.length} characters</span>
              <span>Personalized greeting</span>
            </div>
          </div>
        </div>

        {/* Client Target Segmented Toggle (Desktop only) */}
        {!isMobile && (
          <div className="space-y-1.5 px-0.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Send Target:</span>
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setWaTarget('web')
                    localStorage.setItem('preferred_wa_client', 'web')
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    waTarget === 'web'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="WhatsApp Web: 1 reused tab, 0 duplicate tabs"
                >
                  <span>WhatsApp Web</span>
                  <span className="text-[9px] px-1 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold">1 Tab</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWaTarget('universal')
                    localStorage.setItem('preferred_wa_client', 'universal')
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    waTarget === 'universal'
                      ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Meta wa.me link: opens App safely without lookup errors"
                >
                  <span>App (wa.me)</span>
                  <span className="text-[9px] px-1 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 font-extrabold">Safe</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWaTarget('app')
                    localStorage.setItem('preferred_wa_client', 'app')
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                    waTarget === 'app'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Direct whatsapp:// protocol launcher"
                >
                  Direct App
                </button>
              </div>
            </div>
            {waTarget === 'app' && (
              <p className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/[0.08] p-1.5 rounded-lg border border-amber-500/20 leading-tight">
                Agar Mac app par "Couldn't look up phone number" error aaye to phone par WhatsApp open rakhein ya <strong>WhatsApp Web (1 Tab)</strong> select karein.
              </p>
            )}
          </div>
        )}

        {/* Authoritative Primary Action with Smart Highlighted Cooldown (Rule DS1) */}
        {cooldown.isCooling ? (
          <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
            {/* Smart Highlighted Countdown Card */}
            <div className="p-3 rounded-2xl bg-amber-500/[0.08] dark:bg-amber-500/[0.12] border border-amber-500/30 shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                  </span>
                  <div className="leading-tight min-w-0">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block truncate">
                      Anti-Ban Safe Delay Active
                    </span>
                    <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 truncate block">
                      Cooling down to protect your WhatsApp number
                    </span>
                  </div>
                </div>

                {/* Highlighted Monospace Timer Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 dark:bg-amber-500/25 border border-amber-500/40 text-amber-950 dark:text-amber-100 font-mono text-sm font-black tracking-wider shadow-inner shrink-0">
                  <ClockIcon size={14} className="text-amber-600 dark:text-amber-400 animate-spin" />
                  <span>{cooldown.formattedTime || cooldown.formattedRemaining || '00:00'}</span>
                </div>
              </div>

              {/* Smooth Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-amber-500/20 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${cooldown.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Smart Skip & Unlock Button */}
            <button
              type="button"
              onClick={cooldown.clearCooldown}
              className="w-full h-11 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-sm shadow-amber-500/25 transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="text-sm">⚡</span>
              <span>Skip Wait ({cooldown.formattedTime || cooldown.formattedRemaining || '00:00'}) & Unlock Send Now</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleDispatch}
            className="w-full h-11 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm shadow-sm shadow-[#25D366]/25 transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <WhatsAppIcon size={18} className="fill-current text-white" />
            <span>
              Send via WhatsApp {!isMobile && waTarget === 'app' ? 'Desktop App' : !isMobile && waTarget === 'universal' ? 'App (wa.me)' : 'Web (1 Tab)'}
            </span>
          </button>
        )}

      </div>
    </div>
  )
}
