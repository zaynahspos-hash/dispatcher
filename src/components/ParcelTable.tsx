import React, { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { Parcel, Settings } from '../utils/groqParser'
import { CITY_LIST } from '../utils/cityList'
import { PlusIcon, HistoryIcon } from './Icons'
import { useToast } from './common/Toast'
import { getFilteredCities } from './parcel/cityAutocomplete'
import { ParcelKPIBar } from './parcel/ParcelKPIBar'
import { ParcelDesktopGrid } from './parcel/ParcelDesktopGrid'
import { ParcelMobileCards } from './parcel/ParcelMobileCards'

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
      } catch (err) {
        console.warn('[ParcelTable::clearAll] Failed to clear local cache:', err)
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
      {/* 1. KPI Summary Bar & Dispatch Action Toolbar */}
      <ParcelKPIBar
        totalParcels={parcels.length}
        selectedCount={selected.size}
        totalCOD={totalCOD}
        invalidPhonesCount={invalidPhonesCount}
        unverifiedCitiesCount={unverifiedCitiesCount}
        onAddRow={addRow}
        onExportExcel={exportExcel}
        onClearAll={clearAll}
        onBookSelected={() => onBookSelected(selectedList)}
        onBookAll={onBookAll}
        loading={loading}
      />

      {/* 2. Desktop Excel Spreadsheet Grid */}
      <ParcelDesktopGrid
        parcels={parcels}
        selected={selected}
        toggleSelect={toggleSelect}
        toggleAll={toggleAll}
        updateField={updateField}
        deleteParcel={deleteParcel}
        activeCityList={activeCityList}
        editingCity={editingCity}
        setEditingCity={setEditingCity}
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        filteredCities={filteredCities}
        cityInputRef={cityInputRef}
        orderTypes={ORDER_TYPES}
      />

      {/* 3. Mobile Handheld Editing Cards (RULE M1) */}
      <ParcelMobileCards
        parcels={parcels}
        selected={selected}
        toggleSelect={toggleSelect}
        updateField={updateField}
        deleteParcel={deleteParcel}
        addRow={addRow}
        activeCityList={activeCityList}
        editingCity={editingCity}
        setEditingCity={setEditingCity}
        setCityFilter={setCityFilter}
        filteredCities={filteredCities}
        expandedRow={expandedRow}
        setExpandedRow={setExpandedRow}
        orderTypes={ORDER_TYPES}
      />
    </div>
  )
}
