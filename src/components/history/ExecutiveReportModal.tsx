import React, { useState, useMemo } from 'react'
import { CloseIcon, PrintIcon, FileTextIcon, CheckIcon } from '../Icons'
import { BookedParcel } from './types'
import {
  PaperPresetType,
  PAPER_PRESETS,
  ReportActiveFilters,
  computeExecutiveAnalytics,
  formatDaysCount,
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
  const daysText = useMemo(() => formatDaysCount(activeFilters.fromDate, activeFilters.toDate), [activeFilters.fromDate, activeFilters.toDate])

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
    <div className="mo">
      <div className="mbk" onClick={onClose} />
      <div className="mc2 big">
        
        {/* Header - app (1).html layout */}
        <div className="mh rh">
          <span className="wic">
            <FileTextIcon size={22} />
          </span>
          <div className="ht">
            <b>
              Executive Logistics Audit Report
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {analytics.totalParcels.toLocaleString()} orders
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Rs. {analytics.totalCOD.toLocaleString()}
              </span>
            </b>
            <small>
              {storeName} &bull; Report ID: <span className="font-mono">{analytics.reportId}</span> &bull; {analytics.generatedAt}
            </small>
          </div>

          <div className="ra">
            <div className="seg-bar">
              {(Object.keys(PAPER_PRESETS) as PaperPresetType[]).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPreset(key)}
                  className={selectedPreset === key ? 'on' : ''}
                  title={`${PAPER_PRESETS[key].label} (${PAPER_PRESETS[key].dimensions})`}
                >
                  {PAPER_PRESETS[key].label.split(' ')[0]}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="btn p"
            >
              <PrintIcon size={14} />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExcelExport}
              className="btn"
            >
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={handleCSVExport}
              className="btn"
            >
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn sm"
              title="Close report"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        </div>

        {/* Sub-tabs bar */}
        <div className="rtb">
          {[
            { id: 'overview', label: 'Executive Overview' },
            { id: 'status', label: 'Milestone Status' },
            { id: 'prefixes', label: `Order Prefix Ranking (${analytics.topPrefixes.length})` },
            { id: 'cities', label: `City Distribution (${analytics.topCities.length})` },
            { id: 'ledger', label: `Manifest Ledger (${parcels.length})` }
          ].map(tab => (
            <span
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`filter-tab ${activeTab === tab.id ? 'on' : ''}`}
            >
              {tab.label}
            </span>
          ))}
          <span className="pre">
            Preset: <b className="text-emerald-600 dark:text-emerald-400 font-bold">{PAPER_PRESETS[selectedPreset].label}</b> ({PAPER_PRESETS[selectedPreset].dimensions})
          </span>
        </div>

        {/* Document Preview Canvas */}
        <div className="mb space-y-4">
          
          {/* Active Filter Scope Grid (5 columns on desktop, 2 on mobile) */}
          <div className="sc">
            <div>
              <small>Date Range</small>
              <b className="font-mono text-xs">
                {activeFilters.fromDate || 'All'} &rarr; {activeFilters.toDate || 'All'}
              </b>
            </div>
            <div>
              <small>Status Scope</small>
              <b>
                {activeFilters.statusFilter === 'all' ? 'All statuses' : activeFilters.statusFilter}
              </b>
            </div>
            <div>
              <small>City / Destination</small>
              <b className="uppercase">
                {activeFilters.cityFilter === 'all' ? 'All cities' : activeFilters.cityFilter}
              </b>
            </div>
            <div>
              <small>Order Source</small>
              <b>
                {activeFilters.sourceFilter === 'postex_portal' ? 'Portal / external' : activeFilters.sourceFilter === 'app' ? 'In-app' : 'All sources'}
              </b>
            </div>
            <div>
              <small>Search Filter</small>
              <b className="truncate">
                {activeFilters.searchQuery ? `"${activeFilters.searchQuery}"` : 'None (full set)'}
              </b>
            </div>
          </div>

          {/* 5-Card Executive KPI Grid */}
          <div className="rk">
            <div>
              <small>Filtered Orders</small>
              <b>{analytics.totalParcels.toLocaleString()}</b>
              <span>100% filtered scope</span>
            </div>
            <div>
              <small>Gross COD Revenue</small>
              <b>Rs. {analytics.totalCOD.toLocaleString()}</b>
              <span>Total receivable</span>
            </div>
            <div>
              <small>Average Order</small>
              <b>Rs. {Math.round(analytics.totalParcels > 0 ? analytics.totalCOD / analytics.totalParcels : 0).toLocaleString()}</b>
              <span>COD per parcel</span>
            </div>
            <div>
              <small>Delivery Success</small>
              <b>{analytics.deliverySuccessRate || '0%'}</b>
              <span>{analytics.statusBreakdown.find(s => s.status.toLowerCase().includes('delivered'))?.count || 0} delivered</span>
            </div>
            <div>
              <small>Active Pipeline COD</small>
              <b>Rs. {analytics.inTransitCOD ? analytics.inTransitCOD.toLocaleString() : analytics.totalCOD.toLocaleString()}</b>
              <span>{analytics.inTransitCount || analytics.totalParcels} in transit / out</span>
            </div>
          </div>

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

          {/* Signatures & Verification Footer */}
          <div className="sig">
            <div>
              <b>Merchant dispatcher signatory</b>
              Name &amp; sign: _________________________________
            </div>
            <div>
              <b>Courier / PostEx rider signatory</b>
              Officer name &amp; CNIC: __________________________
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
