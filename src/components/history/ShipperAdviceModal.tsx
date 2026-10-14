import React from 'react'
import { InfoIcon, SyncIcon, HistoryIcon, AlertIcon } from '../Icons'
import { BookedParcel } from './types'

interface ShipperAdviceModalProps {
  parcel: BookedParcel | null
  onClose: () => void
  adviceStatusId: number
  setAdviceStatusId: (statusId: number) => void
  adviceRemarks: string
  setAdviceRemarks: (remarks: string) => void
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
  error: string | null
}

export function ShipperAdviceModal({
  parcel,
  onClose,
  adviceStatusId,
  setAdviceStatusId,
  adviceRemarks,
  setAdviceRemarks,
  onSubmit,
  isSubmitting,
  error
}: ShipperAdviceModalProps) {
  if (!parcel) return null

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <InfoIcon size={18} className="text-amber-500 dark:text-amber-400" /> Submit Shipper Advice
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              CN: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{parcel.tracking}</span> ({parcel.name})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-950/50 hover:bg-gray-200 dark:hover:bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center transition font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wide">Select Advice Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAdviceStatusId(2)}
                className={`py-3 px-4 rounded-xl border text-center font-bold text-xs transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  adviceStatusId === 2
                    ? 'border-blue-500 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
                }`}
              >
                <SyncIcon size={18} />
                <span>Retry Attempt</span>
              </button>
              <button
                type="button"
                onClick={() => setAdviceStatusId(1)}
                className={`py-3 px-4 rounded-xl border text-center font-bold text-xs transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  adviceStatusId === 1
                    ? 'border-rose-500 dark:border-rose-600 bg-rose-50/50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
                }`}
              >
                <HistoryIcon size={18} />
                <span>Return Requested</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wide">Remarks / Instructions (Required)</label>
            <textarea
              value={adviceRemarks}
              onChange={e => setAdviceRemarks(e.target.value)}
              rows={3}
              placeholder={
                adviceStatusId === 2
                  ? "E.g., Customer requested delivery tomorrow, please re-attempt."
                  : "E.g., Customer refused delivery, please request return."
              }
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              required
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50 flex items-center gap-1.5">
              <AlertIcon size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-750 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !adviceRemarks.trim()}
              className="px-4 py-2.5 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 disabled:opacity-50 text-[#ffffff] rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/15 cursor-pointer"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Advice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
