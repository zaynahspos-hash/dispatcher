import React, { useState, useEffect } from 'react'
import { Parcel } from '../../utils/groqParser'
import { PlusIcon, TrashIcon, RefreshIcon } from '../Icons'
import { MobileCityDropdown } from './MobileCityDropdown'
import { ParcelExtraDetails } from './ParcelExtraDetails'

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
  conflictedIndices?: Set<number>
  conflictReasons?: Map<number, 'already_in_db' | 'duplicate_in_table'>
  onResolveSingleRow?: (index: number) => void
  expandDefaults?: boolean
  autoExpandLines?: boolean
}

export function ParcelMobileCards({
  parcels,
  selected,
  toggleSelect,
  toggleAll,
  onDeselectAll: _onDeselectAll,
  updateField,
  deleteParcel,
  addRow,
  activeCityList,
  editingCity,
  setEditingCity,
  setCityFilter,
  filteredCities,
  expandedRow: _expandedRow,
  setExpandedRow: _setExpandedRow,
  orderTypes,
  conflictedIndices,
  conflictReasons,
  onResolveSingleRow,
  expandDefaults,
  autoExpandLines = false
}: ParcelMobileCardsProps) {
  // Local card expansion overrides so individual card toggles work reliably
  const [cardOverrides, setCardOverrides] = useState<Record<number, boolean>>({})
  const [extraDetailsOpen, setExtraDetailsOpen] = useState<Record<number, boolean>>({})

  // When bulk expand/collapse is triggered via top toolbar, reset individual card overrides so ALL cards follow the bulk state
  useEffect(() => {
    setCardOverrides({})
  }, [autoExpandLines, expandDefaults])

  useEffect(() => {
    setExtraDetailsOpen({})
  }, [expandDefaults])

  const handleToggleCard = (idx: number) => {
    setCardOverrides(prev => {
      const current = prev[idx] !== undefined ? prev[idx] : (!!autoExpandLines || !!expandDefaults)
      return { ...prev, [idx]: !current }
    })
  }

  const toggleExtraDetails = (idx: number) => {
    setExtraDetailsOpen(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  return (
    <div className="lg:hidden space-y-3 w-full max-w-full min-w-0">
      {/* Mobile Select All Bar (Matches Results tab, shows only when none selected) */}
      {parcels.length > 0 && toggleAll && selected.size === 0 && (
        <div className="flex items-center justify-between bg-white dark:bg-[#0c121e] px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-1">
          <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={false}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
            />
            <span>Select All ({parcels.length})</span>
          </label>
        </div>
      )}

      {parcels.map((parcel, i) => {
        const isPhoneValid = !parcel.phone || /^03\d{9}$/.test(parcel.phone.replace(/[-+\s]/g, ''))
        const isCityValid = !parcel.city || activeCityList.includes(parcel.city.toUpperCase())
        const isExpanded = cardOverrides[i] !== undefined ? cardOverrides[i] : (!!autoExpandLines || !!expandDefaults)
        const isExtraOpen = extraDetailsOpen[i] !== undefined ? extraDetailsOpen[i] : !!expandDefaults

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
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100 dark:border-slate-800/80 gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleSelect(i)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer shrink-0"
                />
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                  #{i + 1}
                </span>
                <div className="flex items-center gap-1 min-w-0 flex-1 max-w-[170px]">
                  <input
                    value={parcel.id || ''}
                    onChange={e => updateField(i, 'id', e.target.value)}
                    placeholder="Ref ID"
                    className={`w-full min-w-[65px] px-2 py-1 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 ${
                      conflictedIndices?.has(i)
                        ? 'bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 focus:ring-amber-500'
                        : parcel.isDefaultId
                        ? 'bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/30 text-amber-500 dark:text-amber-400 placeholder:text-amber-500 dark:placeholder:text-amber-400 focus:ring-amber-500'
                        : 'bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:ring-emerald-500'
                    }`}
                  />
                  {conflictedIndices?.has(i) && onResolveSingleRow && (
                    <button
                      type="button"
                      onClick={() => onResolveSingleRow(i)}
                      title={`${conflictReasons?.get(i) === 'already_in_db' ? 'Already in DB' : 'Duplicate'} - Click to assign next available serial`}
                      className="h-6 px-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] flex items-center gap-0.5 active:scale-95 cursor-pointer shrink-0 whitespace-nowrap shadow-2xs"
                    >
                      <RefreshIcon size={9} />
                      <span>Next</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg border shadow-xs whitespace-nowrap shrink-0 ${
                  Number(parcel.total || 0) === 0
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
                }`}>
                  Rs. {Number(parcel.total || 0).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => deleteParcel(i)}
                  title="Delete Row"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer active:scale-95 shrink-0"
                >
                  <TrashIcon size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleCard(i)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer active:scale-95 shrink-0"
                  title={isExpanded ? 'Collapse card' : 'Expand card'}
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Collapsed State Summary Line */}
            {!isExpanded && (
              <div
                onClick={() => handleToggleCard(i)}
                className="flex items-center justify-between text-xs pt-0.5 cursor-pointer hover:opacity-80 transition"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {parcel.name || 'Unnamed Recipient'}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-[11px] text-slate-500">{parcel.phone || 'No phone'}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {parcel.city || 'No City'}
                  </span>
                  {parcel.orderType && parcel.orderType !== 'Normal' && (
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0">
                      {parcel.orderType}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0 ml-2">
                  Edit &rarr;
                </span>
              </div>
            )}

            {/* Mobile Input Fields Grid (Visible when isExpanded) */}
            {isExpanded && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-100">
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
                    <MobileCityDropdown
                      currentCity={parcel.city}
                      filteredCities={filteredCities}
                      onSelectCity={city => {
                        updateField(i, 'city', city)
                        setEditingCity(null)
                      }}
                    />
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Order Type
                  </label>
                  <select
                    value={parcel.orderType || 'Normal'}
                    onChange={e => updateField(i, 'orderType', e.target.value)}
                    className={`w-full px-2.5 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                      (parcel.orderType && parcel.orderType !== 'Normal')
                        ? 'text-amber-600 dark:text-amber-400 font-bold border-amber-300 dark:border-amber-700 bg-amber-500/10'
                        : 'text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-[#070b12] border-slate-200 dark:border-slate-800'
                    }`}
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
                {autoExpandLines ? (
                  <textarea
                    rows={Math.min(5, Math.max(2, Math.ceil((parcel.address || '').length / 28)))}
                    value={parcel.address || ''}
                    onChange={e => updateField(i, 'address', e.target.value)}
                    placeholder="House, street, sector, area..."
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed break-words"
                  />
                ) : (
                  <input
                    value={parcel.address || ''}
                    onChange={e => updateField(i, 'address', e.target.value)}
                    placeholder="House, street, sector, area..."
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                )}
              </div>

              {/* Row 4: COD Amount & Items */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    COD Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    value={parcel.total === 0 ? '' : parcel.total}
                    onChange={e => updateField(i, 'total', e.target.value === '' ? 0 : Number(e.target.value))}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    className={`w-full px-2.5 py-2 rounded-xl border text-xs font-mono font-black focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      Number(parcel.total || 0) === 0
                        ? 'text-amber-500 dark:text-amber-400 border-amber-300 dark:border-amber-700/80 bg-amber-500/5 placeholder:text-amber-500 dark:placeholder:text-amber-400 font-black'
                        : 'text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-[#070b12] border-slate-200 dark:border-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Items Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={!parcel.items || parcel.items === 0 ? '' : parcel.items}
                    onChange={e => updateField(i, 'items', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                    onFocus={e => e.target.select()}
                    placeholder="1"
                    className={`w-full px-2.5 py-2 rounded-xl border text-xs text-center font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      parcel.isDefaultItems
                        ? 'text-amber-500 dark:text-amber-400 border-amber-300 dark:border-amber-700/80 bg-amber-500/5 placeholder:text-amber-500 dark:placeholder:text-amber-400'
                        : 'text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-[#070b12] border-slate-200 dark:border-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Toggle Additional Settings: Weight, Notes, Detail */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => toggleExtraDetails(i)}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{isExtraOpen ? 'Hide Extra Details' : 'Edit Product & Courier Note'}</span>
                </button>

                {isExtraOpen && (
                  <ParcelExtraDetails
                    index={i}
                    parcel={parcel}
                    updateField={updateField}
                  />
                )}
              </div>
            </div>
            )}
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
