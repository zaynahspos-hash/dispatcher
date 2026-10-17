import React from 'react'
import { UserProfile } from './types'

interface AdminDeleteMerchantModalProps {
  isOpen: boolean
  merchant: UserProfile | null
  confirmText: string
  onConfirmTextChange: (text: string) => void
  onCancel: () => void
  onConfirm: () => void
  isBusy: boolean
}

export const AdminDeleteMerchantModal: React.FC<AdminDeleteMerchantModalProps> = ({
  isOpen,
  merchant,
  confirmText,
  onConfirmTextChange,
  onCancel,
  onConfirm,
  isBusy
}) => {
  if (!isOpen || !merchant) return null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#0f172a] border border-rose-500/30 rounded-2xl p-5 shadow-2xl">
        <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 mb-1">
          Permanently Delete Merchant?
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
          This will cascade wipe <strong className="text-slate-900 dark:text-white">{merchant.email}</strong> across all databases and storage buckets:
        </p>
        <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 mb-4 list-disc pl-4">
          <li>All dispatch orders & booked parcels history</li>
          <li>Customer directory records & phone numbers</li>
          <li>PostEx & AI credentials, tokens & settings</li>
          <li>Storage bucket files & avatars</li>
          <li>Authentication account & identities</li>
        </ul>
        <div className="space-y-1.5 mb-4">
          <label className="text-[10px] uppercase font-bold text-slate-400">
            Type DELETE to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={e => onConfirmTextChange(e.target.value)}
            placeholder="DELETE"
            className="w-full h-9 border border-rose-300 dark:border-rose-900/60 rounded-lg px-3 text-xs bg-slate-50 dark:bg-slate-900 font-mono text-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isBusy}
            className="h-8 px-3.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmText.trim() !== 'DELETE' || isBusy}
            className="h-8 px-4 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white cursor-pointer transition"
          >
            {isBusy ? 'Deleting...' : 'Wipe & Delete Merchant'}
          </button>
        </div>
      </div>
    </div>
  )
}
