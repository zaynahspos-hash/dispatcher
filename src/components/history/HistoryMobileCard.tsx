import { useState } from 'react'
import { SyncIcon, CancelIcon, InfoIcon, ChevronDownIcon, CheckIcon } from '../Icons'
import { WhatsAppActionButton } from '../common/WhatsAppActionButton'
import {
  BookedParcel,
  isCancelledStatus,
  isUnderReview,
  getDisplayStatus,
  getStatusBadgeStyle,
  isCancellable,
  WhatsAppAlertState,
  isParcelWhatsAppSent
} from './types'

interface HistoryMobileCardProps {
  parcel: BookedParcel
  isSelected: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onToggleSelect: (tracking: string, checked: boolean) => void
  onSyncStatus: (tracking: string) => void
  isSyncing: boolean
  onCancel: (tracking: string) => void
  onOpenAdvice: (parcel: BookedParcel) => void
  onOpenWhatsApp: (parcel: BookedParcel) => void
  whatsappNote?: string
  whatsappTemplate?: string
  isWhatsAppSent?: boolean
  alertState?: WhatsAppAlertState
  onMarkWhatsAppSent?: (tracking: string, id?: string) => void
  onToggleWhatsAppSent?: (tracking: string) => void
}

export function HistoryMobileCard({
  parcel,
  isSelected,
  isExpanded,
  onToggleExpand,
  onToggleSelect,
  onSyncStatus,
  isSyncing,
  onCancel,
  onOpenAdvice,
  onOpenWhatsApp,
  isWhatsAppSent,
  alertState = 'none'
}: HistoryMobileCardProps) {
  const [copied, setCopied] = useState(false)
  const effectiveWhatsAppSent = isParcelWhatsAppSent(parcel, isWhatsAppSent ? () => true : undefined)

  const effectiveState: WhatsAppAlertState = (alertState && alertState !== 'none')
    ? alertState
    : (parcel.whatsapp_booking_sent && parcel.whatsapp_status_sent)
      ? 'both'
      : parcel.whatsapp_booking_sent
        ? 'booking_only'
        : parcel.whatsapp_status_sent
          ? 'status_only'
          : effectiveWhatsAppSent
            ? 'booking_only'
            : 'none'

  const canCancel = isCancellable(parcel.status, parcel.loadsheet_generated)

  const handleCopyCN = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (parcel.tracking) {
      navigator.clipboard.writeText(parcel.tracking)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div
      className={`p-3.5 rounded-2xl bg-white dark:bg-[#0c121e] border transition-all duration-200 shadow-xs w-full max-w-full min-w-0 ${
        isSelected
          ? 'border-emerald-500/50 ring-1 ring-emerald-500/20 bg-emerald-500/[0.02]'
          : 'border-slate-200/90 dark:border-slate-800'
      }`}
    >
      {/* 1. Top Row: Checkbox, Tracking Pill, City Badge & COD Price */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={e => onToggleSelect(parcel.tracking, e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer shrink-0"
          />

          {/* Tracking Number Pill */}
          <a
            href={`https://postex.pk/tracking?cn=${parcel.tracking}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 truncate cursor-pointer active:scale-95"
            title={`Track ${parcel.tracking} on PostEx`}
          >
            <CheckIcon size={11} className="shrink-0" />
            <span>{parcel.tracking}</span>
          </a>

          {/* City Badge */}
          {parcel.city && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wide shrink-0">
              {parcel.city}
            </span>
          )}
        </div>

        {/* COD Price Token */}
        <div className="text-right shrink-0">
          <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
            Rs. {Number(parcel.total || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* 2. Recipient & Phone Row */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
          <span className="truncate">{parcel.name || 'Unnamed Recipient'}</span>
          {parcel.phone && (
            <a
              href={`tel:${parcel.phone}`}
              className="font-mono text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold shrink-0 transition"
              title="Click to call"
            >
              {parcel.phone}
            </a>
          )}
        </div>
        {parcel.address && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed truncate mt-0.5">
            {parcel.address}
          </div>
        )}
      </div>

      {/* 3. Sub-meta Tags: Live Status Badge, WhatsApp Alert State, Portal Source, Booking Date */}
      <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
        {/* Live Status Badge */}
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap max-w-full leading-normal text-center shadow-2xs ${getStatusBadgeStyle(
            parcel.status,
            parcel.tracking,
            parcel.loadsheet_generated
          )}`}
          title={getDisplayStatus(parcel.status, parcel.loadsheet_generated)}
        >
          {getDisplayStatus(parcel.status, parcel.loadsheet_generated)}
        </span>

        {effectiveWhatsAppSent ? (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#25D366]/15 text-[#128C7E] dark:text-[#25D366] border border-[#25D366]/25 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
            {effectiveState === 'both' ? 'Both Sent' : 'Sent'}
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800">
            WA Pending
          </span>
        )}

        {parcel.source === 'postex_portal' && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25">
            Portal
          </span>
        )}

        {parcel.bookingDate && (
          <span className="text-[10px] text-slate-400 font-medium ml-auto">
            {new Date(parcel.bookingDate).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </span>
        )}
      </div>

      {/* 4. Expanded Logistics Details Drawer */}
      {isExpanded && (
        <div className="mb-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Order Ref ID</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{parcel.id || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Booking Date</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {parcel.bookingDate
                  ? new Date(parcel.bookingDate).toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })
                  : '—'}
              </span>
            </div>
          </div>

          {parcel.address && (
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Full Address</span>
              <p className="text-slate-700 dark:text-slate-300 font-medium text-[11px] leading-relaxed mt-0.5 break-words">
                {parcel.address}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. Bottom Actions Bar (Apple iOS Aligned Grid: Primary Row + Dedicated Secondary Row) */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
        <div className="flex items-center gap-1.5">
          {/* WhatsApp Action Button */}
          {!isCancelledStatus(parcel.status) && (
            <div className="flex-1 min-w-0">
              <WhatsAppActionButton
                variant="chip"
                isSent={effectiveWhatsAppSent}
                onClick={() => onOpenWhatsApp(parcel)}
                label={effectiveState === 'both' ? 'Both Sent' : effectiveWhatsAppSent ? 'Sent' : 'WhatsApp'}
                title="Send WhatsApp Order Update"
                className="w-full h-8 rounded-xl font-bold text-xs"
              />
            </div>
          )}

          {/* Copy CN Button */}
          {parcel.tracking && (
            <button
              type="button"
              onClick={handleCopyCN}
              className={`h-8 px-3 rounded-xl border text-xs font-semibold transition active:scale-95 cursor-pointer shrink-0 ${
                copied
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Copy Consignment Tracking Number"
            >
              {copied ? 'Copied!' : 'Copy CN'}
            </button>
          )}

          {/* Sync Status Button */}
          <button
            type="button"
            onClick={() => onSyncStatus(parcel.tracking)}
            disabled={isSyncing}
            className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition cursor-pointer flex items-center justify-center disabled:opacity-50 active:scale-95 shadow-2xs shrink-0"
            title="Sync Live Status from PostEx"
          >
            {isSyncing ? (
              <svg className="animate-spin h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <SyncIcon size={13} />
            )}
          </button>

          {/* Expand Details Drawer */}
          <button
            type="button"
            onClick={onToggleExpand}
            className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer flex items-center justify-center active:scale-95 shadow-2xs shrink-0"
            title={isExpanded ? 'Hide Extra Details' : 'View Extra Details'}
          >
            <ChevronDownIcon size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Dedicated Secondary Row for Shipper Advice & Cancel (Clean Full-Width, 0 Orphan Wrapping) */}
        {(isUnderReview(parcel.status) || canCancel) && (
          <div className="flex items-center gap-1.5 pt-0.5">
            {isUnderReview(parcel.status) && (
              <button
                type="button"
                onClick={() => onOpenAdvice(parcel)}
                className="flex-1 h-8 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/25 font-bold rounded-xl transition flex items-center justify-center gap-1.5 text-xs cursor-pointer active:scale-95"
                title="Submit Shipper Advice"
              >
                <InfoIcon size={12} />
                <span>Submit Shipper Advice</span>
              </button>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={() => onCancel(parcel.tracking)}
                disabled={isSyncing}
                className="flex-1 h-8 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/25 font-bold rounded-xl transition flex items-center justify-center gap-1.5 text-xs cursor-pointer disabled:opacity-50 active:scale-95"
                title="Cancel Booking"
              >
                <CancelIcon size={12} />
                <span>Cancel Order</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
