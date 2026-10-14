import { useState, useMemo } from 'react'
import { Settings } from '../utils/groqParser'
import { PrintIcon, SyncIcon, CancelIcon, HistoryIcon, AlertIcon } from './Icons'
import { BookedParcel, StatusFilterType, getStatusCategory, isUnderReview } from './history/types'
import { useBookedHistoryOperations } from '../hooks/useBookedHistoryOperations'
import { HistoryFilterBar } from './history/HistoryFilterBar'
import { HistoryTableRow } from './history/HistoryTableRow'
import { HistoryMobileCard } from './history/HistoryMobileCard'
import { ShipperAdviceModal } from './history/ShipperAdviceModal'

export type { BookedParcel }

interface BookedHistoryProps {
  settings: Settings
  history: BookedParcel[]
  onUpdateHistory: (updated: BookedParcel[]) => void
}

export function BookedHistory({ settings, history, onUpdateHistory }: BookedHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('pending_loadsheet')
  const [searchQuery, setSearchQuery] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [statusSelect, setStatusSelect] = useState('all')
  const [pickupFilter, setPickupFilter] = useState('all')
  const [pageSize, setPageSize] = useState<number>(100)

  const handleClearFilters = () => {
    setSearchQuery('')
    setFromDate('')
    setToDate('')
    setStatusSelect('all')
    setPickupFilter('all')
  }

  // Dynamic counts for status tabs based on history
  const counts = useMemo(() => {
    const all = history.length
    let pendingLoadsheet = 0
    let booked = 0
    let inTransit = 0
    let delivered = 0
    let returned = 0
    let cancelled = 0

    history.forEach(h => {
      const cat = getStatusCategory(h.status, h.tracking)
      if (cat === 'pending_loadsheet') pendingLoadsheet++
      else if (cat === 'booked') booked++
      else if (cat === 'intransit') inTransit++
      else if (cat === 'delivered') delivered++
      else if (cat === 'returned') returned++
      else if (cat === 'cancelled') cancelled++
    })

    return { all, pendingLoadsheet, booked, inTransit, delivered, returned, cancelled }
  }, [history])

  // Filter logic
  const filteredParcels = useMemo(() => {
    return history.filter(item => {
      if (statusFilter !== 'all') {
        const cat = getStatusCategory(item.status, item.tracking)
        if (cat !== statusFilter) return false
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim()
        const matchesOrder = item.id.toLowerCase().includes(q)
        const matchesTracking = item.tracking.toLowerCase().includes(q)
        const matchesName = item.name.toLowerCase().includes(q)
        const matchesPhone = item.phone.toLowerCase().includes(q)
        if (!matchesOrder && !matchesTracking && !matchesName && !matchesPhone) {
          return false
        }
      }

      const bDate = new Date(item.bookingDate)
      const itemTime = bDate.getTime()
      if (fromDate) {
        const start = new Date(fromDate)
        start.setHours(0, 0, 0, 0)
        if (itemTime < start.getTime()) return false
      }
      if (toDate) {
        const end = new Date(toDate)
        end.setHours(23, 59, 59, 999)
        if (itemTime > end.getTime()) return false
      }

      if (statusSelect !== 'all') {
        const sel = statusSelect.toLowerCase()
        if (sel === 'under_review') {
          if (!isUnderReview(item.status)) return false
        } else {
          const statusLower = item.status.toLowerCase()
          if (!statusLower.includes(sel)) return false
        }
      }

      if (pickupFilter !== 'all') {
        if (item.city.toUpperCase() !== pickupFilter.toUpperCase()) return false
      }

      return true
    }).sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
  }, [history, statusFilter, searchQuery, fromDate, toDate, statusSelect, pickupFilter])

  // PostEx operations hook
  const {
    selectedIds,
    setSelectedIds,
    handleSelectAll,
    handleSelectItem,
    isLoading,
    actionStatus,
    setActionStatus,
    syncingTracking,
    isSyncingAll,
    syncProgress,
    isCancellingAll,
    cancelProgress,
    adviceParcel,
    setAdviceParcel,
    adviceStatusId,
    setAdviceStatusId,
    adviceRemarks,
    setAdviceRemarks,
    isSubmittingAdvice,
    adviceError,
    setAdviceError,
    handlePrintSelected,
    handleGenerateLoadSheet,
    handleCancelSelected,
    handleCancelSingle,
    handleSyncStatus,
    handleRefreshAll,
    handleSubmitAdvice
  } = useBookedHistoryOperations({
    settings,
    history,
    onUpdateHistory,
    filteredParcels
  })

  // Pagination logic
  const paginatedParcels = useMemo(() => {
    return filteredParcels.slice(0, pageSize)
  }, [filteredParcels, pageSize])

  const hasMore = filteredParcels.length > pageSize

  const handleSaveName = (tracking: string, newName: string) => {
    const updated = history.map(item => {
      if (item.tracking === tracking) {
        return { ...item, name: newName }
      }
      return item
    })
    onUpdateHistory(updated)
  }

  const uniqueCities = useMemo(() => {
    const citiesSet = new Set(history.map(item => item.city.toUpperCase().trim()))
    return Array.from(citiesSet).filter(Boolean).sort()
  }, [history])

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-gray-700/80 p-4 sm:p-6 transition-colors duration-200">
      {/* Header and Sync Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-gray-700 pb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100">Booked Parcels History</h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 font-medium">
            Showing {filteredParcels.length} booked orders stored in this browser
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isSyncingAll || isLoading}
            className="bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 disabled:opacity-50 text-[#ffffff] font-extrabold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            {isSyncingAll ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{syncProgress}</span>
              </>
            ) : (
              <>
                <SyncIcon size={14} />
                <span>Refresh Active Statuses</span>
              </>
            )}
          </button>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-xl border border-blue-100 dark:border-blue-900/50 text-sm animate-fade-in">
              <span className="font-semibold text-blue-700 dark:text-blue-300">{selectedIds.length} selected</span>
              <button
                type="button"
                onClick={handlePrintSelected}
                disabled={isLoading}
                className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 text-[#ffffff] font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <PrintIcon size={12} />
                <span>Print Labels</span>
              </button>
              <button
                type="button"
                onClick={handleGenerateLoadSheet}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-[#ffffff] font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Generate Load Sheet PDF"
              >
                <PrintIcon size={12} />
                <span>Load Sheet</span>
              </button>
              <button
                type="button"
                onClick={handleCancelSelected}
                disabled={isLoading}
                className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-[#ffffff] font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isCancellingAll ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-[#ffffff]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>{cancelProgress}</span>
                  </>
                ) : (
                  <>
                    <CancelIcon size={12} />
                    <span>Cancel Bookings</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filter Component */}
      <HistoryFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        statusSelect={statusSelect}
        setStatusSelect={setStatusSelect}
        pickupFilter={pickupFilter}
        setPickupFilter={setPickupFilter}
        uniqueCities={uniqueCities}
        handleClearFilters={handleClearFilters}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
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
                <span className="text-emerald-600 dark:text-emerald-400 text-base font-bold">✓</span>
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
            ✕
          </button>
        </div>
      )}

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
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-150 dark:border-gray-700">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-150 dark:border-gray-700">
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedParcels.length && paginatedParcels.length > 0}
                      onChange={e => handleSelectAll(e.target.checked, paginatedParcels.map(p => p.tracking))}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 dark:text-blue-400 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 font-bold text-gray-700 dark:text-gray-200">Consignee</th>
                  <th className="p-4 font-bold text-gray-700 dark:text-gray-200">Tracking Info</th>
                  <th className="p-4 font-bold text-gray-700 dark:text-gray-200">Destination</th>
                  <th className="p-4 font-bold text-gray-700 dark:text-gray-200">Booking Date</th>
                  <th className="p-4 font-bold text-gray-700 dark:text-gray-200 text-right">COD Amount</th>
                  <th className="p-4 font-bold text-gray-700 dark:text-gray-200">Status</th>
                  <th className="p-4 font-bold text-gray-700 dark:text-gray-200 text-center w-36">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedParcels.map(parcel => (
                  <HistoryTableRow
                    key={parcel.tracking}
                    parcel={parcel}
                    isSelected={selectedIds.includes(parcel.tracking)}
                    onToggleSelect={handleSelectItem}
                    onSaveName={handleSaveName}
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
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="lg:hidden flex flex-col gap-3">
            {/* Mobile Select All Bar */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-900 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-1">
              <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-gray-700 dark:text-gray-200 select-none">
                <input
                  type="checkbox"
                  checked={selectedIds.length === paginatedParcels.length && paginatedParcels.length > 0}
                  onChange={e => handleSelectAll(e.target.checked, paginatedParcels.map(p => p.tracking))}
                  className="w-4.5 h-4.5 rounded border-gray-300 text-blue-600 dark:text-blue-400 focus:ring-blue-500 cursor-pointer"
                />
                <span>Select All ({selectedIds.length}/{paginatedParcels.length} selected)</span>
              </label>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-extrabold cursor-pointer transition"
                >
                  Deselect All
                </button>
              )}
            </div>

            {paginatedParcels.map(parcel => (
              <HistoryMobileCard
                key={parcel.tracking}
                parcel={parcel}
                isSelected={selectedIds.includes(parcel.tracking)}
                onToggleSelect={handleSelectItem}
                onSaveName={handleSaveName}
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
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <button
              type="button"
              onClick={() => setPageSize(prev => prev + 100)}
              className="mt-4 w-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-xl border border-gray-200 dark:border-gray-700 transition text-xs shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
            >
              <SyncIcon size={14} />
              <span>Load More ({filteredParcels.length - pageSize} remaining)</span>
            </button>
          )}
        </div>
      )}

      {/* Shipper Advice Modal */}
      <ShipperAdviceModal
        parcel={adviceParcel}
        onClose={() => {
          setAdviceParcel(null)
          setAdviceError(null)
        }}
        adviceStatusId={adviceStatusId}
        setAdviceStatusId={setAdviceStatusId}
        adviceRemarks={adviceRemarks}
        setAdviceRemarks={setAdviceRemarks}
        onSubmit={handleSubmitAdvice}
        isSubmitting={isSubmittingAdvice}
        error={adviceError}
      />
    </div>
  )
}
