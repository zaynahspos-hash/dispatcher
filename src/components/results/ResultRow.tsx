import { useState, useEffect } from 'react'
import { FileTextIcon, CancelIcon, AlertIcon, TrashIcon, CheckIcon } from '../Icons'
import { Settings } from '../../utils/groqParser'
import { SearchableDropdown } from '../SearchableDropdown'
import { BookingResult } from '../BookingResults'

const ORDER_TYPES = [
  { value: 'Normal', label: 'Normal (COD)' },
  { value: 'Reversed', label: 'Reversed (Pickup)' },
  { value: 'Replacement', label: 'Replacement (Exchange)' },
  { value: 'Overland', label: 'Overland (Cargo)' },
]

interface ResultRowProps {
  r: BookingResult
  isExpanded: boolean
  onToggleExpand: () => void
  setResults: React.Dispatch<React.SetStateAction<BookingResult[]>>
  settings: Settings
  cities: string[]
  onBookSingle: (result: BookingResult) => Promise<void>
  onCancelShipment?: (tracking: string) => Promise<void>
  cancellingTracking: string[]
  setCancellingTracking: React.Dispatch<React.SetStateAction<string[]>>
  getWhatsAppLink: (parcel: BookingResult) => string
}

export function ResultRow({
  r,
  isExpanded,
  onToggleExpand,
  setResults,
  settings,
  cities,
  onBookSingle,
  onCancelShipment,
  cancellingTracking,
  setCancellingTracking,
  getWhatsAppLink
}: ResultRowProps) {
  const [formValues, setFormValues] = useState<BookingResult>({
    ...r,
    items: r.items !== undefined ? r.items : (Number(settings.default_items) || 1),
    weight: r.weight !== undefined ? r.weight : (Number(settings.default_weight) || 0.5),
    detail: r.detail !== undefined ? r.detail : (settings.default_product || 'Kids Clothes'),
    note: r.note !== undefined ? r.note : (settings.default_note || 'Call before delivery'),
    orderType: r.orderType !== undefined ? r.orderType : 'Normal',
    airwayBillCopy: r.airwayBillCopy !== undefined ? r.airwayBillCopy : 1
  })

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setFormValues({
      ...r,
      items: r.items !== undefined ? r.items : (Number(settings.default_items) || 1),
      weight: r.weight !== undefined ? r.weight : (Number(settings.default_weight) || 0.5),
      detail: r.detail !== undefined ? r.detail : (settings.default_product || 'Kids Clothes'),
      note: r.note !== undefined ? r.note : (settings.default_note || 'Call before delivery'),
      orderType: r.orderType !== undefined ? r.orderType : 'Normal',
      airwayBillCopy: r.airwayBillCopy !== undefined ? r.airwayBillCopy : 1
    })
  }, [r, settings])

  const handleSave = (showFeedback = true) => {
    if (!formValues.name.trim()) {
      alert('Please enter customer name.')
      return false
    }
    if (!formValues.phone.trim()) {
      alert('Please enter phone number.')
      return false
    }
    if (!formValues.city.trim()) {
      alert('Please select a city.')
      return false
    }
    if (!formValues.address.trim()) {
      alert('Please enter address.')
      return false
    }

    setResults(prev => prev.map(item => item.id === r.id ? { ...formValues } : item))
    if (showFeedback) {
      setIsSaving(true)
      setTimeout(() => setIsSaving(false), 1500)
    }
    return true
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to delete row for "${r.name || 'Unnamed'}"?`)) {
      setResults(prev => prev.filter(item => item.id !== r.id))
    }
  }

  const handleBook = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const saved = handleSave(false)
    if (!saved) return
    await onBookSingle(formValues)
  }

  const getStatusBorder = () => {
    if (r.status === 'success') return 'border-emerald-200/80 dark:border-emerald-900/40 bg-white dark:bg-[#0c121e]'
    if (r.status === 'cancelled') return 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 opacity-75'
    if (r.status === 'manual') return 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e]'
    return 'border-rose-200/80 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/20'
  }

  return (
    <div className={`border rounded-2xl transition-all duration-150 overflow-hidden ${getStatusBorder()} ${isExpanded ? 'ring-2 ring-emerald-500/50 shadow-md' : 'hover:border-slate-300 dark:hover:border-slate-700'}`}>
      {/* Header View */}
      <div 
        onClick={onToggleExpand} 
        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 select-none cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`font-bold text-sm ${r.status === 'cancelled' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
              {r.name || <span className="italic font-normal text-slate-400">Unnamed Customer</span>}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {r.city}
            </span>
            {r.total > 0 && (
              <span className={`text-xs font-bold font-mono ${r.status === 'cancelled' ? 'line-through text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                Rs. {Number(r.total).toLocaleString()}
              </span>
            )}
            {r.orderType && r.orderType !== 'Normal' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
                {r.orderType}
              </span>
            )}
            {r.status === 'manual' && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                Draft
              </span>
            )}
            {r.status === 'error' && r.error && (
              <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded max-w-[240px] truncate" title={r.error}>
                {r.error}
              </span>
            )}
          </div>
          {r.tracking && (
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <FileTextIcon size={12} className="text-slate-400 shrink-0" />
              <span>Tracking: <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{r.tracking}</strong></span>
            </div>
          )}
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {r.status === 'success' && r.tracking && (
            <div className="hidden sm:flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(r.tracking || '')
                  alert('Tracking number copied!')
                }}
                className="text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer font-semibold"
              >
                Copy
              </button>
              <a
                href={getWhatsAppLink(r)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer font-semibold"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.035-2.834-6.867-1.829-1.83-4.269-2.837-6.87-2.839-5.439 0-9.866 4.372-9.87 9.733-.001 1.73.465 3.418 1.348 4.908l-.993 3.629 3.73-.977z" />
                </svg>
                <span>WhatsApp</span>
              </a>
              {onCancelShipment && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Are you sure you want to cancel booking for ${r.name} (${r.tracking})?`)) {
                      setCancellingTracking(prev => [...prev, r.tracking || ''])
                      try {
                        await onCancelShipment(r.tracking || '')
                      } catch (err: any) {
                        alert(err.message || 'Cancellation failed.')
                      } finally {
                        setCancellingTracking(prev => prev.filter(t => t !== r.tracking))
                      }
                    }
                  }}
                  disabled={cancellingTracking.includes(r.tracking || '')}
                  className="text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2.5 py-1.5 rounded-lg disabled:opacity-50 transition flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <CancelIcon size={12} />
                  <span>{cancellingTracking.includes(r.tracking || '') ? '...' : 'Cancel'}</span>
                </button>
              )}
            </div>
          )}
          {r.status === 'success' && (
            <div className="w-6 h-6 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center shrink-0">
              <CheckIcon size={13} className="text-emerald-600 dark:text-emerald-400 font-bold" />
            </div>
          )}
          {r.status === 'cancelled' && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md font-semibold shrink-0">
              Cancelled
            </span>
          )}
          {r.status === 'manual' && (
            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300" title="Manual Entry">
              <span className="text-[10px] font-black">M</span>
            </div>
          )}
          {r.status === 'error' && (
            <div className="w-6 h-6 bg-rose-500/20 border border-rose-500/40 rounded-full flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
              <AlertIcon size={13} />
            </div>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer flex items-center justify-center shrink-0"
            title="Delete Row"
          >
            <TrashIcon size={15} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer flex items-center justify-center shrink-0"
            title={isExpanded ? 'Collapse Row' : 'Expand Row'}
          >
            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Edit Form */}
      {isExpanded && (
        <div className="px-4 pb-5 pt-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 transition-all duration-200">
          {/* Mobile-only action buttons for booked parcels */}
          {r.status === 'success' && r.tracking && (
            <div className="sm:hidden flex flex-col gap-2 mb-4 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" onClick={e => e.stopPropagation()}>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Quick Actions:</div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(r.tracking || '')
                    alert('Tracking number copied!')
                  }}
                  className="flex-1 text-center text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-3 py-2 rounded-lg transition cursor-pointer font-semibold"
                >
                  Copy Tracking
                </button>
                <a
                  href={getWhatsAppLink(r)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.035-2.834-6.867-1.829-1.83-4.269-2.837-6.87-2.839-5.439 0-9.866 4.372-9.87 9.733-.001 1.73.465 3.418 1.348 4.908l-.993 3.629 3.73-.977z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>
                {onCancelShipment && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`Are you sure you want to cancel booking for ${r.name} (${r.tracking})?`)) {
                        setCancellingTracking(prev => [...prev, r.tracking || ''])
                        try {
                          await onCancelShipment(r.tracking || '')
                        } catch (err: any) {
                          alert(err.message || 'Cancellation failed.')
                        } finally {
                          setCancellingTracking(prev => prev.filter(t => t !== r.tracking))
                        }
                      }
                    }}
                    disabled={cancellingTracking.includes(r.tracking || '')}
                    className="flex-1 text-center text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-2 rounded-lg disabled:opacity-50 transition flex items-center justify-center gap-1 cursor-pointer font-semibold"
                  >
                    <CancelIcon size={12} />
                    <span>{cancellingTracking.includes(r.tracking || '') ? '...' : 'Cancel'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Field: Name */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Customer Name *</label>
              <input
                type="text"
                value={formValues.name}
                onChange={e => setFormValues(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-slate-100"
                placeholder="Enter customer name"
              />
            </div>

            {/* Field: Phone */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Phone Number *</label>
              <input
                type="text"
                value={formValues.phone}
                onChange={e => setFormValues(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-slate-100"
                placeholder="e.g. 03001234567"
              />
            </div>

            {/* Field: City */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">City *</label>
              <SearchableDropdown
                value={formValues.city}
                onChange={val => setFormValues(prev => ({ ...prev, city: val }))}
                options={cities}
                className="w-full"
                placeholder="Select city..."
              />
            </div>

            {/* Field: COD Amount */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">COD Amount (Rs.) *</label>
              <input
                type="number"
                value={formValues.total || ''}
                onChange={e => setFormValues(prev => ({ ...prev, total: Number(e.target.value) || 0 }))}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-slate-100"
                placeholder="0"
              />
            </div>

            {/* Field: Address */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Full Address *</label>
              <textarea
                value={formValues.address}
                onChange={e => setFormValues(prev => ({ ...prev, address: e.target.value }))}
                rows={2}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-slate-100"
                placeholder="Street address, sector/area, city"
              />
            </div>

            {/* Optional Grid: Weight, Items, Order Type, Airway Copies */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formValues.weight}
                onChange={e => setFormValues(prev => ({ ...prev, weight: Number(e.target.value) || 0.5 }))}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Items / Pieces</label>
              <input
                type="number"
                value={formValues.items}
                onChange={e => setFormValues(prev => ({ ...prev, items: Number(e.target.value) || 1 }))}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Order Type (PostEx V3)</label>
              <select
                value={formValues.orderType || 'Normal'}
                onChange={e => setFormValues(prev => ({ ...prev, orderType: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                {ORDER_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Airway Bill Copies</label>
              <input
                type="number"
                value={formValues.airwayBillCopy}
                onChange={e => setFormValues(prev => ({ ...prev, airwayBillCopy: Number(e.target.value) || 1 }))}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Product Detail</label>
              <input
                type="text"
                value={formValues.detail}
                onChange={e => setFormValues(prev => ({ ...prev, detail: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-slate-100"
                placeholder="Product description..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Booking Note</label>
              <input
                type="text"
                value={formValues.note}
                onChange={e => setFormValues(prev => ({ ...prev, note: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-slate-100"
                placeholder="Instructions for rider..."
              />
            </div>
          </div>

          {/* Action buttons inside expanded area */}
          <div className="flex flex-wrap items-center justify-between border-t border-slate-200 dark:border-slate-800 mt-5 pt-4 gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-sm transition cursor-pointer flex items-center gap-1.5 active:scale-98"
              >
                <span>{isSaving ? 'Saved!' : 'Save Changes'}</span>
              </button>
              <button
                type="button"
                onClick={onToggleExpand}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition cursor-pointer flex items-center gap-1.5 active:scale-98"
                title="Collapse this row"
              >
                <span>Collapse Card ▲</span>
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition cursor-pointer active:scale-98"
              >
                Delete Row
              </button>
            </div>

            <div className="flex items-center gap-2">
              {r.status !== 'success' && (
                <button
                  type="button"
                  onClick={handleBook}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Book Parcel (PostEx)</span>
                </button>
              )}
              {r.status === 'success' && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckIcon size={14} />
                  <span>Order booked successfully</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
