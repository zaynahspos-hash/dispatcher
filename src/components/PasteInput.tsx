import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Parcel } from '../utils/groqParser'
import { PasteIcon, SparklesIcon, UploadIcon, InfoIcon } from './Icons'

interface PasteInputProps {
  onParse: (text: string) => void
  onExcelParse?: (parcels: Parcel[]) => void
  loading: boolean
}

const SAMPLE_TEXT = `1. Muhammad Ali
Phone: 0300-1234567
Address: House 5, Street 3, DHA Phase 1, Lahore
Amount: Rs. 2500
Items: 2 pcs

2. Fatima Bibi
Contact: +92 333 9876543
Ghar: Near Masjid, Mohalla Islamabad, Karachi
Amount: 1800
Qty: 3

3. Ahmed Khan (exchange/wrong size)
Number: 03451234567
Pata: Chowk Yateem Khana, Faisalabad
Amount: Non-COD
`

export default function PasteInput({ onParse, onExcelParse, loading }: PasteInputProps) {
  const [text, setText] = useState('')
  const [showSample, setShowSample] = useState(false)

  function loadSample() {
    setText(SAMPLE_TEXT)
    setShowSample(false)
  }

  function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
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
          alert('Excel file is empty or has no rows!')
          return
        }

        const parsed: Parcel[] = data.map((row: any, index: number) => {
          const rawCity = String(row['City'] || '').trim().toUpperCase()
          
          return {
            id: String(row['Order Reference Number'] || row['Reference Number'] || row['Order ID'] || `EXP-${Date.now()}-${index}`),
            total: Number(row['Order Amount'] || row['Amount'] || 0),
            detail: String(row['Order Detail'] || row['Detail'] || row['Items Detail'] || ''),
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

        if (onExcelParse) {
          onExcelParse(parsed)
        }
      } catch (err: any) {
        alert('Excel parsing failed: ' + err.message)
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm transition-colors duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <PasteIcon className="text-blue-600 dark:text-blue-400" size={22} />
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Paste WhatsApp Orders</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Multiple orders ek saath paste karo — AI automatically parse karega
            </p>
          </div>
          <button
            onClick={() => setShowSample(!showSample)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold border border-blue-200 dark:border-blue-900 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition shrink-0 ml-4 cursor-pointer"
          >
            Sample Text
          </button>
        </div>

        {showSample && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Sample WhatsApp message format:</p>
              <button
                onClick={loadSample}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-[#ffffff] px-3 py-1 rounded-lg transition cursor-pointer"
              >
                Load Sample
              </button>
            </div>
            <pre className="text-xs text-blue-800 dark:text-blue-300 whitespace-pre-wrap font-mono">{SAMPLE_TEXT}</pre>
          </div>
        )}

        <textarea
          className="w-full h-72 border border-gray-200 dark:border-slate-800 rounded-xl p-4 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 transition-colors"
          placeholder={`Yahan WhatsApp parcel messages paste karo...\n\nExample:\nMuhammad Ali\n0300-1234567\nHouse 5, DHA Phase 1, Lahore\nAmount: 2500`}
          value={text}
          onChange={e => setText(e.target.value)}
        />

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => onParse(text)}
            disabled={!text.trim() || loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-[#ffffff] font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                AI Parse ho raha hai...
              </>
            ) : (
              <>
                <SparklesIcon size={18} />
                Parse with AI
              </>
            )}
          </button>
          <button
            onClick={() => setText('')}
            disabled={!text}
            className="px-5 py-3 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 font-medium transition cursor-pointer"
          >
            Clear
          </button>
        </div>

        <div className="my-6 flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-400 font-semibold uppercase select-none">
          <div className="h-[1px] bg-gray-200 dark:bg-slate-800 flex-1"></div>
          <span>Or Upload Excel File</span>
          <div className="h-[1px] bg-gray-200 dark:bg-slate-800 flex-1"></div>
        </div>

        <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition cursor-pointer relative group">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleExcelUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <UploadIcon className="text-gray-400 dark:text-gray-500 group-hover:text-blue-500 group-hover:scale-110 transition duration-200" size={32} />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-400">Drag & drop sample.xlsx here</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">or click to browse from desktop</p>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-5 bg-gray-50 dark:bg-slate-950/40 rounded-xl p-4 border border-gray-100 dark:border-slate-800/80">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
            <InfoIcon className="text-blue-600 dark:text-blue-400" size={14} />
            Tips:
          </p>
          <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5 list-disc list-inside">
            <li>Multiple orders paste kar saktay ho — AI sab alag kar lega</li>
            <li>Urdu addresses bhi chalti hain — AI Roman Urdu mein convert karega</li>
            <li>+92 ya 92 se shuru phone numbers automatically fix ho jayenge</li>
            <li>City spelling galat ho toh bhi AI closest match lagayega</li>
            <li>Exchange/Return/Wrong Size likha ho toh automatically "Replacement" type lagega</li>
            <li>Non-COD / Advance Paid ka amount automatically 0 ho jata hai</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
