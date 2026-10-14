import { useState } from 'react'
import { SyncIcon, CancelIcon, InfoIcon } from '../Icons'
import {
  BookedParcel,
  isCancelledStatus,
  isBookedStatus,
  isUnderReview,
  getDisplayStatus,
  isCancellable,
  getWhatsAppLink
} from './types'

interface HistoryMobileCardProps {
  parcel: BookedParcel
  isSelected: boolean
  onToggleSelect: (tracking: string, checked: boolean) => void
  onSaveName: (tracking: string, newName: string) => void
  onSyncStatus: (tracking: string) => void
  isSyncing: boolean
  onCancel: (tracking: string) => void
  onOpenAdvice: (parcel: BookedParcel) => void
  whatsappNote?: string
  whatsappTemplate?: string
}

export function HistoryMobileCard({
  parcel,
  isSelected,
  onToggleSelect,
  onSaveName,
  onSyncStatus,
  isSyncing,
  onCancel,
  onOpenAdvice,
  whatsappNote,
  whatsappTemplate
}: HistoryMobileCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingName, setEditingName] = useState(parcel.name)

  const handleCommitName = () => {
    onSaveName(parcel.tracking, editingName)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditingName(parcel.name)
    setIsEditing(false)
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col gap-3 hover:border-blue-400 transition">
      {/* Top Row: Checkbox, Name, Status Badge, Sync */}
      <div className="flex items-start justify-between border-b border-gray-200/50 dark:border-gray-700/50 pb-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={e => onToggleSelect(parcel.tracking, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
          />
          <div>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  className="px-2 py-1 text-xs border rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 w-full max-w-[120px]"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCommitName()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                />
                <button
                  type="button"
                  onClick={handleCommitName}
                  className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded cursor-pointer"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{parcel.name}</div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingName(parcel.name)
                    setIsEditing(true)
                  }}
                  className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:text-blue-400 transition cursor-pointer"
                  title="Edit Name"
                >
                  ✏️
                </button>
              </div>
            )}
            <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">{parcel.phone}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
              parcel.status === 'success' || parcel.status === 'Delivered' || isBookedStatus(parcel.status)
                ? 'bg-[var(--status-success-bg)] border-[var(--status-success-border)] text-[var(--status-success-text)]'
                : isCancelledStatus(parcel.status) || parcel.status === 'Returned'
                ? 'bg-[var(--status-danger-bg)] border-[var(--status-danger-border)] text-[var(--status-danger-text)]'
                : isUnderReview(parcel.status)
                ? 'bg-[var(--status-warning-bg)] border-[var(--status-warning-border)] text-[var(--status-warning-text)]'
                : 'bg-[var(--status-info-bg)] border-[var(--status-info-border)] text-[var(--status-info-text)]'
            }`}
          >
            {getDisplayStatus(parcel.status)}
          </span>
          <button
            type="button"
            onClick={() => onSyncStatus(parcel.tracking)}
            disabled={isSyncing}
            className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:text-blue-400 transition disabled:opacity-50 cursor-pointer text-xs flex items-center justify-center"
            title="Sync Status"
          >
            {isSyncing ? (
              <svg className="animate-spin h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <SyncIcon size={14} />
            )}
          </button>
        </div>
      </div>

      {/* Details List */}
      <div className="flex flex-col gap-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400 dark:text-gray-500">Tracking CN:</span>
          <a
            href={`https://postex.pk/tracking?cn=${parcel.tracking}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline font-bold font-mono"
          >
            {parcel.tracking}
          </a>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 dark:text-gray-500">Ref:</span>
          <span className="text-gray-700 dark:text-gray-200 font-medium">{parcel.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 dark:text-gray-500">Destination:</span>
          <span className="text-gray-700 dark:text-gray-200 font-medium">{parcel.city}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 dark:text-gray-500">Date:</span>
          <span className="text-gray-700 dark:text-gray-200">
            {new Date(parcel.bookingDate).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1 border-t border-gray-200/30 dark:border-gray-700/30 pt-2">
          <span className="text-gray-400 dark:text-gray-500 font-medium">COD:</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Rs. {parcel.total.toLocaleString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end mt-1">
        {isUnderReview(parcel.status) && (
          <button
            type="button"
            onClick={() => onOpenAdvice(parcel)}
            className="flex-1 max-w-[120px] bg-amber-500 dark:bg-amber-600 hover:bg-amber-600 text-[#ffffff] font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
          >
            <InfoIcon size={12} />
            <span>Advice</span>
          </button>
        )}
        {isCancelledStatus(parcel.status) ? (
          <div
            className="flex-1 max-w-[120px] bg-slate-700/50 text-slate-500 dark:text-gray-400 font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-not-allowed opacity-50"
            title="WhatsApp link disabled for cancelled orders"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.035-2.834-6.867-1.829-1.83-4.269-2.837-6.87-2.839-5.439 0-9.866 4.372-9.87 9.733-.001 1.73.465 3.418 1.348 4.908l-.993 3.629 3.73-.977z" />
            </svg>
            <span>Send link</span>
          </div>
        ) : (
          <a
            href={getWhatsAppLink(parcel, whatsappNote, whatsappTemplate)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 max-w-[120px] bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:bg-emerald-700 text-[#ffffff] font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 text-xs shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.035-2.834-6.867-1.829-1.83-4.269-2.837-6.87-2.839-5.439 0-9.866 4.372-9.87 9.733-.001 1.73.465 3.418 1.348 4.908l-.993 3.629 3.73-.977z" />
            </svg>
            <span>Send link</span>
          </a>
        )}
        {isCancellable(parcel.status) && (
          <button
            type="button"
            onClick={() => onCancel(parcel.tracking)}
            disabled={isSyncing}
            className="flex-1 max-w-[120px] bg-red-500 dark:bg-red-600 hover:bg-red-600 text-[#ffffff] font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 text-xs shadow-md shadow-red-500/10 cursor-pointer disabled:opacity-50"
            title="Cancel Booking"
          >
            {isSyncing ? (
              <svg className="animate-spin h-3.5 w-3.5 text-[#ffffff]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                <CancelIcon size={12} />
                <span>Cancel</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
