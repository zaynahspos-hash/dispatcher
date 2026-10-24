import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Settings } from '../utils/aiParser'
import { RefreshIcon, CheckIcon, AlertIcon, CloseIcon, HistoryIcon, SyncIcon, PrintIcon } from './Icons'
import {
  BookedParcel,
  StatusFilterType,
  SourceFilterType,
  isCancellable,
  isCancelledStatus,
  getStatusCategory,
  getLocalTodayDate,
  getParcelDateStr,
  parsePortalDate,
  transformPostExOrders,
  mergeParcelLists,
  isFakeOrDemoPhone,
  parseCODAmount
} from './history/types'
import { CustomerEntry } from './admin/types'
import { useBookedHistoryOperations } from '../hooks/useBookedHistoryOperations'
import { useBookedHistoryFilter } from '../hooks/useBookedHistoryFilter'
import { usePostExRangeSync } from '../hooks/usePostExRangeSync'
import { readExternalParcels, writeExternalParcels, clearExternalParcels, loadExternalParcelsAsync } from '../utils/portalParcelStore'
import { idbSaveCustomers, idbGetCustomers } from '../utils/indexedDbStore'
import { HistoryFilterBar } from './history/HistoryFilterBar'
import { HistorySelectionBar } from './history/HistorySelectionBar'
import { HistoryTableRow } from './history/HistoryTableRow'
import { HistoryMobileCardList } from './history/HistoryMobileCardList'
import { ShipperAdviceModal } from './history/ShipperAdviceModal'
import { WhatsAppSelectModal } from './history/WhatsAppSelectModal'
import { LoadSheetConfirmModal } from './history/LoadSheetConfirmModal'
import { ExecutiveReportModal } from './history/ExecutiveReportModal'
import { useWhatsAppSentTracker } from '../hooks/useWhatsAppSentTracker'
import { SharedPagination } from './common/SharedPagination'
import { usePagination } from '../hooks/usePagination'

export type { BookedParcel }

interface BookedHistoryProps {
  settings: Settings
  history: BookedParcel[]
  onUpdateHistory: (updated: BookedParcel[]) => void
  userId?: string
}

export function BookedHistory({ settings, history, onUpdateHistory, userId }: BookedHistoryProps) {
  // Purge any legacy fixed-pixel column widths from localStorage so layout is 100% responsive
  useEffect(() => {
    try {
      localStorage.removeItem('history_desktop_grid_col_widths')
    } catch {}
  }, [])

  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceFilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [fromDate, setFromDate] = useState<string>(() => getLocalTodayDate())
  const [toDate, setToDate] = useState<string>(() => getLocalTodayDate())
  const [statusSelect, setStatusSelect] = useState('all')
  const [pickupFilter, setPickupFilter] = useState('all')
  const [whatsappFilter, setWhatsappFilter] = useState<'all' | 'pending' | 'sent'>('all')
  const [whatsAppModalParcel, setWhatsAppModalParcel] = useState<BookedParcel | null>(null)
  const [isLoadSheetConfirmOpen, setIsLoadSheetConfirmOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  // External / Portal parcels live in their own state so database sync,
  // realtime echoes or auth refreshes can never wipe them.
  const [externalParcels, setExternalParcels] = useState<BookedParcel[]>(() =>
    readExternalParcels(userId, fromDate, toDate)
  )

  useEffect(() => {
    let isSubscribed = true
    const cached = readExternalParcels(userId, fromDate, toDate)
    if (cached.length > 0) {
      setExternalParcels(cached)
    } else {
      // Pull full dataset from IndexedDB asynchronously across page reloads
      loadExternalParcelsAsync(userId, fromDate, toDate).then(parcels => {
        if (isSubscribed && parcels && parcels.length > 0) {
          setExternalParcels(parcels)
        }
      })
    }
    return () => { isSubscribed = false }
  }, [userId, fromDate, toDate])

  // Listen for background PostEx sync events from Admin tab or other windows
  useEffect(() => {
    const handleSyncEvent = (e: any) => {
      const detail = e?.detail
      if (!detail) return
      if (!detail.userId || !userId || detail.userId === userId) {
        const cached = readExternalParcels(userId, fromDate, toDate)
        if (cached.length > 0) {
          setExternalParcels(cached)
        } else {
          loadExternalParcelsAsync(userId, fromDate, toDate).then(parcels => {
            if (parcels && parcels.length > 0) setExternalParcels(parcels)
          })
        }
      }
    }
    window.addEventListener('portal_parcels_synced', handleSyncEvent)
    return () => window.removeEventListener('portal_parcels_synced', handleSyncEvent)
  }, [userId, fromDate, toDate])

  const externalParcelsRef = useRef<BookedParcel[]>(externalParcels)
  useEffect(() => {
    externalParcelsRef.current = externalParcels
  }, [externalParcels])

  const activeRangeRef = useRef(`${fromDate}|${toDate}`)
  useEffect(() => {
    activeRangeRef.current = `${fromDate}|${toDate}`
  }, [fromDate, toDate])

  // Single list used for filters, counts, actions and WhatsApp — app bookings
  // and direct-from-PostEx parcels behave exactly the same here.
  const combinedHistory = useMemo(
    () => mergeParcelLists(history, externalParcels),
    [history, externalParcels]
  )

  // Route every action result to both stores: database rows to Supabase,
  // external rows back into the persisted PostEx list.
  const applyHistoryUpdate = useCallback((updated: BookedParcel[]) => {
    const external = updated.filter(parcel => {
      if (parcel.source !== 'postex_portal') return false
      const parcelDate = getParcelDateStr(parcel.bookingDate)
      if (fromDate && (!parcelDate || parcelDate < fromDate)) return false
      if (toDate && (!parcelDate || parcelDate > toDate)) return false
      return true
    })
    externalParcelsRef.current = external
    setExternalParcels(external)
    writeExternalParcels(userId, fromDate, toDate, external)
    onUpdateHistory(updated)
  }, [onUpdateHistory, userId, fromDate, toDate])

  const applyPortalOrders = useCallback((orders: any[], range: string) => {
    // Ignore a response that belongs to a date range the merchant already left.
    if (range !== activeRangeRef.current) return
    const transformed = transformPostExOrders(orders, externalParcelsRef.current)
    externalParcelsRef.current = transformed
    writeExternalParcels(userId, fromDate, toDate, transformed)
    setExternalParcels(transformed)

    // Extract customer directory contacts and save to IndexedDB so Admin tab has them immediately
    if (Array.isArray(orders) && orders.length > 0) {
      idbGetCustomers().then(cachedList => {
        const map = new Map<string, CustomerEntry>()
        ;(cachedList || []).forEach(c => {
          if (!isFakeOrDemoPhone(c.phone, c.name)) {
            map.set(`${c.user_id}_${c.phone.replace(/\D/g, '')}`, c)
          }
        })
        orders.forEach((o, idx) => {
          const rawPhone = (o.customerPhone || '').trim()
          if (!rawPhone || isFakeOrDemoPhone(rawPhone, o.customerName)) return
          const cleanPhone = rawPhone.replace(/\D/g, '')
          const rawDate = o.transactionDate || o.orderDate || o.bookingDate || o.createdDatetime || o.modifiedDatetime
          const validIsoDate = parsePortalDate(rawDate)
          const entry: CustomerEntry = {
            id: `portal_${userId || 'merchant'}_${o.trackingNumber || o.orderRefNumber || idx}`,
            user_id: userId || 'default',
            name: o.customerName || 'Valued Customer',
            phone: rawPhone,
            city: o.cityName || '',
            address: o.deliveryAddress || '',
            source: 'postex_portal',
            created_at: validIsoDate,
            updated_at: validIsoDate,
            user: { email: settings?.store_name || 'Merchant' }
          }
          map.set(`${userId || 'default'}_${cleanPhone}`, entry)
        })
        const merged = Array.from(map.values())
        void idbSaveCustomers(merged)
      })
    }
  }, [userId, fromDate, toDate, settings])

  const portalSync = usePostExRangeSync({
    token: settings.postex_token,
    userId,
    fromDate,
    toDate,
    onOrders: applyPortalOrders
  })

  const waTracker = useWhatsAppSentTracker(
    userId || settings?.postex_token,
    combinedHistory,
    applyHistoryUpdate
  )

  const handleClearFilters = () => {
    const today = getLocalTodayDate()
    setSearchQuery('')
    setFromDate(today)
    setToDate(today)
    setStatusFilter('all')
    setStatusSelect('all')
    setPickupFilter('all')
    setWhatsappFilter('all')
    setSourceFilter('all')
  }

  // Filter and dynamic counts hook
  const { counts, sourceCounts, filteredParcels } = useBookedHistoryFilter({
    history: combinedHistory, statusFilter, sourceFilter, searchQuery, fromDate, toDate,
    statusSelect, pickupFilter, whatsappFilter, isWhatsAppSent: waTracker.isSent
  })

  // PostEx operations hook
  const {
    selectedIds, setSelectedIds, handleSelectAll, handleSelectItem, isLoading,
    actionStatus, setActionStatus, syncingTracking,
    isSyncingAll, syncProgress,
    isCancellingAll, cancelProgress, adviceParcel, setAdviceParcel,
    adviceStatusId, setAdviceStatusId, adviceRemarks, setAdviceRemarks,
    isSubmittingAdvice, adviceError, setAdviceError, handlePrintSelected,
    handleGenerateLoadSheet, handleCancelSelected, handleCancelSingle,
    handleSyncStatus, handleSyncSelected, handleSyncTracking, handleSubmitAdvice
  } = useBookedHistoryOperations({
    settings,
    history: combinedHistory,
    onUpdateHistory: applyHistoryUpdate,
    filteredParcels,
    userId,
    onTrackingSynced: () => {
      // If user had 'pending_loadsheet' selected and tracking sync moved all of them to real statuses,
      // seamlessly switch to 'all' so orders never vanish from the merchant's view!
      setStatusFilter(prev => prev === 'pending_loadsheet' ? 'all' : prev)
    }
  })

  const handleManualRefresh = async () => {
    if (!settings.postex_token) {
      setActionStatus({ type: 'error', message: 'PostEx API token is missing in Settings.' })
      return
    }
    // Invalidate local cache for active range to force an instant fresh load from PostEx
    clearExternalParcels(userId, fromDate, toDate)
    const fetchedCount = await portalSync.sync(true)
    if (fetchedCount === null) return
    setActionStatus({
      type: 'success',
      message: fetchedCount > 0
        ? `${fetchedCount} external parcels loaded directly from PostEx.`
        : 'No PostEx parcels found for the selected date range.'
    })
  }

  // DB-Optimized Shared Pagination
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems: paginatedParcels
  } = usePagination({
    items: filteredParcels,
    initialPageSize: 25,
    storageKey: 'booked_history'
  })

  const uniqueCities = useMemo(() => {
    const citiesSet = new Set(combinedHistory.map(item => item.city.toUpperCase().trim()))
    return Array.from(citiesSet).filter(Boolean).sort()
  }, [combinedHistory])

  const pendingLoadsheetParcels = useMemo(() => {
    return combinedHistory.filter(p => getStatusCategory(p.status, p.tracking, p.hasLoadSheet) === 'pending_loadsheet')
  }, [combinedHistory])

  // Filtered & Selected Total COD Value (Reactive to all active filters)
  const filteredTotalCOD = useMemo(() => {
    return filteredParcels.reduce((sum, p) => sum + parseCODAmount(p.total), 0)
  }, [filteredParcels])

  const selectedTotalCOD = useMemo(() => {
    if (selectedIds.length === 0) return 0
    return combinedHistory
      .filter(p => selectedIds.includes(p.tracking))
      .reduce((sum, p) => sum + parseCODAmount(p.total), 0)
  }, [combinedHistory, selectedIds])

  // Active filter indicators for sticky header when operator scrolls down
  const today = getLocalTodayDate()
  const activeFilterPills = useMemo(() => {
    const pills: { label: string; onClear: () => void }[] = []
    
    if (statusFilter !== 'all') {
      const labelMap: Record<string, string> = {
        pending_loadsheet: 'Pending Sheet',
        booked: 'Booked',
        intransit: 'In Transit',
        out_for_delivery: 'Out for Delivery',
        action_required: 'Action Required',
        delivered: 'Delivered',
        returned: 'Returned',
        cancelled: 'Cancelled'
      }
      pills.push({ label: labelMap[statusFilter] || statusFilter, onClear: () => setStatusFilter('all') })
    }

    if (pickupFilter && pickupFilter !== 'all') {
      pills.push({ label: `City: ${pickupFilter}`, onClear: () => setPickupFilter('all') })
    }

    if (sourceFilter && sourceFilter !== 'all') {
      pills.push({ label: sourceFilter === 'postex_portal' ? 'Portal' : 'App', onClear: () => setSourceFilter('all') })
    }

    if (whatsappFilter && whatsappFilter !== 'all') {
      pills.push({ label: whatsappFilter === 'sent' ? 'WA Sent' : 'WA Pending', onClear: () => setWhatsappFilter('all') })
    }

    if (searchQuery) {
      pills.push({ label: `"${searchQuery.length > 12 ? searchQuery.slice(0, 12) + '…' : searchQuery}"`, onClear: () => setSearchQuery('') })
    }

    return pills
  }, [statusFilter, pickupFilter, sourceFilter, whatsappFilter, searchQuery, setStatusFilter, setPickupFilter, setSourceFilter, setWhatsappFilter, setSearchQuery])

  const handleLoadSheetClick = () => {
    if (selectedIds.length > 0) {
      setIsLoadSheetConfirmOpen(true)
    } else {
      if (pendingLoadsheetParcels.length > 0) {
        setSelectedIds(pendingLoadsheetParcels.map(p => p.tracking))
        setIsLoadSheetConfirmOpen(true)
      } else if (paginatedParcels.length > 0) {
        setSelectedIds(paginatedParcels.map(p => p.tracking))
        setIsLoadSheetConfirmOpen(true)
      }
    }
  }

  const [autoExpandLines, setAutoExpandLines] = useState<boolean>(() => {
    return localStorage.getItem('zaynah_history_auto_expand_lines') === 'true'
  })

  const handleToggleAutoExpandLines = () => {
    setAutoExpandLines(prev => {
      const next = !prev
      localStorage.setItem('zaynah_history_auto_expand_lines', String(next))
      return next
    })
  }

  return (
    <div className="bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors duration-200 w-full max-w-full min-w-0">
      {/* Sticky Top Header with Filtered Parcels Count & Total COD Amount Value */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#0c121e]/95 backdrop-none py-2.5 sm:py-3 px-3 sm:px-4 -mx-1 sm:-mx-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Booked History</span>
              <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                {filteredParcels.length} {filteredParcels.length === 1 ? 'Parcel' : 'Parcels'}
              </span>
            </h2>

            {/* Filtered Total COD Value Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-mono font-black bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-2xs">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total COD:</span>
              <span>Rs. {filteredTotalCOD.toLocaleString()}</span>
            </span>

            {/* Average COD per parcel */}
            {filteredParcels.length > 0 && (
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-sans text-slate-400 uppercase tracking-wider">Avg:</span>
                <span>Rs. {Math.round(filteredTotalCOD / (filteredParcels.length || 1)).toLocaleString()}</span>
              </span>
            )}

            {/* Selected Parcels Count & Amount Badge (when checked) */}
            {selectedIds.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 animate-fade-in shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Selected:</span>
                <span>{selectedIds.length} (Rs. {selectedTotalCOD.toLocaleString()})</span>
              </span>
            )}

            {/* Active Filter Pills (scrolling indicator) */}
            {activeFilterPills.length > 0 && (
              <div className="hidden lg:flex items-center gap-1.5">
                {activeFilterPills.map((pill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                  >
                    <span>{pill.label}</span>
                    <button
                      type="button"
                      onClick={pill.onClear}
                      className="hover:text-rose-600 dark:hover:text-rose-400 font-bold ml-0.5 cursor-pointer"
                      title="Clear filter"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {portalSync.isSyncing && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live PostEx Sync
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleToggleAutoExpandLines}
            className={`flex-1 sm:flex-initial h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap ${
              autoExpandLines
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>{autoExpandLines ? 'Collapse All' : 'Expand All'}</span>
          </button>

          {/* Load Sheet Quick Action in Header */}
          <button
            type="button"
            onClick={handleLoadSheetClick}
            disabled={isLoading || (selectedIds.length === 0 && pendingLoadsheetParcels.length === 0 && paginatedParcels.length === 0)}
            className={`flex-1 sm:flex-initial h-9 px-3 sm:px-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer active:scale-95 ${
              (selectedIds.length > 0 || pendingLoadsheetParcels.length > 0)
                ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border-emerald-500/50 hover:border-emerald-500 ring-1 ring-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60'
            }`}
            title="Generate official PostEx Load Sheet PDF"
          >
            <PrintIcon size={13} className={(selectedIds.length > 0 || pendingLoadsheetParcels.length > 0) ? 'text-emerald-500' : ''} />
            <span>Load Sheet ({selectedIds.length > 0 ? selectedIds.length : pendingLoadsheetParcels.length})</span>
          </button>

          {/* 1-Click Real Tracking Sync for All Filtered (or Selected) Parcels */}
          <button
            type="button"
            onClick={() => handleSyncTracking(selectedIds.length > 0 ? selectedIds : undefined)}
            disabled={isSyncingAll || portalSync.isSyncing || isLoading || filteredParcels.length === 0}
            className="flex-1 sm:flex-initial h-9 px-3 sm:px-3.5 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-700 dark:text-sky-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-50"
            title="1-Click Real Tracking Sync: Fetches granular live milestones directly from PostEx tracking"
          >
            {isSyncingAll ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{syncProgress || 'Syncing...'}</span>
              </>
            ) : (
              <>
                <SyncIcon size={13} className="text-sky-600 dark:text-sky-400" />
                <span>Sync Live Status ({selectedIds.length > 0 ? selectedIds.length : filteredParcels.length})</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={portalSync.isSyncing || isLoading || isSyncingAll}
            className="flex-1 sm:flex-initial h-9 px-3 sm:px-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
            title="Fetch latest booked parcels directly from PostEx for selected date range"
          >
            {portalSync.isSyncing ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <RefreshIcon size={13} />
                <span>Sync PostEx</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Concurrent Tracking Sync Progress Banner */}
      {isSyncingAll && (
        <div className="mb-4 p-3 rounded-xl bg-sky-50/95 dark:bg-sky-950/40 border border-sky-500/30 flex items-center justify-between gap-2.5 animate-pulse">
          <div className="flex items-center gap-2 min-w-0">
            <SyncIcon size={14} className="text-sky-600 dark:text-sky-400 animate-spin shrink-0" />
            <p className="text-xs font-bold text-sky-900 dark:text-sky-200 truncate">
              {syncProgress || 'Synchronizing live milestones from PostEx tracking...'}
            </p>
          </div>
          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300">
            Live Sync
          </span>
        </div>
      )}

      {/* Advanced Filter Component (Banner renders at the top inside HistoryFilterBar, matching Admin tab exactly) */}
      <HistoryFilterBar
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate}
        statusSelect={statusSelect} setStatusSelect={setStatusSelect}
        pickupFilter={pickupFilter} setPickupFilter={setPickupFilter}
        uniqueCities={uniqueCities} handleClearFilters={handleClearFilters}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        sourceFilter={sourceFilter} setSourceFilter={setSourceFilter}
        whatsappFilter={whatsappFilter} setWhatsappFilter={setWhatsappFilter}
        isSyncing={portalSync.isSyncing}
        syncProgress={portalSync.progress}
        syncElapsedSeconds={portalSync.elapsedSeconds}
        counts={counts}
        sourceCounts={sourceCounts}
      />

      {portalSync.error && !portalSync.isSyncing && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/90 dark:bg-rose-900/25 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertIcon size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
            <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">{portalSync.error}</p>
          </div>
          <button
            type="button"
            onClick={handleManualRefresh}
            className="shrink-0 text-xs font-bold px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}


      {/* Action Notification Banner */}
      {actionStatus && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between border flex-wrap gap-3 ${
            actionStatus.type === 'success'
              ? 'bg-emerald-50/90 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50/90 dark:bg-rose-900/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              {actionStatus.type === 'success' ? (
                <CheckIcon size={16} className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertIcon size={16} className="text-rose-600 dark:text-rose-400" />
              )}
              <p className="text-xs font-semibold">{actionStatus.message}</p>
            </div>
            {actionStatus.actionLabel && actionStatus.onAction && (
              <button
                type="button"
                onClick={actionStatus.onAction}
                className="text-xs font-extrabold px-3 py-1 bg-red-100/90 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-300 dark:border-red-900/50 text-red-800 dark:text-red-300 rounded-lg transition shadow-sm cursor-pointer"
              >
                {actionStatus.actionLabel}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActionStatus(null)}
            className="text-xs font-bold hover:opacity-75 cursor-pointer p-1"
          >
            <CloseIcon size={14} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
          </button>
        </div>
      )}

      {/* Selection Action Bar (Anchored directly above table & cards) */}
      <HistorySelectionBar
        selectedCount={selectedIds.length}
        totalCount={paginatedParcels.length}
        filteredTotalCOD={filteredTotalCOD}
        selectedTotalCOD={selectedTotalCOD}
        cancellableCount={combinedHistory.filter(p => selectedIds.includes(p.tracking) && isCancellable(p.status, p.loadsheet_generated, p.tracking)).length}
        printableCount={combinedHistory.filter(p => selectedIds.includes(p.tracking) && !isCancelledStatus(p.status) && getStatusCategory(p.status, p.tracking) !== 'returned').length}
        loadsheetableCount={
          selectedIds.length > 0
            ? combinedHistory.filter(p => selectedIds.includes(p.tracking) && getStatusCategory(p.status, p.tracking, p.hasLoadSheet) === 'pending_loadsheet').length
            : pendingLoadsheetParcels.length
        }
        onSelectAll={() => handleSelectAll(true, paginatedParcels.map(p => p.tracking))}
        onDeselectAll={() => setSelectedIds([])}
        onPrintSelected={handlePrintSelected}
        onGenerateLoadSheet={handleLoadSheetClick}
        onCancelSelected={handleCancelSelected}
        onSyncSelected={handleSyncSelected}
        onGenerateReport={() => setIsReportModalOpen(true)}
        isLoading={isLoading}
        isCancellingAll={isCancellingAll}
        cancelProgress={cancelProgress}
      />

      {/* Table view for Desktop / Card List for Mobile */}
      {paginatedParcels.length === 0 ? (
        <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <div className="flex justify-center">
            <HistoryIcon size={36} className="text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold mt-3">
            {portalSync.isSyncing ? 'Loading parcels directly from PostEx...' : 'No parcels match the filters'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {portalSync.isSyncing ? 'This may take a few seconds for busy accounts' : 'Try changing date or status filters'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Desktop Table: fixed layout, columns shrink to fit — zero horizontal scroll */}
          <div className="hidden lg:block rounded-xl border border-slate-200/80 dark:border-slate-800 w-full max-w-full overflow-hidden">
            <table className="w-full table-fixed max-w-full text-left text-xs border-collapse select-none">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#070b12] border-b border-slate-200/80 dark:border-slate-800 text-[10px] xl:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                  <th className="w-[5%] xl:w-[4%] px-1.5 py-2.5 xl:px-3 xl:py-3 text-center">
                    <input
                      type="checkbox"
                      ref={el => {
                        if (el) {
                          el.indeterminate = selectedIds.length > 0 && selectedIds.length < paginatedParcels.length
                        }
                      }}
                      checked={selectedIds.length === paginatedParcels.length && paginatedParcels.length > 0}
                      onChange={() => {
                        if (selectedIds.length > 0) {
                          handleSelectAll(false, [])
                        } else {
                          handleSelectAll(true, paginatedParcels.map(p => p.tracking))
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="w-[14%] px-2 py-2.5 xl:px-3 xl:py-3 font-bold text-slate-700 dark:text-slate-200">Customer</th>
                  <th className="w-[17%] xl:w-[18%] px-2 py-2.5 xl:px-3 xl:py-3 font-bold text-slate-700 dark:text-slate-200">Tracking Info</th>
                  <th className="w-[19%] xl:w-[15%] px-2 py-2.5 xl:px-3 xl:py-3 font-bold text-slate-700 dark:text-slate-200">Destination</th>
                  <th className="hidden xl:table-cell xl:w-[10%] px-2 py-2.5 xl:px-3 xl:py-3 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">Booking Date</th>
                  <th className="w-[12%] xl:w-[9%] px-3 py-2.5 xl:py-3 font-bold text-slate-700 dark:text-slate-200 text-right whitespace-nowrap pr-4">COD Amount</th>
                  <th className="w-[17%] xl:w-[16%] px-3 py-2.5 xl:py-3 font-bold text-slate-700 dark:text-slate-200">Status</th>
                  <th className="w-[16%] xl:w-[14%] px-1 py-2.5 xl:px-2 xl:py-3 font-bold text-slate-700 dark:text-slate-200 text-center whitespace-nowrap" title="WhatsApp: Sky Blue = Booking Only • Amber = Status Only • Emerald = Both Sent">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedParcels.map(parcel => (
                  <HistoryTableRow
                    key={parcel.tracking}
                    parcel={parcel}
                    isSelected={selectedIds.includes(parcel.tracking)}
                    onToggleSelect={handleSelectItem}
                    onSyncStatus={handleSyncStatus}
                    isSyncing={syncingTracking === parcel.tracking}
                    onCancel={handleCancelSingle}
                    onOpenAdvice={p => {
                      setAdviceParcel(p)
                      setAdviceStatusId(2)
                      setAdviceRemarks('')
                      setAdviceError(null)
                    }}
                    onOpenWhatsApp={setWhatsAppModalParcel}
                    whatsappNote={settings.whatsapp_note}
                    whatsappTemplate={settings.whatsapp_template}
                    isWhatsAppSent={waTracker.isSent(parcel.tracking) || waTracker.isSent(parcel.id)}
                    autoExpandLines={autoExpandLines}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <HistoryMobileCardList
            paginatedParcels={paginatedParcels}
            selectedIds={selectedIds}
            handleSelectAll={handleSelectAll}
            setSelectedIds={setSelectedIds}
            handleSelectItem={handleSelectItem}
            handleSyncStatus={handleSyncStatus}
            syncingTracking={syncingTracking}
            handleCancelSingle={handleCancelSingle}
            onOpenAdvice={p => { setAdviceParcel(p); setAdviceStatusId(2); setAdviceRemarks(''); setAdviceError(null) }}
            onOpenWhatsApp={setWhatsAppModalParcel}
            whatsappNote={settings.whatsapp_note}
            whatsappTemplate={settings.whatsapp_template}
            isWhatsAppSent={waTracker.isSent}
            getAlertState={waTracker.getAlertState}
            onMarkWhatsAppSent={(tracking, id) => waTracker.markSent(tracking, undefined, id)}
            onToggleWhatsAppSent={waTracker.toggleSent}
            autoExpandLines={autoExpandLines}
          />

          {/* Shared Unified Pagination */}
          <SharedPagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50, 100, 200, 300]}
            itemLabel="booked parcels"
            className="mt-4"
          />
        </div>
      )}

      {/* Shipper Advice Modal */}
      <ShipperAdviceModal
        parcel={adviceParcel}
        onClose={() => { setAdviceParcel(null); setAdviceError(null) }}
        adviceStatusId={adviceStatusId} setAdviceStatusId={setAdviceStatusId}
        adviceRemarks={adviceRemarks} setAdviceRemarks={setAdviceRemarks}
        onSubmit={handleSubmitAdvice} isSubmitting={isSubmittingAdvice} error={adviceError}
      />

      {/* Manual WhatsApp Select Modal (2 Clean Options) */}
      <WhatsAppSelectModal
        parcel={whatsAppModalParcel}
        onClose={() => setWhatsAppModalParcel(null)}
        whatsappNote={settings.whatsapp_note}
        whatsappTemplate={settings.whatsapp_template_booking || settings.whatsapp_template}
        whatsappTemplateOutForDelivery={settings.whatsapp_template_out_for_delivery}
        whatsappTemplateActionRequired={settings.whatsapp_template_action_required}
        whatsappTemplateDelivered={settings.whatsapp_template_delivered}
        isBookingSent={waTracker.isBookingSent(whatsAppModalParcel?.tracking, whatsAppModalParcel?.id)}
        isStatusSent={waTracker.isStatusSent(whatsAppModalParcel?.tracking, whatsAppModalParcel?.id)}
        onMarkSent={(tracking, id, type) => waTracker.markSent(tracking, type, id)}
      />

      {/* Load Sheet Alert Confirmation Modal */}
      <LoadSheetConfirmModal
        isOpen={isLoadSheetConfirmOpen}
        onClose={() => setIsLoadSheetConfirmOpen(false)}
        onConfirm={async () => {
          await handleGenerateLoadSheet()
          setIsLoadSheetConfirmOpen(false)
        }}
        selectedParcels={combinedHistory.filter(p => selectedIds.includes(p.tracking))}
        pickupCode={settings.postex_pickup}
        isGenerating={isLoading}
        onRemoveInvalid={() => {
          const invalidSet = new Set(
            combinedHistory
              .filter(p => selectedIds.includes(p.tracking))
              .filter(p => {
                const cat = getStatusCategory(p.status, p.tracking)
                return cat === 'cancelled' || cat === 'intransit' || cat === 'delivered' || cat === 'returned'
              })
              .map(p => p.tracking)
          )
          setSelectedIds(prev => prev.filter(id => !invalidSet.has(id)))
        }}
      />

      {/* Executive Logistics Audit & Operations Report Modal */}
      {isReportModalOpen && (
        <ExecutiveReportModal
          parcels={
            selectedIds.length > 0
              ? combinedHistory.filter(p => selectedIds.includes(p.tracking))
              : filteredParcels
          }
          activeFilters={{
            fromDate,
            toDate,
            statusFilter,
            cityFilter: 'all',
            sourceFilter,
            searchQuery
          }}
          storeName={settings.store_name || 'Zaynahs POS'}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  )
}

