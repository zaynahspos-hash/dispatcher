import { SyncIcon, CancelIcon, InfoIcon, WhatsAppIcon } from '../Icons'
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
  return (
    <div className="bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
      {/* Top Row: Checkbox, Name, Status Badge, Sync */}
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={e => onToggleSelect(parcel.tracking, e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 dark:text-white text-sm">{parcel.name}</span>
              {isWhatsAppSent ? (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                  Sent ✓
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800">
                  WA Pending
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{parcel.phone}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
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
            {getDisplayStatus(parcel.status)}
          </span>
          <button
            type="button"
            onClick={() => onSyncStatus(parcel.tracking)}
            disabled={isSyncing}
            className="text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:text-emerald-400 transition disabled:opacity-50 cursor-pointer text-xs flex items-center justify-center p-1"
            title="Sync Status"
          >
            {isSyncing ? (
              <svg className="animate-spin h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <SyncIcon size={14} />
            )}
          </button>
        </div>
      </div>

      {/* Details List */}
      <div className="flex flex-col gap-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400 dark:text-slate-500">Tracking CN:</span>
          <a
            href={`https://postex.pk/tracking?cn=${parcel.tracking}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold font-mono"
          >
            {parcel.tracking}
          </a>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 dark:text-slate-500">Ref:</span>
          <span className="text-slate-700 dark:text-slate-200 font-medium">{parcel.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 dark:text-slate-500">Destination:</span>
          <span className="text-slate-700 dark:text-slate-200 font-medium">{parcel.city}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 dark:text-slate-500">Date:</span>
          <span className="text-slate-700 dark:text-slate-200 font-medium">
            {new Date(parcel.bookingDate).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1 border-t border-slate-100 dark:border-slate-800/60 pt-2">
          <span className="text-slate-400 dark:text-slate-500 font-medium">COD:</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">Rs. {parcel.total.toLocaleString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end mt-1">
        {isUnderReview(parcel.status) && (
          <button
            type="button"
            onClick={() => onOpenAdvice(parcel)}
            className="flex-1 max-w-[120px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
          >
            <InfoIcon size={12} />
            <span>Advice</span>
          </button>
        )}
        {isCancelledStatus(parcel.status) ? (
          <div
            className="flex-1 max-w-[120px] bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-not-allowed opacity-50"
            title="WhatsApp link disabled for cancelled orders"
          >
            <WhatsAppIcon size={14} className="fill-current" />
            <span>WhatsApp</span>
          </div>
        ) : (
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
            className={`flex-1 max-w-[120px] font-bold py-1.5 px-2.5 rounded-lg transition flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow-2xs active:scale-95 ${
              isWhatsAppSent
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-emerald-500/20'
                : 'border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
            }`}
            title={isWhatsAppSent ? 'WhatsApp Sent ✓ • Click to Re-send (Alt+Click to unmark)' : 'Send WhatsApp Message (Pending)'}
          >
            <WhatsAppIcon size={14} className="fill-current" />
            <span>{isWhatsAppSent ? 'Sent ✓' : 'WhatsApp'}</span>
          </a>
        )}
        {isCancellable(parcel.status) && (
          <button
            type="button"
            onClick={() => onCancel(parcel.tracking)}
            disabled={isSyncing}
            className="flex-1 max-w-[120px] bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-600 font-semibold py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 text-xs cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Cancel Booking"
          >
            {isSyncing ? (
              <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                <CancelIcon size={12} />
                <span>Cancel</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
