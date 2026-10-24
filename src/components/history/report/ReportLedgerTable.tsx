import React from 'react'
import { SearchIcon } from '../../Icons'
import { BookedParcel, parseCODAmount } from '../types'

interface ReportLedgerTableProps {
  parcels: BookedParcel[]
  totalCount: number
  selectedPrefixFilter: string | null
  ledgerSearch: string
  onSearchChange: (val: string) => void
}

export const ReportLedgerTable: React.FC<ReportLedgerTableProps> = ({
  parcels,
  totalCount,
  selectedPrefixFilter,
  ledgerSearch,
  onSearchChange
}) => {
  return (
    <div className="bg-white dark:bg-[#0c121e] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Parcels Manifest Ledger
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800">
            Showing {parcels.length} of {totalCount}
          </span>
          {selectedPrefixFilter && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
              Prefix: {selectedPrefixFilter}
            </span>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={ledgerSearch}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search manifest..."
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          />
          <span className="absolute left-2.5 top-2 text-slate-400">
            <SearchIcon size={12} />
          </span>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-20 shadow-xs">
            <tr className="bg-slate-100 dark:bg-[#0c121e]">
              <th className="px-3 py-2 text-center w-10 bg-slate-100 dark:bg-[#0c121e] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase">#</th>
              <th className="px-3 py-2 bg-slate-100 dark:bg-[#0c121e] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase">Tracking CN</th>
              <th className="px-3 py-2 bg-slate-100 dark:bg-[#0c121e] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase">Order Ref</th>
              <th className="px-3 py-2 bg-slate-100 dark:bg-[#0c121e] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase">Customer</th>
              <th className="px-3 py-2 bg-slate-100 dark:bg-[#0c121e] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase">Phone</th>
              <th className="px-3 py-2 bg-slate-100 dark:bg-[#0c121e] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase">Destination</th>
              <th className="px-3 py-2 bg-slate-100 dark:bg-[#0c121e] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-right">COD (Rs.)</th>
              <th className="px-3 py-2 bg-slate-100 dark:bg-[#0c121e] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {parcels.slice(0, 150).map((p, idx) => (
              <tr key={p.tracking || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-3 py-2 text-center font-mono text-[11px] text-slate-400">
                  {idx + 1}
                </td>
                <td className="px-3 py-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {p.tracking}
                </td>
                <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">
                  {p.id || 'N/A'}
                </td>
                <td className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[140px]">
                  {p.name || 'Customer'}
                </td>
                <td className="px-3 py-2 font-mono text-slate-500">
                  {p.phone}
                </td>
                <td className="px-3 py-2 uppercase font-semibold text-slate-700 dark:text-slate-300">
                  {p.city}
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                  Rs. {parseCODAmount(p.total).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-center">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
