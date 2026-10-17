import React, { useState, useRef, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { Parcel, Settings } from '../utils/groqParser'
import { BookedParcel } from './history/types'
import { CITY_LIST } from '../utils/cityList'
import { PlusIcon, HistoryIcon } from './Icons'
import { useToast } from './common/Toast'
import { getFilteredCities } from './parcel/cityAutocomplete'
import { ParcelKPIBar } from './parcel/ParcelKPIBar'
import { ParcelDesktopGrid } from './parcel/ParcelDesktopGrid'
import { ParcelMobileCards } from './parcel/ParcelMobileCards'
import { measureMaxContentLengths, triggerTableAutoFit, triggerTableReset } from '../hooks/useResizableColumns'
import {
  buildHistoryIdSet,
  detectSerialConflicts,
  resolveAllSerialConflicts,
  getNextAvailableSerial,
  cleanSerialId
} from '../utils/orderSerialHelper'

interface ParcelTableProps {
  parcels: Parcel[]
  setParcels: React.Dispatch<React.SetStateAction<Parcel[]>>
  onBookAll: () => void
  onBookSelected: (selected: number[]) => void
  loading: boolean
  settings: Settings
  cities?: string[]
  updateSetting?: (key: keyof Settings | Partial<Settings>, value?: string) => void
  history?: BookedParcel[]
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
  cities,
  updateSetting,
  history
}: ParcelTableProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set(parcels.map((_, i) => i)))
  const [cityFilter, setCityFilter] = useState('')
  const [editingCity, setEditingCity] = useState<{ row: number; isMobile?: boolean } | null>(null)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [expandDefaults, setExpandDefaults] = useState<boolean>(() => {
    return localStorage.getItem('zaynah_table_expand_defaults') === 'true'
  })
  const [autoExpandLines, setAutoExpandLines] = useState<boolean>(() => {
    return localStorage.getItem('zaynah_table_auto_expand_lines') === 'true'
  })
  const cityInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const handleToggleExpandDefaults = () => {
    setExpandDefaults(prev => {
      const next = !prev
      localStorage.setItem('zaynah_table_expand_defaults', String(next))
      return next
    })
  }

  const handleToggleAutoExpandLines = () => {
    setAutoExpandLines(prev => {
      const next = !prev
      localStorage.setItem('zaynah_table_auto_expand_lines', String(next))
      return next
    })
  }

  const historyIds = useMemo(() => buildHistoryIdSet(history), [history])
  const conflictInfo = useMemo(() => detectSerialConflicts(parcels, historyIds), [parcels, historyIds])

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
    const prefix = settings.order_id_prefix !== undefined ? settings.order_id_prefix : 'tv-'
    let nextNum = parseInt(settings.order_id_next_num || '1001', 10)
    if (isNaN(nextNum)) nextNum = 1001

    const used = new Set<string>(historyIds)
    parcels.forEach(p => {
      if (p.id) used.add(cleanSerialId(p.id))
    })

    const next = getNextAvailableSerial(prefix, nextNum, used)

    const newParcel: Parcel = {
      id: next.nextId,
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
    if (updateSetting) {
      updateSetting('order_id_next_num', String(next.nextNum))
    }
    toast.success('Row Added', `New order ready with ID: ${next.nextId}`)
  }

  function handleResolveSingleRow(index: number) {
    const prefix = settings.order_id_prefix !== undefined ? settings.order_id_prefix : 'tv-'
    let nextNum = parseInt(settings.order_id_next_num || '1001', 10) || 1001

    const used = new Set<string>(historyIds)
    parcels.forEach((p, i) => {
      if (i !== index && p.id) used.add(cleanSerialId(p.id))
    })

    const next = getNextAvailableSerial(prefix, nextNum, used)
    updateField(index, 'id', next.nextId)
    if (updateSetting) {
      updateSetting('order_id_next_num', String(next.nextNum))
    }
    toast.success('Serial Reassigned', `Row #${index + 1} updated to available ID: ${next.nextId}`)
  }

  function handleResolveAllConflicts() {
    const prefix = settings.order_id_prefix !== undefined ? settings.order_id_prefix : 'tv-'
    let nextNum = parseInt(settings.order_id_next_num || '1001', 10) || 1001

    const res = resolveAllSerialConflicts(parcels, historyIds, prefix, nextNum)
    setParcels(res.updatedParcels)
    if (updateSetting && res.nextNum !== nextNum) {
      updateSetting('order_id_next_num', String(res.nextNum))
    }
    toast.success('Serials Auto-Assigned', `${res.resolvedCount} duplicate/DB ID(s) resolved to clean sequential serials!`)
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

  const handleAutoFitColumns = (e?: React.MouseEvent) => {
    if (e?.altKey) {
      triggerTableReset('parcel_desktop_grid_col_widths')
      setAutoExpandLines(false)
      localStorage.setItem('zaynah_table_auto_expand_lines', 'false')
      toast.info('Column Widths Reset', 'Reset column widths to default.')
      return
    }
    const lengths = measureMaxContentLengths(
      {
        refId: 'REF ID', customer: 'CUSTOMER', phone: 'PHONE', city: 'CITY',
        address: 'DELIVERY ADDRESS', cod: 'COD (RS.)', items: 'ITEMS',
        orderType: 'ORDER TYPE', weight: 'WEIGHT (KG)', detail: 'PRODUCT / DETAIL',
        note: 'TRANSACTION NOTE', copies: 'COPIES'
      },
      parcels,
      {
        refId: p => p.id,
        customer: p => p.name,
        phone: p => p.phone,
        city: p => p.city,
        address: p => p.address,
        cod: p => `Rs. ${p.total || 0}`,
        items: p => String(p.items || 1),
        orderType: p => p.orderType || 'Normal',
        weight: p => `${p.weight || 0.5} kg`,
        detail: p => p.detail,
        note: p => p.note,
        copies: p => String(p.airwayBillCopy || 1)
      }
    )
    triggerTableAutoFit('parcel_desktop_grid_col_widths', lengths)
    toast.success('Auto-Fitted & Expanded', 'Fitted columns and expanded all rows to maximum text.')
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
        duplicateSerialsCount={conflictInfo.totalConflicts}
        onResolveDuplicates={handleResolveAllConflicts}
        expandDefaults={expandDefaults}
        onToggleExpandDefaults={handleToggleExpandDefaults}
        onAutoFitColumns={handleAutoFitColumns}
        autoExpandLines={autoExpandLines}
        onToggleAutoExpandLines={handleToggleAutoExpandLines}
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
        conflictedIndices={conflictInfo.conflictedIndices}
        conflictReasons={conflictInfo.conflictReasons}
        onResolveSingleRow={handleResolveSingleRow}
        expandDefaults={expandDefaults}
        autoExpandLines={autoExpandLines}
      />

      {/* 3. Mobile Handheld Editing Cards (RULE M1) */}
      <ParcelMobileCards
        parcels={parcels}
        selected={selected}
        toggleSelect={toggleSelect}
        toggleAll={toggleAll}
        onDeselectAll={() => setSelected(new Set())}
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
        conflictedIndices={conflictInfo.conflictedIndices}
        conflictReasons={conflictInfo.conflictReasons}
        onResolveSingleRow={handleResolveSingleRow}
        expandDefaults={expandDefaults}
        autoExpandLines={autoExpandLines}
      />
    </div>
  )
}
