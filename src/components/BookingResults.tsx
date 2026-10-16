import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { PlusIcon, HistoryIcon } from './Icons'
import { Settings } from '../utils/groqParser'
import { AirwayVaultModal } from './history/AirwayVaultModal'
import { saveAirwayDocument } from '../utils/localPdfVault'
import { ResultsKPIBar } from './results/ResultsKPIBar'
import { ResultsFilterBar, ResultsStatusFilter } from './results/ResultsFilterBar'
import { ResultsSelectionBar } from './results/ResultsSelectionBar'
import { ResultsDesktopGrid } from './results/ResultsDesktopGrid'
import { ResultsMobileCardList } from './results/ResultsMobileCardList'

export interface BookingResult {
  id: string
  name: string
  phone: string
  city: string
  address: string
  total: number
  status: 'success' | 'error' | 'cancelled' | 'manual'
  tracking?: string
  error?: string
  items?: number
  weight?: number
  detail?: string
  note?: string
  orderType?: string
  airwayBillCopy?: number
}

interface BookingResultsProps {
  results: BookingResult[]
  setResults: React.Dispatch<React.SetStateAction<BookingResult[]>>
  onPrintLabels: () => void
  loadingLabels?: boolean
  onCancelShipment?: (tracking: string) => Promise<void>
  settings: Settings
  cities: string[]
  onBookSingle: (result: BookingResult) => Promise<void>
  updateSetting?: (key: keyof Settings | Partial<Settings>, value?: string) => void
}

const ORDER_TYPES = [
  { value: 'Normal', label: 'Normal (COD)' },
  { value: 'Reversed', label: 'Reversed (Pickup)' },
  { value: 'Replacement', label: 'Replacement (Exchange)' },
  { value: 'Overland', label: 'Overland (Cargo)' },
]

export default function BookingResults({
  results,
  setResults,
  onPrintLabels,
  loadingLabels,
  onCancelShipment,
  settings,
  cities,
  onBookSingle,
  updateSetting
}: BookingResultsProps) {
  const [cancellingTracking, setCancellingTracking] = useState<string[]>([])
  const [showVault, setShowVault] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ResultsStatusFilter>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const handleCancel = async (tracking: string) => {
    if (!onCancelShipment) return
    setCancellingTracking(prev => [...prev, tracking])
    try {
      await onCancelShipment(tracking)
    } finally {
      setCancellingTracking(prev => prev.filter(t => t !== tracking))
    }
  }

  const getWhatsAppLink = (parcel: BookingResult) => {
    let cleanPhone = parcel.phone.replace(/\D/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.substring(1)
    } else if (!cleanPhone.startsWith('92') && cleanPhone.length === 10) {
      cleanPhone = '92' + cleanPhone
    }

    const trackingUrl = `https://postex.pk/tracking?cn=${parcel.tracking || ''}`
    const defaultNote = 'Review dejye ga lazmin is number pe or agar 2-5 din mein parcel receive nahi hota to is number pe rabta karna hai. Happy Shopping!'
    const noteContent = settings.whatsapp_note && settings.whatsapp_note !== 'Thank you for shopping with us!' 
      ? settings.whatsapp_note 
      : defaultNote

    const formattedTotal = Number(parcel.total || 0).toLocaleString('en-PK')
    let template = settings.whatsapp_template || 'Dear {name}, your order has been booked.\n\nTotal COD: Rs. {amount}\nTracking: {url}\n\n{note}'

    // Upgrade legacy default templates to include amount
    if (template.includes('Dear {name}, your order has been booked. You can track it here: {url}')) {
      template = 'Dear {name}, your order has been booked.\n\nTotal COD: Rs. {amount}\nTracking: {url}\n\n{note}'
    }

    // Ensure total COD amount is always present
    if (!template.includes('{amount}') && !template.includes('{order_amount}') && !template.includes('{total}')) {
      template = `${template}\nTotal COD: Rs. ${formattedTotal}`
    }

    template = template
      .replace(/{(?:name|customer_name)}/g, parcel.name)
      .replace(/{(?:url|portal_link)}/g, trackingUrl)
      .replace(/{(?:amount|order_amount|total)}/g, formattedTotal)
      .replace(/{(?:tracking|tracking_number)}/g, parcel.tracking || '')
      .replace(/{note}/g, noteContent)

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(template)}`
  }

  const booked = results.filter(r => r.status === 'success')
  const failed = results.filter(r => r.status === 'error')
  const totalCOD = booked.reduce((sum, r) => sum + (parseFloat(String(r.total)) || 0), 0)

  // Status Filter Counts
  const counts = useMemo(() => ({
    all: results.length,
    booked: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'error').length,
    drafts: results.filter(r => r.status === 'manual').length,
    cancelled: results.filter(r => r.status === 'cancelled').length
  }), [results])

  // Filtered Results by Search & Status
  const filteredResults = useMemo(() => {
    return results.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = (r.name || '').toLowerCase().includes(q)
        const matchPhone = (r.phone || '').toLowerCase().includes(q)
        const matchCity = (r.city || '').toLowerCase().includes(q)
        const matchTracking = (r.tracking || '').toLowerCase().includes(q)
        const matchId = (r.id || '').toLowerCase().includes(q)
        if (!matchName && !matchPhone && !matchCity && !matchTracking && !matchId) return false
      }
      return true
    })
  }, [results, statusFilter, searchQuery])

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filteredResults.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredResults.map(r => r.id)))
    }
  }

  const selectedBooked = useMemo(() => {
    return results.filter(r => selected.has(r.id) && r.status === 'success' && r.tracking)
  }, [results, selected])

  const handlePrintSelected = () => {
    if (selectedBooked.length === 0) return
    saveAirwayDocument(settings.postex_token || 'merchant', {
      batchName: `PostEx Airway Bill (${selectedBooked.length} Selected)`,
      trackingNumbers: selectedBooked.map(b => b.tracking!).filter(Boolean),
      totalCOD: selectedBooked.reduce((s, r) => s + (parseFloat(String(r.total)) || 0), 0)
    })
    onPrintLabels()
  }

  const handlePrintAll = () => {
    if (booked.length === 0) return
    saveAirwayDocument(settings.postex_token || 'merchant', {
      batchName: `PostEx Airway Bill (${booked.length} Parcels)`,
      trackingNumbers: booked.map(b => b.tracking!).filter(Boolean),
      totalCOD: totalCOD
    })
    onPrintLabels()
  }

  const handleDeleteSelected = () => {
    if (selected.size === 0) return
    if (confirm(`Remove ${selected.size} selected row(s)?`)) {
      setResults(prev => prev.filter(r => !selected.has(r.id)))
      setSelected(new Set())
    }
  }

  function exportResultsExcel() {
    const listToExport = selected.size > 0 ? results.filter(r => selected.has(r.id)) : filteredResults
    const data = listToExport.map(r => ({
      'Name': r.name,
      'Phone': r.phone,
      'City': r.city,
      'Address': r.address,
      'COD Amount': r.total,
      'Status': r.status === 'success' ? 'Booked' : r.status === 'cancelled' ? 'Cancelled' : r.status === 'manual' ? 'Draft' : 'Failed',
      'Tracking Number': r.tracking || '',
      'Order Type': r.orderType || 'Normal',
      'Error': r.error || '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Results')
    XLSX.writeFile(wb, `booking-results-${Date.now()}.xlsx`)
  }

  const clearAllResults = () => {
    if (confirm('Are you sure you want to clear all results? This cannot be undone.')) {
      setResults([])
      setSelected(new Set())
    }
  }

  const handleAddNewResult = () => {
    const prefix = settings.order_id_prefix !== undefined ? settings.order_id_prefix : 'tv-'
    let nextNum = parseInt(settings.order_id_next_num || '1001', 10)
    if (isNaN(nextNum)) nextNum = 1001

    const newRow: BookingResult = {
      id: `${prefix}${nextNum}`,
      name: '',
      phone: '',
      city: cities[0] || 'Lahore',
      address: '',
      total: 0,
      status: 'manual',
      items: Number(settings.default_items) || 1,
      weight: Number(settings.default_weight) || 0.5,
      detail: settings.default_product || 'Kids Clothes',
      note: settings.default_note || 'Call before delivery',
      orderType: 'Normal',
      airwayBillCopy: 1
    }
    setResults(prev => [newRow, ...prev])
    if (updateSetting) {
      updateSetting('order_id_next_num', String(nextNum + 1))
    }
  }

  const updateField = (id: string, field: keyof BookingResult, value: string | number) => {
    setResults(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleDeleteRow = (id: string) => {
    if (confirm('Are you sure you want to remove this row?')) {
      setResults(prev => prev.filter(r => r.id !== id))
      setSelected(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  if (results.length === 0) {
    return (
      <div className="w-full text-center py-20 bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <HistoryIcon size={28} />
          </div>
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">No Dispatched Results Yet</h3>
        <p className="text-xs mb-6 text-slate-500 max-w-sm mx-auto">
          Orders booked from the Parcels table or added manually will appear in this unified logistics spreadsheet.
        </p>
        <button
          onClick={handleAddNewResult}
          className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 mx-auto shadow-xs active:scale-98"
        >
          <PlusIcon size={14} />
          <span>Add Manual Order Row</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3.5 transition-colors duration-200">
      {/* 1. Integrated KPI Summary & Action Toolbar */}
      <ResultsKPIBar
        totalResults={results.length}
        selectedCount={selected.size}
        bookedCount={booked.length}
        totalCOD={totalCOD}
        failedCount={failed.length}
        onAddNewResult={handleAddNewResult}
        onExportExcel={exportResultsExcel}
        onOpenVault={() => setShowVault(true)}
        onClearAll={clearAllResults}
        onPrintAll={handlePrintAll}
        loadingLabels={loadingLabels}
      />

      {/* 2. Filter Bar (Search + Segmented Status Pills) */}
      <ResultsFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        counts={counts}
        onClearFilters={() => {
          setSearchQuery('')
          setStatusFilter('all')
        }}
      />

      {/* 3. Selection Action Bar (Anchored directly above table) */}
      <ResultsSelectionBar
        selectedCount={selected.size}
        totalCount={filteredResults.length}
        selectedBookedCount={selectedBooked.length}
        onDeselectAll={() => setSelected(new Set())}
        onPrintSelected={handlePrintSelected}
        onDeleteSelected={handleDeleteSelected}
        loadingLabels={loadingLabels}
      />

      {/* 4. Spreadsheet Grid for Desktop / Cards for Mobile */}
      {filteredResults.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <div className="flex justify-center">
            <HistoryIcon size={36} className="text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold mt-3">No results match this filter</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try resetting search or status filters</p>
        </div>
      ) : (
        <>
          <ResultsDesktopGrid
            results={filteredResults}
            selected={selected}
            toggleSelect={toggleSelect}
            toggleAll={toggleAll}
            updateField={updateField}
            onDelete={handleDeleteRow}
            onBookSingle={onBookSingle}
            onCancelShipment={onCancelShipment ? handleCancel : undefined}
            cancellingTracking={cancellingTracking}
            getWhatsAppLink={getWhatsAppLink}
            cities={cities}
            orderTypes={ORDER_TYPES}
          />

          <ResultsMobileCardList
            results={filteredResults}
            selected={selected}
            toggleSelect={toggleSelect}
            toggleAll={toggleAll}
            onDeselectAll={() => setSelected(new Set())}
            onDelete={handleDeleteRow}
            onBookSingle={onBookSingle}
            onCancelShipment={onCancelShipment ? handleCancel : undefined}
            cancellingTracking={cancellingTracking}
            getWhatsAppLink={getWhatsAppLink}
          />
        </>
      )}

      {/* Airway Bill Document Vault Modal */}
      {showVault && (
        <AirwayVaultModal
          userId={settings.postex_token || 'merchant'}
          isOpen={showVault}
          onClose={() => setShowVault(false)}
        />
      )}
    </div>
  )
}
