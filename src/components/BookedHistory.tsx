import { useState, useMemo, useEffect } from 'react'
import { Settings } from '../utils/groqParser'
import { SyncIcon, HistoryIcon, AlertIcon, CheckIcon, CloseIcon, RefreshIcon } from './Icons'
import { BookedParcel, StatusFilterType, isCancellable } from './history/types'
import { useBookedHistoryOperations } from '../hooks/useBookedHistoryOperations'
import { useBookedHistoryFilter } from '../hooks/useBookedHistoryFilter'
import { HistoryFilterBar } from './history/HistoryFilterBar'
import { HistorySelectionBar } from './history/HistorySelectionBar'
import { HistoryTableRow } from './history/HistoryTableRow'
import { HistoryMobileCardList } from './history/HistoryMobileCardList'
import { ShipperAdviceModal } from './history/ShipperAdviceModal'
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

  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('pending_loadsheet')
  const [searchQuery, setSearchQuery] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [statusSelect, setStatusSelect] = useState('all')
  const [pickupFilter, setPickupFilter] = useState('all')
  const [whatsappFilter, setWhatsappFilter] = useState<'all' | 'pending' | 'sent'>('all')
  const waTracker = useWhatsAppSentTracker(userId || settings?.postex_token, history, onUpdateHistory)

  const handleClearFilters = () => {
    setSearchQuery(''); setFromDate(''); setToDate(''); setStatusSelect('all'); setPickupFilter('all'); setWhatsappFilter('all')
  }

  // Filter and dynamic counts hook
  const { counts, filteredParcels } = useBookedHistoryFilter({
    history, statusFilter, searchQuery, fromDate, toDate,
    statusSelect, pickupFilter, whatsappFilter, isWhatsAppSent: waTracker.isSent
  })

  // PostEx operations hook
  const {
    selectedIds, setSelectedIds, handleSelectAll, handleSelectItem, isLoading,
    actionStatus, setActionStatus, syncingTracking, isSyncingAll, syncProgress,
    isCancellingAll, cancelProgress, adviceParcel, setAdviceParcel,
    adviceStatusId, setAdviceStatusId, adviceRemarks, setAdviceRemarks,
    isSubmittingAdvice, adviceError, setAdviceError, handlePrintSelected,
    handleGenerateLoadSheet, handleCancelSelected, handleCancelSingle,
    handleSyncStatus, handleRefreshAll, handleSubmitAdvice
  } = useBookedHistoryOperations({
    settings, history, onUpdateHistory, filteredParcels
  })

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
    const citiesSet = new Set(history.map(item => item.city.toUpperCase().trim()))
    return Array.from(citiesSet).filter(Boolean).sort()
  }, [history])

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
      {/* Header and Sync Actions */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Booked History</span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {filteredParcels.length}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleAutoExpandLines}
            className={`h-8 px-2.5 sm:px-3 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap ${
              autoExpandLines
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>{autoExpandLines ? 'Collapse All' : 'Expand All'}</span>
          </button>

          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isSyncingAll || isLoading}
            className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98 shrink-0"
          >
            {isSyncingAll ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-[11px]">{syncProgress}</span>
              </>
            ) : (
              <>
                <RefreshIcon size={13} />
                <span>Refresh Statuses</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filter Component */}
      <HistoryFilterBar
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate}
        statusSelect={statusSelect} setStatusSelect={setStatusSelect}
        pickupFilter={pickupFilter} setPickupFilter={setPickupFilter}
        uniqueCities={uniqueCities} handleClearFilters={handleClearFilters}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        whatsappFilter={whatsappFilter} setWhatsappFilter={setWhatsappFilter}
        counts={counts}
      />

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
        cancellableCount={history.filter(p => selectedIds.includes(p.tracking) && isCancellable(p.status, p.loadsheet_generated, p.tracking)).length}
        onDeselectAll={() => setSelectedIds([])}
        onPrintSelected={handlePrintSelected}
        onGenerateLoadSheet={handleGenerateLoadSheet}
        onCancelSelected={handleCancelSelected}
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
          <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold mt-3">No parcels match the filters</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try changing date or status filters</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Desktop Table: 100% Non-Movable Responsive Layout */}
          <div className="hidden lg:block overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 w-full max-w-full">
            <table className="w-full min-w-0 max-w-full text-left text-xs border-collapse table-fixed select-none">
              <colgroup>
                <col style={{ width: '40px' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '29%' }} />
                <col style={{ width: '7%' }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-50 dark:bg-[#070b12] border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                  <th className="p-3 text-center">
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
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-200">Consignee</th>
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-200">Tracking Info</th>
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-200">Destination</th>
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-200">Booking Date</th>
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-200 text-right">COD Amount</th>
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-200">Status</th>
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-200 text-center">Action</th>
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
                    whatsappNote={settings.whatsapp_note}
                    whatsappTemplate={settings.whatsapp_template}
                    isWhatsAppSent={waTracker.isSent(parcel.tracking) || waTracker.isSent(parcel.id)}
                    onMarkWhatsAppSent={waTracker.markSent}
                    onToggleWhatsAppSent={waTracker.toggleSent}
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
            whatsappNote={settings.whatsapp_note}
            whatsappTemplate={settings.whatsapp_template}
            isWhatsAppSent={waTracker.isSent}
            onMarkWhatsAppSent={waTracker.markSent}
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
            pageSizeOptions={[10, 25, 50, 100]}
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
    </div>
  )
}
