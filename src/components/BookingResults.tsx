import { useState } from 'react'
import * as XLSX from 'xlsx'
import { 
  PrintIcon, 
  PasteIcon, 
  UploadIcon, 
  HistoryIcon, 
  TrashIcon, 
  PlusIcon, 
  FolderIcon
} from './Icons'
import { Settings } from '../utils/groqParser'
import { AirwayVaultModal } from './history/AirwayVaultModal'
import { saveAirwayDocument } from '../utils/localPdfVault'
import { ResultRow } from './results/ResultRow'

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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cancellingTracking, setCancellingTracking] = useState<string[]>([])
  const [showVault, setShowVault] = useState(false)

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
  const cancelled = results.filter(r => r.status === 'cancelled')
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

  function copyTrackings() {
    const trackings = booked.map(r => r.tracking).join('\n')
    navigator.clipboard.writeText(trackings).then(() => {
      alert('Tracking numbers copied!')
    })
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
    setExpandedId(newId)
  }

  if (results.length === 0) {
    return (
      <div className="w-full text-center py-16 text-slate-400 dark:text-slate-500">
        <div className="flex justify-center mb-4">
          <HistoryIcon size={44} className="text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">No booking results yet</p>
        <p className="text-xs mb-5 text-slate-400">Book parcels from the Dispatch table or add a manual entry row.</p>
        <button
          onClick={handleAddNewResult}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition cursor-pointer flex items-center gap-1.5 mx-auto"
        >
          <PlusIcon size={15} />
          <span>Add Manual Booking Row</span>
        </button>
      </div>
    )
  }

  return (
    <div className="w-full transition-colors duration-200">
      {/* Sleek Apple-style KPI Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800 rounded-2xl mb-5 shadow-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Booked:</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{booked.length}</span>
          </div>
          {failed.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Failed:</span>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">{failed.length}</span>
            </div>
          )}
          {manual.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Drafts:</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">{manual.length}</span>
            </div>
          )}
          {cancelled.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cancelled:</span>
              <span className="text-sm font-bold text-slate-500 font-mono">{cancelled.length}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total COD:</span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            Rs. {totalCOD.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          {booked.length > 0 && (
            <>
              <button
                onClick={() => {
                  if (booked.length > 0) {
                    saveAirwayDocument(settings.postex_token || 'merchant', {
                      batchName: `PostEx Airway Bill (${booked.length} Parcels)`,
                      trackingNumbers: booked.map(b => b.tracking!).filter(Boolean),
                      totalCOD: totalCOD
                    })
                  }
                  onPrintLabels()
                }}
                disabled={loadingLabels}
                className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 whitespace-nowrap"
              >
                {loadingLabels ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <PrintIcon size={15} />
                    <span>Print Labels (PDF)</span>
                  </>
                )}
              </button>
              <button
                onClick={copyTrackings}
                className="h-10 px-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer active:scale-98 shadow-xs whitespace-nowrap"
              >
                <PasteIcon size={14} className="text-slate-500" />
                <span>Copy</span>
              </button>
            </>
          )}
          <button
            onClick={() => setShowVault(true)}
            className="h-10 px-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 whitespace-nowrap"
            title="Open Local Airway Bill & CN Document Vault"
          >
            <FolderIcon size={14} className="text-emerald-500" />
            <span>Airway Vault</span>
          </button>
          <button
            onClick={exportResultsExcel}
            className="h-10 px-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer active:scale-98 shadow-xs whitespace-nowrap"
          >
            <UploadIcon size={14} className="text-slate-500" />
            <span>Export</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddNewResult}
            className="h-10 px-3.5 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 whitespace-nowrap"
          >
            <PlusIcon size={14} className="text-emerald-500" />
            <span>Add Row</span>
          </button>
          <button
            onClick={clearAllResults}
            className="h-10 px-3.5 border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 whitespace-nowrap"
          >
            <TrashIcon size={14} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Booked section */}
      {booked.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2.5 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block"></span>
            <span>Successfully Booked ({booked.length})</span>
          </h3>
          <div className="space-y-2.5">
            {booked.map((r, i) => {
              const rowId = r.id || `booked_${i}`
              return (
                <ResultRow
                  key={rowId}
                  r={r}
                  isExpanded={expandedId === rowId}
                  onToggleExpand={() => setExpandedId(prev => prev === rowId ? null : rowId)}
                  setResults={setResults}
                  settings={settings}
                  cities={cities}
                  onBookSingle={onBookSingle}
                  onCancelShipment={onCancelShipment}
                  cancellingTracking={cancellingTracking}
                  setCancellingTracking={setCancellingTracking}
                  getWhatsAppLink={getWhatsAppLink}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Manual section */}
      {manual.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-400 rounded-full inline-block"></span>
            <span>Manual Drafts ({manual.length})</span>
          </h3>
          <div className="space-y-2.5">
            {manual.map((r, i) => {
              const rowId = r.id || `manual_${i}`
              return (
                <ResultRow
                  key={rowId}
                  r={r}
                  isExpanded={expandedId === rowId}
                  onToggleExpand={() => setExpandedId(prev => prev === rowId ? null : rowId)}
                  setResults={setResults}
                  settings={settings}
                  cities={cities}
                  onBookSingle={onBookSingle}
                  cancellingTracking={cancellingTracking}
                  setCancellingTracking={setCancellingTracking}
                  getWhatsAppLink={getWhatsAppLink}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Cancelled section */}
      {cancelled.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-400 rounded-full inline-block"></span>
            <span>Cancelled Shipments ({cancelled.length})</span>
          </h3>
          <div className="space-y-2.5">
            {cancelled.map((r, i) => {
              const rowId = r.id || `cancelled_${i}`
              return (
                <ResultRow
                  key={rowId}
                  r={r}
                  isExpanded={expandedId === rowId}
                  onToggleExpand={() => setExpandedId(prev => prev === rowId ? null : rowId)}
                  setResults={setResults}
                  settings={settings}
                  cities={cities}
                  onBookSingle={onBookSingle}
                  cancellingTracking={cancellingTracking}
                  setCancellingTracking={setCancellingTracking}
                  getWhatsAppLink={getWhatsAppLink}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Failed section */}
      {failed.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2.5 flex items-center gap-2">
            <span className="w-2 h-2 bg-rose-500 rounded-full inline-block"></span>
            <span>Failed / Needs Attention ({failed.length})</span>
          </h3>
          <div className="space-y-2.5">
            {failed.map((r, i) => {
              const rowId = r.id || `failed_${i}`
              return (
                <ResultRow
                  key={rowId}
                  r={r}
                  isExpanded={expandedId === rowId}
                  onToggleExpand={() => setExpandedId(prev => prev === rowId ? null : rowId)}
                  setResults={setResults}
                  settings={settings}
                  cities={cities}
                  onBookSingle={onBookSingle}
                  cancellingTracking={cancellingTracking}
                  setCancellingTracking={setCancellingTracking}
                  getWhatsAppLink={getWhatsAppLink}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Local Airway Bill & CN Document Vault Modal */}
      <AirwayVaultModal
        userId={settings.postex_token || 'merchant'}
        isOpen={showVault}
        onClose={() => setShowVault(false)}
      />
    </div>
  )
}
