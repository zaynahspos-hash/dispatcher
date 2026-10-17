import React, { useState } from 'react'
import { 
  SavedAirwayDocument, 
  downloadSavedPdf 
} from '../../utils/localPdfVault'
import { 
  DownloadIcon, 
  TrashIcon, 
  CopyIcon, 
  FileTextIcon, 
  CheckIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  ExternalLinkIcon
} from '../Icons'
import { printLabels, generateLoadSheet } from '../../utils/postexApi'
import { useToast } from '../common/Toast'

interface VaultDocumentCardProps {
  doc: SavedAirwayDocument
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onDelete: (id: string) => void
  postexToken?: string
  defaultPickupCode?: string
}

export const VaultDocumentCard: React.FC<VaultDocumentCardProps> = ({
  doc,
  isSelected,
  onToggleSelect,
  onDelete,
  postexToken,
  defaultPickupCode
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const toast = useToast()

  const isLoadSheet = doc.type === 'load_sheet'
  const dateFormatted = new Date(doc.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  // Handle re-download or live re-print via PostEx
  const handlePrintOrDownload = async () => {
    // Case 1: Base64 PDF is cached locally
    if (doc.pdfBase64) {
      const ok = downloadSavedPdf(doc)
      if (ok) {
        toast.success('Downloaded', `${isLoadSheet ? 'Load sheet' : 'Airway bill'} PDF opened.`)
        return
      }
    }

    // Case 2: Live print via PostEx token
    if (!postexToken) {
      toast.error('Token Missing', 'PostEx API token is required to re-fetch document PDF.')
      return
    }

    setIsPrinting(true)
    try {
      if (isLoadSheet) {
        const code = doc.pickupCode || defaultPickupCode || ''
        await generateLoadSheet(postexToken, code, doc.trackingNumbers)
        toast.success('Load Sheet Generated', `PostEx load sheet for ${doc.count} parcels opened.`)
      } else {
        const ok = await printLabels(postexToken, doc.trackingNumbers)
        if (ok) {
          toast.success('Airway Bills Generated', `PostEx airway bills for ${doc.count} parcels opened.`)
        } else {
          toast.error('Print Error', 'Failed to fetch airway bills from PostEx.')
        }
      }
    } catch (err: any) {
      toast.error('PostEx Error', err?.message || 'Could not retrieve PDF from PostEx.')
    } finally {
      setIsPrinting(false)
    }
  }

  // Copy tracking numbers to clipboard
  const handleCopyCNs = async () => {
    try {
      const text = doc.trackingNumbers.join(', ')
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      toast.info('Copied to Clipboard', `${doc.count} CN tracking numbers copied.`)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast.error('Clipboard Error', 'Could not copy tracking numbers.')
    }
  }

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/40 shadow-xs'
          : 'bg-white dark:bg-[#0c121e] border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-2xs'
      }`}
    >
      {/* Main Card Header / Row */}
      <div className="p-3.5 sm:p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Multi-select Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(doc.id)}
            className="mt-1 w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
            aria-label={`Select ${doc.batchName}`}
          />

          <div className="min-w-0 flex-1">
            {/* Title & Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Pill */}
              <span
                className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider ${
                  isLoadSheet
                    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/25'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                }`}
              >
                <FileTextIcon size={11} />
                <span>{isLoadSheet ? 'Load Sheet' : 'Airway Bill'}</span>
              </span>

              {/* Batch Name */}
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {doc.batchName}
              </h3>

              {/* Parcels Count Chip */}
              <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                {doc.count} {doc.count === 1 ? 'Parcel' : 'Parcels'}
              </span>

              {/* COD Amount Chip */}
              {doc.totalCOD > 0 && (
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                  COD: Rs. {doc.totalCOD.toLocaleString()}
                </span>
              )}

              {/* Pickup Code Chip for Loadsheets */}
              {doc.pickupCode && (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                  Pickup: {doc.pickupCode}
                </span>
              )}
            </div>

            {/* Tracking Numbers Quick Preview — Trackable Links on Click */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {doc.trackingNumbers.slice(0, 5).map(cn => (
                <a
                  key={cn}
                  href={`https://postex.pk/tracking?cn=${cn}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-500/10 dark:bg-slate-800/80 dark:hover:bg-emerald-500/15 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500/30 transition-all cursor-pointer active:scale-95 group/cn"
                  title={`Track CN ${cn} on PostEx`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{cn}</span>
                  <ExternalLinkIcon size={9} className="opacity-60 group-hover/cn:opacity-100 text-emerald-500 transition-opacity" />
                </a>
              ))}
              {doc.trackingNumbers.length > 5 && (
                <span className="text-[10px] text-slate-400 font-semibold px-1">
                  +{doc.trackingNumbers.length - 5} more
                </span>
              )}
            </div>

            {/* Timestamp and origin info */}
            <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              <span>Saved: {dateFormatted}</span>
              {doc.notes && (
                <>
                  <span>&bull;</span>
                  <span>{doc.notes}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar — Apple iOS Native Styling */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 w-full md:w-auto justify-between md:justify-end">
          {/* Toggle Orders Detail Accordion */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="View parcels in this batch"
          >
            {isExpanded ? <ChevronDownIcon size={13} /> : <ChevronRightIcon size={13} />}
            <span>{isExpanded ? 'Hide Details' : 'View Orders'}</span>
          </button>

          {/* Copy All CNs Button */}
          <button
            type="button"
            onClick={handleCopyCNs}
            className="h-8.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Copy all tracking numbers"
          >
            {isCopied ? <CheckIcon size={13} className="text-emerald-500" /> : <CopyIcon size={13} />}
            <span>{isCopied ? 'Copied' : 'Copy CNs'}</span>
          </button>

          {/* Re-Download / Print PDF Button */}
          <button
            type="button"
            onClick={handlePrintOrDownload}
            disabled={isPrinting}
            className={`h-8.5 px-4 rounded-full text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${
              isLoadSheet
                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
            }`}
            title={doc.pdfBase64 ? 'Download saved PDF document' : 'Fetch and open PDF from PostEx'}
          >
            <DownloadIcon size={13} />
            <span>{isPrinting ? 'Processing...' : (doc.pdfBase64 ? 'Download PDF' : 'Print PDF')}</span>
          </button>

          {/* Delete Single Batch Button */}
          <button
            type="button"
            onClick={() => onDelete(doc.id)}
            title="Delete this batch from device storage"
            className="h-8.5 w-8.5 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-500 hover:text-rose-600 border border-rose-200/60 dark:border-rose-900/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
          >
            <TrashIcon size={13} />
          </button>
        </div>
      </div>

      {/* Expandable Order Details Table / List */}
      {isExpanded && (
        <div className="border-t border-slate-200/90 dark:border-slate-800/90 bg-slate-50/70 dark:bg-slate-900/60 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Orders Included in this Document ({doc.count})
            </span>
            <button
              type="button"
              onClick={handleCopyCNs}
              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Copy All ({doc.count})
            </button>
          </div>

          {doc.items && doc.items.length > 0 ? (
            <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60 max-h-56 overflow-y-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c121e]">
              {doc.items.map((item, idx) => (
                <div key={`${item.tracking}-${idx}`} className="p-2.5 sm:p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={`https://postex.pk/tracking?cn=${item.tracking}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 text-xs tracking-tight hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                      title={`Track CN ${item.tracking} on PostEx`}
                    >
                      <span>{item.tracking}</span>
                      <ExternalLinkIcon size={10} className="text-emerald-500 opacity-70" />
                    </a>
                    {item.amount !== undefined && (
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0 text-xs">
                        Rs. {item.amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate font-medium">
                      {[item.name, item.city, item.phone].filter(Boolean).join(' • ')}
                    </span>
                    {item.orderRef && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                        Ref: {item.orderRef}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {doc.trackingNumbers.map((cn, idx) => (
                <a
                  key={`${cn}-${idx}`}
                  href={`https://postex.pk/tracking?cn=${cn}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0c121e] hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 font-mono text-xs text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-between transition-all cursor-pointer"
                  title={`Track CN ${cn} on PostEx`}
                >
                  <span>{cn}</span>
                  <ExternalLinkIcon size={11} className="text-emerald-500 opacity-70" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
