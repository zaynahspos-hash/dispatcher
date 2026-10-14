import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Parcel, Settings } from '../utils/groqParser'
import { CITY_LIST } from '../utils/cityList'
import { PlusIcon, UploadIcon, SyncIcon, TrashIcon, HistoryIcon } from './Icons'

interface ParcelTableProps {
  parcels: Parcel[]
  setParcels: React.Dispatch<React.SetStateAction<Parcel[]>>
  onBookAll: () => void
  onBookSelected: (selected: number[]) => void
  loading: boolean
  settings: Settings
  cities?: string[]
}

const ORDER_TYPES = ['Normal', 'Replacement', 'Overland', 'Reversed']

export default function ParcelTable({ parcels, setParcels, onBookAll, onBookSelected, loading, settings, cities }: ParcelTableProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set(parcels.map((_, i) => i)))
  const [cityFilter, setCityFilter] = useState('')
  const [editingCity, setEditingCity] = useState<{ row: number } | null>(null)
  const cityInputRef = useRef<HTMLInputElement>(null)

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
  }

  function addRow() {
    const newParcel: Parcel = {
      id: `tv${Date.now()}`,
      name: '',
      phone: '',
      city: 'Lahore',
      address: '',
      total: 0,
      items: parseInt(settings.default_items) || 1,
      weight: parseFloat(settings.default_weight) || 0.5,
      orderType: 'Normal',
      airwayBillCopy: 1,
      detail: settings.default_product || 'Kids Clothes',
      note: settings.default_note || 'Call before delivery',
    }
    setParcels(prev => [...prev, newParcel])
    setSelected(prev => new Set([...prev, parcels.length]))
  }

  function exportExcel() {
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
      'Address Code': '',
      'Return Address Code': '',
      'Order Type (Normal/Reversed/Replacement/Overland)': p.orderType,
      'Booking Weight': p.weight,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Parcels')
    XLSX.writeFile(wb, `postex-parcels-${Date.now()}.xlsx`)
  }

  const activeCityList = (cities && cities.length > 0) ? cities : CITY_LIST
  const cleanFilter = cityFilter.trim().toLowerCase()
  const filteredCities = activeCityList.filter(c =>
    c.toLowerCase().includes(cleanFilter)
  ).slice(0, 15)

  const totalCOD = parcels.reduce((sum, p) => sum + (parseFloat(String(p.total)) || 0), 0)
  const selectedList = Array.from(selected)

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (parcels.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <div className="flex justify-center mb-3">
          <HistoryIcon size={48} className="text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-base font-semibold mb-1">Koi parcel nahi abhi</p>
        <p className="text-sm mb-5">Paste tab mein orders paste karo ya naya row add karo.</p>
        <button
          onClick={addRow}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-[#ffffff] font-bold rounded-xl shadow-md transition cursor-pointer"
        >
          <PlusIcon size={16} /> Add Row
        </button>
      </div>
    )
  }

  return (
    <div className="transition-colors duration-200">
      {/* ── Summary + Action Bar ────────────────────────────────────────── */}
      <div className="mb-4 space-y-3">
        {/* Stats row */}
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            {parcels.length} Parcels
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full font-medium">
            COD: <strong>Rs. {totalCOD.toLocaleString()}</strong>
          </span>
          <span className="text-xs bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full text-blue-700 dark:text-blue-300 font-semibold">
            {selected.size} selected
          </span>
        </div>

        {/* Action buttons — 2×2 grid on mobile, row on desktop */}
        <div className="grid grid-cols-2 sm:flex gap-2">
          <button
            onClick={addRow}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer"
          >
            <PlusIcon size={15} /> Add Row
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer"
          >
            <UploadIcon size={15} /> Export
          </button>
          <button
            onClick={() => onBookSelected(selectedList)}
            disabled={loading || selected.size === 0}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-blue-300 dark:border-blue-700 rounded-xl text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <SyncIcon size={15} /> Book ({selected.size})
          </button>
          <button
            onClick={onBookAll}
            disabled={loading || parcels.length === 0}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-600 dark:bg-green-600 hover:bg-green-700 dark:hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-[#ffffff] font-bold rounded-xl transition cursor-pointer col-span-2 sm:col-span-1"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Booking...
              </>
            ) : (
              <>
                <SyncIcon size={15} /> Book All ({parcels.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── MOBILE CARD VIEW (hidden on sm+) ───────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {/* Select All toggle */}
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none mb-1">
          <input
            type="checkbox"
            checked={selected.size === parcels.length && parcels.length > 0}
            onChange={toggleAll}
            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 w-4 h-4"
          />
          Select All
        </label>

        {parcels.map((parcel, i) => (
          <div
            key={i}
            className={`rounded-2xl border transition overflow-hidden ${
              selected.has(i)
                ? 'border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900'
            }`}
          >
            {/* Card header: checkbox + name + delete */}
            <div className="flex items-center gap-2 px-3 pt-3 pb-2">
              <input
                type="checkbox"
                checked={selected.has(i)}
                onChange={() => toggleSelect(i)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 w-4 h-4 shrink-0"
              />
              <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-5 shrink-0">#{i+1}</span>
              <input
                value={parcel.name || ''}
                onChange={e => updateField(i, 'name', e.target.value)}
                placeholder="Customer Name *"
                className="flex-1 min-w-0 font-bold text-sm text-slate-800 dark:text-gray-100 bg-transparent border-b border-slate-200 dark:border-gray-700 focus:outline-none focus:border-blue-400 py-0.5 placeholder-gray-400"
              />
              <button
                onClick={() => deleteParcel(i)}
                className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg p-1.5 transition cursor-pointer shrink-0"
              >
                <TrashIcon size={15} />
              </button>
            </div>

            {/* Card body: 2-col grid of fields */}
            <div className="px-3 pb-3 grid grid-cols-2 gap-x-3 gap-y-2">

              {/* Phone */}
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Phone</label>
                <input
                  value={parcel.phone || ''}
                  onChange={e => updateField(i, 'phone', e.target.value)}
                  placeholder="03XXXXXXXXX"
                  className={`w-full border rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 mt-0.5 ${
                    parcel.phone && !/^03\d{9}$/.test(parcel.phone)
                      ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/30'
                      : 'border-slate-200 dark:border-gray-700'
                  }`}
                />
              </div>

              {/* COD */}
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">COD (Rs.)</label>
                <input
                  type="number"
                  value={parcel.total ?? ''}
                  onChange={e => updateField(i, 'total', e.target.value)}
                  placeholder="0"
                  className="w-full border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 mt-0.5 text-right"
                />
              </div>

              {/* City */}
              <div className="col-span-1 relative">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">City</label>
                <input
                  ref={editingCity?.row === i ? cityInputRef : undefined}
                  value={parcel.city || ''}
                  onChange={e => {
                    updateField(i, 'city', e.target.value)
                    setCityFilter(e.target.value)
                    setEditingCity({ row: i })
                  }}
                  onFocus={() => {
                    setCityFilter(parcel.city || '')
                    setEditingCity({ row: i })
                  }}
                  onBlur={() => setTimeout(() => setEditingCity(null), 250)}
                  className={`w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 mt-0.5 ${
                    parcel.city && !activeCityList.includes(parcel.city.toUpperCase())
                      ? 'border-amber-300 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/30'
                      : 'border-slate-200 dark:border-gray-700'
                  }`}
                />
                {editingCity?.row === i && filteredCities.length > 0 && (
                  <div className="absolute z-30 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl max-h-44 overflow-y-auto">
                    {filteredCities.map(city => (
                      <button
                        key={city}
                        onMouseDown={() => {
                          updateField(i, 'city', city)
                          setEditingCity(null)
                        }}
className="block w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-800 dark:text-gray-100 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Items</label>
                <input
                  type="number"
                  value={parcel.items ?? ''}
                  placeholder={settings.default_items || '1'}
                  onChange={e => updateField(i, 'items', e.target.value)}
                  className="w-full border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 mt-0.5 text-center"
                />
              </div>

              {/* Address — full width */}
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Address</label>
                <input
                  value={parcel.address || ''}
                  onChange={e => updateField(i, 'address', e.target.value)}
                  placeholder="Full delivery address"
                  className="w-full border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 mt-0.5"
                />
              </div>

              {/* Weight + Order Type */}
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={parcel.weight ?? ''}
                  onChange={e => updateField(i, 'weight', e.target.value)}
                  className="w-full border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 mt-0.5 text-center"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Type</label>
                <select
                  value={parcel.orderType || 'Normal'}
                  onChange={e => updateField(i, 'orderType', e.target.value)}
                  className="w-full border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 mt-0.5"
                >
                  {ORDER_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Note */}
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Note</label>
                <input
                  value={parcel.note || ''}
                  onChange={e => updateField(i, 'note', e.target.value)}
                  placeholder="Delivery instructions..."
                  className="w-full border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 mt-0.5"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP TABLE VIEW (hidden on mobile) ──────────────────────── */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900 min-h-[350px]">
        <table className="w-full text-sm min-w-[1200px]">
          <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-700">
            <tr>
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selected.size === parcels.length && parcels.length > 0}
                  onChange={toggleAll}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                />
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase">#</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase">Ref ID</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase">Name</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase">Phone</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase">City</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase min-w-[250px]">Address</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase">COD (Rs.)</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase" title={`Default: ${settings.default_items || '1'} pcs`}>Items</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase">Wt(kg)</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase">Type</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase">Detail</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase">Note</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {parcels.map((parcel, i) => (
              <tr key={i} className={`hover:bg-slate-50/70 dark:hover:bg-gray-800/50 transition ${selected.has(i) ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`}>
                <td className="px-3 py-2">
                  <input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)} className="rounded border-gray-300 dark:border-gray-600 text-blue-600" />
                </td>
                <td className="px-3 py-2 text-gray-400 dark:text-gray-500 text-xs font-mono">{i + 1}</td>
                <td className="px-3 py-2">
                  <input value={parcel.id || ''} onChange={e => updateField(i, 'id', e.target.value)} className="border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs w-20 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100" />
                </td>
                <td className="px-3 py-2">
                  <input value={parcel.name || ''} onChange={e => updateField(i, 'name', e.target.value)} className="border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100" />
                </td>
                <td className="px-3 py-2">
                  <input value={parcel.phone || ''} onChange={e => updateField(i, 'phone', e.target.value)} className={`border rounded-lg px-2 py-1.5 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 ${parcel.phone && !/^03\d{9}$/.test(parcel.phone) ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/30' : 'border-slate-200 dark:border-gray-700'}`} />
                </td>
                <td className="px-3 py-2 relative">
                  <input
                    ref={editingCity?.row === i ? cityInputRef : undefined}
                    value={parcel.city || ''}
                    onChange={e => { updateField(i, 'city', e.target.value); setCityFilter(e.target.value); setEditingCity({ row: i }) }}
                    onFocus={() => { setCityFilter(parcel.city || ''); setEditingCity({ row: i }) }}
                    onBlur={() => setTimeout(() => setEditingCity(null), 250)}
                    className={`border rounded-lg px-2 py-1.5 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 ${parcel.city && !activeCityList.includes(parcel.city.toUpperCase()) ? 'border-amber-300 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'border-slate-200 dark:border-gray-700'}`}
                  />
                  {editingCity?.row === i && filteredCities.length > 0 && (
                    <div className={`absolute z-30 ${i >= parcels.length - 2 && i > 0 ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-lg w-52 max-h-48 overflow-y-auto`}>
                      {filteredCities.map(city => (
                        <button key={city} onMouseDown={() => { updateField(i, 'city', city); setEditingCity(null) }} className="block w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-800 dark:text-gray-100 hover:text-blue-700 dark:hover:text-blue-300">{city}</button>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <input value={parcel.address || ''} onChange={e => updateField(i, 'address', e.target.value)} className="border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs w-64 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100" />
                </td>
                <td className="px-3 py-2">
                  <input type="number" value={parcel.total ?? ''} onChange={e => updateField(i, 'total', e.target.value)} className="border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs w-20 focus:outline-none focus:ring-1 focus:ring-blue-400 text-right bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100" />
                </td>
                <td className="px-3 py-2">
                  <input type="number" value={parcel.items ?? ''} placeholder={settings.default_items || '1'} onChange={e => updateField(i, 'items', e.target.value)} className="border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs w-14 focus:outline-none focus:ring-1 focus:ring-blue-400 text-center bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100" />
                </td>
                <td className="px-3 py-2">
                  <input type="number" step="0.1" value={parcel.weight ?? ''} onChange={e => updateField(i, 'weight', e.target.value)} className="border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs w-16 focus:outline-none focus:ring-1 focus:ring-blue-400 text-center bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100" />
                </td>
                <td className="px-3 py-2">
                  <select value={parcel.orderType || 'Normal'} onChange={e => updateField(i, 'orderType', e.target.value)} className="border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100">
                    {ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input value={parcel.detail || ''} onChange={e => updateField(i, 'detail', e.target.value)} className="border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100" />
                </td>
                <td className="px-3 py-2">
                  <input value={parcel.note || ''} onChange={e => updateField(i, 'note', e.target.value)} className="border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs w-36 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100" />
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => deleteParcel(i)} className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg p-1 transition cursor-pointer flex items-center justify-center" title="Delete parcel">
                    <TrashIcon size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      {parcels.length > 0 && (
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block shrink-0"></span>
            <span>Red = invalid phone format</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shrink-0"></span>
            <span>Yellow = city not in PostEx list</span>
          </span>
        </div>
      )}
    </div>
  )
}
