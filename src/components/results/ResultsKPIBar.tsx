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
    <div className="space-y-4">
      {/* 1. Page Header .ph from app (1).html */}
      <div className="ph">
        <div>
          <h1>Results</h1>
          <p>Dispatched orders and drafts.</p>
        </div>
        <div className="ac">
          <button
            type="button"
            onClick={onOpenVault}
            className="btn"
            title="Open Document Vault"
          >
            <FolderIcon size={16} />
            <span>Airway vault</span>
          </button>
          <button
            type="button"
            onClick={onExportExcel}
            className="btn"
            title="Export results to Excel"
          >
            <UploadIcon size={16} />
            <span>{selectedCount > 0 ? `Export (${selectedCount})` : 'Export XLSX'}</span>
          </button>
          <button
            type="button"
            onClick={onAddNewResult}
            className="btn p"
          >
            <PlusIcon size={16} />
            <span>Add row</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Strip .strip from app (1).html */}
      <div className="strip">
        <div>
          <small>Dispatched results</small>
          <b>
            {totalResults} <em>({selectedCount > 0 ? `${selectedCount} sel, ` : ''}{bookedCount} booked)</em>
          </b>
        </div>
        <div>
          <small>Booked COD value</small>
          <b>Rs {totalCOD.toLocaleString()}</b>
        </div>
        <div>
          <small>Dispatch health</small>
          <b className="ok">
            <span className="dot g inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
            {failedCount === 0 ? '100% operational' : `${failedCount} failed`}
          </b>
        </div>
        <div onClick={onOpenVault} className="cursor-pointer">
          <small>Airway vault</small>
          <b className="ok">
            <span className="dot g inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
            {bookedCount} bills stored
          </b>
        </div>
      </div>
    </div>
  )
}
