import React, { useState, useMemo } from 'react'
import { 
  FolderIcon, 
  CloseIcon, 
  TrashIcon, 
  DownloadIcon, 
  SearchIcon, 
  CheckIcon 
} from '../Icons'
import { 
  SavedAirwayDocument, 
  getSavedAirwayDocuments, 
  deleteAirwayDocument, 
  bulkDeleteAirwayDocuments, 
  clearAllAirwayDocuments, 
  downloadSavedPdf 
} from '../../utils/localPdfVault'
import { useToast } from '../common/Toast'

interface AirwayVaultModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

type DateFilter = 'all' | 'today' | '7days' | 'month'

export const AirwayVaultModal: React.FC<AirwayVaultModalProps> = ({ userId, isOpen, onClose }) => {
  const [docs, setDocs] = useState<SavedAirwayDocument[]>(() => getSavedAirwayDocuments(userId))
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const toast = useToast()

  // Refresh docs when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setDocs(getSavedAirwayDocuments(userId))
      setSelectedIds([])
    }
  }, [isOpen, userId])

  // Filtered documents
  const filteredDocs = useMemo(() => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    return docs.filter(doc => {
      // Date filter
      if (dateFilter === 'today') {
        if (!doc.createdAt.startsWith(todayStr)) return false
      } else if (dateFilter === '7days') {
        const diffMs = now.getTime() - new Date(doc.createdAt).getTime()
        if (diffMs > 7 * 24 * 60 * 60 * 1000) return false
      } else if (dateFilter === 'month') {
        const diffMs = now.getTime() - new Date(doc.createdAt).getTime()
        if (diffMs > 30 * 24 * 60 * 60 * 1000) return false
      }

      // Search query (matches tracking numbers or batch name)
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesName = doc.batchName.toLowerCase().includes(q)
        const matchesCN = doc.trackingNumbers.some(cn => cn.toLowerCase().includes(q))
        if (!matchesName && !matchesCN) return false
      }

      return true
    })
  }, [docs, search, dateFilter])

  if (!isOpen) return null

  function handleDeleteOne(id: string) {
    const updated = deleteAirwayDocument(userId, id)
    setDocs(updated)
    setSelectedIds(prev => prev.filter(item => item !== id))
    toast.info('Document Deleted', 'Airway bill removed from local vault.')
  }

  function handleBulkDelete() {
    if (selectedIds.length === 0) return
    const updated = bulkDeleteAirwayDocuments(userId, selectedIds)
    setDocs(updated)
    setSelectedIds([])
    toast.success('Bulk Delete', `Removed ${selectedIds.length} airway bills from vault.`)
  }

  function handleClearAll() {
    if (!window.confirm('Are you sure you want to clear all locally saved Airway Bills?')) return
    clearAllAirwayDocuments(userId)
    setDocs([])
    setSelectedIds([])
    toast.warning('Vault Cleared', 'All local CN documents have been purged from this device.')
  }

  function handleToggleSelect(id: string) {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  function handleSelectAll() {
    if (selectedIds.length === filteredDocs.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredDocs.map(d => d.id))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-none animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0c121e] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FolderIcon size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Airway Bill & CN Document Vault
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  {docs.length} Saved
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Persistent local file storage for generated PostEx Airway Bills on this device.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-[#070b12] border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
          
          {/* Date Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              { id: 'all' as DateFilter, label: 'All Dates' },
              { id: 'today' as DateFilter, label: 'Today' },
              { id: '7days' as DateFilter, label: 'Last 7 Days' },
              { id: 'month' as DateFilter, label: 'This Month' },
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setDateFilter(pill.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                  dateFilter === pill.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by CN or Batch..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Multi-Select Action Bar (Shows when items selected) */}
        {selectedIds.length > 0 && (
          <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
            <span>{selectedIds.length} documents selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <TrashIcon size={13} />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Document List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <FolderIcon size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Airway Bills in this Range</p>
              <p className="text-xs text-slate-400 mt-1">
                Generated PDF labels from PostEx will be saved here automatically.
              </p>
            </div>
          ) : (
            filteredDocs.map(doc => {
              const isSelected = selectedIds.includes(doc.id)
              const dateFormatted = new Date(doc.createdAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short'
              })

              return (
                <div
                  key={doc.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-500/5 border-emerald-500/40 shadow-xs'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(doc.id)}
                      className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {doc.batchName}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                          {doc.count} Parcels
                        </span>
                        {doc.totalCOD > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
                            Rs. {doc.totalCOD.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Tracking Numbers Preview */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {doc.trackingNumbers.slice(0, 4).map(cn => (
                          <span key={cn} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {cn}
                          </span>
                        ))}
                        {doc.trackingNumbers.length > 4 && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            +{doc.trackingNumbers.length - 4} more
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                        Saved: {dateFormatted}
                      </p>
                    </div>
                  </div>

                  {/* Actions for this document */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    {doc.pdfBase64 && (
                      <button
                        onClick={() => {
                          const ok = downloadSavedPdf(doc)
                          if (ok) toast.success('Downloaded', 'PDF Airway Bill saved.')
                          else toast.error('Download Failed', 'Could not open PDF file.')
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <DownloadIcon size={14} />
                        <span>Re-download</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteOne(doc.id)}
                      title="Delete from local vault"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070b12] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            {filteredDocs.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                {selectedIds.length === filteredDocs.length ? 'Deselect All' : 'Select All'}
              </button>
            )}

            {docs.length > 0 && (
              <button
                onClick={handleClearAll}
                className="ml-3 font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Clear Entire Vault
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold cursor-pointer transition"
          >
            Close Vault
          </button>
        </div>

      </div>
    </div>
  )
}
