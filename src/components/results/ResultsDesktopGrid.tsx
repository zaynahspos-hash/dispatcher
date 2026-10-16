import { BookingResult } from '../BookingResults'
import { TrashIcon, CancelIcon, CheckIcon, SyncIcon } from '../Icons'
import { useResizableColumns } from '../../hooks/useResizableColumns'

interface ResultsDesktopGridProps {
  results: BookingResult[]
  updateField: (id: string, field: keyof BookingResult, value: string | number) => void
  onDelete: (id: string) => void
  onBookSingle: (result: BookingResult) => Promise<void>
  onCancelShipment?: (tracking: string) => Promise<void>
  cancellingTracking: string[]
  getWhatsAppLink: (parcel: BookingResult) => string
  cities: string[]
  orderTypes: Array<{ value: string; label: string }>
}

const DEFAULT_RESULTS_WIDTHS = {
  index: 40,
  refId: 105,
  customer: 155,
  phone: 125,
  city: 135,
  address: 240,
  cod: 105,
  orderType: 115,
  statusTracking: 160,
  actions: 110
}

export function ResultsDesktopGrid({
  results,
  updateField,
  onDelete,
  onBookSingle,
  onCancelShipment,
  cancellingTracking,
  getWhatsAppLink,
  orderTypes
}: ResultsDesktopGridProps) {
  const { widths, getResizerProps } = useResizableColumns({
    storageKey: 'results_desktop_grid_col_widths',
    defaultWidths: DEFAULT_RESULTS_WIDTHS,
    minWidths: {
      index: 36,
      refId: 70,
      customer: 90,
      phone: 90,
      city: 80,
      address: 120,
      cod: 80,
      orderType: 80,
      statusTracking: 120,
      actions: 90
    }
  })

  return (
    <div className="hidden sm:block rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-xs overflow-hidden">
      <div className="overflow-x-auto min-h-[380px] pb-24">
        <table
          className="text-xs border-collapse table-fixed select-none"
          style={{ minWidth: Object.values(widths).reduce((a, b) => a + b, 0) }}
        >
          <colgroup><col style={{ width: `${widths.index}px` }} /><col style={{ width: `${widths.refId}px` }} /><col style={{ width: `${widths.customer}px` }} /><col style={{ width: `${widths.phone}px` }} /><col style={{ width: `${widths.city}px` }} /><col style={{ width: `${widths.address}px` }} /><col style={{ width: `${widths.cod}px` }} /><col style={{ width: `${widths.orderType}px` }} /><col style={{ width: `${widths.statusTracking}px` }} /><col style={{ width: `${widths.actions}px` }} /></colgroup>
          <thead className="bg-slate-50 dark:bg-[#070b12] border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
            <tr>
              <th className="p-3 text-center font-mono border-r border-slate-200/80 dark:border-slate-800 relative">
                #
                <div {...getResizerProps('index')} />
              </th>
              <th className="p-3 text-left border-r border-slate-200/80 dark:border-slate-800 relative">
                Ref ID
                <div {...getResizerProps('refId')} />
              </th>
              <th className="p-3 text-left border-r border-slate-200/80 dark:border-slate-800 relative">
                Customer
                <div {...getResizerProps('customer')} />
              </th>
              <th className="p-3 text-left border-r border-slate-200/80 dark:border-slate-800 relative">
                Phone
                <div {...getResizerProps('phone')} />
              </th>
              <th className="p-3 text-left border-r border-slate-200/80 dark:border-slate-800 relative">
                City
                <div {...getResizerProps('city')} />
              </th>
              <th className="p-3 text-left border-r border-slate-200/80 dark:border-slate-800 relative">
                Delivery Address
                <div {...getResizerProps('address')} />
              </th>
              <th className="p-3 text-right border-r border-slate-200/80 dark:border-slate-800 relative">
                COD (Rs.)
                <div {...getResizerProps('cod')} />
              </th>
              <th className="p-3 text-center border-r border-slate-200/80 dark:border-slate-800 relative">
                Order Type
                <div {...getResizerProps('orderType')} />
              </th>
              <th className="p-3 text-center border-r border-slate-200/80 dark:border-slate-800 relative">
                Status / Tracking
                <div {...getResizerProps('statusTracking')} />
              </th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
            {results.map((r, i) => {
              const isBooked = r.status === 'success'
              const isCancelled = r.status === 'cancelled'
              const isError = r.status === 'error'

              return (
                <tr
                  key={r.id || i}
                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors ${
                    isBooked ? 'bg-emerald-500/[0.02]' : isError ? 'bg-rose-500/[0.03]' : ''
                  }`}
                >
                  {/* Row Index */}
                  <td className="p-2 text-center text-slate-400 font-mono text-[11px] border-r border-b border-slate-200/80 dark:border-slate-800">
                    {i + 1}
                  </td>

                  {/* Ref ID */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono">
                    <input
                      value={r.id || ''}
                      disabled={isBooked}
                      onChange={e => updateField(r.id, 'id', e.target.value)}
                      className="w-full h-10 px-3 py-2 bg-transparent text-xs font-mono text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75"
                    />
                  </td>

                  {/* Customer Name */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800">
                    <input
                      value={r.name || ''}
                      disabled={isBooked}
                      onChange={e => updateField(r.id, 'name', e.target.value)}
                      placeholder="Recipient Name"
                      className="w-full h-10 px-3 py-2 bg-transparent text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75"
                    />
                  </td>

                  {/* Phone */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono">
                    <input
                      value={r.phone || ''}
                      disabled={isBooked}
                      onChange={e => updateField(r.id, 'phone', e.target.value)}
                      placeholder="03001234567"
                      className="w-full h-10 px-3 py-2 bg-transparent text-xs font-mono text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75"
                    />
                  </td>

                  {/* City */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800">
                    <input
                      value={r.city || ''}
                      disabled={isBooked}
                      onChange={e => updateField(r.id, 'city', e.target.value)}
                      placeholder="City Name"
                      className="w-full h-10 px-3 py-2 bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75"
                    />
                  </td>

                  {/* Address */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800">
                    <input
                      value={r.address || ''}
                      disabled={isBooked}
                      onChange={e => updateField(r.id, 'address', e.target.value)}
                      placeholder="Delivery address..."
                      className="w-full h-10 px-3 py-2 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75"
                    />
                  </td>

                  {/* COD */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono">
                    <input
                      type="number"
                      value={r.total}
                      disabled={isBooked}
                      onChange={e => updateField(r.id, 'total', Number(e.target.value))}
                      className="w-full h-10 px-3 py-2 bg-transparent text-xs font-mono font-bold text-right text-emerald-600 dark:text-emerald-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75"
                    />
                  </td>

                  {/* Order Type */}
                  <td className="p-1 border-r border-b border-slate-200/80 dark:border-slate-800 text-center">
                    <select
                      value={r.orderType || 'Normal'}
                      disabled={isBooked}
                      onChange={e => updateField(r.id, 'orderType', e.target.value)}
                      className="h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-75 cursor-pointer"
                    >
                      {orderTypes.map(ot => (
                        <option key={ot.value} value={ot.value}>
                          {ot.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Status & Tracking */}
                  <td className="p-2 border-r border-b border-slate-200/80 dark:border-slate-800 text-center">
                    {isBooked && r.tracking ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckIcon size={11} />
                          {r.tracking}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(r.tracking || '')
                            alert('Tracking number copied!')
                          }}
                          className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition"
                          title="Copy Tracking Number"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    ) : isCancelled ? (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 line-through">
                        Cancelled
                      </span>
                    ) : isError ? (
                      <span
                        className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 truncate max-w-[140px]"
                        title={r.error}
                      >
                        {r.error || 'Booking Error'}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        Draft
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-2 border-b border-slate-200/80 dark:border-slate-800 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* WhatsApp Button */}
                      <a
                        href={getWhatsAppLink(r)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition shadow-2xs"
                        title="Send WhatsApp Order Update"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.035-2.834-6.867-1.829-1.83-4.269-2.837-6.87-2.839-5.439 0-9.866 4.372-9.87 9.733-.001 1.73.465 3.418 1.348 4.908l-.993 3.629 3.73-.977z" />
                        </svg>
                      </a>

                      {/* Book Single if not booked */}
                      {!isBooked && (
                        <button
                          type="button"
                          onClick={() => onBookSingle(r)}
                          className="h-7 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-2xs transition flex items-center gap-1 active:scale-95"
                          title="Book on PostEx V3"
                        >
                          <SyncIcon size={11} />
                          <span>Book</span>
                        </button>
                      )}

                      {/* Cancel Booking if booked */}
                      {isBooked && r.tracking && onCancelShipment && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Cancel booking for ${r.name} (${r.tracking})?`)) {
                              onCancelShipment(r.tracking || '')
                            }
                          }}
                          disabled={cancellingTracking.includes(r.tracking || '')}
                          className="w-7 h-7 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 transition shadow-2xs disabled:opacity-50"
                          title="Cancel Shipment"
                        >
                          <CancelIcon size={12} />
                        </button>
                      )}

                      {/* Delete Row */}
                      <button
                        type="button"
                        onClick={() => onDelete(r.id)}
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 flex items-center justify-center transition shadow-2xs"
                        title="Delete Row"
                      >
                        <TrashIcon size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
