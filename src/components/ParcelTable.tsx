import React, { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { Parcel, Settings } from '../utils/groqParser'
import { CITY_LIST } from '../utils/cityList'
import { PlusIcon, UploadIcon, SyncIcon, TrashIcon, HistoryIcon } from './Icons'
import { useToast } from './common/Toast'

interface ParcelTableProps {
  parcels: Parcel[]
  setParcels: React.Dispatch<React.SetStateAction<Parcel[]>>
  onBookAll: () => void
  onBookSelected: (selected: number[]) => void
  loading: boolean
  settings: Settings
  cities?: string[]
}

export const ORDER_TYPES = [
  { value: 'Normal', label: 'Normal (COD)' },
  { value: 'Reversed', label: 'Reversed (Return Pickup)' },
  { value: 'Replacement', label: 'Replacement (Exchange)' },
  { value: 'Overland', label: 'Overland (Heavy Cargo)' }
]

const POPULAR_CITIES = [
  'LAHORE', 'KARACHI', 'ISLAMABAD', 'RAWALPINDI', 'FAISALABAD',
  'MULTAN', 'PESHAWAR', 'GUJRANWALA', 'SIALKOT', 'QUETTA',
  'HYDERABAD', 'BAHAWALPUR', 'SARGODHA', 'SUKKUR', 'GUJRAT',
  'SHEIKHUPURA', 'JHELUM', 'SAHIWAL', 'KASUR', 'MARDAN', 'WAH CANTT',
  'ATTOCK', 'CHAKWAL', 'OKARA', 'DERA GHAZI KHAN', 'RAHIM YAR KHAN'
]

const CITY_ALIASES: Record<string, string> = {
  lhr: 'LAHORE',
  lah: 'LAHORE',
  khi: 'KARACHI',
  kar: 'KARACHI',
  isb: 'ISLAMABAD',
  isl: 'ISLAMABAD',
  rwp: 'RAWALPINDI',
  pindi: 'RAWALPINDI',
  fsd: 'FAISALABAD',
  fai: 'FAISALABAD',
  mul: 'MULTAN',
  psh: 'PESHAWAR',
  gjw: 'GUJRANWALA',
  guj: 'GUJRANWALA',
  skt: 'SIALKOT',
  qta: 'QUETTA',
  hyd: 'HYDERABAD',
  bwp: 'BAHAWALPUR',
  sgd: 'SARGODHA',
  skr: 'SUKKUR',
  ryk: 'RAHIM YAR KHAN',
  dgk: 'DERA GHAZI KHAN'
}

function getFilteredCities(query: string, allCities: string[]): string[] {
  const uniqueCities = Array.from(new Set(allCities))
  const clean = (query || '').trim().toLowerCase()

  if (!clean) {
    const popularInList = POPULAR_CITIES.filter(c => uniqueCities.includes(c))
    const remainder = uniqueCities.filter(c => !popularInList.includes(c)).slice(0, 10)
    return Array.from(new Set([...popularInList, ...remainder]))
  }

  const results: string[] = []

  // Alias lookup
  const aliasMatch = CITY_ALIASES[clean]
  if (aliasMatch && uniqueCities.includes(aliasMatch)) {
    results.push(aliasMatch)
  }

  // Exact prefix matches first
  const prefixMatches = uniqueCities.filter(c => c.toLowerCase().startsWith(clean))
  prefixMatches.sort((a, b) => a.localeCompare(b))
  for (const c of prefixMatches) {
    if (!results.includes(c)) results.push(c)
  }

  // Substring matches next
  const substringMatches = uniqueCities.filter(
    c => c.toLowerCase().includes(clean) && !c.toLowerCase().startsWith(clean)
  )
  substringMatches.sort((a, b) => a.localeCompare(b))
  for (const c of substringMatches) {
    if (!results.includes(c)) results.push(c)
  }

  return results.slice(0, 25)
}

export default function ParcelTable({
  parcels,
  setParcels,
  onBookAll,
  onBookSelected,
  loading,
  settings,
  cities
}: ParcelTableProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set(parcels.map((_, i) => i)))
  const [cityFilter, setCityFilter] = useState('')
  const [editingCity, setEditingCity] = useState<{ row: number; isMobile?: boolean } | null>(null)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const cityInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const activeCityList = (cities && cities.length > 0) ? cities : CITY_LIST

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

  // Ensure all parcels are selected by default when loaded from localStorage
  useEffect(() => {
    if (parcels.length > 0 && selected.size === 0) {
      setSelected(new Set(parcels.map((_, i) => i)))
    }
  }, [parcels.length])

  function updateField(index: number, field: keyof Parcel, value: string | number) {
    setParcels(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function toggleSelect(index: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === parcels.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(parcels.map((_, i) => i)))
    }
  }

  function deleteParcel(index: number) {
    setParcels(prev => prev.filter((_, i) => i !== index))
    setSelected(prev => {
      const next = new Set<number>()
      prev.forEach(i => {
        if (i < index) next.add(i)
        else if (i > index) next.add(i - 1)
      })
      return next
    })
    toast.info('Row Removed', 'Parcel deleted from staging grid.')
  }

  function clearAll() {
    if (parcels.length === 0) return
    if (window.confirm(`Clear all ${parcels.length} staged parcels from staging grid?`)) {
      setParcels([])
      setSelected(new Set())
      try {
        localStorage.removeItem('zaynah_staged_parcels_guest')
        localStorage.removeItem('staged_parcels_backup')
      } catch (e) {
        // ignore
      }
      toast.info('Grid Cleared', 'All staged parcels have been removed.')
    }
  }

  function addRow() {
    const newParcel: Parcel = {
      id: `tv${Date.now().toString().slice(-6)}`,
      name: '',
      phone: '',
      city: 'Lahore',
      address: '',
      total: 0,
      items: parseInt(settings.default_items) || 1,
      weight: parseFloat(settings.default_weight) || 0.5,
      orderType: 'Normal',
      airwayBillCopy: 1,
      detail: settings.default_product || 'Apparel & Goods',
      note: settings.default_note || 'Call before delivery',
    }
    setParcels(prev => [...prev, newParcel])
    setSelected(prev => new Set([...prev, parcels.length]))
    toast.success('Row Added', 'New order ready for input.')
  }

  function exportExcel() {
    if (parcels.length === 0) return
    const data = parcels.map(p => ({
      'Order Reference Number': p.id,
      'Order Amount': p.total,
      'Order Detail': p.detail,
      'Customer Name': p.name,
      'Customer Phone': p.phone,
      'Order Address': p.address,
      'City': p.city,
      'Items': p.items,
      'Airway Bill Copies': p.airwayBillCopy,
      'Notes': p.note,
      'Order Type (Normal/Reversed/Replacement/Overland)': p.orderType,
      'Booking Weight': p.weight,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Parcels')
    XLSX.writeFile(wb, `PostEx_Parcels_${Date.now()}.xlsx`)
    toast.success('Export Successful', `Exported ${parcels.length} parcels to XLSX.`)
  }

  const filteredCities = getFilteredCities(cityFilter, activeCityList)
  const totalCOD = parcels.reduce((sum, p) => sum + (parseFloat(String(p.total)) || 0), 0)
  const selectedList = Array.from(selected)

  // Validation checks
  const invalidPhonesCount = parcels.filter(
    p => p.phone && !/^03\d{9}$/.test(p.phone.replace(/[-+\s]/g, ''))
  ).length
  const unverifiedCitiesCount = parcels.filter(
    p => p.city && !activeCityList.includes(p.city.toUpperCase())
  ).length

  if (parcels.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-12 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-4">
          <HistoryIcon size={32} />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
          Staging Parcel Grid is Empty
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
          Paste WhatsApp chat orders in the <strong>Paste</strong> tab or manually add a parcel row to start dispatching.
        </p>
        <button
          onClick={addRow}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer active:scale-98"
        >
          <PlusIcon size={16} /> Add Manual Order
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sleek Integrated KPI Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/80 shadow-xs">
        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Staged Parcels
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
              {parcels.length}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ({selected.size} selected)
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total COD Value
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs font-bold text-slate-400">Rs.</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {totalCOD.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Phone Format
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold">
            {invalidPhonesCount === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                100% Valid
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {invalidPhonesCount} Invalid
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            PostEx Coverage
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold">
            {unverifiedCitiesCount === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                All Cities Matched
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {unverifiedCitiesCount} Unverified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Secondary Utilities: Add Row, Export, Clear All */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={addRow}
            className="flex-1 sm:flex-initial h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 whitespace-nowrap"
          >
            <PlusIcon size={14} className="text-emerald-500 shrink-0" />
            <span>Add Row</span>
          </button>

          <button
            onClick={exportExcel}
            className="flex-1 sm:flex-initial h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 whitespace-nowrap"
          >
            <UploadIcon size={14} className="text-emerald-500 shrink-0" />
            <span>Export XLSX</span>
          </button>

          <button
            onClick={clearAll}
            className="h-10 px-3.5 rounded-xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100/80 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 whitespace-nowrap"
            title="Clear all staged rows"
          >
            <TrashIcon size={14} className="shrink-0" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>

        {/* Primary Dispatch Actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {selected.size > 0 && selected.size < parcels.length && (
            <button
              onClick={() => onBookSelected(selectedList)}
              disabled={loading}
              className="flex-1 sm:flex-initial h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 whitespace-nowrap shadow-xs"
            >
              <SyncIcon size={14} className="shrink-0 text-slate-400" />
              <span>Book Selected ({selected.size})</span>
            </button>
          )}

          <button
            onClick={onBookAll}
            disabled={loading || parcels.length === 0}
            className={`${selected.size > 0 && selected.size < parcels.length ? 'flex-1' : 'w-full'} sm:flex-initial h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-tight shadow-sm shadow-emerald-600/20 transition disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer active:scale-98 whitespace-nowrap`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Dispatching...</span>
              </>
            ) : (
              <>
                <span>Book All ({parcels.length}) &rarr;</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Desktop Excel Data Grid */}
      <div className="hidden sm:block rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-xs overflow-hidden">
        {/* Horizontal scroll container with comfortable column widths */}
        <div className="overflow-x-auto min-h-[400px] pb-32">
          <table className="w-full text-xs min-w-[1260px] border-collapse">
            <thead className="bg-slate-50 dark:bg-[#070b12] border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
              <tr>
                <th className="w-12 px-3 py-3 text-center border-r border-slate-200/80 dark:border-slate-800">
                  <input
                    type="checkbox"
                    checked={selected.size === parcels.length && parcels.length > 0}
                    onChange={toggleAll}
                    className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="w-12 px-2 py-3 text-center font-mono border-r border-slate-200/80 dark:border-slate-800">#</th>
                <th className="w-32 min-w-[120px] px-3 py-3 text-left border-r border-slate-200/80 dark:border-slate-800">Ref ID</th>
                <th className="w-44 min-w-[170px] px-3 py-3 text-left border-r border-slate-200/80 dark:border-slate-800">Customer</th>
                <th className="w-36 min-w-[140px] px-3 py-3 text-left border-r border-slate-200/80 dark:border-slate-800">Phone</th>
                <th className="w-44 min-w-[170px] px-3 py-3 text-left border-r border-slate-200/80 dark:border-slate-800">City</th>
                <th className="min-w-[280px] px-3 py-3 text-left border-r border-slate-200/80 dark:border-slate-800">Delivery Address</th>
                <th className="w-32 min-w-[120px] px-3 py-3 text-right border-r border-slate-200/80 dark:border-slate-800">COD (Rs.)</th>
                <th className="w-20 min-w-[80px] px-3 py-3 text-center border-r border-slate-200/80 dark:border-slate-800">Items</th>
                <th className="w-36 min-w-[140px] px-3 py-3 text-center border-r border-slate-200/80 dark:border-slate-800">Order Type</th>
                <th className="w-16 min-w-[64px] px-3 py-3 text-center">Action</th>
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
                    <td className="w-12 px-3 py-2 text-center border-r border-b border-slate-200/80 dark:border-slate-800">
                      <input
                        type="checkbox"
                        checked={selected.has(i)}
                        onChange={() => toggleSelect(i)}
                        className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Row Index */}
                    <td className="w-12 px-2 py-2 text-center text-slate-400 font-mono text-[11px] border-r border-b border-slate-200/80 dark:border-slate-800">
                      {i + 1}
                    </td>

                    {/* Ref ID (Flush Excel Cell) */}
                    <td className="w-32 min-w-[120px] p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono">
                      <input
                        value={parcel.id || ''}
                        onChange={e => updateField(i, 'id', e.target.value)}
                        className="w-full h-10 px-3 py-2 bg-transparent text-xs font-mono text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                      />
                    </td>

                    {/* Customer Name */}
                    <td className="w-44 min-w-[170px] p-0 border-r border-b border-slate-200/80 dark:border-slate-800">
                      <input
                        value={parcel.name || ''}
                        onChange={e => updateField(i, 'name', e.target.value)}
                        placeholder="Recipient Name"
                        className="w-full h-10 px-3 py-2 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                      />
                    </td>

                    {/* Phone Number */}
                    <td className="w-36 min-w-[140px] p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono">
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
                    <td className="w-44 min-w-[170px] p-0 border-r border-b border-slate-200/80 dark:border-slate-800 relative city-autocomplete-container">
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
                    <td className="min-w-[280px] p-0 border-r border-b border-slate-200/80 dark:border-slate-800">
                      <input
                        value={parcel.address || ''}
                        onChange={e => updateField(i, 'address', e.target.value)}
                        placeholder="House, street, area..."
                        className="w-full h-10 px-3 py-2 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                      />
                    </td>

                    {/* COD Amount (Right Aligned Font Mono) */}
                    <td className="w-32 min-w-[120px] p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono">
                      <input
                        type="number"
                        value={parcel.total}
                        onChange={e => updateField(i, 'total', Number(e.target.value))}
                        className="w-full h-10 px-3 py-2 bg-transparent text-xs font-mono font-bold text-right text-emerald-600 dark:text-emerald-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                      />
                    </td>

                    {/* Items Count (Centered) */}
                    <td className="w-20 min-w-[80px] p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono">
                      <input
                        type="number"
                        value={parcel.items}
                        onChange={e => updateField(i, 'items', Number(e.target.value))}
                        className="w-full h-10 px-2 py-2 bg-transparent text-xs font-mono text-center text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                      />
                    </td>

                    {/* Order Type (All 4 PostEx V3 Types) */}
                    <td className="w-36 min-w-[140px] p-0 border-r border-b border-slate-200/80 dark:border-slate-800">
                      <select
                        value={parcel.orderType || 'Normal'}
                        onChange={e => updateField(i, 'orderType', e.target.value)}
                        className="w-full h-10 px-2.5 py-2 bg-transparent text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset cursor-pointer"
                      >
                        {ORDER_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Action (Centered, never clipped) */}
                    <td className="w-16 min-w-[64px] p-0 border-b border-slate-200/80 dark:border-slate-800 text-center">
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

      {/* Mobile Screen Full Editing Cards (RULE M1: Handheld First) */}
      <div className="sm:hidden space-y-4">
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
                      {ORDER_TYPES.map(t => (
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
    </div>
  )
}
