import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { Parcel } from '../utils/aiParser'
import { PasteIcon, SparklesIcon, UploadIcon, InfoIcon, DownloadIcon, CheckIcon } from './Icons'
import { useToast } from './common/Toast'
import { ScrollableChipsBar } from './common/ScrollableChipsBar'

interface PasteInputProps {
  onParse: (text: string) => void
  onExcelParse?: (parcels: Parcel[]) => void
  loading: boolean
}

const TEMPLATES = [
  {
    id: 'bulk3',
    label: '3-Order Bulk Sample',
    text: `1. Muhammad Ali
Phone: 0300-1234567
Address: House 5, Street 3, DHA Phase 1, Lahore
Amount: Rs. 2500
Items: 2 pcs Kids Clothes

2. Fatima Bibi
Contact: +92 333 9876543
Ghar: Flat 404, Near Masjid, Gulshan e Iqbal, Karachi
Amount: 1800
Qty: 3 Lawn Suits

3. Ahmed Khan
Number: 03451234567
Pata: Street 2, Chowk Yateem Khana, Faisalabad
Amount: 3200
Note: Fragile item`
  },
  {
    id: 'exchange',
    label: 'Exchange / Replacement',
    text: `Customer: Bilal Tariq
Mobile: 03217654321
Address: Shop 14, Raja Bazaar, Rawalpindi
Order Type: Replacement (size issue)
Cash to Collect: 200 (Delivery fee only)
Items: Medium Kurti Exchange`
  },
  {
    id: 'urdu',
    label: 'Roman Urdu Mixed Chat',
    text: `Bhai mera parcel book kar do
Naam: Usman Ghani
Phone: 03124567890
Address: Mohalla Farooqia, Gali No 4, Multan
Total bill 4500 ban gaya hai delivery pe payment karon ga
Items: 1 Pair Leather Shoes`
  },
  {
    id: 'noncod',
    label: 'Advance Paid (Non-COD)',
    text: `Order Details:
Recipient: Dr. Ayesha Noor
Cell: 03029876543
Deliver to: Clinic 3, Jail Road, Lahore
Payment: Already Paid via EasyPaisa (Non COD)
Amount: 0
Items: Dental Care Kit`
  }
]

export default function PasteInput({ onParse, onExcelParse, loading }: PasteInputProps) {
  const [text, setText] = useState('')
  const [mobileMode, setMobileMode] = useState<'paste' | 'excel'>('paste')
  const [dragOver, setDragOver] = useState(false)
  const toast = useToast()

  function handleExcelFile(file: File) {
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json<any>(ws)

        if (data.length === 0) {
          toast.error('Empty File', 'The selected Excel sheet has no order rows.')
          return
        }

        const parsed: Parcel[] = data.map((row: any, index: number) => {
          const rawCity = String(row['City'] || '').trim().toUpperCase()
          return {
            id: String(row['Order Reference Number'] || row['Reference Number'] || row['Order ID'] || `EXP-${Date.now()}-${index}`),
            total: Number(row['Order Amount'] || row['Amount'] || 0),
            detail: String(row['Order Detail'] || row['Detail'] || row['Items Detail'] || 'Parcel'),
            name: String(row['Customer Name'] || row['Name'] || ''),
            phone: String(row['Customer Phone'] || row['Phone'] || row['Contact'] || ''),
            address: String(row['Order Address'] || row['Address'] || ''),
            city: rawCity,
            items: Number(row['Items'] || row['Qty'] || 1),
            airwayBillCopy: Number(row['Airway Bill Copies'] || 1),
            note: String(row['Notes'] || row['Remarks'] || ''),
            orderType: String(row['Order Type'] || row['Order Type (Normal/Reversed/Replacement/Overland)'] || 'Normal'),
            weight: Number(row['Booking Weight'] || row['Weight'] || 0.5),
          }
        })

        toast.success('Excel Sheet Parsed', `Loaded ${parsed.length} orders into the parcels table!`)
        if (onExcelParse) {
          onExcelParse(parsed)
        }
      } catch (err: any) {
        toast.error('Excel Import Failed', err.message || 'Could not parse spreadsheet file.')
      }
    }
    reader.readAsBinaryString(file)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleExcelFile(file)
  }

  function downloadSampleExcel() {
    const sampleRows = [
      {
        'Order Reference Number': 'ORD-101',
        'Customer Name': 'Muhammad Ali',
        'Customer Phone': '03001234567',
        'City': 'Lahore',
        'Order Address': 'House 5, Street 3, DHA Phase 1',
        'Order Amount': 2500,
        'Items Detail': 'Kids Wear (2 pcs)',
        'Order Type': 'Normal',
        'Booking Weight': 0.5
      },
      {
        'Order Reference Number': 'ORD-102',
        'Customer Name': 'Fatima Bibi',
        'Customer Phone': '03339876543',
        'City': 'Karachi',
        'Order Address': 'Flat 404, Gulshan e Iqbal',
        'Order Amount': 1800,
        'Items Detail': 'Stitched Dress',
        'Order Type': 'Normal',
        'Booking Weight': 0.8
      }
    ]
    const ws = XLSX.utils.json_to_sheet(sampleRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sample Orders')
    XLSX.writeFile(wb, 'PostEx_Sample_Orders.xlsx')
    toast.info('Sample Downloaded', 'PostEx_Sample_Orders.xlsx saved to your computer.')
  }

  const charCount = text.length
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div className="w-full max-w-full min-w-0">
      
      {/* ========================================================
          1. MOBILE VIEW (< 860px) - Native iOS Style
          ======================================================== */}
      <div className="min-[860px]:hidden space-y-3 pb-6">
        {/* Segmented Control */}
        <div className="ios-seg">
          <button
            type="button"
            onClick={() => setMobileMode('paste')}
            className={mobileMode === 'paste' ? 'on' : ''}
          >
            Paste chat
          </button>
          <button
            type="button"
            onClick={() => setMobileMode('excel')}
            className={mobileMode === 'excel' ? 'on' : ''}
          >
            Excel file
          </button>
        </div>

        {mobileMode === 'paste' ? (
          <>
            {/* Native Mobile Textarea (16px font prevents iOS zoom) */}
            <div className="ios-grp p-3">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste customer WhatsApp messages here...

Muhammad Ali
0300-1234567
House 5, Street 3, DHA Phase 1, Lahore
Amount: Rs. 2500
Items: 2 Suits"
                className="w-full h-56 bg-transparent border-0 text-[16px] text-[var(--tx)] placeholder:text-[var(--t3)] resize-none focus:outline-none leading-relaxed"
              />
              <div className="flex items-center justify-between pt-2 border-t border-[var(--bd)] text-[12px] text-[var(--t2)]">
                <span>{charCount} chars · {wordCount} words</span>
                {text && (
                  <button
                    type="button"
                    onClick={() => setText('')}
                    className="text-[var(--dg)] font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Quick Sample Chips */}
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-[var(--t2)] uppercase px-2 mb-1.5">
                Try a sample
              </div>
              <div className="ios-grp divide-y divide-[var(--bd)]">
                {TEMPLATES.map(tmpl => (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      setText(tmpl.text)
                      toast.info('Template Loaded', tmpl.label)
                    }}
                    className="ios-row tap cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <b className="text-[14px] font-medium text-[var(--tx)] truncate block">
                        {tmpl.label}
                      </b>
                      <span className="text-[12px] text-[var(--t2)] truncate block">
                        {tmpl.text.split('\n')[0]}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--ac)]">Use</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 50px Mobile CTA */}
            <button
              type="button"
              onClick={() => {
                if (!text.trim()) {
                  toast.warning('Empty Chat', 'Please paste at least one customer WhatsApp order first.')
                  return
                }
                onParse(text)
              }}
              disabled={!text.trim() || loading}
              className={`ios-cta w-full shadow-sm mt-3 ${!text.trim() || loading ? 'off' : ''}`}
            >
              {loading ? (
                <span>AI Parsing Orders...</span>
              ) : (
                <>
                  <SparklesIcon size={18} />
                  <span>Parse with AI &rarr;</span>
                </>
              )}
            </button>
          </>
        ) : (
          <>
            {/* Excel Mobile Ingestion Card */}
            <div className="ios-grp p-6 text-center">
              <input
                type="file"
                id="excel-mobile-file"
                accept=".xlsx, .xls"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleExcelFile(file)
                }}
                className="hidden"
              />
              <label htmlFor="excel-mobile-file" className="cursor-pointer block">
                <div className="w-12 h-12 rounded-2xl bg-[var(--acs)] text-[var(--ac)] mx-auto flex items-center justify-center mb-2">
                  <UploadIcon size={24} />
                </div>
                <b className="text-[15px] font-semibold text-[var(--tx)] block mb-1">
                  Choose an .xlsx file
                </b>
                <span className="text-[13px] text-[var(--t2)] block">
                  Shopify, WooCommerce or PostEx format
                </span>
              </label>
            </div>

            <div className="ios-grp">
              <div
                onClick={downloadSampleExcel}
                className="ios-row tap cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <b className="text-[15px] font-medium text-[var(--tx)] block">
                    Download sample Excel
                  </b>
                  <span className="text-[13px] text-[var(--t2)] block">
                    PostEx compatible template (.xlsx)
                  </span>
                </div>
                <DownloadIcon size={16} className="text-[var(--ac)] shrink-0" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ========================================================
          2. DESKTOP VIEW (>= 860px) - Logistics Workspace
          ======================================================== */}
      <div className="hidden min-[860px]:block space-y-6">
        
        {/* Page Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--bd)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--acs)] text-[var(--ac)] flex items-center justify-center shrink-0">
              <PasteIcon size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--tx)] tracking-tight">
                WhatsApp Order Dispatcher
              </h2>
              <p className="text-xs text-[var(--t2)] mt-0.5">
                Convert raw customer chats into clean parcel records with 1-click AI parsing.
              </p>
            </div>
          </div>

          <button
            onClick={downloadSampleExcel}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--bd)] bg-[var(--s1)] text-[var(--tx)] hover:bg-[var(--s2)] transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <DownloadIcon size={14} className="text-[var(--ac)]" />
            <span>Download Sample Excel</span>
          </button>
        </div>

        {/* Quick Template Chips */}
        <div>
          <span className="text-[11px] font-semibold text-[var(--t2)] uppercase tracking-wider block mb-2">
            1-Click Sample Templates (Tap to Test)
          </span>
          <ScrollableChipsBar
            containerClassName="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x pb-1"
          >
            {TEMPLATES.map(tmpl => (
              <button
                key={tmpl.id}
                onClick={() => {
                  setText(tmpl.text)
                  toast.info('Template Loaded', tmpl.label)
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--s1)] border border-[var(--bd)] hover:border-[var(--ac)] text-[var(--tx)] transition cursor-pointer shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
              >
                {tmpl.label}
              </button>
            ))}
          </ScrollableChipsBar>
        </div>

        {/* Main Two-Column Bento Layout */}
        <div className="grid grid-cols-12 gap-6 items-start">
          
          {/* Left Column: AI Text Terminal (8 Cols on Desktop) */}
          <div className="col-span-8 bg-[var(--s1)] rounded-2xl border border-[var(--bd)] p-5 shadow-xs">
            
            {/* Terminal Bar */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--bd)] text-xs">
              <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--t2)]">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--ac)] inline-block animate-pulse"></span>
                <span>LIVE PARSER TERMINAL</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[var(--t2)] font-mono">
                  {charCount} chars · {wordCount} words
                </span>
                {text && (
                  <button
                    onClick={() => setText('')}
                    className="text-xs text-[var(--dg)] hover:underline font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Code Editor Style Textarea */}
            <div className="relative">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste single or multiple customer WhatsApp messages here...

Example:
Muhammad Ali
0300-1234567
House 5, Street 3, DHA Phase 1, Lahore
Amount: Rs. 2500
Items: 2 Suits"
                className="w-full h-80 p-4 rounded-xl bg-[var(--s2)] border border-[var(--bd)] text-[var(--tx)] font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ac)]/40 transition placeholder:text-[var(--t3)]"
              />
            </div>

            {/* Action Row */}
            <div className="mt-4 pt-4 border-t border-[var(--bd)] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[var(--t2)]">
                <span className="px-2 py-0.5 rounded-md bg-[var(--s2)] font-mono text-[11px] font-bold">
                  Ctrl + Enter
                </span>
                <span>to parse directly</span>
              </div>

              <button
                onClick={() => {
                  if (!text.trim()) {
                    toast.warning('Empty Chat', 'Please paste at least one customer WhatsApp order first.')
                    return
                  }
                  onParse(text)
                }}
                disabled={!text.trim() || loading}
                className="px-6 py-2.5 rounded-xl bg-[var(--ac)] hover:opacity-90 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>AI Parsing Orders...</span>
                ) : (
                  <>
                    <SparklesIcon size={16} />
                    <span>Parse with AI &rarr;</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Right Column: Excel Hub & Engine Insights (4 Cols on Desktop) */}
          <div className="col-span-4 space-y-5">
            
            {/* Excel Bulk Upload Card */}
            <div className="bg-[var(--s1)] rounded-2xl border border-[var(--bd)] p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <UploadIcon size={18} className="text-[var(--ac)]" />
                <h3 className="font-semibold text-sm text-[var(--tx)]">
                  Bulk Excel File Ingestion
                </h3>
              </div>
              
              <p className="text-xs text-[var(--t2)] mb-4">
                Directly upload Excel sheets (.xlsx) in Shopify, WooCommerce, or PostEx format.
              </p>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer relative group ${
                  dragOver 
                    ? 'border-[var(--ac)] bg-[var(--acs)]' 
                    : 'border-[var(--bd)] hover:border-[var(--ac)] hover:bg-[var(--s2)]'
                }`}
              >
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleExcelFile(file)
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[var(--s2)] flex items-center justify-center text-[var(--t2)] group-hover:text-[var(--ac)] transition">
                    <UploadIcon size={20} />
                  </div>
                  <p className="text-xs font-semibold text-[var(--tx)]">
                    Drag & drop .xlsx here
                  </p>
                  <p className="text-[11px] text-[var(--t2)]">
                    or browse from your system
                  </p>
                </div>
              </div>
            </div>

            {/* AI Highlights Card */}
            <div className="bg-[var(--s1)] rounded-2xl border border-[var(--bd)] p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <InfoIcon size={16} className="text-[var(--ac)]" />
                <h4 className="font-semibold text-xs uppercase tracking-wider text-[var(--tx)]">
                  Logistics AI Engine Highlights
                </h4>
              </div>

              <ul className="text-xs text-[var(--t2)] space-y-2">
                <li className="flex items-start gap-2">
                  <CheckIcon size={14} className="text-[var(--ac)] shrink-0 mt-0.5" />
                  <span><strong>Multi-Order Splitting:</strong> Paste 50+ messages at once; AI automatically splits individual orders.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon size={14} className="text-[var(--ac)] shrink-0 mt-0.5" />
                  <span><strong>City Normalization:</strong> Auto-resolves spellings against 500+ PostEx operational cities.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon size={14} className="text-[var(--ac)] shrink-0 mt-0.5" />
                  <span><strong>Phone Sanitization:</strong> Formats to clean 11 digits automatically.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon size={14} className="text-[var(--ac)] shrink-0 mt-0.5" />
                  <span><strong>Exchange / Non-COD:</strong> Automatically zeroes COD for returns/replacements.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
