import React, { useState, useMemo } from 'react'
import { CloseIcon, PrintIcon, FileTextIcon, CheckIcon } from '../Icons'
import { BookedParcel } from './types'
import {
  PaperPresetType,
  PAPER_PRESETS,
  ReportActiveFilters,
  computeExecutiveAnalytics,
  exportExecutiveReportToExcel,
  exportExecutiveReportToCSV,
  printExecutiveReportHTML
} from '../../utils/executiveReportGenerator'
import { ReportKPIStrip } from './report/ReportKPIStrip'
import { ReportStatusBreakdown } from './report/ReportStatusBreakdown'
import { ReportPrefixRanking } from './report/ReportPrefixRanking'
import { ReportCityRanking } from './report/ReportCityRanking'
import { ReportLedgerTable } from './report/ReportLedgerTable'

interface ExecutiveReportModalProps {
  parcels: BookedParcel[]
  activeFilters: ReportActiveFilters
  storeName?: string
  onClose: () => void
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  parcels,
  activeFilters,
  storeName = 'Zaynahs POS',
  onClose
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PaperPresetType>('a4_portrait')
  const [activeTab, setActiveTab] = useState<'overview' | 'status' | 'prefixes' | 'cities' | 'ledger'>('overview')
  const [selectedPrefixFilter, setSelectedPrefixFilter] = useState<string | null>(null)
  const [ledgerSearch, setLedgerSearch] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  const analytics = useMemo(() => computeExecutiveAnalytics(parcels), [parcels])

  const previewParcels = useMemo(() => {
    return parcels.filter(p => {
      if (selectedPrefixFilter) {
        const pfx = (p.id || '').toUpperCase()
        if (!pfx.startsWith(selectedPrefixFilter.replace('#', '')) && !pfx.includes(selectedPrefixFilter)) {
          return false
        }
      }
      if (ledgerSearch.trim()) {
        const q = ledgerSearch.toLowerCase().trim()
        const matchesCN = (p.tracking || '').toLowerCase().includes(q)
        const matchesRef = (p.id || '').toLowerCase().includes(q)
        const matchesName = (p.name || '').toLowerCase().includes(q)
        const matchesCity = (p.city || '').toLowerCase().includes(q)
        const matchesPhone = (p.phone || '').toLowerCase().includes(q)
        if (!matchesCN && !matchesRef && !matchesName && !matchesCity && !matchesPhone) {
          return false
        }
      }
      return true
    })
  }, [parcels, selectedPrefixFilter, ledgerSearch])

  const handlePrint = () => {
    printExecutiveReportHTML(parcels, analytics, activeFilters, storeName, PAPER_PRESETS[selectedPreset])
  }

  const handleExcelExport = () => {
    exportExecutiveReportToExcel(parcels, analytics, activeFilters, storeName)
  }

  const handleCSVExport = () => {
    exportExecutiveReportToCSV(parcels, analytics.reportId)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://dispatcher.zaynahs.pk')
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-none animate-in fade-in duration-200">
      <div className="w-full max-w-6xl max-h-[94vh] flex flex-col bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all">
        
        {/* Header & Preset Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#070b12] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <FileTextIcon size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                  Executive Logistics Audit Report
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {analytics.totalParcels.toLocaleString()} Orders
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Rs. {analytics.totalCOD.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {storeName} &bull; Report ID: <span className="font-mono">{analytics.reportId}</span> &bull; {analytics.generatedAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-2xs">
              {(Object.keys(PAPER_PRESETS) as PaperPresetType[]).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPreset(key)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                    selectedPreset === key
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title={`${PAPER_PRESETS[key].label} (${PAPER_PRESETS[key].dimensions})`}
                >
                  {PAPER_PRESETS[key].label.split(' ')[0]}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="h-8.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <PrintIcon size={13} />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExcelExport}
              className="h-8.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span className="text-emerald-600 font-extrabold text-[11px]">XLSX</span>
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={handleCSVExport}
              className="h-8.5 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              CSV
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8.5 h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1">
            {[
              { id: 'overview', label: 'Executive Overview' },
              { id: 'status', label: 'Milestone Status' },
              { id: 'prefixes', label: `Order Prefix Ranking (${analytics.topPrefixes.length})` },
              { id: 'cities', label: `City Distribution (${analytics.topCities.length})` },
              { id: 'ledger', label: `Manifest Ledger (${parcels.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-2xs border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 hidden sm:block">
            Preset: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{PAPER_PRESETS[selectedPreset].label}</span> ({PAPER_PRESETS[selectedPreset].dimensions})
          </div>
        </div>

        {/* Document Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/50 dark:bg-[#070b12] space-y-4">
          
          {/* Active Filter Criteria */}
          <div className="p-3 bg-white dark:bg-[#0c121e] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Active Scope & Filter Criteria
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500">Date Range</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {activeFilters.fromDate || 'All'} &rarr; {activeFilters.toDate || 'All'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500">Status Scope</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {activeFilters.statusFilter === 'all' ? 'All Statuses' : activeFilters.statusFilter}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500">City / Destination</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                  {activeFilters.cityFilter === 'all' ? 'All Cities' : activeFilters.cityFilter}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500">Order Source</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {activeFilters.sourceFilter === 'postex_portal' ? 'Portal / External' : activeFilters.sourceFilter === 'app' ? 'In-App' : 'All Sources'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500">Search Filter</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {activeFilters.searchQuery ? `"${activeFilters.searchQuery}"` : 'None (Full Set)'}
                </span>
              </div>
            </div>
          </div>

          {/* 5-Card Executive KPI Strip */}
          <ReportKPIStrip analytics={analytics} />

          {/* Milestone Status Breakdown */}
          {(activeTab === 'overview' || activeTab === 'status') && (
            <ReportStatusBreakdown statusBreakdown={analytics.statusBreakdown} />
          )}

          {/* Order Reference Prefix Ranking */}
          {(activeTab === 'overview' || activeTab === 'prefixes') && (
            <ReportPrefixRanking
              topPrefixes={analytics.topPrefixes}
              selectedPrefixFilter={selectedPrefixFilter}
              onSelectPrefix={pfx => {
                setSelectedPrefixFilter(pfx)
                if (pfx) setActiveTab('ledger')
              }}
            />
          )}

          {/* Destination City Distribution */}
          {(activeTab === 'overview' || activeTab === 'cities') && (
            <ReportCityRanking topCities={analytics.topCities} />
          )}

          {/* Parcels Manifest Ledger */}
          {(activeTab === 'overview' || activeTab === 'ledger') && (
            <ReportLedgerTable
              parcels={previewParcels}
              totalCount={parcels.length}
              selectedPrefixFilter={selectedPrefixFilter}
              ledgerSearch={ledgerSearch}
              onSearchChange={setLedgerSearch}
            />
          )}

          {/* Executive Audit Footer Card - Small, Smart, Clean & Responsive */}
          <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-[#0c121e] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px] text-slate-500">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Verified Audit Record
              </span>
              <span>&bull;</span>
              <span>Engine:</span>
              <a
                href="https://dispatcher.zaynahs.pk"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                dispatcher.zaynahs.pk
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-1.5 py-0.5 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded transition cursor-pointer text-[10px] text-slate-400 font-semibold"
                title="Copy link"
              >
                {copiedLink ? <CheckIcon size={11} className="text-emerald-500" /> : 'copy'}
              </button>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <span>PostEx V3 Logistics Architecture</span>
              <span>&bull;</span>
              <span>&copy; 2026 Zaynahs POS</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
