import React from 'react'
import { CityMetric } from '../../../utils/report/types'

interface ReportCityRankingProps {
  topCities: CityMetric[]
}

export const ReportCityRanking: React.FC<ReportCityRankingProps> = ({ topCities }) => {
  return (
    <div className="bg-white dark:bg-[#0c121e] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Top Destination Cities Ranking
        </span>
        <span className="text-[11px] font-mono text-slate-500">
          {topCities.length} Leading Hubs
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/70 dark:bg-slate-900/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase">
            <tr>
              <th className="px-3.5 py-2 text-center">Rank</th>
              <th className="px-3.5 py-2">Destination City</th>
              <th className="px-3.5 py-2 text-center">Orders</th>
              <th className="px-3.5 py-2 text-right">COD Volume (Rs.)</th>
              <th className="px-3.5 py-2 text-center">Delivered</th>
              <th className="px-3.5 py-2 text-center">In Transit</th>
              <th className="px-3.5 py-2 text-center">Share (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {topCities.map((c, idx) => (
              <tr key={c.city} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-3.5 py-2 text-center font-bold text-slate-400">
                  #{idx + 1}
                </td>
                <td className="px-3.5 py-2 font-bold text-slate-800 dark:text-slate-200 uppercase">
                  {c.city}
                </td>
                <td className="px-3.5 py-2 text-center font-mono font-bold">
                  {c.count.toLocaleString()}
                </td>
                <td className="px-3.5 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Rs. {c.codAmount.toLocaleString()}
                </td>
                <td className="px-3.5 py-2 text-center font-mono font-bold text-emerald-600">
                  {c.deliveredCount}
                </td>
                <td className="px-3.5 py-2 text-center font-mono font-bold text-sky-600">
                  {c.inTransitCount}
                </td>
                <td className="px-3.5 py-2 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                    {c.volumeShare}%
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
