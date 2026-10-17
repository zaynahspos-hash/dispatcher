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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 w-full">
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Merchants</span>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-lg sm:text-2xl font-black font-mono text-slate-900 dark:text-white">{totalUsers}</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Registered</span>
        </div>
      </div>

      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Today</span>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-lg sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{activeUsersTodayCount}</span>
          <span className="text-[10px] text-slate-400 font-semibold">Online</span>
        </div>
      </div>

      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">AI Parses</span>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-lg sm:text-2xl font-black font-mono text-slate-900 dark:text-white">{totalAIparses}</span>
          <span className="text-[10px] text-slate-400 font-semibold">Orders</span>
        </div>
      </div>

      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Booked</span>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-lg sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{totalBookings}</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Live CNs</span>
        </div>
      </div>

      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs col-span-2 sm:col-span-1">
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Customers</span>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-lg sm:text-2xl font-black font-mono text-slate-900 dark:text-white">{totalCustomers}</span>
          <span className="text-[10px] text-slate-400 font-semibold">Directory</span>
        </div>
      </div>
    </div>
  )
}
