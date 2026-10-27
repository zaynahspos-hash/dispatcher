import { useState } from 'react'
import { SyncIcon, CancelIcon, InfoIcon, ChevronDownIcon, ChevronRightIcon, ExternalLinkIcon } from '../Icons'
import { WhatsAppActionButton } from '../common/WhatsAppActionButton'
import {
  BookedParcel,
  isCancelledStatus,
  isUnderReview,
  getDisplayStatus,
  getStatusBadgeStyle,
  isCancellable,
  isParcelWhatsAppSent
} from './types'

interface HistoryTableRowProps {
  parcel: BookedParcel
  isSelected: boolean
  onToggleSelect: (tracking: string, checked: boolean) => void
  onSyncStatus: (tracking: string) => void
  isSyncing: boolean
  onCancel: (tracking: string) => void
  onOpenAdvice: (parcel: BookedParcel) => void
  onOpenWhatsApp: (parcel: BookedParcel) => void
  whatsappNote?: string
  whatsappTemplate?: string
  isWhatsAppSent?: boolean
  autoExpandLines?: boolean
}

export function HistoryTableRow({
  parcel,
  isSelected,
  onToggleSelect,
  onSyncStatus,
  isSyncing,
  onCancel,
  onOpenAdvice,
  onOpenWhatsApp,
  isWhatsAppSent,
  autoExpandLines = false
}: HistoryTableRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const effectiveWhatsAppSent = isParcelWhatsAppSent(parcel, isWhatsAppSent ? () => true : undefined)

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
        <td className="px-1.5 py-2.5 xl:px-3 xl:py-3 text-center align-middle">
          <div className="flex items-center justify-center gap-1 xl:gap-1.5">
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className="w-5 h-5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
              title={isExpanded ? 'Collapse row details' : 'Expand full order details'}
              aria-label="Expand row details"
            >
              {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
            </button>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={e => onToggleSelect(parcel.tracking, e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 focus:ring-0 cursor-pointer shrink-0"
            />
          </div>
        </td>
        <td className="px-2 py-2.5 xl:px-3 xl:py-3 min-w-0 align-middle">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className={`font-semibold text-slate-900 dark:text-white text-xs min-w-0 ${autoExpandLines ? 'break-words' : 'truncate'}`}>
              {parcel.name}
            </span>
            {effectiveWhatsAppSent ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#25D366]/15 text-[#128C7E] dark:text-[#25D366] border border-[#25D366]/25 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                Sent
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 shrink-0">
                WA Pending
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium mt-0.5 truncate">{parcel.phone}</div>
        </td>
        <td className="px-2 py-2.5 xl:px-3 xl:py-3 min-w-0 align-middle">
          <a
            href={`https://postex.pk/tracking?cn=${parcel.tracking}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold font-mono text-[11px] xl:text-xs inline-flex items-center gap-1 xl:gap-1.5 max-w-full min-w-0 select-all"
            title={`PostEx CN: ${parcel.tracking} (Click to open tracking)`}
          >
            <span className="truncate min-w-0">{parcel.tracking}</span>
            <ExternalLinkIcon size={11} className="opacity-70 shrink-0 hidden xl:inline-block" />
          </a>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5 min-w-0">
            <span className="text-[10px] xl:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Ref: {parcel.id}</span>
            {parcel.source === 'app' ? (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shrink-0 whitespace-nowrap">
                <span className="hidden xl:inline">Booked in App</span>
                <span className="xl:hidden">App</span>
              </span>
            ) : parcel.source === 'postex_portal' ? (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25 shrink-0 whitespace-nowrap">
                <span className="hidden xl:inline">Portal / External</span>
                <span className="xl:hidden">Portal</span>
              </span>
            ) : null}
          </div>
        </td>

        <td className="px-2 py-2.5 xl:px-3 xl:py-3 min-w-0 align-middle">
          <div className={`font-semibold text-slate-800 dark:text-slate-100 text-xs ${autoExpandLines ? 'break-words' : 'truncate'}`}>{parcel.city}</div>
          <div className={`text-[11px] text-slate-500 dark:text-slate-400 ${autoExpandLines ? 'break-words whitespace-normal leading-tight mt-0.5' : 'truncate'}`}>{parcel.address}</div>
        </td>
        <td className="hidden xl:table-cell px-2 py-2.5 xl:px-3 xl:py-3 min-w-0 text-slate-600 dark:text-slate-400 font-medium text-[11px] xl:text-xs whitespace-nowrap align-middle">
          {new Date(parcel.bookingDate).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </td>
        <td className="px-3 py-2.5 xl:py-3 min-w-0 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400 text-[11px] xl:text-xs whitespace-nowrap align-middle pr-4">
          Rs. {parcel.total.toLocaleString()}
        </td>
        <td className="px-3 py-2.5 xl:py-3 min-w-0 align-middle">
          {(() => {
            const badgeColor = getStatusBadgeStyle(parcel.status, parcel.tracking, parcel.loadsheet_generated)
            const displayStatus = getDisplayStatus(parcel.status, parcel.loadsheet_generated)

            return (
              <span
                className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] xl:text-[11px] font-semibold border text-center leading-tight whitespace-nowrap select-none shadow-2xs ${badgeColor}`}
                title={displayStatus}
              >
                {displayStatus}
              </span>
            )
          })()}
        </td>
        <td className="px-1 py-2.5 xl:px-2 xl:py-3 text-center min-w-0 align-middle">
          <div className="flex items-center justify-center gap-1 xl:gap-1.5 flex-wrap">
            <WhatsAppActionButton
              isSent={effectiveWhatsAppSent}
              disabled={isCancelledStatus(parcel.status)}
              onClick={() => onOpenWhatsApp(parcel)}
              title={
                isCancelledStatus(parcel.status)
                  ? 'WhatsApp disabled for cancelled orders'
                  : effectiveWhatsAppSent
                    ? 'WhatsApp Sent • Click to Re-send (Booking or Real Status)'
                    : 'Send WhatsApp Alert (Pending)'
              }
            />

            <button
              type="button"
              onClick={() => onSyncStatus(parcel.tracking)}
              disabled={isSyncing}
              title="Sync real-time status from PostEx"
              className="w-7 h-7 rounded-xl text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer flex items-center justify-center shrink-0 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60"
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

            {isCancellable(parcel.status, parcel.loadsheet_generated, parcel.tracking) && (
              <button
                type="button"
                onClick={() => onCancel(parcel.tracking)}
                disabled={isSyncing}
                className="w-7 h-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800/80 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 flex items-center justify-center transition cursor-pointer disabled:opacity-50 shadow-2xs active:scale-95 shrink-0"
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
                className="h-7 px-2 rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
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
