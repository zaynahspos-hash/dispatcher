import { BookingResult } from '../BookingResults'
import { TrashIcon, CancelIcon, CheckIcon, SyncIcon, WhatsAppIcon } from '../Icons'

interface ResultsMobileCardListProps {
  results: BookingResult[]
  selected?: Set<string>
  toggleSelect?: (id: string) => void
  toggleAll?: () => void
  onDeselectAll?: () => void
  onDelete: (id: string) => void
  onBookSingle: (result: BookingResult) => Promise<void>
  onCancelShipment?: (tracking: string) => Promise<void>
  cancellingTracking: string[]
  getWhatsAppLink: (parcel: BookingResult) => string
  isWhatsAppSent?: (key?: string | null) => boolean
  onMarkWhatsAppSent?: (tracking?: string | null, id?: string | null) => void
  onToggleWhatsAppSent?: (key?: string | null) => void
}

export function ResultsMobileCardList({
  results,
  selected,
  toggleSelect,
  toggleAll,
  onDeselectAll,
  onDelete,
  onBookSingle,
  onCancelShipment,
  cancellingTracking,
  getWhatsAppLink,
  isWhatsAppSent,
  onMarkWhatsAppSent,
  onToggleWhatsAppSent
}: ResultsMobileCardListProps) {
  return (
    <div className="sm:hidden space-y-2.5">
      {/* Mobile Select All Bar */}
      {results.length > 0 && toggleAll && (
        <div className="flex items-center justify-between bg-white dark:bg-[#0c121e] px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-1">
          <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 select-none">
            <input
              type="checkbox"
              ref={el => {
                if (el && selected) {
                  el.indeterminate = selected.size > 0 && selected.size < results.length
                }
              }}
              checked={selected ? selected.size === results.length && results.length > 0 : false}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
            />
            <span>Select All ({selected ? selected.size : 0}/{results.length} selected)</span>
          </label>
          {selected && selected.size > 0 && onDeselectAll && (
            <button
              type="button"
              onClick={onDeselectAll}
              className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 font-extrabold cursor-pointer transition"
            >
              Deselect All
            </button>
          )}
        </div>
      )}

      {results.map((r, i) => {
        const isBooked = r.status === 'success'
        const isCancelled = r.status === 'cancelled'
        const isError = r.status === 'error'
        const isChecked = selected ? selected.has(r.id) : false

        return (
          <div
            key={r.id || i}
            className={`p-3.5 rounded-2xl bg-white dark:bg-[#0c121e] border transition-all duration-200 shadow-xs ${
              isChecked
                ? 'border-emerald-500/50 ring-1 ring-emerald-500/20 bg-emerald-500/[0.02]'
                : isBooked
                ? 'border-emerald-200/80 dark:border-emerald-900/50'
                : isError
                ? 'border-rose-200/80 dark:border-rose-900/50'
                : 'border-slate-200/90 dark:border-slate-800'
            }`}
          >
            {/* Top row: Status / Tracking & COD */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                {toggleSelect && (
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelect(r.id)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                )}
                <span className="font-mono text-[10px] text-slate-400 font-bold shrink-0">#{i + 1}</span>
                {isBooked && r.tracking ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 truncate">
                    <CheckIcon size={11} />
                    {r.tracking}
                  </span>
                ) : isCancelled ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 line-through">
                    Cancelled
                  </span>
                ) : isError ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 truncate">
                    {r.error || 'Failed'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Draft
                  </span>
                )}
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                  {r.city}
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                  Rs. {Number(r.total).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Recipient & Address */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                <span className="truncate">{r.name || 'Unnamed Recipient'}</span>
                <span className="font-mono text-slate-500 text-[11px] font-semibold">{r.phone}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                {r.address}
              </p>
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {/* WhatsApp */}
                {(() => {
                  const sent = isWhatsAppSent ? (isWhatsAppSent(r.tracking) || isWhatsAppSent(r.id)) : false
                  return (
                    <a
                      href={getWhatsAppLink(r)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => {
                        if (e.altKey) {
                          e.preventDefault()
                          onToggleWhatsAppSent?.(r.tracking || r.id)
                        } else {
                          onMarkWhatsAppSent?.(r.tracking, r.id)
                        }
                      }}
                      className={`h-8 px-2.5 rounded-xl font-bold flex items-center gap-1.5 text-xs transition active:scale-95 ${
                        sent
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-emerald-500/20'
                          : 'border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                      }`}
                      title={sent ? 'WhatsApp Sent • Click to Re-send (Alt+Click to unmark)' : 'Send WhatsApp Order Update (Pending)'}
                    >
                      <WhatsAppIcon size={14} className="fill-current" />
                      <span>{sent ? 'Sent' : 'WhatsApp'}</span>
                    </a>
                  )
                })()}

                {/* Copy Tracking if booked */}
                {isBooked && r.tracking && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(r.tracking || '')
                      alert('Tracking copied!')
                    }}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Copy CN
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {!isBooked && (
                  <button
                    type="button"
                    onClick={() => onBookSingle(r)}
                    className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1 active:scale-95"
                  >
                    <SyncIcon size={12} />
                    <span>Book</span>
                  </button>
                )}

                {isBooked && r.tracking && onCancelShipment && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Cancel shipment for ${r.name}?`)) {
                        onCancelShipment(r.tracking || '')
                      }
                    }}
                    disabled={cancellingTracking.includes(r.tracking || '')}
                    className="h-8 px-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold transition"
                  >
                    <CancelIcon size={12} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onDelete(r.id)}
                  className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 flex items-center justify-center transition"
                  title="Delete Row"
                >
                  <TrashIcon size={12} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
