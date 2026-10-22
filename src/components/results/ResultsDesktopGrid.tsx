import { useState, useRef, useEffect } from 'react'
import { BookingResult } from '../BookingResults'
import { TrashIcon, CancelIcon, CheckIcon, TruckIcon } from '../Icons'
import { WhatsAppActionButton } from '../common/WhatsAppActionButton'
import { useResizableColumns, measureMaxContentLengths } from '../../hooks/useResizableColumns'
import { LogisticsDefaultsCells } from '../common/LogisticsDefaultsCells'
import { CityDropdownMenu } from '../parcel/CityDropdownMenu'
import { getFilteredCities } from '../parcel/cityAutocomplete'
import { CITY_LIST } from '../../utils/cityList'

interface ResultsDesktopGridProps {
  results: BookingResult[]
  selected?: Set<string>
  toggleSelect?: (id: string) => void
  toggleAll?: () => void
  updateField: (id: string, field: keyof BookingResult, value: string | number) => void
  onDelete: (id: string) => void
  onBookSingle: (result: BookingResult) => Promise<void>
  onCancelShipment?: (tracking: string) => Promise<void>
  cancellingTracking: string[]
  getWhatsAppLink: (parcel: BookingResult) => string
  cities: string[]
  orderTypes: Array<{ value: string; label: string }>
  expandDefaults?: boolean
  isWhatsAppSent?: (key?: string | null) => boolean
  onMarkWhatsAppSent?: (tracking?: string | null, id?: string | null) => void
  onToggleWhatsAppSent?: (key?: string | null) => void
}

const DEFAULT_RESULTS_WIDTHS = {
  checkbox: 38, index: 34, refId: 110, customer: 145, phone: 125, city: 120, address: 240,
  cod: 100, items: 50, orderType: 155, weight: 75, detail: 150, note: 160, copies: 75, statusTracking: 185, actions: 115
}

export function ResultsDesktopGrid({
  results, selected, toggleSelect, toggleAll, updateField, onDelete,
  onBookSingle, onCancelShipment, cancellingTracking, getWhatsAppLink,
  cities, orderTypes, expandDefaults, isWhatsAppSent, onMarkWhatsAppSent, onToggleWhatsAppSent
}: ResultsDesktopGridProps) {
  const [cityFilter, setCityFilter] = useState('')
  const [editingCity, setEditingCity] = useState<{ id: string } | null>(null)
  const cityInputRef = useRef<HTMLInputElement>(null)
  const activeCityList = (cities && cities.length > 0) ? cities : CITY_LIST
  const filteredCities = getFilteredCities(cityFilter, activeCityList)

  // Handle outside clicks to close city autocomplete cleanly without race conditions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (editingCity !== null) {
        const target = e.target as HTMLElement
        if (!target.closest('.city-autocomplete-container')) {
          setEditingCity(null)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [editingCity])
  const { widths, getResizerProps } = useResizableColumns({
    storageKey: 'results_desktop_grid_col_widths',
    defaultWidths: DEFAULT_RESULTS_WIDTHS,
    minWidths: {
      checkbox: 28, index: 28, refId: 40, customer: 40, phone: 40, city: 40, address: 40,
      cod: 40, items: 36, orderType: 40, weight: 36, detail: 40, note: 40, copies: 36, statusTracking: 50, actions: 50
    },
    onMeasureCol: (colKey) => {
      const lengths = measureMaxContentLengths({ [colKey]: colKey }, results, {
        refId: r => r.id, customer: r => r.name, phone: r => r.phone,
        city: r => r.city, address: r => r.address, cod: r => `Rs. ${r.total || 0}`,
        items: r => String(r.items || 1),
        orderType: () => 'Normal (COD)    ', weight: r => `${r.weight || 0.5} kg`,
        detail: r => r.detail, note: r => r.note,
        copies: () => 'COPIES  ', statusTracking: r => `${r.tracking || '2226280000000'}     `
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
    window.addEventListener('autofit_results_desktop_grid_col_widths', handleAutoFitResetScroll)
    return () => {
      window.removeEventListener('autofit_results_desktop_grid_col_widths', handleAutoFitResetScroll)
    }
  }, [])

  // Whenever expandDefaults changes, smoothly scroll back to left so Ref ID and Customer are never hidden
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }, [expandDefaults])

  // Calculate table width strictly for ACTIVE / RENDERED columns only (never inflate with hidden default columns)
  const activeColWidths = [
    widths.checkbox || DEFAULT_RESULTS_WIDTHS.checkbox,
    widths.index || DEFAULT_RESULTS_WIDTHS.index,
    widths.refId || DEFAULT_RESULTS_WIDTHS.refId,
    widths.customer || DEFAULT_RESULTS_WIDTHS.customer,
    widths.phone || DEFAULT_RESULTS_WIDTHS.phone,
    widths.city || DEFAULT_RESULTS_WIDTHS.city,
    widths.address || DEFAULT_RESULTS_WIDTHS.address,
    widths.cod || DEFAULT_RESULTS_WIDTHS.cod,
    widths.items || DEFAULT_RESULTS_WIDTHS.items,
    widths.orderType || DEFAULT_RESULTS_WIDTHS.orderType,
    ...(expandDefaults ? [
      widths.weight || DEFAULT_RESULTS_WIDTHS.weight,
      widths.detail || DEFAULT_RESULTS_WIDTHS.detail,
      widths.note || DEFAULT_RESULTS_WIDTHS.note,
      widths.copies || DEFAULT_RESULTS_WIDTHS.copies
    ] : []),
    widths.statusTracking || DEFAULT_RESULTS_WIDTHS.statusTracking,
    widths.actions || DEFAULT_RESULTS_WIDTHS.actions
  ]
  const totalTableWidth = activeColWidths.reduce((sum, w) => sum + (w || 100), 0)

  return (
    <div className="hidden lg:block rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-xs overflow-hidden w-full max-w-full min-w-0">
      <div ref={scrollContainerRef} className="overflow-x-auto min-h-[380px] pb-24 max-w-full min-w-0">
        <table
          className="text-xs border-collapse table-fixed select-none w-full"
          style={{ minWidth: `${totalTableWidth}px` }}
        >
          <colgroup>
            <col style={{ width: `${widths.checkbox || DEFAULT_RESULTS_WIDTHS.checkbox}px` }} />
            <col style={{ width: `${widths.index || DEFAULT_RESULTS_WIDTHS.index}px` }} />
            <col style={{ width: `${widths.refId || DEFAULT_RESULTS_WIDTHS.refId}px` }} />
            <col style={{ width: `${widths.customer || DEFAULT_RESULTS_WIDTHS.customer}px` }} />
            <col style={{ width: `${widths.phone || DEFAULT_RESULTS_WIDTHS.phone}px` }} />
            <col style={{ width: `${widths.city || DEFAULT_RESULTS_WIDTHS.city}px` }} />
            <col style={{ width: `${widths.address || DEFAULT_RESULTS_WIDTHS.address}px` }} />
            <col style={{ width: `${widths.cod || DEFAULT_RESULTS_WIDTHS.cod}px` }} />
            <col style={{ width: `${widths.items || DEFAULT_RESULTS_WIDTHS.items}px` }} />
            <col style={{ width: `${widths.orderType || DEFAULT_RESULTS_WIDTHS.orderType}px` }} />
            {expandDefaults && (
              <>
                <col style={{ width: `${widths.weight || DEFAULT_RESULTS_WIDTHS.weight}px` }} />
                <col style={{ width: `${widths.detail || DEFAULT_RESULTS_WIDTHS.detail}px` }} />
                <col style={{ width: `${widths.note || DEFAULT_RESULTS_WIDTHS.note}px` }} />
                <col style={{ width: `${widths.copies || DEFAULT_RESULTS_WIDTHS.copies}px` }} />
              </>
            )}
            <col style={{ width: `${widths.statusTracking || DEFAULT_RESULTS_WIDTHS.statusTracking}px` }} />
            <col style={{ width: `${widths.actions || DEFAULT_RESULTS_WIDTHS.actions}px` }} />
          </colgroup>
          <thead className="bg-slate-50 dark:bg-[#070b12] border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
            <tr>
              <th className="p-3 text-center border-r border-slate-200/80 dark:border-slate-800 relative">
                {selected && toggleAll && (
                  <input
                    type="checkbox"
                    ref={el => {
                      if (el) {
                        el.indeterminate = selected.size > 0 && selected.size < results.length
                      }
                    }}
                    checked={selected.size === results.length && results.length > 0}
                    onChange={toggleAll}
                    className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                )}
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
              const isChecked = selected ? selected.has(r.id) : false
              const isSent = isWhatsAppSent ? (isWhatsAppSent(r.tracking) || isWhatsAppSent(r.id)) : false
              const cleanPhone = (r.phone || '').replace(/[-+\s]/g, '')
              const isPhoneEmpty = !r.phone || r.phone.trim() === ''
              const isPhoneDummy = r.phone?.trim() === '03001234567' || cleanPhone === '03001234567'
              const isPhoneWarning = isPhoneEmpty || isPhoneDummy
              const isPhoneValid = !r.phone || /^03\d{9}$/.test(cleanPhone)
              const isCityValid = !r.city || activeCityList.includes(r.city.toUpperCase())

              return (
                <tr
                  key={r.id || i}
                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors ${
                    isChecked ? 'bg-emerald-500/[0.04]' : isBooked ? 'bg-emerald-500/[0.02]' : isError ? 'bg-rose-500/[0.03]' : ''
                  } ${editingCity?.id === r.id && !isBooked ? 'relative z-40' : ''}`}
                >
                  {/* Row Checkbox */}
                  <td className="p-3 text-center border-r border-b border-slate-200/80 dark:border-slate-800">
                    {toggleSelect && (
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(r.id)}
                        className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                      />
                    )}
                  </td>

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

                  {/* Phone (with validation highlights matching Parcels tab) */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono">
                    <input
                      value={r.phone || ''}
                      disabled={isBooked}
                      onChange={e => updateField(r.id, 'phone', e.target.value)}
                      placeholder="03001234567"
                      className={`w-full h-10 px-3 py-2 bg-transparent text-xs font-mono focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-inset disabled:opacity-75 ${
                        !isBooked && isPhoneWarning
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 focus:ring-amber-500 placeholder:text-amber-500/70'
                          : !isBooked && !isPhoneValid
                          ? 'bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 focus:ring-rose-500'
                          : 'text-slate-800 dark:text-slate-100 focus:ring-emerald-500'
                      }`}
                    />
                  </td>

                  {/* City (with live searchable dropdown matching Parcels tab) */}
                  <td className={`p-0 border-r border-b border-slate-200/80 dark:border-slate-800 relative city-autocomplete-container min-w-0 ${
                    editingCity?.id === r.id && !isBooked ? 'overflow-visible z-50' : 'overflow-hidden'
                  }`}>
                    <input
                      ref={editingCity?.id === r.id ? cityInputRef : undefined}
                      value={r.city || ''}
                      disabled={isBooked}
                      onChange={e => {
                        updateField(r.id, 'city', e.target.value)
                        setCityFilter(e.target.value)
                        setEditingCity({ id: r.id })
                      }}
                      onFocus={() => {
                        if (!isBooked) {
                          setCityFilter(r.city || '')
                          setEditingCity({ id: r.id })
                        }
                      }}
                      placeholder="Type City..."
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={editingCity?.id === r.id && !isBooked}
                      data-lpignore="true"
                      data-form-type="other"
                      name={`city_results_dropdown_${r.id || i}`}
                      className={`w-full min-w-0 h-10 px-3 py-2 bg-transparent text-xs font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-inset disabled:opacity-75 ${
                        !isBooked && !isCityValid
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 focus:ring-amber-500'
                          : 'text-slate-800 dark:text-slate-100 focus:ring-emerald-500'
                      }`}
                    />

                    {/* City Dropdown Menu (Always opens downwards with clear visibility) */}
                    {editingCity?.id === r.id && !isBooked && (
                      <CityDropdownMenu
                        filteredCities={filteredCities}
                        isNearBottom={i >= results.length - 2 && results.length > 3}
                        selectedCity={r.city}
                        onSelectCity={city => {
                          updateField(r.id, 'city', city)
                          setEditingCity(null)
                        }}
                      />
                    )}
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

                  {/* COD Amount (Right Aligned Font Mono) - Yellow/Amber for 0 COD, Green for > 0 */}
                  <td className={`p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono overflow-hidden min-w-0 ${
                    Number(r.total || 0) === 0 ? 'bg-amber-500/5 dark:bg-amber-950/15' : ''
                  }`}>
                    <input
                      type="number"
                      value={r.total === 0 ? '' : r.total}
                      disabled={isBooked}
                      onChange={e => updateField(r.id, 'total', e.target.value === '' ? 0 : Number(e.target.value))}
                      onFocus={e => e.target.select()}
                      placeholder="0"
                      className={`w-full min-w-0 h-10 px-3 py-2 bg-transparent text-xs font-mono font-bold text-right focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75 ${
                        Number(r.total || 0) === 0
                          ? 'text-amber-500 dark:text-amber-400 placeholder:text-amber-500 dark:placeholder:text-amber-400 font-black'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    />
                  </td>

                  {/* Items Count (Centered) */}
                  <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono">
                    <input
                      type="number"
                      min="1"
                      disabled={isBooked}
                      value={!r.items || r.items === 0 ? '' : r.items}
                      onChange={e => updateField(r.id, 'items', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                      onFocus={e => e.target.select()}
                      placeholder="1"
                      className="w-full h-10 px-2 py-2 bg-transparent text-xs font-mono text-center text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75"
                    />
                  </td>

                  {/* Order Type - Yellow text for anything other than Normal */}
                  <td className={`p-0 border-r border-b border-slate-200/80 dark:border-slate-800 overflow-hidden min-w-0 ${
                    (r.orderType && r.orderType !== 'Normal') ? 'bg-amber-500/10 dark:bg-amber-950/25' : ''
                  }`}>
                    <select
                      value={r.orderType || 'Normal'}
                      disabled={isBooked}
                      onChange={e => updateField(r.id, 'orderType', e.target.value)}
                      className={`w-full h-10 px-3 py-2 bg-transparent text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75 cursor-pointer ${
                        (r.orderType && r.orderType !== 'Normal')
                          ? 'text-amber-600 dark:text-amber-400 font-black'
                          : 'font-medium text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {orderTypes.map(ot => (
                        <option key={ot.value} value={ot.value}>
                          {ot.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Defaults Expanded Logistics Columns */}
                  {expandDefaults && (
                    <LogisticsDefaultsCells
                      disabled={isBooked}
                      weight={r.weight}
                      detail={r.detail}
                      note={r.note}
                      copies={r.airwayBillCopy}
                      onUpdate={(field, val) => updateField(r.id, field, val)}
                    />
                  )}

                  {/* Status & Tracking */}
                  <td className="p-2 border-r border-b border-slate-200/80 dark:border-slate-800 text-center">
                    {isBooked && r.tracking ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <a
                          href={`https://postex.pk/tracking?cn=${r.tracking}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-all hover:scale-102 cursor-pointer"
                          title={`Track ${r.tracking} on PostEx`}
                        >
                          <CheckIcon size={11} />
                          <span>{r.tracking}</span>
                        </a>
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
                      <WhatsAppActionButton
                        isSent={isSent}
                        href={getWhatsAppLink(r)}
                        onClick={e => {
                          if (e.altKey) {
                            e.preventDefault()
                            onToggleWhatsAppSent?.(r.tracking || r.id)
                          } else {
                            onMarkWhatsAppSent?.(r.tracking, r.id)
                          }
                        }}
                        title={isSent ? 'WhatsApp Sent • Click to Re-send (Alt+Click to unmark)' : 'Send WhatsApp Order Update (Pending)'}
                      />

                      {/* Book Single if not booked */}
                      {!isBooked && (
                        <button
                          type="button"
                          onClick={() => onBookSingle(r)}
                          className="w-7.5 h-7.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition shadow-2xs border border-emerald-600 active:scale-95 cursor-pointer"
                          title="Book order with PostEx"
                          aria-label="Book order"
                        >
                          <TruckIcon size={14} className="text-white" />
                        </button>
                      )}

                      {/* Cancel Booking if booked */}
                      {isBooked && r.tracking && onCancelShipment && (
                        <button
                          type="button"
                          onClick={() => { if (confirm(`Cancel booking for ${r.name} (${r.tracking})?`)) onCancelShipment(r.tracking || '') }}
                          disabled={cancellingTracking.includes(r.tracking || '')}
                          className="w-7.5 h-7.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 transition shadow-2xs disabled:opacity-50 active:scale-95"
                          title="Cancel Shipment"
                        >
                          <CancelIcon size={12} />
                        </button>
                      )}

                      {/* Delete Row */}
                      <button
                        type="button"
                        onClick={() => onDelete(r.id)}
                        className="w-7.5 h-7.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 flex items-center justify-center transition shadow-2xs active:scale-95"
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
