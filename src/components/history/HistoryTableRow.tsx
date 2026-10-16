import { useState } from 'react'
import { SyncIcon, CancelIcon, InfoIcon, ChevronDownIcon, ChevronRightIcon, ExternalLinkIcon } from '../Icons'
import {
  BookedParcel,
  isCancelledStatus,
  isBookedStatus,
  isUnderReview,
  getDisplayStatus,
  isCancellable,
  getWhatsAppLink
} from './types'

interface HistoryTableRowProps {
  parcel: BookedParcel
  isSelected: boolean
  onToggleSelect: (tracking: string, checked: boolean) => void
  onSyncStatus: (tracking: string) => void
  isSyncing: boolean
  onCancel: (tracking: string) => void
  onOpenAdvice: (parcel: BookedParcel) => void
  whatsappNote?: string
  whatsappTemplate?: string
}

export function HistoryTableRow({
  parcel,
  isSelected,
  onToggleSelect,
  onSyncStatus,
  isSyncing,
  onCancel,
  onOpenAdvice,
  whatsappNote,
  whatsappTemplate
}: HistoryTableRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1800)
  }

  return (
    <>
      <tr className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors ${
        isExpanded 
          ? 'bg-slate-50/90 dark:bg-slate-800/60' 
          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
      }`}>
        <td className="p-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className="w-5 h-5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
              title={isExpanded ? 'Collapse row details' : 'Expand full order details'}
              aria-label="Expand row details"
            >
              {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
            </button>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={e => onToggleSelect(parcel.tracking, e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 focus:ring-0 cursor-pointer"
            />
          </div>
        </td>
        <td className="p-3">
          <div className="font-semibold text-slate-900 dark:text-white text-xs">{parcel.name}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium mt-0.5">{parcel.phone}</div>
        </td>
        <td className="p-3">
          <a
            href={`https://postex.pk/tracking?cn=${parcel.tracking}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold font-mono text-xs flex items-center gap-1"
          >
            <span>{parcel.tracking}</span>
            <ExternalLinkIcon size={11} className="opacity-70" />
          </a>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Ref: {parcel.id}</div>
        </td>
        <td className="p-3">
          <div className="font-semibold text-slate-800 dark:text-slate-100 text-xs">{parcel.city}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">{parcel.address}</div>
        </td>
        <td className="p-3 text-slate-600 dark:text-slate-400 font-medium text-xs">
          {new Date(parcel.bookingDate).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </td>
        <td className="p-3 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400 text-xs">
          Rs. {parcel.total.toLocaleString()}
        </td>
        <td className="p-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                parcel.status === 'success' || parcel.status === 'Delivered' || isBookedStatus(parcel.status)
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : isCancelledStatus(parcel.status) || parcel.status === 'Returned'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
                  : isUnderReview(parcel.status)
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {getDisplayStatus(parcel.status)}
            </span>
            <button
              type="button"
              onClick={() => onSyncStatus(parcel.tracking)}
              disabled={isSyncing}
              title="Sync real-time status from PostEx"
              className="w-6 h-6 rounded-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer flex items-center justify-center"
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
          </div>
        </td>
        <td className="p-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            {isCancelledStatus(parcel.status) ? (
              <div
                className="w-7 h-7 rounded-md border border-slate-200/60 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 flex items-center justify-center cursor-not-allowed"
                title="WhatsApp link disabled for cancelled orders"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.035-2.834-6.867-1.829-1.83-4.269-2.837-6.87-2.839-5.439 0-9.866 4.372-9.87 9.733-.001 1.73.465 3.418 1.348 4.908l-.993 3.629 3.73-.977z" />
                </svg>
              </div>
            ) : (
              <a
                href={getWhatsAppLink(parcel, whatsappNote, whatsappTemplate)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-800/80 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 flex items-center justify-center transition cursor-pointer shadow-2xs"
                title="Send tracking details to WhatsApp"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.035-2.834-6.867-1.829-1.83-4.269-2.837-6.87-2.839-5.439 0-9.866 4.372-9.87 9.733-.001 1.73.465 3.418 1.348 4.908l-.993 3.629 3.73-.977z" />
                </svg>
              </a>
            )}
            {isCancellable(parcel.status) && (
              <button
                type="button"
                onClick={() => onCancel(parcel.tracking)}
                disabled={isSyncing}
                className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800/80 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 flex items-center justify-center transition cursor-pointer disabled:opacity-50 shadow-2xs"
                title="Cancel Booking"
              >
                {isSyncing ? (
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <CancelIcon size={14} />
                )}
              </button>
            )}
            {isUnderReview(parcel.status) && (
              <button
                type="button"
                onClick={() => onOpenAdvice(parcel)}
                className="h-7 px-2 rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Submit Shipper Advice (Retry/Return)"
              >
                <InfoIcon size={11} />
                <span>Advice</span>
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Excel Collapsible Row Expansion */}
      {isExpanded && (
        <tr className="bg-slate-50/80 dark:bg-[#070b12] border-b border-slate-200/90 dark:border-slate-800">
          <td colSpan={8} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-[#0c121e] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-xs">
              
              {/* Section 1: Delivery Address & Street Breakdown */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Full Destination Address
                </span>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/70 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {parcel.city}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                    {parcel.address || 'No full street address specified.'}
                  </p>
                </div>
              </div>

              {/* Section 2: Consignee & Communication */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Recipient & Contact
                </span>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/70 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">{parcel.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Ref: {parcel.id}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs text-slate-700 dark:text-slate-300">
                    <span>{parcel.phone}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(parcel.phone, 'phone')}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-sans font-bold"
                    >
                      {copiedKey === 'phone' ? 'Copied!' : 'Copy Phone'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: PostEx Logistics & Quick Dispatch */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  PostEx Logistics & Tracking
                </span>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/70 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Tracking (CN):</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{parcel.tracking}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(parcel.tracking, 'tracking')}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-sans font-bold"
                      >
                        {copiedKey === 'tracking' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">COD Payable:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">Rs. {parcel.total.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Live Portal:</span>
                    <a
                      href={`https://postex.pk/tracking?cn=${parcel.tracking}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Track on PostEx</span>
                      <ExternalLinkIcon size={12} />
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  )
}
