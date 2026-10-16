import { useState } from 'react'
import * as XLSX from 'xlsx'
import { 
  PrintIcon, 
  UploadIcon, 
  TrashIcon, 
  PlusIcon, 
  FolderIcon,
  HistoryIcon
} from './Icons'
import { Settings } from '../utils/groqParser'
import { AirwayVaultModal } from './history/AirwayVaultModal'
import { saveAirwayDocument } from '../utils/localPdfVault'
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
  onBookSingle
}: BookingResultsProps) {
  const [cancellingTracking, setCancellingTracking] = useState<string[]>([])
  const [showVault, setShowVault] = useState(false)

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
    const noteContent = settings.whatsapp_note || 'Thank you for shopping with us!'

    let template = settings.whatsapp_template || 'Dear {name}, your order has been booked. You can track it here: {url}\n{note}'
    template = template
      .replace(/{name}/g, parcel.name)
      .replace(/{url}/g, trackingUrl)
      .replace(/{note}/g, noteContent)

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(template)}`
  }

  const booked = results.filter(r => r.status === 'success')
  const failed = results.filter(r => r.status === 'error')
  const manual = results.filter(r => r.status === 'manual')
  const totalCOD = booked.reduce((sum, r) => sum + (parseFloat(String(r.total)) || 0), 0)

  function exportResultsExcel() {
    const data = results.map(r => ({
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
    }
  }

  const handleAddNewResult = () => {
    const newId = `manual_${Date.now()}`
    const newRow: BookingResult = {
      id: newId,
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
  }

  const updateField = (id: string, field: keyof BookingResult, value: string | number) => {
    setResults(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleDeleteRow = (id: string) => {
    if (confirm('Are you sure you want to remove this row?')) {
      setResults(prev => prev.filter(r => r.id !== id))
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
      {/* Sleek Integrated KPI Summary Bar (Matches ParcelKPIBar) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/80 shadow-xs">
        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Dispatched Results
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
              {results.length}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ({booked.length} booked{manual.length > 0 ? `, ${manual.length} drafts` : ''})
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Booked COD Value
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
            Dispatch Health
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold">
            {failed.length === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                100% Operational
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {failed.length} Failed Bookings
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Airway Document Vault
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {booked.length} Airway Bills Stored
          </div>
        </div>
      </div>

      {/* Action Toolbar (Matches ParcelKPIBar) */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleAddNewResult}
            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-xs whitespace-nowrap"
          >
            <PlusIcon size={14} className="text-emerald-500 shrink-0" />
            <span>Add Row</span>
          </button>

          <button
            onClick={exportResultsExcel}
            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-xs whitespace-nowrap"
          >
            <UploadIcon size={14} className="text-emerald-500 shrink-0" />
            <span>Export XLSX</span>
          </button>

          <button
            onClick={() => setShowVault(true)}
            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-xs whitespace-nowrap"
            title="Open Airway Bill Vault"
          >
            <FolderIcon size={14} className="text-emerald-500 shrink-0" />
            <span>Airway Vault</span>
          </button>

          <button
            onClick={clearAllResults}
            className="h-9 px-3.5 rounded-lg border border-rose-200/80 dark:border-rose-900/50 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-semibold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-xs whitespace-nowrap"
            title="Clear all results"
          >
            <TrashIcon size={14} className="shrink-0" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>

        {/* Primary Action Button */}
        {booked.length > 0 && (
          <div className="w-full sm:w-auto">
            <button
              onClick={() => {
                saveAirwayDocument(settings.postex_token || 'merchant', {
                  batchName: `PostEx Airway Bill (${booked.length} Parcels)`,
                  trackingNumbers: booked.map(b => b.tracking!).filter(Boolean),
                  totalCOD: totalCOD
                })
                onPrintLabels()
              }}
              disabled={loadingLabels}
              className="w-full sm:w-auto h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50 whitespace-nowrap"
            >
              {loadingLabels ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Generating Labels...</span>
                </>
              ) : (
                <>
                  <PrintIcon size={14} />
                  <span>Print Airway Bills ({booked.length}) →</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Desktop Excel Spreadsheet Table */}
      <ResultsDesktopGrid
        results={results}
        updateField={updateField}
        onDelete={handleDeleteRow}
        onBookSingle={onBookSingle}
        onCancelShipment={onCancelShipment ? handleCancel : undefined}
        cancellingTracking={cancellingTracking}
        getWhatsAppLink={getWhatsAppLink}
        cities={cities}
        orderTypes={ORDER_TYPES}
      />

      {/* Mobile Card List */}
      <ResultsMobileCardList
        results={results}
        onDelete={handleDeleteRow}
        onBookSingle={onBookSingle}
        onCancelShipment={onCancelShipment ? handleCancel : undefined}
        cancellingTracking={cancellingTracking}
        getWhatsAppLink={getWhatsAppLink}
      />

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
