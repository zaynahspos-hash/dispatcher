export interface LogisticsDefaultsCellsProps {
  weight?: number
  detail?: string
  note?: string
  copies?: number
  disabled?: boolean
  onUpdate: (field: 'weight' | 'detail' | 'note' | 'airwayBillCopy', value: any) => void
}

export function LogisticsDefaultsCells({
  weight,
  detail,
  note,
  copies,
  disabled = false,
  onUpdate
}: LogisticsDefaultsCellsProps) {
  return (
    <>
      {/* Weight (KG) */}
      <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono">
        <input
          type="number"
          step="0.1"
          disabled={disabled}
          value={weight ?? 0.5}
          onChange={e => onUpdate('weight', parseFloat(e.target.value) || 0.5)}
          className="w-full h-10 px-2 py-2 bg-transparent text-xs font-mono text-center text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75"
        />
      </td>

      {/* Detail / Product */}
      <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800">
        <input
          disabled={disabled}
          value={detail || ''}
          onChange={e => onUpdate('detail', e.target.value)}
          placeholder="e.g. Kids Clothes"
          className="w-full h-10 px-2.5 py-2 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75 truncate"
        />
      </td>

      {/* Note / Remarks */}
      <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800">
        <input
          disabled={disabled}
          value={note || ''}
          onChange={e => onUpdate('note', e.target.value)}
          placeholder="e.g. Call before delivery"
          className="w-full h-10 px-2.5 py-2 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75 truncate"
        />
      </td>

      {/* Copies */}
      <td className="p-0 border-r border-b border-slate-200/80 dark:border-slate-800 font-mono">
        <input
          type="number"
          min="1"
          max="5"
          disabled={disabled}
          value={copies || 1}
          onChange={e => onUpdate('airwayBillCopy', parseInt(e.target.value, 10) || 1)}
          className="w-full h-10 px-1.5 py-2 bg-transparent text-xs font-mono text-center text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset disabled:opacity-75"
        />
      </td>
    </>
  )
}
