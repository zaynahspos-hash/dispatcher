import { PaperPreset } from './types'

/**
 * Returns clean vector print CSS tailored for specific paper sizes (A4, A5, Thermal 80mm).
 * Engineered strictly without blur, with exact page breaks and crisp vector borders.
 */
export function getPrintReportStyles(preset: PaperPreset, isThermal: boolean): string {
  return `
    @page {
      size: ${preset.pageSize};
      margin: ${isThermal ? '4mm' : '10mm'};
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: ${isThermal ? '4mm' : '10mm'};
      font-size: ${isThermal ? '10px' : '11px'};
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .store-brand { font-size: 18px; font-weight: 900; letter-spacing: -0.02em; color: #0f172a; text-transform: uppercase; }
    .doc-title { font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
    .meta-right { text-align: right; font-size: 10px; color: #475569; }
    .meta-right strong { color: #0f172a; }

    .filter-strip {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      margin-bottom: 12px;
      display: grid;
      grid-template-columns: repeat(${isThermal ? 2 : 5}, 1fr);
      gap: 6px;
      font-size: 9.5px;
    }
    .filter-item { display: flex; flex-direction: column; }
    .filter-label { color: #64748b; font-size: 8.5px; text-transform: uppercase; font-weight: 700; }
    .filter-val { font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(${isThermal ? 2 : 5}, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .kpi-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      background: #f8fafc;
    }
    .kpi-card.emerald { background: #f0fdf4; border-color: #86efac; }
    .kpi-card.sky { background: #f0f9ff; border-color: #7dd3fc; }
    .kpi-title { font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: #64748b; }
    .kpi-card.emerald .kpi-title { color: #166534; }
    .kpi-val { font-size: 14px; font-weight: 800; font-family: monospace; color: #0f172a; margin-top: 2px; }
    .kpi-card.emerald .kpi-val { color: #15803d; }
    .kpi-sub { font-size: 8.5px; color: #64748b; margin-top: 1px; }

    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #0f172a;
      margin: 12px 0 6px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-title::after {
      content: "";
      flex: 1;
      height: 1px;
      background: #e2e8f0;
    }

    table { width: 100%; border-collapse: collapse; font-size: 9.5px; margin-bottom: 12px; }
    th {
      background: #0f172a;
      color: #ffffff;
      padding: 5px 8px;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.03em;
      border: 1px solid #0f172a;
    }
    tr:nth-child(even) { background-color: #f8fafc; }



    .report-footer {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5px;
      color: #64748b;
      page-break-inside: avoid;
    }
    .footer-link {
      font-weight: 800;
      color: #059669;
      text-decoration: none;
    }

    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  `
}
