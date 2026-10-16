import React from 'react'

interface AdminStatsBarProps {
  totalUsers: number
  activeUsersTodayCount: number
  totalAIparses: number
  totalBookings: number
  totalCustomers: number
}

export const AdminStatsBar: React.FC<AdminStatsBarProps> = ({
  totalUsers,
  activeUsersTodayCount,
  totalAIparses,
  totalBookings,
  totalCustomers
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/80 shadow-xs">
      <div className="p-3.5 sm:p-4">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Merchants</span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">{totalUsers}</span>
        </div>
      </div>
      <div className="p-3.5 sm:p-4">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Today</span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{activeUsersTodayCount}</span>
        </div>
      </div>
      <div className="p-3.5 sm:p-4">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total AI Parses</span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">{totalAIparses}</span>
        </div>
      </div>
      <div className="p-3.5 sm:p-4">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Booked</span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{totalBookings}</span>
        </div>
      </div>
      <div className="p-3.5 sm:p-4 col-span-2 sm:col-span-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Customers</span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">{totalCustomers}</span>
        </div>
      </div>
    </div>
  )
}
