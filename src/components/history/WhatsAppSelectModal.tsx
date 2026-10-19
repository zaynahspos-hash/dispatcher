import React from 'react'
import { CloseIcon, WhatsAppIcon, PackageIcon, TruckIcon, AlertTriangleIcon, CheckCircleIcon } from '../Icons'
import { BookedParcel, getWhatsAppLink, detectParcelMilestone, getMilestoneInfo, getDisplayStatus } from './types'

interface WhatsAppSelectModalProps {
  parcel: BookedParcel | null
  onClose: () => void
  whatsappNote?: string
  whatsappTemplate?: string
  isBookingSent?: boolean
  isStatusSent?: boolean
  onMarkSent?: (tracking: string, id: string | undefined, type: 'booking' | 'status') => void
}

export const WhatsAppSelectModal: React.FC<WhatsAppSelectModalProps> = ({
  parcel,
  onClose,
  whatsappNote,
  whatsappTemplate,
  isBookingSent = false,
  isStatusSent = false,
  onMarkSent
}) => {
  if (!parcel) return null

  const realMilestone = detectParcelMilestone(parcel)
  const milestoneInfo = getMilestoneInfo(realMilestone)

  const bookingUrl = getWhatsAppLink(parcel, whatsappNote, whatsappTemplate, 'booking')
  const statusUrl = getWhatsAppLink(parcel, whatsappNote, whatsappTemplate, realMilestone)

  const handleSend = (url: string, type: 'booking' | 'status') => {
    onMarkSent?.(parcel.tracking, parcel.id, type)
    window.open(url, '_blank', 'noopener,noreferrer')
    onClose()
  }

  // Pure SVG icon based on milestone type (Rule 33 - Zero emojis in UI)
  const StatusIcon = 
    milestoneInfo.iconType === 'truck' ? TruckIcon :
    milestoneInfo.iconType === 'alert' ? AlertTriangleIcon :
    milestoneInfo.iconType === 'check' ? CheckCircleIcon :
    PackageIcon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-md bg-white dark:bg-[#0c121e] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-5 sm:p-6 z-10 animate-in zoom-in-95 duration-150 space-y-4">
        {/* Header - Apple Native Sheet Style */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center border border-[#25D366]/20">
              <WhatsAppIcon size={18} className="fill-current text-[#25D366]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Send WhatsApp Alert
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct customer notification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition flex items-center justify-center cursor-pointer"
            title="Close"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Grouped Info Card - Apple Inset List Style (Zero horizontal wrap / Zero awkward pills) */}
        <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 p-3.5 divide-y divide-slate-200/60 dark:divide-slate-800/60 text-xs">
          {/* Row 1: Consignee & Phone */}
          <div className="pb-2.5 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Customer</span>
              <span className="font-semibold text-slate-900 dark:text-white text-xs truncate block">{parcel.name}</span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Phone</span>
              <span className="font-mono text-slate-600 dark:text-slate-300 font-medium text-xs">{parcel.phone}</span>
            </div>
          </div>

          {/* Row 2: Tracking (CN) & City */}
          <div className="py-2.5 flex items-center justify-between">
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

          {/* Row 3: Live Status (Full-width clean row - NO wrapped pills!) */}
          <div className="pt-2.5 flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Live Status</span>
            <div className="flex items-center gap-1.5 min-w-0 text-right">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate" title={parcel.status}>
                {getDisplayStatus(parcel.status, parcel.loadsheet_generated)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Options - Apple iOS Action Cards */}
        <div className="space-y-2.5 pt-0.5">
          {/* Option 1: Booking Confirmation */}
          <button
            type="button"
            onClick={() => handleSend(bookingUrl, 'booking')}
            className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer group flex items-start gap-3.5 active:scale-[0.98] ${
              isBookingSent
                ? 'bg-sky-500/[0.04] border-sky-500/35 dark:border-sky-500/30'
                : 'bg-white dark:bg-slate-900/30 border-slate-200/80 dark:border-slate-800/80 hover:border-sky-400/50 hover:bg-sky-500/[0.02]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20 mt-0.5">
              <PackageIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Option 1: Booking Confirmation
                </span>
                {isBookingSent ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-500/15 border border-sky-500/25 px-2 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    Sent
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                    Ready
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Sends parcel details, COD total, and postex.pk tracking link.
              </p>
            </div>
          </button>

          {/* Option 2: Real Status Alert */}
          <button
            type="button"
            onClick={() => handleSend(statusUrl, 'status')}
            className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer group flex items-start gap-3.5 active:scale-[0.98] ${
              isStatusSent
                ? 'bg-amber-500/[0.04] border-amber-500/35 dark:border-amber-500/30'
                : 'bg-white dark:bg-slate-900/30 border-slate-200/80 dark:border-slate-800/80 hover:border-amber-400/50 hover:bg-amber-500/[0.02]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 mt-0.5">
              <StatusIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Option 2: Live Status Alert ({milestoneInfo.label})
                </span>
                {isStatusSent ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Sent
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                    Ready
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Sends live courier milestone matching "{parcel.status}".
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="pt-1 text-center text-[10px] text-slate-400">
          Opens WhatsApp directly with prefilled message.
        </div>
      </div>
    </div>
  )
}
