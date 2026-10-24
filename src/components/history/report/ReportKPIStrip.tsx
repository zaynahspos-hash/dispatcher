import React from 'react'
import { ExecutiveReportAnalytics } from '../../../utils/report/types'

interface ReportKPIStripProps {
  analytics: ExecutiveReportAnalytics
}

export const ReportKPIStrip: React.FC<ReportKPIStripProps> = ({ analytics }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div className="p-3 bg-white dark:bg-[#0c121e] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filtered Orders</div>
        <div className="text-lg font-mono font-black text-slate-900 dark:text-white mt-1">
          {analytics.totalParcels.toLocaleString()}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">100% Filtered Scope</div>
      </div>

      <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-500/30 shadow-2xs">
        <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Gross COD Revenue</div>
        <div className="text-lg font-mono font-black text-emerald-700 dark:text-emerald-300 mt-1">
          Rs. {analytics.totalCOD.toLocaleString()}
        </div>
        <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Total Receivable</div>
      </div>

      <div className="p-3 bg-white dark:bg-[#0c121e] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Average Order</div>
        <div className="text-lg font-mono font-black text-slate-900 dark:text-white mt-1">
          Rs. {analytics.avgCOD.toLocaleString()}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">COD per Parcel</div>
      </div>

      <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-500/30 shadow-2xs">
        <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Delivery Success</div>
        <div className="text-lg font-mono font-black text-emerald-700 dark:text-emerald-300 mt-1">
          {analytics.deliverySuccessRatio}%
        </div>
        <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
          {analytics.deliveredCount} Delivered &bull; {analytics.returnRatio}% RTO
        </div>
      </div>

      <div className="p-3 bg-sky-50/50 dark:bg-sky-950/20 rounded-xl border border-sky-500/30 shadow-2xs">
        <div className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">Active Pipeline COD</div>
        <div className="text-lg font-mono font-black text-sky-700 dark:text-sky-300 mt-1">
          Rs. {(analytics.inTransitCOD + analytics.outForDeliveryCOD).toLocaleString()}
        </div>
        <div className="text-[10px] text-sky-600/80 dark:text-sky-400/80 mt-0.5">
          {analytics.inTransitCount + analytics.outForDeliveryCount} In Transit / Out
        </div>
      </div>
    </div>
  )
}
