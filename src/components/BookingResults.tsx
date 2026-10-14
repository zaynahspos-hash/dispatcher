import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { PrintIcon, PasteIcon, UploadIcon, HistoryIcon, CancelIcon, AlertIcon, FileTextIcon, TrashIcon } from './Icons'
import { Settings } from '../utils/groqParser'
import { SearchableDropdown } from './SearchableDropdown'

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
      <div className="w-full text-center py-16 text-gray-400 dark:text-gray-500">
        <div className="flex justify-center mb-4">
          <HistoryIcon size={48} className="text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-lg font-semibold mb-2">Koi results nahi abhi tak</p>
        <p className="text-sm mb-5">Parcels tab mein parcels book karo ya naya custom row add karo.</p>
        <button
          onClick={handleAddNewResult}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-[#ffffff] font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 mx-auto"
        >
          ➕ Add Manual Booking Row
        </button>
      </div>
    )
  }

  return (
    <div className="w-full transition-colors duration-200">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-2xl p-2.5 sm:p-5 text-center">
          <div className="text-3xl sm:text-4xl font-black text-green-600 dark:text-green-400">{booked.length}</div>
          <div className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-300 mt-1">Booked</div>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-2.5 sm:p-5 text-center">
          <div className="text-3xl sm:text-4xl font-black text-red-500 dark:text-red-400">{failed.length}</div>
          <div className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 mt-1">Failed</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl p-2.5 sm:p-5 text-center">
          <div className="text-xs sm:text-2xl font-black text-blue-600 dark:text-blue-400 truncate leading-tight">
            <span className="sm:hidden text-sm font-black">Rs.</span>
            <br className="sm:hidden" />
            <span className="text-base sm:text-2xl">{totalCOD.toLocaleString()}</span>
          </div>
          <div className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300 mt-1">Total COD</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 mb-5">
        {booked.length > 0 && (
          <>
            <button
              onClick={onPrintLabels}
              disabled={loadingLabels}
              className="col-span-2 sm:flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 text-[#ffffff] font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md text-sm"
            >
              {loadingLabels ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <PrintIcon size={18} />
                  <span>Print Labels (PDF)</span>
                </>
              )}
            </button>
            <button
              onClick={copyTrackings}
              className="sm:flex-none px-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition flex items-center gap-1.5 justify-center cursor-pointer"
            >
              <PasteIcon size={16} />
              <span>Copy</span>
            </button>
          </>
        )}
        <button
          onClick={exportResultsExcel}
          className="sm:flex-none px-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition flex items-center gap-1.5 justify-center cursor-pointer"
        >
          <UploadIcon size={16} />
          <span>Export</span>
        </button>
        <button
          onClick={handleAddNewResult}
          className="sm:flex-none px-3 py-3 bg-[#475569] dark:bg-gray-700 text-[#ffffff] hover:bg-[#334155] dark:hover:bg-gray-600 rounded-xl text-sm font-bold transition flex items-center gap-1.5 justify-center cursor-pointer shadow-md"
        >
          ➕ Add Row
        </button>
        <button
          onClick={clearAllResults}
          className="sm:flex-none px-3 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-[#ffffff] rounded-xl text-sm font-bold transition flex items-center gap-1.5 justify-center cursor-pointer shadow-md"
        >
          <TrashIcon size={16} />
          <span>Clear All</span>
        </button>
      </div>

      {/* Booked section */}
      {booked.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full inline-block"></span>
            Successfully Booked ({booked.length})
          </h3>
          <div className="space-y-2">
            {booked.map((r, i) => (
              <ResultRow
                key={r.id}
                r={r}
                isExpanded={expandedId === r.id}
                onToggleExpand={() => setExpandedId(expandedId === r.id ? null : r.id)}
                setResults={setResults}
                settings={settings}
                cities={cities}
                onBookSingle={onBookSingle}
                onCancelShipment={onCancelShipment}
                cancellingTracking={cancellingTracking}
                setCancellingTracking={setCancellingTracking}
                getWhatsAppLink={getWhatsAppLink}
              />
            ))}
          </div>
        </div>
      )}

      {/* Manual section */}
      {manual.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-slate-500 dark:bg-slate-400 rounded-full inline-block"></span>
            Manual Bookings ({manual.length})
          </h3>
          <div className="space-y-2">
            {manual.map((r, i) => (
              <ResultRow
                key={r.id}
                r={r}
                isExpanded={expandedId === r.id}
                onToggleExpand={() => setExpandedId(expandedId === r.id ? null : r.id)}
                setResults={setResults}
                settings={settings}
                cities={cities}
                onBookSingle={onBookSingle}
                cancellingTracking={cancellingTracking}
                setCancellingTracking={setCancellingTracking}
                getWhatsAppLink={getWhatsAppLink}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cancelled section */}
      {cancelled.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full inline-block"></span>
            Cancelled ({cancelled.length})
          </h3>
          <div className="space-y-2">
            {cancelled.map((r, i) => (
              <ResultRow
                key={r.id}
                r={r}
                isExpanded={expandedId === r.id}
                onToggleExpand={() => setExpandedId(expandedId === r.id ? null : r.id)}
                setResults={setResults}
                settings={settings}
                cities={cities}
                onBookSingle={onBookSingle}
                cancellingTracking={cancellingTracking}
                setCancellingTracking={setCancellingTracking}
                getWhatsAppLink={getWhatsAppLink}
              />
            ))}
          </div>
        </div>
      )}

      {/* Failed section */}
      {failed.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full inline-block"></span>
            Failed / Pending ({failed.length})
          </h3>
          <div className="space-y-2">
            {failed.map((r, i) => (
              <ResultRow
                key={r.id}
                r={r}
                isExpanded={expandedId === r.id}
                onToggleExpand={() => setExpandedId(expandedId === r.id ? null : r.id)}
                setResults={setResults}
                settings={settings}
                cities={cities}
                onBookSingle={onBookSingle}
                cancellingTracking={cancellingTracking}
                setCancellingTracking={setCancellingTracking}
                getWhatsAppLink={getWhatsAppLink}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface ResultRowProps {
  r: BookingResult
  isExpanded: boolean
  onToggleExpand: () => void
  setResults: React.Dispatch<React.SetStateAction<BookingResult[]>>
  settings: Settings
  cities: string[]
  onBookSingle: (result: BookingResult) => Promise<void>
  onCancelShipment?: (tracking: string) => Promise<void>
  cancellingTracking: string[]
  setCancellingTracking: React.Dispatch<React.SetStateAction<string[]>>
  getWhatsAppLink: (parcel: BookingResult) => string
}

function ResultRow({
  r,
  isExpanded,
  onToggleExpand,
  setResults,
  settings,
  cities,
  onBookSingle,
  onCancelShipment,
  cancellingTracking,
  setCancellingTracking,
  getWhatsAppLink
}: ResultRowProps) {
  const [formValues, setFormValues] = useState<BookingResult>({
    ...r,
    items: r.items !== undefined ? r.items : (Number(settings.default_items) || 1),
    weight: r.weight !== undefined ? r.weight : (Number(settings.default_weight) || 0.5),
    detail: r.detail !== undefined ? r.detail : (settings.default_product || 'Kids Clothes'),
    note: r.note !== undefined ? r.note : (settings.default_note || 'Call before delivery'),
    orderType: r.orderType !== undefined ? r.orderType : 'Normal',
    airwayBillCopy: r.airwayBillCopy !== undefined ? r.airwayBillCopy : 1
  })

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setFormValues({
      ...r,
      items: r.items !== undefined ? r.items : (Number(settings.default_items) || 1),
      weight: r.weight !== undefined ? r.weight : (Number(settings.default_weight) || 0.5),
      detail: r.detail !== undefined ? r.detail : (settings.default_product || 'Kids Clothes'),
      note: r.note !== undefined ? r.note : (settings.default_note || 'Call before delivery'),
      orderType: r.orderType !== undefined ? r.orderType : 'Normal',
      airwayBillCopy: r.airwayBillCopy !== undefined ? r.airwayBillCopy : 1
    })
  }, [r, settings])

  const handleSave = (showFeedback = true) => {
    if (!formValues.name.trim()) {
      alert('Please enter customer name.')
      return false
    }
    if (!formValues.phone.trim()) {
      alert('Please enter phone number.')
      return false
    }
    if (!formValues.city.trim()) {
      alert('Please select a city.')
      return false
    }
    if (!formValues.address.trim()) {
      alert('Please enter address.')
      return false
    }

    setResults(prev => prev.map(item => item.id === r.id ? { ...formValues } : item))
    if (showFeedback) {
      setIsSaving(true)
      setTimeout(() => setIsSaving(false), 1500)
    }
    return true
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to delete row for "${r.name || 'Unnamed'}"?`)) {
      setResults(prev => prev.filter(item => item.id !== r.id))
    }
  }

  const handleBook = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const saved = handleSave(false)
    if (!saved) return
    await onBookSingle(formValues)
  }

  const getStatusColorClass = () => {
    if (r.status === 'success') return 'bg-green-50 border-green-200 text-green-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-200'
    if (r.status === 'cancelled') return 'bg-gray-50 border-gray-200 text-gray-700 opacity-80 dark:bg-gray-900/30 dark:border-gray-800/50 dark:text-gray-400'
    if (r.status === 'manual') return 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-900/30 dark:border-slate-850 dark:text-slate-200'
    return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-200'
  }

  return (
    <div className={`border rounded-xl transition-all transition-colors duration-200 overflow-hidden ${getStatusColorClass()} ${isExpanded ? 'ring-1 ring-blue-400 dark:ring-blue-600 shadow-md' : 'hover:bg-opacity-80 cursor-pointer'}`}>
      {/* Header View */}
      <div 
        onClick={onToggleExpand} 
        className="p-4 flex items-center justify-between gap-3 select-none"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`font-bold text-sm ${r.status === 'cancelled' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-slate-800 dark:text-gray-100'}`}>
              {r.name || <span className="italic font-normal text-gray-400 dark:text-gray-500">Unnamed Customer</span>}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              r.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
              r.status === 'cancelled' ? 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300' :
              r.status === 'manual' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {r.city}
            </span>
            {r.total > 0 && (
              <span className={`text-xs font-semibold ${r.status === 'cancelled' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                Rs. {Number(r.total).toLocaleString()}
              </span>
            )}
            {r.status === 'manual' && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                Manual Draft
              </span>
            )}
            {r.status === 'error' && r.error && (
              <span className="text-xs text-red-500 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md max-w-[200px] truncate" title={r.error}>
                {r.error}
              </span>
            )}
          </div>
          {r.tracking && (
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <FileTextIcon size={12} className="text-gray-400 dark:text-gray-500 shrink-0" />
              <span>Tracking: <strong className="font-mono">{r.tracking}</strong></span>
            </div>
          )}
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {r.status === 'success' && r.tracking && (
            <div className="hidden sm:flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(r.tracking || '')
                  alert('Tracking number copied!')
                }}
                className="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 border border-green-200 dark:border-green-900 px-2.5 py-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition cursor-pointer font-semibold"
              >
                Copy
              </button>
              <a
                href={getWhatsAppLink(r)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#ffffff] bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 border border-emerald-600 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer font-semibold shadow-md shadow-emerald-600/10"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.035-2.834-6.867-1.829-1.83-4.269-2.837-6.87-2.839-5.439 0-9.866 4.372-9.87 9.733-.001 1.73.465 3.418 1.348 4.908l-.993 3.629 3.73-.977z" />
                </svg>
                <span>Send link</span>
              </a>
              {onCancelShipment && (
                <button
                  onClick={async () => {
                    if (confirm(`Are you sure you want to cancel booking for ${r.name} (${r.tracking})?`)) {
                      setCancellingTracking(prev => [...prev, r.tracking || ''])
                      try {
                        await onCancelShipment(r.tracking || '')
                      } catch (err: any) {
                        alert(err.message || 'Cancellation failed.')
                      } finally {
                        setCancellingTracking(prev => prev.filter(t => t !== r.tracking))
                      }
                    }
                  }}
                  disabled={cancellingTracking.includes(r.tracking || '')}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 border border-red-200 dark:border-red-900 px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 transition flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <CancelIcon size={12} />
                  <span>{cancellingTracking.includes(r.tracking || '') ? '...' : 'Cancel'}</span>
                </button>
              )}
            </div>
          )}
          {r.status === 'success' && (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-[#ffffff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {r.status === 'cancelled' && (
            <span className="text-xs text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 font-semibold shrink-0">
              Cancelled
            </span>
          )}
          {r.status === 'manual' && (
            <div className="w-6 h-6 bg-slate-400 dark:bg-slate-600 rounded-full flex items-center justify-center shrink-0 text-[#ffffff]" title="Manual Entry">
              <span className="text-[10px] font-black">M</span>
            </div>
          )}
          {r.status === 'error' && (
            <div className="w-6 h-6 bg-red-400 rounded-full flex items-center justify-center shrink-0 text-[#ffffff]">
              <AlertIcon size={14} />
            </div>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer flex items-center justify-center shrink-0"
            title="Delete Row"
          >
            <TrashIcon size={16} />
          </button>
          <svg className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Edit Form */}
      {isExpanded && (
        <div className="px-4 pb-5 pt-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-800 dark:text-gray-100 transition-all duration-300">
          {/* Mobile-only action buttons for booked parcels */}
          {r.status === 'success' && r.tracking && (
            <div className="sm:hidden flex flex-col gap-2.5 mb-4 p-3 bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900 rounded-xl" onClick={e => e.stopPropagation()}>
              <div className="text-xs font-bold text-green-800 dark:text-green-300">Quick Actions:</div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(r.tracking || '')
                    alert('Tracking number copied!')
                  }}
                  className="flex-1 text-center text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-900 px-3 py-2 rounded-lg transition cursor-pointer font-semibold"
                >
                  Copy Tracking
                </button>
                <a
                  href={getWhatsAppLink(r)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center text-xs text-[#ffffff] bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 px-3 py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer font-semibold shadow-md shadow-emerald-600/10"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.035-2.834-6.867-1.829-1.83-4.269-2.837-6.87-2.839-5.439 0-9.866 4.372-9.87 9.733-.001 1.73.465 3.418 1.348 4.908l-.993 3.629 3.73-.977z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>
                {onCancelShipment && (
                  <button
                    onClick={async () => {
                      if (confirm(`Are you sure you want to cancel booking for ${r.name} (${r.tracking})?`)) {
                        setCancellingTracking(prev => [...prev, r.tracking || ''])
                        try {
                          await onCancelShipment(r.tracking || '')
                        } catch (err: any) {
                          alert(err.message || 'Cancellation failed.')
                        } finally {
                          setCancellingTracking(prev => prev.filter(t => t !== r.tracking))
                        }
                      }
                    }}
                    disabled={cancellingTracking.includes(r.tracking || '')}
                    className="flex-1 text-center text-xs text-red-600 dark:text-red-400 hover:text-red-850 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-900 px-3 py-2 rounded-lg disabled:opacity-50 transition flex items-center justify-center gap-1 cursor-pointer font-semibold"
                  >
                    <CancelIcon size={12} />
                    <span>{cancellingTracking.includes(r.tracking || '') ? '...' : 'Cancel'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Field: Name */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 mb-1 block">Customer Name *</label>
              <input
                type="text"
                value={formValues.name}
                onChange={e => setFormValues(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:outline-none text-slate-800 dark:text-gray-100"
                placeholder="Enter customer name"
              />
            </div>

            {/* Field: Phone */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 mb-1 block">Phone Number *</label>
              <input
                type="text"
                value={formValues.phone}
                onChange={e => setFormValues(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:outline-none text-slate-800 dark:text-gray-100"
                placeholder="e.g. 03001234567"
              />
            </div>

            {/* Field: City */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 mb-1 block">City *</label>
              <SearchableDropdown
                value={formValues.city}
                onChange={val => setFormValues(prev => ({ ...prev, city: val }))}
                options={cities}
                className="w-full"
                placeholder="Select city..."
              />
            </div>

            {/* Field: COD Amount */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 mb-1 block">COD Amount (Rs.) *</label>
              <input
                type="number"
                value={formValues.total || ''}
                onChange={e => setFormValues(prev => ({ ...prev, total: Number(e.target.value) || 0 }))}
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:outline-none text-slate-800 dark:text-gray-100"
                placeholder="0"
              />
            </div>

            {/* Field: Address */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 mb-1 block">Full Address *</label>
              <textarea
                value={formValues.address}
                onChange={e => setFormValues(prev => ({ ...prev, address: e.target.value }))}
                rows={2}
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:outline-none text-slate-800 dark:text-gray-100"
                placeholder="Street address, sector/area, city"
              />
            </div>

            {/* Optional Grid: Weight, Items, Order Type */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 mb-1 block">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formValues.weight}
                onChange={e => setFormValues(prev => ({ ...prev, weight: Number(e.target.value) || 0.5 }))}
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:outline-none text-slate-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 mb-1 block">Items / Pieces</label>
              <input
                type="number"
                value={formValues.items}
                onChange={e => setFormValues(prev => ({ ...prev, items: Number(e.target.value) || 1 }))}
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:outline-none text-slate-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 mb-1 block">Order Type</label>
              <select
                value={formValues.orderType || 'Normal'}
                onChange={e => setFormValues(prev => ({ ...prev, orderType: e.target.value }))}
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:outline-none text-slate-800 dark:text-gray-100"
              >
                <option value="Normal">Normal (COD)</option>
                <option value="Replacement">Replacement (Exchange)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 mb-1 block">Airway Bill Copies</label>
              <input
                type="number"
                value={formValues.airwayBillCopy}
                onChange={e => setFormValues(prev => ({ ...prev, airwayBillCopy: Number(e.target.value) || 1 }))}
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:outline-none text-slate-800 dark:text-gray-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 mb-1 block">Product Detail</label>
              <input
                type="text"
                value={formValues.detail}
                onChange={e => setFormValues(prev => ({ ...prev, detail: e.target.value }))}
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:outline-none text-slate-800 dark:text-gray-100"
                placeholder="Product description..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 mb-1 block">Booking Note</label>
              <input
                type="text"
                value={formValues.note}
                onChange={e => setFormValues(prev => ({ ...prev, note: e.target.value }))}
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:outline-none text-slate-800 dark:text-gray-100"
                placeholder="Instructions for rider..."
              />
            </div>
          </div>

          {/* Action buttons inside expanded area */}
          <div className="flex flex-wrap items-center justify-between border-t border-slate-200 dark:border-gray-700 mt-5 pt-4 gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-[#ffffff] font-bold py-2.5 px-5 rounded-xl text-sm shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{isSaving ? '✅ Saved!' : 'Save Changes'}</span>
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold py-2.5 px-4 rounded-xl text-sm transition cursor-pointer"
              >
                Delete Row
              </button>
            </div>

            <div className="flex items-center gap-2">
              {r.status !== 'success' && (
                <button
                  type="button"
                  onClick={handleBook}
                  className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 text-[#ffffff] font-bold py-2.5 px-5 rounded-xl text-sm shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  🚀 Book Parcel (PostEx)
                </button>
              )}
              {r.status === 'success' && (
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                  🛡️ Order already booked successfully
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
