import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { PlusIcon, HistoryIcon } from './Icons'
import { Settings } from '../utils/groqParser'
import { saveAirwayDocument } from '../utils/localPdfVault'
import { ResultsKPIBar } from './results/ResultsKPIBar'
import { ResultsFilterBar, ResultsStatusFilter } from './results/ResultsFilterBar'
import { ResultsSelectionBar } from './results/ResultsSelectionBar'
import { ResultsDesktopGrid } from './results/ResultsDesktopGrid'
import { ResultsMobileCardList } from './results/ResultsMobileCardList'
import { useWhatsAppSentTracker } from '../hooks/useWhatsAppSentTracker'
import { BookedParcel, DEFAULT_MILESTONE_TEMPLATES, isCorruptText } from './history/types'
import { measureMaxContentLengths, triggerTableAutoFit, triggerTableReset } from '../hooks/useResizableColumns'
import { SharedPagination } from './common/SharedPagination'
import { usePagination } from '../hooks/usePagination'
import { useToast } from './common/Toast'

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
  whatsapp_sent?: boolean
  whatsappSent?: boolean
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
  userId?: string; history?: BookedParcel[]; onUpdateHistory?: (updated: BookedParcel[]) => void
  setActiveTab?: (tab: any) => void
}

const ORDER_TYPES = [
  { value: 'Normal', label: 'Normal (COD)' }, { value: 'Reversed', label: 'Reversed (Pickup)' },
  { value: 'Replacement', label: 'Replacement (Exchange)' }, { value: 'Overland', label: 'Overland (Cargo)' },
]

export default function BookingResults({
  results, setResults, onPrintLabels, loadingLabels, onCancelShipment,
  settings, cities, onBookSingle, updateSetting, userId, history, onUpdateHistory, setActiveTab
}: BookingResultsProps) {
  const [cancellingTracking, setCancellingTracking] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ResultsStatusFilter>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expandDefaults, setExpandDefaults] = useState<boolean>(() => {
    return localStorage.getItem('zaynah_results_expand_defaults') === 'true'
  })

  const toast = useToast()
  const waTracker = useWhatsAppSentTracker(userId || settings?.postex_token, history, onUpdateHistory)

  const handleToggleExpandDefaults = () => {
    const next = !expandDefaults
    setExpandDefaults(next)
    localStorage.setItem('zaynah_results_expand_defaults', String(next))
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
    if (isMobile) {
      toast.info(next ? 'All Cards Expanded' : 'All Cards Collapsed', next ? 'Expanded all result cards for detailed viewing.' : 'Collapsed cards into compact summary overview.')
    } else {
      toast.info(next ? 'Defaults Columns Expanded' : 'Defaults Columns Hidden', next ? 'Showing Weight, Detail, Note & Copies columns.' : 'Hidden optional logistics columns.')
    }
  }

  const handleOpenVault = () => {
    if (setActiveTab) {
      setActiveTab('vault')
    } else {
      window.location.hash = '#vault'
    }
  }

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
    if (cleanPhone.startsWith('0')) cleanPhone = '92' + cleanPhone.substring(1)
    else if (!cleanPhone.startsWith('92') && cleanPhone.length === 10) cleanPhone = '92' + cleanPhone

    const trackingUrl = `https://postex.pk/tracking?cn=${parcel.tracking || ''}`
    const defaultNote = 'Meharbani farma kar apna local SIM phone number ON rakhain 📱🔔 taake delivery rider asani se rabta kar sake 🚚💨\n\nReview dejye ga lazmi is number pe ⭐📝 aur agar 2-5 din mein parcel receive nahi hota ⏳ to is number pe rabta karna hai 📞\n\nHappy Shopping! 🛍️😊🎉'
    const noteContent = settings.whatsapp_note && settings.whatsapp_note !== 'Thank you for shopping with us!' && !isCorruptText(settings.whatsapp_note) && settings.whatsapp_note.includes('📱')
      ? settings.whatsapp_note 
      : defaultNote

    const formattedTotal = Number(parcel.total || 0).toLocaleString('en-PK')
    let template = (settings.whatsapp_template && !isCorruptText(settings.whatsapp_template) && settings.whatsapp_template.includes('📦'))
      ? settings.whatsapp_template
      : DEFAULT_MILESTONE_TEMPLATES.booking

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
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return (r.name || '').toLowerCase().includes(q) || (r.phone || '').toLowerCase().includes(q) ||
        (r.city || '').toLowerCase().includes(q) || (r.tracking || '').toLowerCase().includes(q) || (r.id || '').toLowerCase().includes(q)
    })
  }, [results, statusFilter, searchQuery])

  // DB-Optimized Shared Pagination
  const {
    currentPage, setCurrentPage, pageSize, setPageSize,
    totalItems, paginatedItems: paginatedResults
  } = usePagination({ items: filteredResults, initialPageSize: 25, storageKey: 'booking_results' })

  // Selection handlers
  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })
  const toggleAll = () => setSelected(selected.size === filteredResults.length ? new Set() : new Set(filteredResults.map(r => r.id)))

  const selectedBooked = useMemo(() => {
    return results.filter(r => selected.has(r.id) && r.status === 'success' && r.tracking)
  }, [results, selected])

  const handlePrintSelected = () => {
    if (selectedBooked.length === 0) return
    saveAirwayDocument(userId, {
      batchName: `PostEx Airway Bill (${selectedBooked.length} Selected)`,
      trackingNumbers: selectedBooked.map(b => b.tracking!).filter(Boolean),
      totalCOD: selectedBooked.reduce((s, r) => s + (parseFloat(String(r.total)) || 0), 0)
    })
    onPrintLabels()
  }

  const handlePrintAll = () => {
    if (booked.length === 0) return
    saveAirwayDocument(userId, {
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
      Name: r.name, Phone: r.phone, City: r.city, Address: r.address, 'COD Amount': r.total,
      Status: r.status === 'success' ? 'Booked' : r.status === 'cancelled' ? 'Cancelled' : r.status === 'manual' ? 'Draft' : 'Failed',
      'Tracking Number': r.tracking || '', 'Order Type': r.orderType || 'Normal', Error: r.error || '',
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
    const prefix = settings.order_id_prefix !== undefined ? settings.order_id_prefix : 'Ord-'
    let nextNum = parseInt(settings.order_id_next_num || '1001', 10)
    if (isNaN(nextNum)) nextNum = 1001

    const newRow: BookingResult = {
      id: `${prefix}${nextNum}`, name: '', phone: '', city: cities[0] || 'Lahore', address: '', total: 0, status: 'manual',
      items: Number(settings.default_items) || 1, weight: Number(settings.default_weight) || 0.5,
      detail: settings.default_product || 'Kids Clothes', note: settings.default_note || 'Call before delivery',
      orderType: 'Normal', airwayBillCopy: 1
    }
    setResults(prev => [newRow, ...prev])
    if (updateSetting) updateSetting('order_id_next_num', String(nextNum + 1))
  }

  const updateField = (id: string, field: keyof BookingResult, value: string | number) => {
    setResults(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleDeleteRow = (id: string) => {
    if (confirm('Are you sure you want to remove this row?')) {
      setResults(prev => prev.filter(r => r.id !== id))
      setSelected(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const handleAutoFitColumns = (e?: React.MouseEvent) => {
    if (e?.altKey) {
      triggerTableReset('results_desktop_grid_col_widths')
      setExpandDefaults(false)
      localStorage.setItem('zaynah_results_expand_defaults', 'false')
      toast.info('Column Widths Reset', 'Reset column widths and card views to default.')
      return
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

    if (isMobile) {
      // Mobile view Auto-Fit (Rule DS8): Vertical card expansion downwards
      const next = !expandDefaults
      setExpandDefaults(next)
      localStorage.setItem('zaynah_results_expand_defaults', String(next))
      toast.success(
        next ? 'Mobile Cards Auto-Fitted' : 'Mobile Cards Collapsed',
        next ? 'Expanded all result cards vertically for complete visibility.' : 'Collapsed cards into compact summary overview.'
      )
      return
    }

    // Desktop view: Horizontal column width auto-fit
    const lengths = measureMaxContentLengths(
      {
        refId: 'REF ID', customer: 'CUSTOMER', phone: 'PHONE', city: 'CITY',
        address: 'DELIVERY ADDRESS', cod: 'COD (RS.)', orderType: 'ORDER TYPE',
        weight: 'WEIGHT (KG)', detail: 'PRODUCT / DETAIL', note: 'NOTE / INSTRUCTIONS',
        copies: 'COPIES', statusTracking: 'STATUS / TRACKING'
      },
      results,
      {
        refId: r => r.id, customer: r => r.name, phone: r => r.phone,
        city: r => r.city, address: r => r.address, cod: r => `Rs. ${r.total || 0}`,
        orderType: () => 'Normal (COD)    ', weight: r => `${r.weight || 0.5} kg`,
        detail: r => r.detail, note: r => r.note,
        copies: () => 'COPIES  ', statusTracking: r => `${r.tracking || '2226280000000'}     `
      }
    )
    triggerTableAutoFit('results_desktop_grid_col_widths', lengths)
    toast.success('Column Widths Auto-Fitted', 'Adjusted column widths to maximum text length.')
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
    <div className="space-y-3.5 transition-colors duration-200 w-full min-w-0 max-w-full">
      {/* 1. Integrated KPI Summary & Action Toolbar */}
      <ResultsKPIBar
        totalResults={results.length}
        selectedCount={selected.size}
        bookedCount={booked.length}
        totalCOD={totalCOD}
        failedCount={failed.length}
        onAddNewResult={handleAddNewResult}
        onExportExcel={exportResultsExcel}
        onOpenVault={handleOpenVault}
        onClearAll={clearAllResults}
        onPrintAll={handlePrintAll}
        loadingLabels={loadingLabels}
        expandDefaults={expandDefaults}
        onToggleExpandDefaults={handleToggleExpandDefaults}
        onAutoFitColumns={handleAutoFitColumns}
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
            results={paginatedResults}
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
            expandDefaults={expandDefaults}
            isWhatsAppSent={waTracker.isSent}
            onMarkWhatsAppSent={(key, id) => waTracker.markSent(key, 'booking', id)}
            onToggleWhatsAppSent={waTracker.toggleSent}
          />

          <ResultsMobileCardList
            results={paginatedResults}
            selected={selected}
            toggleSelect={toggleSelect}
            toggleAll={toggleAll}
            onDeselectAll={() => setSelected(new Set())}
            onDelete={handleDeleteRow}
            onBookSingle={onBookSingle}
            onCancelShipment={onCancelShipment ? handleCancel : undefined}
            cancellingTracking={cancellingTracking}
            getWhatsAppLink={getWhatsAppLink}
            isWhatsAppSent={waTracker.isSent}
            onMarkWhatsAppSent={(key, id) => waTracker.markSent(key, 'booking', id)}
            onToggleWhatsAppSent={waTracker.toggleSent}
            expandDefaults={expandDefaults}
          />

          {/* Shared Unified Pagination */}
          <SharedPagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50, 100, 200, 300]}
            itemLabel="results"
            className="mt-2"
          />
        </>
      )}

    </div>
  )
}
