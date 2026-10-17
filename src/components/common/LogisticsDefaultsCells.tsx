export interface LogisticsDefaultsCellsProps {
  weight?: number
  detail?: string
  note?: string
  copies?: number
  disabled?: boolean
  autoExpandLines?: boolean
  onUpdate: (field: 'weight' | 'detail' | 'note' | 'airwayBillCopy', value: any) => void
}

export function LogisticsDefaultsCells({
  weight,
  detail,
  note,
  copies,
  disabled = false,
  autoExpandLines = false,
  onUpdate
}: LogisticsDefaultsCellsProps) {
  return (
    <>
      {/* Weight (KG) */}
      <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono overflow-hidden min-w-0">
        <input
          type="number"
          step="0.1"
          disabled={disabled}
          value={weight === 0 ? '' : (weight ?? '')}
          onChange={e => onUpdate('weight', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
          onFocus={e => e.target.select()}
          placeholder="0.5"
          className="w-full min-w-0 h-10 px-2 py-2 bg-transparent text-xs font-mono text-center text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75"
        />
      </td>

      {/* Detail / Product */}
      <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 overflow-hidden min-w-0">
        {autoExpandLines ? (
          <textarea
            disabled={disabled}
            rows={Math.min(4, Math.max(1, Math.ceil((detail || '').length / 20)))}
            value={detail || ''}
            onChange={e => onUpdate('detail', e.target.value)}
            placeholder="e.g. Kids Clothes"
            className="w-full min-w-0 p-2.5 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75 resize-none leading-snug break-words"
          />
        ) : (
          <input
            disabled={disabled}
            value={detail || ''}
            onChange={e => onUpdate('detail', e.target.value)}
            placeholder="e.g. Kids Clothes"
            className="w-full min-w-0 h-10 px-2.5 py-2 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75 truncate"
          />
        )}
      </td>

      {/* Note / Remarks */}
      <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 overflow-hidden min-w-0">
        {autoExpandLines ? (
          <textarea
            disabled={disabled}
            rows={Math.min(4, Math.max(1, Math.ceil((note || '').length / 22)))}
            value={note || ''}
            onChange={e => onUpdate('note', e.target.value)}
            placeholder="e.g. Call before delivery"
            className="w-full min-w-0 p-2.5 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75 resize-none leading-snug break-words"
          />
        ) : (
          <input
            disabled={disabled}
            value={note || ''}
            onChange={e => onUpdate('note', e.target.value)}
            placeholder="e.g. Call before delivery"
            className="w-full min-w-0 h-10 px-2.5 py-2 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75 truncate"
          />
        )}
      </td>

      {/* Copies */}
      <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono overflow-hidden min-w-0">
        <input
          type="number"
          min="1"
          max="5"
          disabled={disabled}
          value={copies === 0 ? '' : (copies ?? '')}
          onChange={e => onUpdate('airwayBillCopy', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
          onFocus={e => e.target.select()}
          placeholder="1"
          className="w-full min-w-0 h-10 px-1.5 py-2 bg-transparent text-xs font-mono text-center text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75"
        />
      </td>
    </>
  )
}

