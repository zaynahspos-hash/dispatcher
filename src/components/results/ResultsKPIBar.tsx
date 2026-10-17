import React from 'react'
import { PlusIcon, UploadIcon, FolderIcon, TrashIcon, PrintIcon, AutoFitIcon } from '../Icons'

interface ResultsKPIBarProps {
  totalResults: number
  selectedCount: number
  bookedCount: number
  totalCOD: number
  failedCount: number
  onAddNewResult: () => void
  onExportExcel: () => void
  onOpenVault: () => void
  onClearAll: () => void
  onPrintAll: () => void
  loadingLabels?: boolean
  expandDefaults?: boolean
  onToggleExpandDefaults?: () => void
  onAutoFitColumns?: (e?: React.MouseEvent) => void
}

export const ResultsKPIBar: React.FC<ResultsKPIBarProps> = ({
  totalResults,
  selectedCount,
  bookedCount,
  totalCOD,
  failedCount,
  onAddNewResult,
  onExportExcel,
  onOpenVault,
  onClearAll,
  onPrintAll,
  loadingLabels,
  expandDefaults,
  onToggleExpandDefaults,
  onAutoFitColumns
}) => {
  return (
    <div className="space-y-3.5">
      {/* 1. Sleek Integrated KPI Summary Bar (Matches ParcelKPIBar) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/80 shadow-xs">
        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Dispatched Results
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
              {totalResults}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ({selectedCount > 0 ? `${selectedCount} selected, ` : ''}{bookedCount} booked)
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Booked COD Value
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs font-bold text-slate-400">Rs.</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {totalCOD.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Dispatch Health
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold">
            {failedCount === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                100% Operational
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {failedCount} Failed Bookings
              </span>
            )}
          </div>
        </div>

        <div
          onClick={onOpenVault}
          className="p-3.5 sm:p-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition group"
          title="Open Document Vault Tab"
        >
          <span className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-500 transition uppercase tracking-wider block">
            Airway Document Vault
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {bookedCount} Airway Bills Stored
          </div>
        </div>
      </div>

      {/* 2. Action Toolbar (Matches ParcelKPIBar) */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onAddNewResult}
            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-xs whitespace-nowrap"
          >
            <PlusIcon size={14} className="text-emerald-500 shrink-0" />
            <span>Add Row</span>
          </button>

          <button
            onClick={onExportExcel}
            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-xs whitespace-nowrap"
          >
            <UploadIcon size={14} className="text-emerald-500 shrink-0" />
            <span>{selectedCount > 0 ? `Export (${selectedCount})` : 'Export XLSX'}</span>
          </button>

          <button
            onClick={onOpenVault}
            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-xs whitespace-nowrap"
            title="Open Airway Bill Vault"
          >
            <FolderIcon size={14} className="text-emerald-500 shrink-0" />
            <span>Airway Vault</span>
          </button>

          {onToggleExpandDefaults && (
            <button
              type="button"
              onClick={onToggleExpandDefaults}
              className={`flex-1 sm:flex-initial h-9 px-3 rounded-lg border text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-xs whitespace-nowrap ${
                expandDefaults
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Toggle display of logistics defaults: Weight, Product Detail, Transaction Note, and Copies"
            >
              <span>{expandDefaults ? 'Defaults Expanded' : 'Expand Defaults'}</span>
            </button>
          )}

          {onAutoFitColumns && (
            <button
              type="button"
              onClick={onAutoFitColumns}
              className="flex-1 sm:flex-initial h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-xs whitespace-nowrap"
              title="Auto-fit all column widths to maximum text length • Alt+Click to reset defaults"
            >
              <AutoFitIcon size={14} className="text-emerald-500 shrink-0" />
              <span>Auto-Fit</span>
            </button>
          )}

          <button
            onClick={onClearAll}
            className="h-9 px-3.5 rounded-lg border border-rose-200/80 dark:border-rose-900/50 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-semibold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-xs whitespace-nowrap"
            title="Clear all results"
          >
            <TrashIcon size={14} className="shrink-0" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>

        {/* Primary Action Button (when no specific rows selected, prints all booked) */}
        {bookedCount > 0 && selectedCount === 0 && (
          <div className="w-full sm:w-auto">
            <button
              onClick={onPrintAll}
              disabled={loadingLabels}
              className="w-full sm:w-auto h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {loadingLabels ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Generating Labels...</span>
                </>
              ) : (
                <>
                  <PrintIcon size={14} />
                  <span>Print Airway Bills ({bookedCount})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
