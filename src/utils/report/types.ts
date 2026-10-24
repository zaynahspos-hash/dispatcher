export type PaperPresetType = 'a4_portrait' | 'a4_landscape' | 'a5_portrait' | 'thermal_80mm'

export interface PaperPreset {
  id: PaperPresetType
  label: string
  pageSize: string
  orientation: 'portrait' | 'landscape'
  dimensions: string
  description: string
}

export const PAPER_PRESETS: Record<PaperPresetType, PaperPreset> = {
  a4_portrait: {
    id: 'a4_portrait',
    label: 'A4 Portrait',
    pageSize: 'A4 portrait',
    orientation: 'portrait',
    dimensions: '210 × 297 mm',
    description: 'Standard executive business manifest (Vertical)'
  },
  a4_landscape: {
    id: 'a4_landscape',
    label: 'A4 Landscape',
    pageSize: 'A4 landscape',
    orientation: 'landscape',
    dimensions: '297 × 210 mm',
    description: 'Wide ledger view for dense tabular data'
  },
  a5_portrait: {
    id: 'a5_portrait',
    label: 'A5 Compact',
    pageSize: 'A5 portrait',
    orientation: 'portrait',
    dimensions: '148 × 210 mm',
    description: 'Half-sheet compact packing slip & dispatch note'
  },
  thermal_80mm: {
    id: 'thermal_80mm',
    label: 'Thermal 80mm',
    pageSize: '80mm auto',
    orientation: 'portrait',
    dimensions: '80mm Roll',
    description: 'POS receipt & 4x6" thermal label printers'
  }
}

export interface ReportActiveFilters {
  fromDate?: string
  toDate?: string
  statusFilter?: string
  cityFilter?: string
  sourceFilter?: string
  searchQuery?: string
  whatsappFilter?: string
  presetName?: string
}

export interface StatusMilestoneMetric {
  key: string
  label: string
  count: number
  codAmount: number
  volumeShare: number
  revenueShare: number
}

export interface CityMetric {
  city: string
  count: number
  codAmount: number
  deliveredCount: number
  inTransitCount: number
  volumeShare: number
}

export interface PrefixMetric {
  prefix: string
  count: number
  codAmount: number
  avgCOD: number
  volumeShare: number
  revenueShare: number
}

export interface ExecutiveReportAnalytics {
  reportId: string
  generatedAt: string
  totalParcels: number
  totalCOD: number
  avgCOD: number
  deliveredCount: number
  deliveredCOD: number
  returnedCount: number
  returnedCOD: number
  inTransitCount: number
  inTransitCOD: number
  outForDeliveryCount: number
  outForDeliveryCOD: number
  actionRequiredCount: number
  actionRequiredCOD: number
  pendingLoadsheetCount: number
  pendingLoadsheetCOD: number
  bookedCount: number
  bookedCOD: number
  cancelledCount: number
  cancelledCOD: number
  deliverySuccessRatio: number
  returnRatio: number
  pipelineShare: number
  statusBreakdown: StatusMilestoneMetric[]
  topCities: CityMetric[]
  topPrefixes: PrefixMetric[]
}
