import React, { useRef, useEffect } from 'react'
import { Parcel } from '../../utils/groqParser'
import { TrashIcon, RefreshIcon } from '../Icons'
import { useResizableColumns, measureMaxContentLengths } from '../../hooks/useResizableColumns'
import { CityDropdownMenu } from './CityDropdownMenu'
import { LogisticsDefaultsCells } from '../common/LogisticsDefaultsCells'

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
  conflictedIndices?: Set<number>
  conflictReasons?: Map<number, 'already_in_db' | 'duplicate_in_table'>
  onResolveSingleRow?: (index: number) => void
  expandDefaults?: boolean
  autoExpandLines?: boolean
}

const DEFAULT_PARCEL_WIDTHS = {
  checkbox: 38, index: 34, refId: 110, customer: 145, phone: 125, city: 120,
  address: 240, cod: 100, items: 50, orderType: 155, weight: 75, detail: 150,
  note: 160, copies: 75, action: 44
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
  orderTypes,
  conflictedIndices,
  conflictReasons,
  onResolveSingleRow,
  expandDefaults,
  autoExpandLines = false
}: ParcelDesktopGridProps) {
  const { widths, getResizerProps } = useResizableColumns({
    storageKey: 'parcel_desktop_grid_col_widths',
    defaultWidths: DEFAULT_PARCEL_WIDTHS,
    minWidths: {
      checkbox: 28, index: 28, refId: 50, customer: 40, phone: 40, city: 40, address: 40,
      cod: 40, items: 36, orderType: 40, weight: 36, detail: 40, note: 40, copies: 36, action: 36
    },
    onMeasureCol: (colKey) => {
      const lengths = measureMaxContentLengths({ [colKey]: colKey }, parcels, {
        refId: p => p.id || '',
        customer: p => p.name,
        phone: p => p.phone, city: p => p.city,
        address: p => p.address, cod: p => `Rs. ${p.total || 0}`,
        items: p => String(p.items || 1), orderType: () => 'Normal (COD)    ',
        weight: p => `${p.weight || 0.5} kg`, detail: p => p.detail,
        note: p => p.note, copies: () => 'COPIES  '
      })
      return lengths[colKey] || 12
    }
  })

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // Listen for autofit event to smoothly reset horizontal scroll position so first columns are visible
  useEffect(() => {
    const handleAutoFitResetScroll = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' })
      }
    }
    window.addEventListener('autofit_parcel_desktop_grid_col_widths', handleAutoFitResetScroll)
    return () => {
      window.removeEventListener('autofit_parcel_desktop_grid_col_widths', handleAutoFitResetScroll)
    }
  }, [])

  // Whenever expandDefaults changes, smoothly scroll back to left so Ref ID and Customer are never hidden
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }, [expandDefaults])

  // Calculate table width strictly for ACTIVE / RENDERED columns only (never inflate with hidden default columns)
  const activeColKeys = [
    'checkbox', 'index', 'refId', 'customer', 'phone', 'city', 'address', 'cod', 'items', 'orderType',
    ...(expandDefaults ? ['weight', 'detail', 'note', 'copies'] : []),
    'action'
  ]
  const totalTableWidth = activeColKeys.reduce(
    (sum, key) => sum + (widths[key] || DEFAULT_PARCEL_WIDTHS[key as keyof typeof DEFAULT_PARCEL_WIDTHS] || 100),
    0
  )

  return (
    <div className="hidden lg:block rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-xs overflow-hidden w-full max-w-full min-w-0">
      {/* Horizontal scroll container with interactive Excel resizable column widths */}
      <div ref={scrollContainerRef} className="overflow-x-auto min-h-[400px] pb-32 max-w-full min-w-0">
        <table className="text-xs border-collapse table-fixed select-none w-full" style={{ minWidth: `${totalTableWidth}px` }}>
          <colgroup>
            <col style={{ width: `${widths.checkbox || DEFAULT_PARCEL_WIDTHS.checkbox}px` }} />
            <col style={{ width: `${widths.index || DEFAULT_PARCEL_WIDTHS.index}px` }} />
            <col style={{ width: `${widths.refId || DEFAULT_PARCEL_WIDTHS.refId}px` }} />
            <col style={{ width: `${widths.customer || DEFAULT_PARCEL_WIDTHS.customer}px` }} />
            <col style={{ width: `${widths.phone || DEFAULT_PARCEL_WIDTHS.phone}px` }} />
            <col style={{ width: `${widths.city || DEFAULT_PARCEL_WIDTHS.city}px` }} />
            <col style={{ width: `${widths.address || DEFAULT_PARCEL_WIDTHS.address}px` }} />
            <col style={{ width: `${widths.cod || DEFAULT_PARCEL_WIDTHS.cod}px` }} />
            <col style={{ width: `${widths.items || DEFAULT_PARCEL_WIDTHS.items}px` }} />
            <col style={{ width: `${widths.orderType || DEFAULT_PARCEL_WIDTHS.orderType}px` }} />
            {expandDefaults && (
              <>
                <col style={{ width: `${widths.weight || DEFAULT_PARCEL_WIDTHS.weight}px` }} />
                <col style={{ width: `${widths.detail || DEFAULT_PARCEL_WIDTHS.detail}px` }} />
                <col style={{ width: `${widths.note || DEFAULT_PARCEL_WIDTHS.note}px` }} />
                <col style={{ width: `${widths.copies || DEFAULT_PARCEL_WIDTHS.copies}px` }} />
              </>
            )}
            <col style={{ width: `${widths.action || DEFAULT_PARCEL_WIDTHS.action}px` }} />
          </colgroup>
          <thead className="bg-slate-50 dark:bg-[#070b12] border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
            <tr>
              <th className="p-3 text-center border-r border-slate-200/80 dark:border-slate-800 relative">
                <input
                  type="checkbox"
                  ref={el => {
                    if (el) {
                      el.indeterminate = selected.size > 0 && selected.size < parcels.length
                    }
                  }}
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
              <th className="p-3 text-left border-r border-slate-200/80 dark:border-slate-800 relative">
                Order Type
                <div {...getResizerProps('orderType')} />
              </th>
              {expandDefaults && (
                <>
                  <th className="p-3 text-center border-r border-slate-200/80 dark:border-slate-800 relative">
                    Weight (KG)
                    <div {...getResizerProps('weight')} />
                  </th>
                  <th className="p-3 text-left border-r border-slate-200/80 dark:border-slate-800 relative">
                    Product / Detail
                    <div {...getResizerProps('detail')} />
                  </th>
                  <th className="p-3 text-left border-r border-slate-200/80 dark:border-slate-800 relative">
                    Note / Instructions
                    <div {...getResizerProps('note')} />
                  </th>
                  <th className="p-3 text-center border-r border-slate-200/80 dark:border-slate-800 relative">
                    Copies
                    <div {...getResizerProps('copies')} />
                  </th>
                </>
              )}
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
            {parcels.map((parcel, i) => {
              const isPhoneValid = !parcel.phone || /^03\d{9}$/.test(parcel.phone.replace(/[-+\s]/g, ''))
              const isCityValid = !parcel.city || activeCityList.includes(parcel.city.toUpperCase())

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
                  <td className={`p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono overflow-hidden min-w-[180px] ${
                    conflictedIndices?.has(i)
                      ? 'bg-amber-500/10'
                      : parcel.isDefaultId
                      ? 'bg-amber-500/5 dark:bg-amber-950/15'
                      : ''
                  }`}>
                    <div className="flex items-center min-h-[40px] px-2 gap-1.5 min-w-0">
                      <input
                        value={parcel.id || ''}
                        onChange={e => updateField(i, 'id', e.target.value)}
                        placeholder="Ref ID"
                        className={`flex-1 min-w-[70px] h-full py-2 bg-transparent text-xs font-mono focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset rounded ${
                          conflictedIndices?.has(i)
                            ? 'text-amber-800 dark:text-amber-300 font-bold'
                            : parcel.isDefaultId
                            ? 'text-amber-500 dark:text-amber-400 placeholder:text-amber-500 dark:placeholder:text-amber-400 font-bold'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                        title={
                          conflictedIndices?.has(i)
                            ? (conflictReasons?.get(i) === 'already_in_db'
                                ? 'Serial already booked in database! Click button to assign next available serial.'
                                : 'Duplicate serial in current table! Click button to assign next available serial.')
                            : parcel.isDefaultId
                            ? 'Auto-generated serial (default fallback)'
                            : ''
                        }
                      />
                      {conflictedIndices?.has(i) && onResolveSingleRow && (
                        <button
                          type="button"
                          onClick={() => onResolveSingleRow(i)}
                          title={`${conflictReasons?.get(i) === 'already_in_db' ? 'Already in DB' : 'Duplicate ID'} — Click to assign next available serial`}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-amber-500 hover:bg-amber-600 text-slate-950 font-sans font-bold flex items-center gap-1 transition cursor-pointer shrink-0 whitespace-nowrap shadow-2xs active:scale-95"
                        >
                          <RefreshIcon size={10} className="shrink-0" />
                          <span className="shrink-0">{conflictReasons?.get(i) === 'already_in_db' ? 'In DB' : 'Dup'}</span>
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Customer Name (Single-line flush Excel input) */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 overflow-hidden min-w-0">
                    <input
                      value={parcel.name || ''}
                      onChange={e => updateField(i, 'name', e.target.value)}
                      placeholder="Recipient Name"
                      className="w-full min-w-0 h-10 px-3 py-2 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                    />
                  </td>

                  {/* Phone Number */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono overflow-hidden min-w-0">
                    <input
                      value={parcel.phone || ''}
                      onChange={e => updateField(i, 'phone', e.target.value)}
                      placeholder="03001234567"
                      className={`w-full min-w-0 h-10 px-3 py-2 bg-transparent text-xs font-mono focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-inset ${
                        isPhoneValid
                          ? 'text-slate-800 dark:text-slate-100 focus:ring-emerald-500'
                          : 'bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 focus:ring-rose-500'
                      }`}
                    />
                  </td>

                  {/* City (with live search dropdown) */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 relative city-autocomplete-container overflow-hidden min-w-0">
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
                      className={`w-full min-w-0 h-10 px-3 py-2 bg-transparent text-xs font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-inset ${
                        isCityValid
                          ? 'text-slate-800 dark:text-slate-100 focus:ring-emerald-500'
                          : 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 focus:ring-amber-500'
                      }`}
                    />

                    {/* City Dropdown Menu (Always opens downwards with clear visibility) */}
                    {editingCity?.row === i && !editingCity?.isMobile && (
                      <CityDropdownMenu
                        filteredCities={filteredCities}
                        selectedCity={parcel.city}
                        onSelectCity={city => {
                          updateField(i, 'city', city)
                          setEditingCity(null)
                        }}
                      />
                    )}
                  </td>

                  {/* Address (Single-line flush Excel input) */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 overflow-hidden min-w-0">
                    <input
                      value={parcel.address || ''}
                      onChange={e => updateField(i, 'address', e.target.value)}
                      placeholder="House, street, area..."
                      className={`w-full min-w-0 ${autoExpandLines ? 'h-12' : 'h-10'} px-3 py-2 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset`}
                    />
                  </td>

                  {/* COD Amount (Right Aligned Font Mono) - Yellow/Amber for 0 COD, Green for > 0 */}
                  <td className={`p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono overflow-hidden min-w-0 ${
                    Number(parcel.total || 0) === 0 ? 'bg-amber-500/5 dark:bg-amber-950/15' : ''
                  }`}>
                    <input
                      type="number"
                      value={parcel.total === 0 ? '' : parcel.total}
                      onChange={e => updateField(i, 'total', e.target.value === '' ? 0 : Number(e.target.value))}
                      onFocus={e => e.target.select()}
                      placeholder="0"
                      className={`w-full min-w-0 h-10 px-3 py-2 bg-transparent text-xs font-mono font-bold text-right focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset ${
                        Number(parcel.total || 0) === 0
                          ? 'text-amber-500 dark:text-amber-400 placeholder:text-amber-500 dark:placeholder:text-amber-400 font-black'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    />
                  </td>

                  {/* Items Count (Centered) */}
                  <td className={`p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono ${
                    parcel.isDefaultItems ? 'bg-amber-500/5 dark:bg-amber-950/15' : ''
                  }`}>
                    <input
                      type="number"
                      min="1"
                      value={!parcel.items || parcel.items === 0 ? '' : parcel.items}
                      onChange={e => updateField(i, 'items', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                      onFocus={e => e.target.select()}
                      placeholder="1"
                      title={parcel.isDefaultItems ? 'Default item count (fallback)' : ''}
                      className={`w-full h-10 px-2 py-2 bg-transparent text-xs font-mono text-center focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset ${
                        parcel.isDefaultItems
                          ? 'text-amber-500 dark:text-amber-400 placeholder:text-amber-500 dark:placeholder:text-amber-400 font-bold'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    />
                  </td>

                  {/* Order Type - Yellow text for anything other than Normal */}
                  <td className={`p-0 border-r border-b border-slate-200/80 dark:border-slate-800 ${
                    (parcel.orderType && parcel.orderType !== 'Normal') ? 'bg-amber-500/10 dark:bg-amber-950/25' : ''
                  }`}>
                    <select
                      value={parcel.orderType || 'Normal'}
                      onChange={e => updateField(i, 'orderType', e.target.value)}
                      className={`w-full h-10 px-3 py-2 bg-transparent text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset cursor-pointer ${
                        (parcel.orderType && parcel.orderType !== 'Normal')
                          ? 'text-amber-600 dark:text-amber-400 font-black'
                          : 'font-medium text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {orderTypes.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </td>

                  {/* Defaults Expanded Logistics Columns */}
                  {expandDefaults && (
                    <LogisticsDefaultsCells
                      weight={parcel.weight}
                      detail={parcel.detail}
                      note={parcel.note}
                      copies={parcel.airwayBillCopy}
                      onUpdate={(field, val) => updateField(i, field, val)}
                    />
                  )}

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
