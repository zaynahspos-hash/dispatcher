import React from 'react'
import { CancelIcon, CheckIcon } from '../Icons'
import { SearchableDropdown } from '../SearchableDropdown'
import { BookingResult } from '../BookingResults'

interface ResultRowEditFormProps {
  r: BookingResult
  formValues: BookingResult
  setFormValues: React.Dispatch<React.SetStateAction<BookingResult>>
  cities: string[]
  onSave: (showFeedback?: boolean) => boolean
  isSaving: boolean
  onToggleExpand: () => void
  handleDelete: (e: React.MouseEvent) => void
  handleBook: (e: React.MouseEvent) => Promise<void>
  onCancelShipment?: (tracking: string) => Promise<void>
  cancellingTracking: string[]
  setCancellingTracking: React.Dispatch<React.SetStateAction<string[]>>
  getWhatsAppLink: (parcel: BookingResult) => string
  orderTypes: Array<{ value: string; label: string }>
}

export function ResultRowEditForm({
  r,
  formValues,
  setFormValues,
  cities,
  onSave,
  isSaving,
  onToggleExpand,
  handleDelete,
  handleBook,
  onCancelShipment,
  cancellingTracking,
  setCancellingTracking,
  getWhatsAppLink,
  orderTypes
}: ResultRowEditFormProps) {
  return (
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
            {orderTypes.map(t => (
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
            onClick={() => onSave(true)}
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
  )
}
