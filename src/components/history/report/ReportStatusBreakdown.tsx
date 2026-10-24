import React from 'react'
import { StatusMilestoneMetric } from '../../../utils/report/types'

interface ReportStatusBreakdownProps {
  statusBreakdown: StatusMilestoneMetric[]
}

export const ReportStatusBreakdown: React.FC<ReportStatusBreakdownProps> = ({ statusBreakdown }) => {
  return (
    <div className="bg-white dark:bg-[#0c121e] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Milestone Status Breakdown
        </span>
        <span className="text-[11px] font-mono text-slate-500">
          {statusBreakdown.length} Categories
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-[#0c121e] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase">
            <tr>
              <th className="px-3.5 py-2">Milestone Status</th>
              <th className="px-3.5 py-2 text-center">Orders</th>
              <th className="px-3.5 py-2 text-right">COD Volume (Rs.)</th>
              <th className="px-3.5 py-2 text-center">Volume Share</th>
              <th className="px-3.5 py-2 text-center">Revenue Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {statusBreakdown.map(s => (
              <tr key={s.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-3.5 py-2 font-bold text-slate-800 dark:text-slate-200">
                  {s.label}
                </td>
                <td className="px-3.5 py-2 text-center font-mono font-bold">
                  {s.count.toLocaleString()}
                </td>
                <td className="px-3.5 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Rs. {s.codAmount.toLocaleString()}
                </td>
                <td className="px-3.5 py-2 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                    {s.volumeShare}%
                  </span>
                </td>
                <td className="px-3.5 py-2 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    {s.revenueShare}%
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
