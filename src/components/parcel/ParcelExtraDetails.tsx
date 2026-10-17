import React from 'react'
import { Parcel } from '../../utils/groqParser'

interface ParcelExtraDetailsProps {
  index: number
  parcel: Parcel
  updateField: (index: number, field: keyof Parcel, value: string | number) => void
}

export const ParcelExtraDetails: React.FC<ParcelExtraDetailsProps> = ({
  index,
  parcel,
  updateField
}) => {
  return (
    <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800 space-y-2.5 animate-in fade-in duration-100">
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
          Product Detail
        </label>
        <input
          value={parcel.detail || ''}
          onChange={e => updateField(index, 'detail', e.target.value)}
          placeholder="e.g. Lawn Suit / Shoes"
          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
          Delivery Note / Instructions
        </label>
        <input
          value={parcel.note || ''}
          onChange={e => updateField(index, 'note', e.target.value)}
          placeholder="e.g. Call before delivery"
          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Weight (kg)
          </label>
          <input
            type="number"
            step="0.1"
            value={parcel.weight || 0.5}
            onChange={e => updateField(index, 'weight', parseFloat(e.target.value) || 0.5)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Airway Copies
          </label>
          <input
            type="number"
            value={parcel.airwayBillCopy || 1}
            onChange={e => updateField(index, 'airwayBillCopy', parseInt(e.target.value) || 1)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
