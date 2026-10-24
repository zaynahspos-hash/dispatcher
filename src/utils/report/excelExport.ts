import * as XLSX from 'xlsx'
import { BookedParcel, parseCODAmount, getParcelDateStr } from '../../components/history/types'
import { ExecutiveReportAnalytics, ReportActiveFilters } from './types'

/**
 * Generates and downloads a multi-sheet Excel (.xlsx) file containing both
 * executive operational summaries and the raw filtered manifest ledger.
 */
export function exportExecutiveReportToExcel(
  parcels: BookedParcel[],
  analytics: ExecutiveReportAnalytics,
  filters: ReportActiveFilters,
  storeName: string = 'Zaynahs POS'
) {
  const wb = XLSX.utils.book_new()

  // 1. Executive Summary Sheet
  const summaryRows = [
    ['ZAYNAHS POS • EXECUTIVE LOGISTICS AUDIT REPORT'],
    [`Merchant Store: ${storeName}`],
    [`Report ID: ${analytics.reportId}`, `Generated On: ${analytics.generatedAt}`],
    [],
    ['--- ACTIVE REPORT FILTERS ---'],
    ['Date Range', `${filters.fromDate || 'All'} to ${filters.toDate || 'All'} (${filters.presetName || 'Custom'})`],
    ['Status Filter', filters.statusFilter || 'All Statuses'],
    ['City Filter', filters.cityFilter || 'All Cities'],
    ['Source Filter', filters.sourceFilter || 'All Sources'],
    ['Search Query', filters.searchQuery || 'None'],
    [],
    ['--- HIGH-LEVEL LOGISTICS KPIS ---'],
    ['Total Filtered Parcels', analytics.totalParcels],
    ['Total COD Gross Revenue', `Rs. ${analytics.totalCOD.toLocaleString()}`],
    ['Average Order COD', `Rs. ${analytics.avgCOD.toLocaleString()}`],
    ['Delivery Success Ratio', `${analytics.deliverySuccessRatio}%`],
    ['Return Ratio (RTO)', `${analytics.returnRatio}%`],
    ['Active Pipeline Share', `${analytics.pipelineShare}%`],
    [],
    ['--- STATUS MILESTONE BREAKDOWN ---'],
    ['Milestone', 'Parcels', 'COD Amount (Rs.)', 'Volume Share (%)', 'Revenue Share (%)'],
    ...analytics.statusBreakdown.map(s => [
      s.label, s.count, s.codAmount, `${s.volumeShare}%`, `${s.revenueShare}%`
    ]),
    [],
    ['--- TOP DESTINATION CITIES RANKING ---'],
    ['Rank', 'City Name', 'Parcels', 'Total COD (Rs.)', 'Delivered', 'In Transit', 'Share (%)'],
    ...analytics.topCities.map((c, i) => [
      i + 1, c.city, c.count, c.codAmount, c.deliveredCount, c.inTransitCount, `${c.volumeShare}%`
    ]),
    [],
    ['--- ORDER REFERENCE PREFIX / CHANNEL RANKING ---'],
    ['Rank', 'Order Prefix', 'Parcels', 'Total COD (Rs.)', 'Avg Order (Rs.)', 'Volume (%)', 'Revenue (%)'],
    ...analytics.topPrefixes.map((p, i) => [
      i + 1, p.prefix, p.count, p.codAmount, p.avgCOD, `${p.volumeShare}%`, `${p.revenueShare}%`
    ]),
    [],
    ['Official Platform: https://dispatcher.zaynahs.pk'],
    ['© 2026 Zaynahs POS Logistics Ecosystem. All rights reserved.']
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary')

  // 2. Orders Ledger Sheet
  const orderRows = parcels.map((p, idx) => ({
    '#': idx + 1,
    'Tracking Number (CN)': p.tracking,
    'Order Ref Number': p.id,
    'Customer Name': p.name,
    'Customer Phone': p.phone,
    'Destination City': p.city,
    'Delivery Address': p.address,
    'COD Amount (Rs.)': parseCODAmount(p.total),
    'Order Status': p.status,
    'Booking Date': getParcelDateStr(p.bookingDate) || p.bookingDate,
    'Items': p.items || 1,
    'Weight (KG)': p.weight || 0.5,
    'Order Detail': p.detail || '',
    'Special Note': p.note || '',
    'Source': p.source === 'postex_portal' ? 'Portal / External' : 'Booked in App'
  }))
  const wsOrders = XLSX.utils.json_to_sheet(orderRows)
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Orders Ledger')

  const fileName = `Logistics_Report_${analytics.reportId}_${Date.now()}.xlsx`
  XLSX.writeFile(wb, fileName)
}

/**
 * Generates and downloads a clean, UTF-8 encoded CSV file of the filtered parcels manifest.
 */
export function exportExecutiveReportToCSV(
  parcels: BookedParcel[],
  reportId: string = 'REP'
) {
  const headers = [
    '#',
    'Tracking CN',
    'Order Ref',
    'Customer Name',
    'Customer Phone',
    'Destination City',
    'COD Amount',
    'Status',
    'Booking Date',
    'Source'
  ]

  const rows = parcels.map((p, idx) => [
    idx + 1,
    `"${p.tracking}"`,
    `"${p.id || ''}"`,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    `"${p.phone || ''}"`,
    `"${(p.city || '').replace(/"/g, '""')}"`,
    parseCODAmount(p.total),
    `"${(p.status || '').replace(/"/g, '""')}"`,
    `"${getParcelDateStr(p.bookingDate) || p.bookingDate || ''}"`,
    `"${p.source === 'postex_portal' ? 'Portal / External' : 'App'}"`
  ])

  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Logistics_Manifest_${reportId}_${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
