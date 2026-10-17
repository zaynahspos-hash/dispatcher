import { SyncIcon, CancelIcon, InfoIcon, WhatsAppIcon, ChevronDownIcon } from '../Icons'
import {
  BookedParcel,
  isCancelledStatus,
  isBookedStatus,
  isUnderReview,
  getDisplayStatus,
  isCancellable,
  getWhatsAppLink
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
  whatsappNote?: string
  whatsappTemplate?: string
  isWhatsAppSent?: boolean
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
  whatsappNote,
  whatsappTemplate,
  isWhatsAppSent,
  onMarkWhatsAppSent,
  onToggleWhatsAppSent
}: HistoryMobileCardProps) {
  const effectiveWhatsAppSent = Boolean(parcel.whatsapp_sent || parcel.whatsappSent || isWhatsAppSent)
  const canCancel = isCancellable(parcel.status, parcel.loadsheet_generated)

  return (
    <div className={`bg-white dark:bg-[#0c121e] border rounded-2xl p-3.5 transition-all shadow-xs ${
      isSelected
        ? 'border-emerald-500/50 ring-1 ring-emerald-500/20 bg-emerald-500/[0.02]'
        : 'border-slate-200/80 dark:border-slate-800'
    }`}>
      {/* Top Header: Always Visible Summary Strip */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={e => onToggleSelect(parcel.tracking, e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer shrink-0"
          />
          <div className="min-w-0 flex-1 cursor-pointer" onClick={onToggleExpand}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[150px]">
                {parcel.name || 'Unnamed Recipient'}
              </span>
              {effectiveWhatsAppSent ? (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                  Sent
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800">
                  WA Pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold select-all">{parcel.tracking}</span>
              <span>&bull;</span>
              <span className="uppercase font-semibold text-slate-500">{parcel.city}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right cursor-pointer" onClick={onToggleExpand}>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
                parcel.status === 'success' || parcel.status === 'Delivered' || isBookedStatus(parcel.status)
                  ? 'bg-[var(--status-success-bg)] border-[var(--status-success-border)] text-[var(--status-success-text)]'
                  : isCancelledStatus(parcel.status) || parcel.status === 'Returned'
                  ? 'bg-[var(--status-danger-bg)] border-[var(--status-danger-border)] text-[var(--status-danger-text)]'
                  : isUnderReview(parcel.status)
                  ? 'bg-[var(--status-warning-bg)] border-[var(--status-warning-border)] text-[var(--status-warning-text)]'
                  : 'bg-[var(--status-info-bg)] border-[var(--status-info-border)] text-[var(--status-info-text)]'
              }`}
            >
              {getDisplayStatus(parcel.status, parcel.loadsheet_generated)}
            </span>
            <div className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
              Rs. {Number(parcel.total || 0).toLocaleString()}
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <ChevronDownIcon size={15} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Details Drawer */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 animate-in fade-in duration-100 text-xs">
          <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Phone Number</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{parcel.phone || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Order Ref ID</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{parcel.id || '—'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Booking Date</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {parcel.bookingDate ? new Date(parcel.bookingDate).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Live Status</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{parcel.status}</span>
                <button
                  type="button"
                  onClick={() => onSyncStatus(parcel.tracking)}
                  disabled={isSyncing}
                  className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer p-0.5"
                  title="Sync Status from PostEx"
                >
                  {isSyncing ? (
                    <svg className="animate-spin h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <SyncIcon size={12} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {parcel.address && (
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Delivery Address</span>
              <p className="text-slate-700 dark:text-slate-300 font-medium text-[11px] leading-relaxed mt-0.5 break-words">
                {parcel.address}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2 flex-wrap">
            {isUnderReview(parcel.status) && (
              <button
                type="button"
                onClick={() => onOpenAdvice(parcel)}
                className="h-8 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold rounded-xl transition flex items-center justify-center gap-1 text-xs cursor-pointer"
              >
                <InfoIcon size={12} />
                <span>Advice</span>
              </button>
            )}

            {!isCancelledStatus(parcel.status) && (
              <a
                href={getWhatsAppLink(parcel, whatsappNote, whatsappTemplate)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => {
                  if (e.altKey) {
                    e.preventDefault()
                    onToggleWhatsAppSent?.(parcel.tracking)
                  } else {
                    onMarkWhatsAppSent?.(parcel.tracking, parcel.id)
                  }
                }}
                className={`h-8 px-3 rounded-xl font-bold flex items-center gap-1 text-xs transition cursor-pointer shadow-xs active:scale-95 ${
                  effectiveWhatsAppSent
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-emerald-500/20'
                    : 'border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                }`}
              >
                <WhatsAppIcon size={13} className="fill-current" />
                <span>{effectiveWhatsAppSent ? 'Sent' : 'WhatsApp'}</span>
              </a>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={() => onCancel(parcel.tracking)}
                disabled={isSyncing}
                className="h-8 px-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-600 font-semibold rounded-xl transition flex items-center justify-center gap-1 text-xs cursor-pointer disabled:opacity-50 shadow-xs"
                title="Cancel Booking"
              >
                <CancelIcon size={12} />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
