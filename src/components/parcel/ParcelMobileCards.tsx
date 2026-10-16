import React from 'react'
import { Parcel } from '../../utils/groqParser'
import { PlusIcon, TrashIcon } from '../Icons'
import { POPULAR_CITIES } from './cityAutocomplete'

interface ParcelMobileCardsProps {
  parcels: Parcel[]
  selected: Set<number>
  toggleSelect: (index: number) => void
  toggleAll?: () => void
  onDeselectAll?: () => void
  updateField: (index: number, field: keyof Parcel, value: string | number) => void
  deleteParcel: (index: number) => void
  addRow: () => void
  activeCityList: string[]
  editingCity: { row: number; isMobile?: boolean } | null
  setEditingCity: React.Dispatch<React.SetStateAction<{ row: number; isMobile?: boolean } | null>>
  setCityFilter: (val: string) => void
  filteredCities: string[]
  expandedRow: number | null
  setExpandedRow: React.Dispatch<React.SetStateAction<number | null>>
  orderTypes: Array<{ value: string; label: string }>
}

export function ParcelMobileCards({
  parcels,
  selected,
  toggleSelect,
  toggleAll,
  onDeselectAll,
  updateField,
  deleteParcel,
  addRow,
  activeCityList,
  editingCity,
  setEditingCity,
  setCityFilter,
  filteredCities,
  expandedRow,
  setExpandedRow,
  orderTypes
}: ParcelMobileCardsProps) {
  return (
    <div className="sm:hidden space-y-3">
      {/* Mobile Select All Bar */}
      {parcels.length > 0 && toggleAll && (
        <div className="flex items-center justify-between bg-white dark:bg-[#0c121e] px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-1">
          <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 select-none">
            <input
              type="checkbox"
              ref={el => {
                if (el) {
                  el.indeterminate = selected.size > 0 && selected.size < parcels.length
                }
              }}
              checked={selected.size === parcels.length && parcels.length > 0}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
            />
            <span>Select All ({selected.size}/{parcels.length} selected)</span>
          </label>
          {selected.size > 0 && onDeselectAll && (
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

      {parcels.map((parcel, i) => {
        const isPhoneValid = !parcel.phone || /^03\d{9}$/.test(parcel.phone.replace(/[-+\s]/g, ''))
        const isCityValid = !parcel.city || activeCityList.includes(parcel.city.toUpperCase())
        const isExpanded = expandedRow === i

        return (
          <div
            key={i}
            className={`p-4 rounded-2xl bg-white dark:bg-[#0c121e] border transition-all ${
              selected.has(i)
                ? 'border-emerald-500/50 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {/* Mobile Card Header */}
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleSelect(i)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  #{i + 1}
                </span>
                <input
                  value={parcel.id || ''}
                  onChange={e => updateField(i, 'id', e.target.value)}
                  placeholder="Ref ID"
                  className="w-24 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shadow-xs">
                  Rs. {parcel.total || 0}
                </span>
                <button
                  onClick={() => deleteParcel(i)}
                  title="Delete Row"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer active:scale-95"
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            </div>

            {/* Mobile Input Fields Grid */}
            <div className="space-y-3">
              {/* Row 1: Customer Name & Phone */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Customer Name
                  </label>
                  <input
                    value={parcel.name || ''}
                    onChange={e => updateField(i, 'name', e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={parcel.phone || ''}
                    onChange={e => updateField(i, 'phone', e.target.value)}
                    placeholder="03001234567"
                    className={`w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070b12] border text-xs font-mono font-semibold focus:outline-none ${
                      isPhoneValid
                        ? 'border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100'
                        : 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-600'
                    }`}
                  />
                </div>
              </div>

              {/* Row 2: City & Order Type */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="relative city-autocomplete-container">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    City
                  </label>
                  <input
                    value={parcel.city || ''}
                    onChange={e => {
                      updateField(i, 'city', e.target.value)
                      setCityFilter(e.target.value)
                      setEditingCity({ row: i, isMobile: true })
                    }}
                    onFocus={() => {
                      setCityFilter(parcel.city || '')
                      setEditingCity({ row: i, isMobile: true })
                    }}
                    placeholder="Type City..."
                    className={`w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070b12] border text-xs font-bold focus:outline-none ${
                      isCityValid
                        ? 'border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100'
                        : 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                    }`}
                  />

                  {/* Mobile City Autocomplete Dropdown */}
                  {editingCity?.row === i && editingCity?.isMobile && filteredCities.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      <div className="p-2 bg-slate-50 dark:bg-[#070b12] text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800">
                        <span>Matching Cities ({filteredCities.length})</span>
                        <span className="text-emerald-600 text-[10px] font-medium">Tap to select</span>
                      </div>
                      <div className="p-1">
                        {filteredCities.map(city => (
                          <button
                            key={city}
                            type="button"
                            onMouseDown={e => {
                              e.preventDefault()
                              updateField(i, 'city', city)
                              setEditingCity(null)
                            }}
                            onTouchStart={e => {
                              e.preventDefault()
                              updateField(i, 'city', city)
                              setEditingCity(null)
                            }}
                            className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium cursor-pointer transition-colors flex items-center justify-between ${
                              parcel.city?.toUpperCase() === city
                                ? 'bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <span>{city}</span>
                            {POPULAR_CITIES.includes(city) && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                                Major
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Order Type
                  </label>
                  <select
                    value={parcel.orderType || 'Normal'}
                    onChange={e => updateField(i, 'orderType', e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    {orderTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Full Delivery Address */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Delivery Address
                </label>
                <input
                  value={parcel.address || ''}
                  onChange={e => updateField(i, 'address', e.target.value)}
                  placeholder="House, street, sector, area..."
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Row 4: COD Amount & Items */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    COD Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    value={parcel.total}
                    onChange={e => updateField(i, 'total', Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Items Qty
                  </label>
                  <input
                    type="number"
                    value={parcel.items}
                    onChange={e => updateField(i, 'items', Number(e.target.value))}
                    placeholder="1"
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs text-center font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggle Additional Settings: Weight, Notes, Detail */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setExpandedRow(isExpanded ? null : i)}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{isExpanded ? 'Hide Extra Details ▲' : 'Edit Product & Courier Note ▼'}</span>
                </button>

                {isExpanded && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800 space-y-2.5 animate-in fade-in duration-100">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Product Detail
                      </label>
                      <input
                        value={parcel.detail || ''}
                        onChange={e => updateField(i, 'detail', e.target.value)}
                        placeholder="e.g. Lawn Suit / Shoes"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Delivery Note / Instructions
                      </label>
                      <input
                        value={parcel.note || ''}
                        onChange={e => updateField(i, 'note', e.target.value)}
                        placeholder="e.g. Call before delivery"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={parcel.weight || 0.5}
                          onChange={e => updateField(i, 'weight', parseFloat(e.target.value) || 0.5)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Airway Copies
                        </label>
                        <input
                          type="number"
                          value={parcel.airwayBillCopy || 1}
                          onChange={e => updateField(i, 'airwayBillCopy', parseInt(e.target.value) || 1)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Mobile Big "+ Add New Order Row" Button */}
      <button
        onClick={addRow}
        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition"
      >
        <PlusIcon size={16} /> Add Manual Order Row
      </button>
    </div>
  )
}
