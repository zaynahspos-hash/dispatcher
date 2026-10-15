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

interface HistoryTableRowProps {
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

export function HistoryTableRow({
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
}: HistoryTableRowProps) {
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
    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-100/50 dark:hover:bg-gray-700 transition">
      <td className="p-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={e => onToggleSelect(parcel.tracking, e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500"
        />
      </td>
      <td className="p-4">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editingName}
              onChange={e => setEditingName(e.target.value)}
              className="px-2 py-1 text-xs border rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-emerald-500 w-full max-w-[140px]"
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
          <div className="flex items-center gap-1 group">
            <div className="font-semibold text-slate-900 dark:text-white">{parcel.name}</div>
            <button
              type="button"
              onClick={() => {
                setEditingName(parcel.name)
                setIsEditing(true)
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
              title="Edit Name"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        )}
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium mt-0.5">{parcel.phone}</div>
      </td>
      <td className="p-4">
        <a
          href={`https://postex.pk/tracking?cn=${parcel.tracking}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold font-mono text-xs"
        >
          {parcel.tracking}
        </a>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Ref: {parcel.id}</div>
      </td>
      <td className="p-4">
        <div className="font-semibold text-slate-800 dark:text-slate-100">{parcel.city}</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">{parcel.address}</div>
      </td>
      <td className="p-4 text-slate-600 dark:text-slate-400 font-medium text-xs">
        {new Date(parcel.bookingDate).toLocaleString('en-GB', {
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit'
        })}
      </td>
      <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
        Rs. {parcel.total.toLocaleString()}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
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
            title="Sync real-time status from PostEx"
            className="text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:text-emerald-400 transition disabled:opacity-50 cursor-pointer flex items-center justify-center"
          >
            {isSyncing ? (
              <svg className="animate-spin h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <SyncIcon size={14} />
            )}
          </button>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center justify-center gap-2">
          {isCancelledStatus(parcel.status) ? (
            <div
              className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 p-2 rounded-xl cursor-not-allowed opacity-50"
              title="WhatsApp link disabled for cancelled orders"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.035-2.834-6.867-1.829-1.83-4.269-2.837-6.87-2.839-5.439 0-9.866 4.372-9.87 9.733-.001 1.73.465 3.418 1.348 4.908l-.993 3.629 3.73-.977z" />
              </svg>
            </div>
          ) : (
            <a
              href={getWhatsAppLink(parcel, whatsappNote, whatsappTemplate)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 p-2 rounded-xl transition cursor-pointer"
              title="Send tracking details to WhatsApp"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.035-2.834-6.867-1.829-1.83-4.269-2.837-6.87-2.839-5.439 0-9.866 4.372-9.87 9.733-.001 1.73.465 3.418 1.348 4.908l-.993 3.629 3.73-.977z" />
              </svg>
            </a>
          )}
          {isCancellable(parcel.status) && (
            <button
              type="button"
              onClick={() => onCancel(parcel.tracking)}
              disabled={isSyncing}
              className="inline-flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 p-2 rounded-xl transition cursor-pointer disabled:opacity-50"
              title="Cancel Booking"
            >
              {isSyncing ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <CancelIcon size={16} />
              )}
            </button>
          )}
          {isUnderReview(parcel.status) && (
            <button
              type="button"
              onClick={() => onOpenAdvice(parcel)}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
              title="Submit Shipper Advice (Retry/Return)"
            >
              <InfoIcon size={12} />
              <span>Advice</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
