import React from 'react'
import { PrefixMetric } from '../../../utils/report/types'

interface ReportPrefixRankingProps {
  topPrefixes: PrefixMetric[]
  selectedPrefixFilter: string | null
  onSelectPrefix: (prefix: string | null) => void
}

export const ReportPrefixRanking: React.FC<ReportPrefixRankingProps> = ({
  topPrefixes,
  selectedPrefixFilter,
  onSelectPrefix
}) => {
  return (
    <div className="bg-white dark:bg-[#0c121e] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Order Reference Prefix & Channel Ranking
          </span>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            Analyzes first 2-3 characters of order reference numbers (e.g. AH858 &rarr; AH, #3072529 &rarr; #307)
          </p>
        </div>
        {selectedPrefixFilter && (
          <button
            type="button"
            onClick={() => onSelectPrefix(null)}
            className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
          >
            Clear Filter ({selectedPrefixFilter})
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/70 dark:bg-slate-900/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase">
            <tr>
              <th className="px-3.5 py-2 text-center">Rank</th>
              <th className="px-3.5 py-2">Prefix / Channel</th>
              <th className="px-3.5 py-2 text-center">Orders</th>
              <th className="px-3.5 py-2 text-right">COD Revenue (Rs.)</th>
              <th className="px-3.5 py-2 text-right">Avg Order (Rs.)</th>
              <th className="px-3.5 py-2 text-center">Volume (%)</th>
              <th className="px-3.5 py-2 text-center">Revenue (%)</th>
              <th className="px-3.5 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {topPrefixes.map((p, idx) => {
              const isFilterActive = selectedPrefixFilter === p.prefix
              return (
                <tr
                  key={p.prefix}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                    isFilterActive ? 'bg-sky-50/80 dark:bg-sky-950/40' : ''
                  }`}
                >
                  <td className="px-3.5 py-2 text-center font-bold text-slate-400">
                    #{idx + 1}
                  </td>
                  <td className="px-3.5 py-2 font-mono font-extrabold text-sky-600 dark:text-sky-400">
                    {p.prefix}
                  </td>
                  <td className="px-3.5 py-2 text-center font-mono font-bold">
                    {p.count.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    Rs. {p.codAmount.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-2 text-right font-mono text-slate-600 dark:text-slate-400">
                    Rs. {p.avgCOD.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-2 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                      {p.volumeShare}%
                    </span>
                  </td>
                  <td className="px-3.5 py-2 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      {p.revenueShare}%
                    </span>
                  </td>
                  <td className="px-3.5 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectPrefix(isFilterActive ? null : p.prefix)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                        isFilterActive
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-sky-500 hover:text-white text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isFilterActive ? 'Clear' : 'View Ledger'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
