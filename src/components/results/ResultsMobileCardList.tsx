import { BookingResult } from '../BookingResults'
import { TrashIcon, CancelIcon, CheckIcon, SyncIcon } from '../Icons'

interface ResultsMobileCardListProps {
  results: BookingResult[]
  onDelete: (id: string) => void
  onBookSingle: (result: BookingResult) => Promise<void>
  onCancelShipment?: (tracking: string) => Promise<void>
  cancellingTracking: string[]
  getWhatsAppLink: (parcel: BookingResult) => string
}

export function ResultsMobileCardList({
  results,
  onDelete,
  onBookSingle,
  onCancelShipment,
  cancellingTracking,
  getWhatsAppLink
}: ResultsMobileCardListProps) {
  return (
    <div className="sm:hidden space-y-2.5">
      {results.map((r, i) => {
        const isBooked = r.status === 'success'
        const isCancelled = r.status === 'cancelled'
        const isError = r.status === 'error'

        return (
          <div
            key={r.id || i}
            className={`p-3.5 rounded-2xl bg-white dark:bg-[#0c121e] border transition-all duration-200 shadow-xs ${
              isBooked
                ? 'border-emerald-200/80 dark:border-emerald-900/50'
                : isError
                ? 'border-rose-200/80 dark:border-rose-900/50'
                : 'border-slate-200/90 dark:border-slate-800'
            }`}
          >
            {/* Top row: Status / Tracking & COD */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
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
                <a
                  href={getWhatsAppLink(r)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-xs font-bold transition active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.035-2.834-6.867-1.829-1.83-4.269-2.837-6.87-2.839-5.439 0-9.866 4.372-9.87 9.733-.001 1.73.465 3.418 1.348 4.908l-.993 3.629 3.73-.977z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>

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
