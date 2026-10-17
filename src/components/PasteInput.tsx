import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { Parcel } from '../utils/groqParser'
import { PasteIcon, SparklesIcon, UploadIcon, InfoIcon, DownloadIcon, CheckIcon } from './Icons'
import { useToast } from './common/Toast'

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
    <div className="space-y-6 w-full max-w-full min-w-0">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <PasteIcon size={20} />
            </span>
            WhatsApp Order Dispatcher
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Raw WhatsApp chats ko smart AI models (Groq LLaMA-3.1 / Gemini) se 1-click clean parcel records mein convert karein.
          </p>
        </div>

        {/* Quick Excel Download Button */}
        <button
          onClick={downloadSampleExcel}
          className="self-start sm:self-auto px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <DownloadIcon size={14} className="text-emerald-500" />
          <span>Download Sample Excel</span>
        </button>
      </div>

      {/* Quick Template Chips */}
      <div>
        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">
          1-Click Sample Templates (Tap to Test)
        </span>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x pb-1">
          {TEMPLATES.map(tmpl => (
            <button
              key={tmpl.id}
              onClick={() => {
                setText(tmpl.text)
                toast.info('Template Loaded', tmpl.label)
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 text-slate-700 dark:text-slate-300 transition cursor-pointer shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
            >
              {tmpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: AI Text Terminal (8 Cols on Desktop) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-4 sm:p-6 shadow-sm">
          
          {/* Terminal Bar */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              <span>LIVE PARSER TERMINAL</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400 font-mono">
                {charCount} chars &bull; {wordCount} words
              </span>
              {text && (
                <button
                  onClick={() => setText('')}
                  className="text-xs text-rose-500 hover:text-rose-600 font-bold hover:underline cursor-pointer"
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
              placeholder="Yahan WhatsApp ke single ya multiple customer messages copy paste karein...

Example:
Muhammad Ali
0300-1234567
House 5, Street 3, DHA Phase 1, Lahore
Amount: Rs. 2500
Items: 2 Suits"
              className="w-full h-80 sm:h-96 p-4 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800/90 text-slate-900 dark:text-slate-100 font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>

          {/* Action Row */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-bold">
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
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-tight disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>AI Parsing Orders...</span>
                </>
              ) : (
                <>
                  <SparklesIcon size={18} />
                  <span>Parse with AI &rarr;</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Column: Excel Hub & Engine Insights (4 Cols on Desktop) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Excel Bulk Upload Card */}
          <div className="bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <UploadIcon size={18} className="text-emerald-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Bulk Excel File Ingestion
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Shopify, WooCommerce ya PostEx format ki Excel sheet (.xlsx) direct upload karein.
            </p>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer relative group ${
                dragOver 
                  ? 'border-emerald-500 bg-emerald-500/10' 
                  : 'border-slate-300 dark:border-slate-700/80 hover:border-emerald-500/60 hover:bg-slate-50 dark:hover:bg-slate-900/60'
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
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-emerald-500 group-hover:scale-110 transition duration-200">
                  <UploadIcon size={20} />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Drag & drop .xlsx here
                </p>
                <p className="text-[11px] text-slate-400">
                  or browse from your system
                </p>
              </div>
            </div>
          </div>

          {/* AI Intelligence Rules Card */}
          <div className="bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <InfoIcon size={16} className="text-emerald-500" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Logistics AI Engine Highlights
              </h4>
            </div>

            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5">
              <li className="flex items-start gap-2">
                <CheckIcon size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Multi-Order Splitting:</strong> Ek sath 50+ messages paste karein, AI automatic alag kar dega.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>City Normalization:</strong> 500+ PostEx operational cities ke spelling auto-match hote hain.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Phone Sanitization:</strong> +92, 92, spaces aur dashes hata kar standard 11 digits format banta hai.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Exchange / Non-COD:</strong> Return/replacement detect hote hi COD 0 ho jata hai.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  )
}
