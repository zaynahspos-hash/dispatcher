import { BookedParcel, parseCODAmount } from '../../components/history/types'
import {
  ExecutiveReportAnalytics,
  ReportActiveFilters,
  PaperPreset,
  PAPER_PRESETS
} from './types'

import { getPrintReportStyles } from './printStyles'

/**
 * Prints the executive report formatted for the exact paper size (A4 Portrait, A4 Landscape, A5, Thermal 80mm).
 * Uses an invisible iframe to guarantee 100% vector typography, zero blur, and no UI clipping.
 */
export function printExecutiveReportHTML(
  parcels: BookedParcel[],
  analytics: ExecutiveReportAnalytics,
  filters: ReportActiveFilters,
  storeName: string = 'Zaynahs POS',
  preset: PaperPreset = PAPER_PRESETS.a4_portrait
) {
  const isThermal = preset.id === 'thermal_80mm'
  const styles = getPrintReportStyles(preset, isThermal)

  const statusRowsHtml = analytics.statusBreakdown.map(s => `
    <tr>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: 600;">${s.label}</td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: 700;">${s.count}</td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-weight: 700; color: #059669;">Rs. ${s.codAmount.toLocaleString()}</td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${s.volumeShare}%</td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${s.revenueShare}%</td>
    </tr>
  `).join('')

  const prefixRowsHtml = analytics.topPrefixes.map((p, idx) => `
    <tr>
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: 700;">#${idx + 1}</td>
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: 800; color: #0284c7;">${p.prefix}</td>
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: 700;">${p.count}</td>
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-weight: 700; color: #059669;">Rs. ${p.codAmount.toLocaleString()}</td>
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">Rs. ${p.avgCOD.toLocaleString()}</td>
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center;">${p.volumeShare}%</td>
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center;">${p.revenueShare}%</td>
    </tr>
  `).join('')

  const cityRowsHtml = analytics.topCities.slice(0, 10).map((c, idx) => `
    <tr>
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: 700;">#${idx + 1}</td>
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: 700; text-transform: uppercase;">${c.city}</td>
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: 700;">${c.count}</td>
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-weight: 700; color: #059669;">Rs. ${c.codAmount.toLocaleString()}</td>
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">${c.deliveredCount}</td>
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">${c.inTransitCount}</td>
      <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center;">${c.volumeShare}%</td>
    </tr>
  `).join('')

  const ledgerRowsHtml = parcels.map((p, idx) => `
    <tr>
      <td style="padding: 4px 6px; border: 1px solid #e2e8f0; text-align: center; font-family: monospace; font-size: 10px;">${idx + 1}</td>
      <td style="padding: 4px 6px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 10.5px; font-weight: 700; color: #059669;">${p.tracking}</td>
      <td style="padding: 4px 6px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 10px; color: #64748b;">${p.id || 'N/A'}</td>
      <td style="padding: 4px 6px; border: 1px solid #e2e8f0; font-weight: 600; font-size: 10.5px;">${p.name || 'Valued Customer'}</td>
      <td style="padding: 4px 6px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 10px;">${p.phone}</td>
      <td style="padding: 4px 6px; border: 1px solid #e2e8f0; font-size: 10px; text-transform: uppercase;">${p.city}</td>
      <td style="padding: 4px 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a; font-size: 10.5px;">Rs. ${parseCODAmount(p.total).toLocaleString()}</td>
      <td style="padding: 4px 6px; border: 1px solid #e2e8f0; text-align: center; font-size: 9.5px; font-weight: 700;">${p.status}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Logistics Report — ${analytics.reportId}</title>
      <style>
        ${styles}
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="store-brand">${storeName.toUpperCase()}</div>
          <div class="doc-title">Executive Logistics Audit & Operations Manifest</div>
        </div>
        <div class="meta-right">
          <div><strong>Report ID:</strong> <span style="font-family: monospace;">${analytics.reportId}</span></div>
          <div><strong>Generated:</strong> ${analytics.generatedAt}</div>
          <div><strong>Courier Partner:</strong> PostEx V3 Engine</div>
        </div>
      </div>

      <div class="filter-strip">
        <div class="filter-item">
          <span class="filter-label">Date Scope</span>
          <span class="filter-val">${filters.fromDate || 'All'} → ${filters.toDate || 'All'}</span>
        </div>
        <div class="filter-item">
          <span class="filter-label">Status Scope</span>
          <span class="filter-val">${filters.statusFilter === 'all' ? 'All Statuses' : filters.statusFilter}</span>
        </div>
        <div class="filter-item">
          <span class="filter-label">City Scope</span>
          <span class="filter-val">${filters.cityFilter === 'all' ? 'All Cities' : filters.cityFilter}</span>
        </div>
        <div class="filter-item">
          <span class="filter-label">Order Source</span>
          <span class="filter-val">${filters.sourceFilter === 'postex_portal' ? 'Portal / External' : filters.sourceFilter === 'app' ? 'In-App' : 'All Sources'}</span>
        </div>
        <div class="filter-item">
          <span class="filter-label">Search Keyword</span>
          <span class="filter-val">${filters.searchQuery ? `"${filters.searchQuery}"` : 'None (Full Set)'}</span>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-title">Total Filtered Orders</div>
          <div class="kpi-val">${analytics.totalParcels.toLocaleString()}</div>
          <div class="kpi-sub">100% Filtered Scope</div>
        </div>
        <div class="kpi-card emerald">
          <div class="kpi-title">Gross COD Volume</div>
          <div class="kpi-val">Rs. ${analytics.totalCOD.toLocaleString()}</div>
          <div class="kpi-sub">Total Receivable Amount</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Average Order Value</div>
          <div class="kpi-val">Rs. ${analytics.avgCOD.toLocaleString()}</div>
          <div class="kpi-sub">COD per Parcel</div>
        </div>
        <div class="kpi-card emerald">
          <div class="kpi-title">Delivery Success Rate</div>
          <div class="kpi-val">${analytics.deliverySuccessRatio}%</div>
          <div class="kpi-sub">${analytics.deliveredCount} Delivered Orders</div>
        </div>
        <div class="kpi-card sky">
          <div class="kpi-title">Active Pipeline COD</div>
          <div class="kpi-val">Rs. ${(analytics.inTransitCOD + analytics.outForDeliveryCOD).toLocaleString()}</div>
          <div class="kpi-sub">${analytics.inTransitCount + analytics.outForDeliveryCount} In Transit / Out for Del</div>
        </div>
      </div>

      <div class="section-title">Milestone Status Performance</div>
      <table>
        <thead>
          <tr>
            <th style="text-align: left;">Milestone Status</th>
            <th style="width: 70px;">Orders</th>
            <th style="width: 120px; text-align: right;">COD Amount (Rs.)</th>
            <th style="width: 75px;">Volume (%)</th>
            <th style="width: 75px;">Revenue (%)</th>
          </tr>
        </thead>
        <tbody>
          ${statusRowsHtml}
        </tbody>
      </table>

      <div class="section-title">Order Reference Prefix & Channel Analytics</div>
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">Rank</th>
            <th style="text-align: left; width: 110px;">Order Prefix</th>
            <th style="width: 70px;">Orders</th>
            <th style="width: 120px; text-align: right;">COD Revenue</th>
            <th style="width: 90px; text-align: right;">Avg Order</th>
            <th style="width: 70px;">Volume (%)</th>
            <th style="width: 70px;">Revenue (%)</th>
          </tr>
        </thead>
        <tbody>
          ${prefixRowsHtml}
        </tbody>
      </table>

      <div class="section-title">Top Destination Cities Distribution</div>
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">Rank</th>
            <th style="text-align: left;">Destination City</th>
            <th style="width: 60px;">Orders</th>
            <th style="width: 110px; text-align: right;">COD Amount</th>
            <th style="width: 65px;">Delivered</th>
            <th style="width: 65px;">In Transit</th>
            <th style="width: 60px;">Share (%)</th>
          </tr>
        </thead>
        <tbody>
          ${cityRowsHtml}
        </tbody>
      </table>

      <div class="section-title">Parcels Manifest & Dispatch Ledger (${parcels.length} Orders)</div>
      <table>
        <thead>
          <tr>
            <th style="width: 30px;">#</th>
            <th style="text-align: left; width: 105px;">Tracking CN</th>
            <th style="text-align: left; width: 80px;">Order Ref</th>
            <th style="text-align: left;">Customer Name</th>
            <th style="width: 90px;">Phone</th>
            <th style="width: 80px;">City</th>
            <th style="width: 85px; text-align: right;">COD (Rs.)</th>
            <th style="width: 95px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${ledgerRowsHtml}
        </tbody>
      </table>

      <div class="report-footer">
        <div>
          Official Logistics Engine: <a href="https://dispatcher.zaynahs.pk" class="footer-link">dispatcher.zaynahs.pk</a> &bull; PostEx V3 Logistics Architecture
        </div>
        <div>
          &copy; 2026 Zaynahs POS Logistics Ecosystem. Confidential Executive Audit Record.
        </div>
      </div>
    </body>
    </html>
  `

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.visibility = 'hidden'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (doc) {
    doc.open()
    doc.write(html)
    doc.close()

    // Trigger single print cleanly once content is parsed
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch {}
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1500)
    }, 350)
  }
}
