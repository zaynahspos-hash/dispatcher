import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  SavedAirwayDocument, 
  getSavedAirwayDocuments, 
  deleteAirwayDocument, 
  bulkDeleteAirwayDocuments, 
  clearAllAirwayDocuments,
  syncVaultFromBookedParcels,
  DocumentCategory
} from '../../utils/localPdfVault'
import { VaultDocumentCard } from './VaultDocumentCard'
import { BookedParcel } from '../history/types'
import { Settings } from '../../utils/groqParser'
import { 
  FolderIcon, SearchIcon, TrashIcon, SyncIcon, CopyIcon, CheckIcon 
} from '../Icons'
import { useToast } from '../common/Toast'
import { SharedPagination } from '../common/SharedPagination'
import { usePagination } from '../../hooks/usePagination'

interface DocumentVaultTabProps {
  settings: Settings
  history: BookedParcel[]
  onUpdateHistory?: (updated: BookedParcel[]) => void
  userId?: string
}

type DateFilter = 'all' | 'today' | 'yesterday' | '7days' | 'month'

export const DocumentVaultTab: React.FC<DocumentVaultTabProps> = ({
  settings,
  history,
  userId
}) => {
  const [docs, setDocs] = useState<SavedAirwayDocument[]>(() => getSavedAirwayDocuments(userId))
  const [categoryFilter, setCategoryFilter] = useState<'all' | DocumentCategory>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isCopiedAll, setIsCopiedAll] = useState(false)
  const toast = useToast()

  // Refresh vault from localStorage
  const refreshVault = useCallback(() => {
    setDocs(getSavedAirwayDocuments(userId))
  }, [userId])

  // Listen to vault update events across the app
  useEffect(() => {
    refreshVault()
    const handleUpdate = () => refreshVault()
    window.addEventListener('zaynah_vault_updated', handleUpdate)
    return () => window.removeEventListener('zaynah_vault_updated', handleUpdate)
  }, [refreshVault])

  // Auto-sync if vault is currently empty and history contains booked parcels
  useEffect(() => {
    if (docs.length === 0 && history && history.length > 0) {
      const validParcels = history.filter(p => p.tracking && p.tracking.trim())
      if (validParcels.length > 0) {
        const synced = syncVaultFromBookedParcels(userId, validParcels)
        setDocs(synced)
      }
    }
  }, [docs.length, history, userId])

  // Manual trigger to package existing history into CN batches
  const handleSyncFromHistory = () => {
    if (!history || history.length === 0) {
      toast.info('No History Parcels', 'There are no booked parcels in history to sync.')
      return
    }
    const validParcels = history.filter(p => p.tracking && p.tracking.trim())
    if (validParcels.length === 0) {
      toast.warning('No Tracking Numbers', 'History parcels do not have tracking numbers yet.')
      return
    }
    const synced = syncVaultFromBookedParcels(userId, validParcels)
    setDocs(synced)
    toast.success('Vault Synced', `Indexed booked parcels from history into organized CN batches.`)
  }

  // Filter logic
  const filteredDocs = useMemo(() => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0]

    return docs.filter(doc => {
      if (categoryFilter !== 'all' && doc.type !== categoryFilter) return false
      if (dateFilter === 'today' && !doc.createdAt.startsWith(todayStr)) return false
      if (dateFilter === 'yesterday' && !doc.createdAt.startsWith(yesterdayStr)) return false
      if (dateFilter === '7days' && (now.getTime() - new Date(doc.createdAt).getTime() > 7 * 86400000)) return false
      if (dateFilter === 'month' && (now.getTime() - new Date(doc.createdAt).getTime() > 30 * 86400000)) return false

      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const matchTitle = doc.batchName.toLowerCase().includes(q)
        const matchCN = doc.trackingNumbers.some(cn => cn.toLowerCase().includes(q))
        const matchNotes = doc.notes?.toLowerCase().includes(q)
        const matchItems = doc.items?.some(i => 
          i.name?.toLowerCase().includes(q) || i.phone?.toLowerCase().includes(q) || 
          i.city?.toLowerCase().includes(q) || i.orderRef?.toLowerCase().includes(q)
        )
        if (!matchTitle && !matchCN && !matchNotes && !matchItems) return false
      }
      return true
    })
  }, [docs, categoryFilter, dateFilter, search])

  // DB-Optimized Shared Pagination
  const {
    currentPage, setCurrentPage, pageSize, setPageSize,
    totalItems, paginatedItems: paginatedDocs
  } = usePagination({ items: filteredDocs, initialPageSize: 10, storageKey: 'vault_docs' })

  // Counts for tabs
  const airwayCount = useMemo(() => docs.filter(d => d.type === 'airway_bill').length, [docs])
  const loadSheetCount = useMemo(() => docs.filter(d => d.type === 'load_sheet').length, [docs])
  const totalParcelsFiltered = useMemo(() => filteredDocs.reduce((acc, d) => acc + d.count, 0), [filteredDocs])
  const totalCodFiltered = useMemo(() => filteredDocs.reduce((acc, d) => acc + d.totalCOD, 0), [filteredDocs])

  // Single Delete
  const handleDeleteOne = (id: string) => {
    const updated = deleteAirwayDocument(userId, id)
    setDocs(updated)
    setSelectedIds(prev => prev.filter(item => item !== id))
    toast.info('Document Removed', 'Batch removed from local device vault.')
  }

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Delete ${selectedIds.length} document batch(es) from this device?`)) return
    const updated = bulkDeleteAirwayDocuments(userId, selectedIds)
    setDocs(updated)
    setSelectedIds([])
    toast.success('Bulk Delete', `Deleted ${selectedIds.length} batches.`)
  }

  // Clear All
  const handleClearAll = () => {
    if (!window.confirm('Are you sure you want to completely clear your local document vault?')) return
    clearAllAirwayDocuments(userId)
    setDocs([])
    setSelectedIds([])
    toast.warning('Vault Cleared', 'All local documents have been cleared from this device.')
  }

  // Multi-select toggle
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredDocs.length) setSelectedIds([])
    else setSelectedIds(filteredDocs.map(d => d.id))
  }

  // Copy all selected CNs
  const handleCopySelectedCNs = async () => {
    const selectedDocs = docs.filter(d => selectedIds.includes(d.id))
    const allCNs = selectedDocs.flatMap(d => d.trackingNumbers)
    if (allCNs.length === 0) return
    try {
      await navigator.clipboard.writeText(allCNs.join(', '))
      setIsCopiedAll(true)
      toast.success('Copied CNs', `${allCNs.length} tracking numbers copied to clipboard.`)
      setTimeout(() => setIsCopiedAll(false), 2000)
    } catch {
      toast.error('Copy Failed', 'Could not copy tracking numbers.')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4 w-full max-w-full min-w-0">
      
      {/* Top Header & Stat Summary */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <FolderIcon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Document Vault
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold">
                {docs.length} Batches
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Organized local storage for PostEx Airway Bills (CNs) and Load Sheets on this device.
            </p>
          </div>
        </div>

        {/* Sync from History and Clear Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSyncFromHistory}
            className="h-8.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs border border-slate-200/80 dark:border-slate-700/80"
            title="Index all existing booked parcels from history into CN batches"
          >
            <SyncIcon size={13} className="text-emerald-500" />
            <span>Sync from History</span>
          </button>

          {docs.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="h-8.5 px-3.5 rounded-full border border-rose-200/60 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium transition-all cursor-pointer active:scale-95"
            >
              Clear Vault
            </button>
          )}
        </div>
      </div>

      {/* Main Filter & Search Control Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800/90 shadow-2xs space-y-3">
        
        {/* Row 1: Document Category Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 overflow-x-auto no-scrollbar touch-pan-x">
          {[
            { id: 'all' as const, label: 'All Documents', count: docs.length },
            { id: 'airway_bill' as const, label: 'Airway Bills (CNs)', count: airwayCount },
            { id: 'load_sheet' as const, label: 'Load Sheets', count: loadSheetCount }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              className={`flex-1 min-w-[130px] h-8.5 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                categoryFilter === tab.id
                  ? 'bg-white dark:bg-[#0c121e] text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                categoryFilter === tab.id
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Row 2: Date Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Date Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none">
            {[
              { id: 'all' as DateFilter, label: 'All Dates' },
              { id: 'today' as DateFilter, label: 'Today' },
              { id: 'yesterday' as DateFilter, label: 'Yesterday' },
              { id: '7days' as DateFilter, label: 'Last 7 Days' },
              { id: 'month' as DateFilter, label: 'This Month' }
            ].map(pill => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setDateFilter(pill.id)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                  dateFilter === pill.id
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700/70'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Real-time Search Box */}
          <div className="relative w-full md:max-w-xs">
            <SearchIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by CN, Batch, Customer..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {/* Row 3: Filtered View Summary Chips (Clean Single Row on Mobile) */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2 flex-wrap text-[11px] sm:text-xs">
            <span><strong>{filteredDocs.length}</strong> batches</span>
            <span>&bull;</span>
            <span><strong>{totalParcelsFiltered}</strong> parcels</span>
            {totalCodFiltered > 0 && (
              <>
                <span>&bull;</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Rs. {totalCodFiltered.toLocaleString()}</span>
              </>
            )}
          </div>

          {filteredDocs.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="h-7 px-3 rounded-full text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer self-end sm:self-auto bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 transition-all active:scale-95"
            >
              {selectedIds.length === filteredDocs.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
      </div>

      {/* Multi-Selection Action Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 font-semibold shadow-xs">
          <span>{selectedIds.length} batch(es) selected</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySelectedCNs}
              className="h-8 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              {isCopiedAll ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
              <span>Copy Selected CNs</span>
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="h-8 px-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <TrashIcon size={13} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Documents Batch List */}
      {filteredDocs.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800/90 text-center space-y-3">
          <FolderIcon size={44} className="mx-auto text-slate-300 dark:text-slate-600 opacity-60" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No Documents Found in this Range
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {search.trim() || dateFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try clearing filters or search query to view all documents.'
              : 'Every time you print Airway Bills or generate Load Sheets, they are saved locally here.'}
          </p>
          {docs.length === 0 && history && history.length > 0 && (
            <button
              type="button"
              onClick={handleSyncFromHistory}
              className="mt-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <SyncIcon size={14} />
              <span>Package History into CN Batches</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedDocs.map(doc => (
            <VaultDocumentCard
              key={doc.id}
              doc={doc}
              isSelected={selectedIds.includes(doc.id)}
              onToggleSelect={handleToggleSelect}
              onDelete={handleDeleteOne}
              postexToken={settings.postex_token}
              defaultPickupCode={settings.postex_pickup}
            />
          ))}

          {/* Shared Unified Pagination */}
          <SharedPagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 25, 50]}
            itemLabel="document batches"
            className="mt-3"
          />
        </div>
      )}

    </div>
  )
}
