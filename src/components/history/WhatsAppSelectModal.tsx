import React, { useState, useMemo } from 'react'
import { 
  CloseIcon, 
  WhatsAppIcon, 
  PackageIcon, 
  TruckIcon, 
  AlertTriangleIcon, 
  CheckCircleIcon,
  ShieldCheckIcon,
  ClockIcon
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
      if (saved === 'app' || saved === 'web') return saved
    }
    return 'web'
  })

  // Customer honorific detection (Sir / Ma'am / Mohtaram)
  const greetingInfo = useMemo(() => getRespectfulGreeting(parcel.name), [parcel.name])

  // Milestone detection for Status alerts
  const realMilestone = detectParcelMilestone(parcel)
  const milestoneInfo = getMilestoneInfo(realMilestone)

  // Current active variant selections (auto-loaded from rotational memory)
  const [greetingVariantIdx, setGreetingVariantIdx] = useState<number>(() => getStoredVariantIndex('greeting'))
  const [bookingVariantIdx, setBookingVariantIdx] = useState<number>(() => getStoredVariantIndex('booking'))
  const [statusVariantIdx, setStatusVariantIdx] = useState<number>(() => getStoredVariantIndex('status'))

  // Expanded option preview / editor (null, 'greeting', 'booking', or 'status')
  const [expandedOption, setExpandedOption] = useState<WhatsAppTemplateCategory | null>(null)

  // Custom live text overrides (if merchant decides to tweak text inline before sending)
  const [customText, setCustomText] = useState<{ [key in WhatsAppTemplateCategory]?: string }>({})

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

  // Resolve message for a category and variant
  const getResolvedMessage = (category: WhatsAppTemplateCategory, varIndex: number): string => {
    if (customText[category] !== undefined) {
      return customText[category]!
    }

    let rawTemplate = ''
    if (category === 'greeting') {
      rawTemplate = greetingList[varIndex] || greetingList[0] || (whatsappTemplateGreeting || DEFAULT_WHATSAPP_VARIANTS.greeting[0])
    } else if (category === 'booking') {
      rawTemplate = bookingList[varIndex] || bookingList[0] || (whatsappTemplate || DEFAULT_WHATSAPP_VARIANTS.booking[0])
    } else {
      rawTemplate = statusList[varIndex] || statusList[0] || (
        realMilestone === 'out_for_delivery' ? (whatsappTemplateOutForDelivery || DEFAULT_WHATSAPP_VARIANTS.status[0]) :
        realMilestone === 'action_required' ? (whatsappTemplateActionRequired || DEFAULT_WHATSAPP_VARIANTS.status[2]) :
        realMilestone === 'delivered' ? (whatsappTemplateDelivered || DEFAULT_WHATSAPP_VARIANTS.status[3]) :
        DEFAULT_WHATSAPP_VARIANTS.status[0]
      )
    }

    return formatWhatsAppMessage(rawTemplate, parcel, whatsappNote)
  }

  // Format clean Pakistan international phone digits
  const getCleanPhone = (phone: string): string => {
    let clean = (phone || '').replace(/\D/g, '')
    if (clean.startsWith('0')) {
      clean = '92' + clean.substring(1)
    } else if (!clean.startsWith('92') && clean.length === 10) {
      clean = '92' + clean
    }
    return clean
  }

  // Dispatch handler
  const handleSendOption = (category: WhatsAppTemplateCategory, varIndex: number) => {
    const textToSend = getResolvedMessage(category, varIndex)
    const cleanPhone = getCleanPhone(parcel.phone)
    const encoded = encodeURIComponent(textToSend)

    let url = ''
    if (isMobile) {
      url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
    } else if (waTarget === 'app') {
      url = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`
    } else {
      url = `https://web.whatsapp.com/send/?phone=${cleanPhone}&text=${encoded}`
    }

    // 1. Mark sent in tracking
    onMarkSent?.(parcel.tracking, parcel.id, category)

    // 2. Start Anti-Ban safe cooling delay (120s)
    cooldown.triggerCooldown(antibanDelaySec || 120)

    // 3. Advance to next rotational variant for this category
    rotateToNextVariant(category, category === 'greeting' ? greetingList.length : category === 'booking' ? bookingList.length : statusList.length)

    // 4. Open WhatsApp
    if (url.startsWith('whatsapp://')) {
      window.location.href = url
    } else {
      const waWin = window.open(url, 'whatsapp_web')
      if (waWin) {
        try { waWin.focus() } catch (_) {}
      }
    }

    onClose()
  }

  const handleSelectVariant = (category: WhatsAppTemplateCategory, idx: number) => {
    if (category === 'greeting') setGreetingVariantIdx(idx)
    else if (category === 'booking') setBookingVariantIdx(idx)
    else setStatusVariantIdx(idx)

    setStoredVariantIndex(category, idx)
    // Clear custom text so new variant template loads fresh
    setCustomText(prev => {
      const copy = { ...prev }
      delete copy[category]
      return copy
    })
  }

  // Milestone Icon
  const StatusIcon = 
    milestoneInfo.iconType === 'truck' ? TruckIcon :
    milestoneInfo.iconType === 'alert' ? AlertTriangleIcon :
    milestoneInfo.iconType === 'check' ? CheckCircleIcon :
    PackageIcon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-[#0c121e] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-4 sm:p-6 z-10 animate-in zoom-in-95 duration-150 space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar">
        
        {/* Header - Apple Native Sheet Style */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center border border-[#25D366]/20 shrink-0">
              <WhatsAppIcon size={18} className="fill-current text-[#25D366]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Send WhatsApp Notification
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Anti-Ban
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Rotating variations with smart customer title detection
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition flex items-center justify-center cursor-pointer shrink-0"
            title="Close"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Anti-Ban Cooling Countdown Banner */}
        {cooldown.isCooling ? (
          <div className="p-3 rounded-2xl bg-amber-500/[0.08] dark:bg-amber-500/[0.1] border border-amber-500/30 flex flex-col gap-2 animate-in fade-in">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <ClockIcon size={15} className="text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate">
                  Anti-Ban Delay: {cooldown.formattedTime} remaining
                </span>
              </div>
              <button
                type="button"
                onClick={cooldown.clearCooldown}
                className="text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer shrink-0"
                title="Override cooling delay and allow dispatching now"
              >
                Skip Wait
              </button>
            </div>
            <div className="w-full h-1 bg-amber-200 dark:bg-amber-950/60 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${cooldown.percentRemaining}%` }}
              />
            </div>
            <p className="text-[10px] text-amber-700/90 dark:text-amber-300/80 leading-tight">
              Recommended: 1-2 min gap between messages prevents WhatsApp spam triggers.
            </p>
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/[0.05] dark:bg-emerald-500/[0.04] border border-emerald-500/20 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
              <ShieldCheckIcon size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>100% Anti-Ban Guard Active</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
              Safe Cooldown: {antibanDelaySec}s
            </span>
          </div>
        )}

        {/* Grouped Customer Info Card - Apple Inset List */}
        <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 p-3.5 divide-y divide-slate-200/60 dark:divide-slate-800/60 text-xs">
          {/* Row 1: Consignee & Smart Title Detection */}
          <div className="pb-2 flex items-center justify-between">
            <div className="min-w-0 pr-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Customer</span>
              <span className="font-semibold text-slate-900 dark:text-white text-xs truncate">{parcel.name}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                {greetingInfo.honorific}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono text-slate-600 dark:text-slate-300 font-medium text-xs">{parcel.phone}</span>
            </div>
          </div>

          {/* Row 2: PostEx CN & City */}
          <div className="py-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">PostEx CN</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs select-all">
                {parcel.tracking || 'Unbooked'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Destination</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs uppercase">{parcel.city}</span>
            </div>
          </div>

          {/* Row 3: Live Status */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Live Status</span>
            <div className="flex items-center gap-1.5 min-w-0 text-right">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate" title={parcel.status}>
                {getDisplayStatus(parcel.status, parcel.loadsheet_generated)}
              </span>
            </div>
          </div>
        </div>

        {/* Client Target Selector (Desktop only) */}
        {!isMobile && (
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setWaTarget('web')
                localStorage.setItem('preferred_wa_client', 'web')
              }}
              className={`flex-1 py-1 px-3 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                waTarget === 'web'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <span>WhatsApp Web (Direct)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setWaTarget('app')
                localStorage.setItem('preferred_wa_client', 'app')
              }}
              className={`flex-1 py-1 px-3 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                waTarget === 'app'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <span>Desktop App (Native)</span>
            </button>
          </div>
        )}

        {/* Action Options - 3 Apple iOS Action Cards */}
        <div className="space-y-3 pt-0.5">

          {/* ────────────────── Option 1: Greeting & Verification (Fresh Number) ────────────────── */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/40 p-3.5 transition-all space-y-2.5">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20 mt-0.5">
                  <WhatsAppIcon size={18} className="fill-current text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Option 1: Greeting & Verification
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                      Fresh Contacts
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Polite greeting with customer name. Requests customer to save number and reply "OK".
                  </p>
                </div>
              </div>

              {/* Direct Send Action Button */}
              <button
                type="button"
                onClick={() => handleSendOption('greeting', greetingVariantIdx)}
                className="h-8 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs shrink-0"
              >
                <span>Send</span>
              </button>
            </div>

            {/* Anti-Ban 4-Variant Selector Chips */}
            <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-slate-400 font-semibold mr-1 shrink-0">Variants:</span>
                {greetingList.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectVariant('greeting', idx)}
                    className={`h-6 px-2 rounded-md text-[10px] font-bold transition cursor-pointer shrink-0 ${
                      greetingVariantIdx === idx
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Var {idx + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setExpandedOption(expandedOption === 'greeting' ? null : 'greeting')}
                className="text-[10px] text-purple-600 dark:text-purple-400 font-bold hover:underline shrink-0"
              >
                {expandedOption === 'greeting' ? 'Hide Preview' : 'Preview / Edit'}
              </button>
            </div>

            {/* Expandable Preview & Inline Editor */}
            {expandedOption === 'greeting' && (
              <div className="pt-2 animate-in fade-in duration-150 space-y-1.5">
                <textarea
                  rows={4}
                  value={getResolvedMessage('greeting', greetingVariantIdx)}
                  onChange={e => setCustomText(prev => ({ ...prev, greeting: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 leading-relaxed"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Edits apply to this send only. Real name and COD injected.</span>
                  {customText.greeting && (
                    <button
                      type="button"
                      onClick={() => setCustomText(prev => {
                        const copy = { ...prev }
                        delete copy.greeting
                        return copy
                      })}
                      className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
                    >
                      Reset to Template
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ────────────────── Option 2: Booking Confirmation ────────────────── */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/40 p-3.5 transition-all space-y-2.5">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20 mt-0.5">
                  <PackageIcon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Option 2: Booking Confirmation
                    </span>
                    {isBookingSent ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/25">
                        Sent
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        Ready
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Sends PostEx tracking CN, total COD amount, and live postex.pk tracking link.
                  </p>
                </div>
              </div>

              {/* Direct Send Action Button */}
              <button
                type="button"
                onClick={() => handleSendOption('booking', bookingVariantIdx)}
                className="h-8 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs shrink-0"
              >
                <span>Send</span>
              </button>
            </div>

            {/* Anti-Ban 4-Variant Selector Chips */}
            <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-slate-400 font-semibold mr-1 shrink-0">Variants:</span>
                {bookingList.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectVariant('booking', idx)}
                    className={`h-6 px-2 rounded-md text-[10px] font-bold transition cursor-pointer shrink-0 ${
                      bookingVariantIdx === idx
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Var {idx + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setExpandedOption(expandedOption === 'booking' ? null : 'booking')}
                className="text-[10px] text-sky-600 dark:text-sky-400 font-bold hover:underline shrink-0"
              >
                {expandedOption === 'booking' ? 'Hide Preview' : 'Preview / Edit'}
              </button>
            </div>

            {/* Expandable Preview & Inline Editor */}
            {expandedOption === 'booking' && (
              <div className="pt-2 animate-in fade-in duration-150 space-y-1.5">
                <textarea
                  rows={4}
                  value={getResolvedMessage('booking', bookingVariantIdx)}
                  onChange={e => setCustomText(prev => ({ ...prev, booking: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Edits apply to this send only. Real name and COD injected.</span>
                  {customText.booking && (
                    <button
                      type="button"
                      onClick={() => setCustomText(prev => {
                        const copy = { ...prev }
                        delete copy.booking
                        return copy
                      })}
                      className="text-sky-600 dark:text-sky-400 font-bold hover:underline"
                    >
                      Reset to Template
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ────────────────── Option 3: Live Courier Status Alert ────────────────── */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/40 p-3.5 transition-all space-y-2.5">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 mt-0.5">
                  <StatusIcon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Option 3: Live Status Alert
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                      {milestoneInfo.label}
                    </span>
                    {isStatusSent && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        Sent
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Sends real-time courier update matching status: "{parcel.status}".
                  </p>
                </div>
              </div>

              {/* Direct Send Action Button */}
              <button
                type="button"
                onClick={() => handleSendOption('status', statusVariantIdx)}
                className="h-8 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs shrink-0"
              >
                <span>Send</span>
              </button>
            </div>

            {/* Anti-Ban 4-Variant Selector Chips */}
            <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-slate-400 font-semibold mr-1 shrink-0">Variants:</span>
                {statusList.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectVariant('status', idx)}
                    className={`h-6 px-2 rounded-md text-[10px] font-bold transition cursor-pointer shrink-0 ${
                      statusVariantIdx === idx
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Var {idx + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setExpandedOption(expandedOption === 'status' ? null : 'status')}
                className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline shrink-0"
              >
                {expandedOption === 'status' ? 'Hide Preview' : 'Preview / Edit'}
              </button>
            </div>

            {/* Expandable Preview & Inline Editor */}
            {expandedOption === 'status' && (
              <div className="pt-2 animate-in fade-in duration-150 space-y-1.5">
                <textarea
                  rows={4}
                  value={getResolvedMessage('status', statusVariantIdx)}
                  onChange={e => setCustomText(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Edits apply to this send only. Real name and COD injected.</span>
                  {customText.status && (
                    <button
                      type="button"
                      onClick={() => setCustomText(prev => {
                        const copy = { ...prev }
                        delete copy.status
                        return copy
                      })}
                      className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                    >
                      Reset to Template
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info note */}
        <div className="pt-1 text-center text-[10px] text-slate-400">
          {isMobile
            ? 'Opens WhatsApp directly on your mobile device.'
            : waTarget === 'app'
              ? 'Opens native WhatsApp desktop app directly with 0 browser tabs.'
              : 'Opens single WhatsApp Web tab without redirect screen or duplicate tabs.'}
        </div>
      </div>
    </div>
  )
}
