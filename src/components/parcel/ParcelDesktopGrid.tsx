import React from 'react'
import { Parcel } from '../../utils/groqParser'
import { TrashIcon } from '../Icons'
import { POPULAR_CITIES } from './cityAutocomplete'
import { useResizableColumns } from '../../hooks/useResizableColumns'

interface ParcelDesktopGridProps {
  parcels: Parcel[]
  selected: Set<number>
  toggleSelect: (index: number) => void
  toggleAll: () => void
  updateField: (index: number, field: keyof Parcel, value: string | number) => void
  deleteParcel: (index: number) => void
  activeCityList: string[]
  editingCity: { row: number; isMobile?: boolean } | null
  setEditingCity: React.Dispatch<React.SetStateAction<{ row: number; isMobile?: boolean } | null>>
  cityFilter: string
  setCityFilter: (val: string) => void
  filteredCities: string[]
  cityInputRef: React.RefObject<HTMLInputElement | null>
  orderTypes: Array<{ value: string; label: string }>
}

const DEFAULT_PARCEL_WIDTHS = {
  checkbox: 44,
  index: 40,
  refId: 112,
  customer: 160,
  phone: 130,
  city: 144,
  address: 300,
  cod: 112,
  items: 64,
  orderType: 120,
  action: 48
}

export function ParcelDesktopGrid({
  parcels,
  selected,
  toggleSelect,
  toggleAll,
  updateField,
  deleteParcel,
  activeCityList,
  editingCity,
  setEditingCity,
  setCityFilter,
  filteredCities,
  cityInputRef,
  orderTypes
}: ParcelDesktopGridProps) {
  const { widths, getResizerProps } = useResizableColumns({
    storageKey: 'parcel_desktop_grid_col_widths',
    defaultWidths: DEFAULT_PARCEL_WIDTHS,
    minWidths: {
      checkbox: 36,
      index: 36,
      refId: 70,
      customer: 90,
      phone: 90,
      city: 80,
      address: 120,
      cod: 80,
      items: 50,
      orderType: 80,
      action: 40
    }
  })

  return (
    <div className="hidden sm:block rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-xs overflow-hidden">
      {/* Horizontal scroll container with interactive Excel resizable column widths */}
      <div className="overflow-x-auto min-h-[400px] pb-32">
        <table className="text-xs border-collapse table-fixed select-none" style={{ minWidth: Object.values(widths).reduce((a, b) => a + b, 0) }}>
          <colgroup><col style={{ width: `${widths.checkbox}px` }} /><col style={{ width: `${widths.index}px` }} /><col style={{ width: `${widths.refId}px` }} /><col style={{ width: `${widths.customer}px` }} /><col style={{ width: `${widths.phone}px` }} /><col style={{ width: `${widths.city}px` }} /><col style={{ width: `${widths.address}px` }} /><col style={{ width: `${widths.cod}px` }} /><col style={{ width: `${widths.items}px` }} /><col style={{ width: `${widths.orderType}px` }} /><col style={{ width: `${widths.action}px` }} /></colgroup>
          <thead className="bg-slate-50 dark:bg-[#070b12] border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
            <tr>
              <th className="p-3 text-center border-r border-slate-200/80 dark:border-slate-800 relative">
                <input
                  type="checkbox"
                  checked={selected.size === parcels.length && parcels.length > 0}
                  onChange={toggleAll}
                  className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                />
                <div {...getResizerProps('checkbox')} />
              </th>
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
                Items
                <div {...getResizerProps('items')} />
              </th>
              <th className="p-3 text-center border-r border-slate-200/80 dark:border-slate-800 relative">
                Order Type
                <div {...getResizerProps('orderType')} />
              </th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
            {parcels.map((parcel, i) => {
              const isPhoneValid = !parcel.phone || /^03\d{9}$/.test(parcel.phone.replace(/[-+\s]/g, ''))
              const isCityValid = !parcel.city || activeCityList.includes(parcel.city.toUpperCase())
              const isNearBottom = parcels.length > 2 && i >= parcels.length - 2

              return (
                <tr
                  key={i}
                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors ${
                    selected.has(i) ? 'bg-emerald-500/5 dark:bg-emerald-500/5' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="p-2 text-center border-r border-b border-slate-200/80 dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => toggleSelect(i)}
                      className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                    />
                  </td>

                  {/* Row Index */}
                  <td className="p-2 text-center text-slate-400 font-mono text-[11px] border-r border-b border-slate-200/80 dark:border-slate-800">
                    {i + 1}
                  </td>

                  {/* Ref ID (Flush Excel Cell) */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono">
                    <input
                      value={parcel.id || ''}
                      onChange={e => updateField(i, 'id', e.target.value)}
                      className="w-full h-10 px-3 py-2 bg-transparent text-xs font-mono text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                    />
                  </td>

                  {/* Customer Name */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800">
                    <input
                      value={parcel.name || ''}
                      onChange={e => updateField(i, 'name', e.target.value)}
                      placeholder="Recipient Name"
                      className="w-full h-10 px-3 py-2 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                    />
                  </td>

                  {/* Phone Number */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono">
                    <input
                      value={parcel.phone || ''}
                      onChange={e => updateField(i, 'phone', e.target.value)}
                      placeholder="03001234567"
                      className={`w-full h-10 px-3 py-2 bg-transparent text-xs font-mono focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-inset ${
                        isPhoneValid
                          ? 'text-slate-800 dark:text-slate-100 focus:ring-emerald-500'
                          : 'bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 focus:ring-rose-500'
                      }`}
                    />
                  </td>

                  {/* City (with live search dropdown) */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 relative city-autocomplete-container">
                    <input
                      ref={editingCity?.row === i && !editingCity?.isMobile ? cityInputRef : undefined}
                      value={parcel.city || ''}
                      onChange={e => {
                        updateField(i, 'city', e.target.value)
                        setCityFilter(e.target.value)
                        setEditingCity({ row: i, isMobile: false })
                      }}
                      onFocus={() => {
                        setCityFilter(parcel.city || '')
                        setEditingCity({ row: i, isMobile: false })
                      }}
                      placeholder="Type City..."
                      className={`w-full h-10 px-3 py-2 bg-transparent text-xs font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-inset ${
                        isCityValid
                          ? 'text-slate-800 dark:text-slate-100 focus:ring-emerald-500'
                          : 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 focus:ring-amber-500'
                      }`}
                    />

                    {/* City Dropdown Menu */}
                    {editingCity?.row === i && !editingCity?.isMobile && filteredCities.length > 0 && (
                      <div
                        className={`absolute z-50 left-0 right-0 min-w-[240px] bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in duration-100 ${
                          isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                        }`}
                      >
                        <div className="p-2 bg-slate-50 dark:bg-[#070b12] text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800">
                          <span>Matching Cities ({filteredCities.length})</span>
                          <span className="text-emerald-600 dark:text-emerald-400 text-[9px] font-medium">Select</span>
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
                              className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                                parcel.city?.toUpperCase() === city
                                  ? 'bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <span>{city}</span>
                              {POPULAR_CITIES.includes(city) && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 font-medium">
                                  Major
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Address */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800">
                    <input
                      value={parcel.address || ''}
                      onChange={e => updateField(i, 'address', e.target.value)}
                      placeholder="House, street, area..."
                      className="w-full h-10 px-3 py-2 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                    />
                  </td>

                  {/* COD Amount (Right Aligned Font Mono) */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono">
                    <input
                      type="number"
                      value={parcel.total}
                      onChange={e => updateField(i, 'total', Number(e.target.value))}
                      className="w-full h-10 px-3 py-2 bg-transparent text-xs font-mono font-bold text-right text-emerald-600 dark:text-emerald-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                    />
                  </td>

                  {/* Items Count (Centered) */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono">
                    <input
                      type="number"
                      value={parcel.items}
                      onChange={e => updateField(i, 'items', Number(e.target.value))}
                      className="w-full h-10 px-2 py-2 bg-transparent text-xs font-mono text-center text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                    />
                  </td>

                  {/* Order Type */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800">
                    <select
                      value={parcel.orderType || 'Normal'}
                      onChange={e => updateField(i, 'orderType', e.target.value)}
                      className="w-full h-10 px-2.5 py-2 bg-transparent text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset cursor-pointer"
                    >
                      {orderTypes.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </td>

                  {/* Action */}
                  <td className="p-0 border-b border-slate-200/80 dark:border-slate-800 text-center">
                    <button
                      onClick={() => deleteParcel(i)}
                      title="Delete Row"
                      className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer inline-flex items-center justify-center"
                    >
                      <TrashIcon size={14} />
                    </button>
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
