import React from 'react'
import { BookedParcel, getStatusCategory } from './types'
import { PrintIcon, CloseIcon, AlertIcon } from '../Icons'

interface LoadSheetConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  selectedParcels: BookedParcel[]
  pickupCode?: string
  isGenerating?: boolean
  onRemoveInvalid?: () => void
}

export const LoadSheetConfirmModal: React.FC<LoadSheetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedParcels,
  pickupCode,
  isGenerating = false,
  onRemoveInvalid
}) => {
  if (!isOpen || selectedParcels.length === 0) return null

  const invalidParcels = selectedParcels.filter(p => {
    const cat = getStatusCategory(p.status, p.tracking)
    return cat === 'cancelled' || cat === 'intransit' || cat === 'delivered' || cat === 'returned'
  })

  const validParcels = selectedParcels.filter(p => !invalidParcels.some(ip => ip.tracking === p.tracking))
  const totalCOD = validParcels.reduce((sum, p) => sum + (Number(p.total) || 0), 0)


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-150">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={isGenerating ? undefined : onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 z-10 space-y-4 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <PrintIcon size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Generate Load Sheet?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official PostEx courier handover sheet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-xl text-center">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Parcels</span>
            <span className="text-base font-mono font-black text-slate-900 dark:text-white">
              {validParcels.length}
              {invalidParcels.length > 0 && (
                <span className="text-xs text-amber-500 font-semibold ml-1">({invalidParcels.length} invalid)</span>
              )}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total COD</span>
            <span className="text-base font-mono font-black text-emerald-600 dark:text-emerald-400 truncate block">
              Rs. {totalCOD.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pickup</span>
            <span className="text-base font-mono font-black text-slate-700 dark:text-slate-300 truncate block">
              {pickupCode || 'Default'}
            </span>
          </div>
        </div>

        {/* Invalid Parcels Warning Banner */}
        {invalidParcels.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2 min-w-0">
              <AlertIcon size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200">
                <p className="font-bold">
                  {invalidParcels.length} parcel(s) ineligible for load sheet
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  Orders that are cancelled, in-transit, or already delivered cannot be added.
                </p>
              </div>
            </div>
            {onRemoveInvalid && (
              <button
                type="button"
                onClick={onRemoveInvalid}
                className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition cursor-pointer"
              >
                Exclude
              </button>
            )}
          </div>
        )}

        {/* Selected Parcels Quick Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-0.5">
            <span>Orders to Include ({validParcels.length})</span>
            <span className="text-[10px] text-slate-400 font-mono">PDF Manifest</span>
          </div>
          
          <div className="max-h-40 overflow-y-auto no-scrollbar divide-y divide-slate-100 dark:divide-slate-800/60 border border-slate-100 dark:border-slate-800/80 rounded-xl bg-white dark:bg-slate-950/40">
            {selectedParcels.map((p, idx) => {
              const isInvalid = invalidParcels.some(ip => ip.tracking === p.tracking)
              return (
                <div
                  key={p.tracking || idx}
                  className={`p-2.5 flex items-center justify-between gap-2 text-xs ${
                    isInvalid ? 'bg-amber-50/50 dark:bg-amber-950/20 opacity-75' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {p.name || 'Valued Customer'}
                      </p>
                      {isInvalid && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
                          {p.status || 'Invalid'}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
                      {p.tracking} {p.city ? `• ${p.city}` : ''}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                    Rs. {Number(p.total || 0).toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Explanatory Notice */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-emerald-500/[0.04] dark:bg-emerald-950/[0.1] border border-emerald-500/20 rounded-xl p-2.5 leading-relaxed">
          Generating this load sheet will officially assign these orders to courier handover. The PDF will be saved to your <strong className="text-emerald-600 dark:text-emerald-400">Document Vault</strong> and status will be updated to <strong className="text-slate-800 dark:text-slate-200">BOOKED</strong>.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isGenerating || validParcels.length === 0 || invalidParcels.length > 0}
            className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <PrintIcon size={14} />
                <span>Generate Load Sheet ({validParcels.length})</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
