import React, { useState, useMemo } from 'react'
import { CustomerEntry } from './types'

export type ExportPreset = 'meta_phone' | 'meta_value' | 'google_contacts' | 'custom'

interface CustomerExportModalProps {
  isOpen: boolean
  onClose: () => void
  customers: CustomerEntry[]
}

interface ColumnConfig {
  key: string
  label: string
  metaKey: string
  description: string
  required?: boolean
}

const AVAILABLE_COLUMNS: ColumnConfig[] = [
  { key: 'phone', label: 'Phone Number', metaKey: 'phone', description: 'Normalized with country code (923XXXXXXXXX)', required: true },
  { key: 'fn', label: 'First Name', metaKey: 'fn', description: 'Extracted first name of customer' },
  { key: 'ln', label: 'Last Name / Surname', metaKey: 'ln', description: 'Extracted surname/second name' },
  { key: 'ct', label: 'City', metaKey: 'ct', description: 'Normalized destination/city' },
  { key: 'country', label: 'Country Code', metaKey: 'country', description: 'Two-letter ISO country code (e.g. PK)' },
  { key: 'value', label: 'Customer Value', metaKey: 'value', description: 'Purchase value / total orders for lookalike audiences' },
  { key: 'email', label: 'Email', metaKey: 'email', description: 'Customer email if available' },
  { key: 'address', label: 'Street Address', metaKey: 'address', description: 'Full shipping / delivery address' }
]

export const CustomerExportModal: React.FC<CustomerExportModalProps> = ({
  isOpen,
  onClose,
  customers
}) => {
  const [preset, setPreset] = useState<ExportPreset>('meta_phone')
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['phone', 'fn', 'ln', 'ct', 'country'])
  const [defaultCountry, setDefaultCountry] = useState('PK')
  const [phonePrefix, setPhonePrefix] = useState('92')
  const [defaultValue, setDefaultValue] = useState('1')
  const [copied, setCopied] = useState(false)

  // Switch presets
  const handlePresetChange = (newPreset: ExportPreset) => {
    setPreset(newPreset)
    if (newPreset === 'meta_phone') {
      setSelectedColumns(['phone', 'fn', 'ln', 'ct', 'country'])
    } else if (newPreset === 'meta_value') {
      setSelectedColumns(['phone', 'fn', 'ln', 'ct', 'country', 'value'])
    } else if (newPreset === 'google_contacts') {
      setSelectedColumns(['phone', 'fn', 'ln', 'ct', 'address'])
    }
  }

  const toggleColumn = (key: string) => {
    if (key === 'phone') return // phone is required for audience targeting
    setPreset('custom')
    setSelectedColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  // Helper to normalize phone with prefix
  const normalizePhone = (phoneRaw: string) => {
    let clean = (phoneRaw || '').replace(/\D/g, '')
    if (clean.startsWith('0')) {
      clean = phonePrefix + clean.slice(1)
    } else if (!clean.startsWith(phonePrefix) && clean.length === 10) {
      clean = phonePrefix + clean
    }
    return clean
  }

  // Split Name into First and Last
  const splitName = (fullName: string) => {
    const raw = (fullName || '').trim()
    const parts = raw.split(/\s+/)
    const fn = parts[0] || 'Customer'
    const ln = parts.slice(1).join(' ') || ''
    return { fn, ln }
  }

  // Precomputed stats & validation tracking (Red/Green)
  const validationStats = useMemo(() => {
    let validPhones = 0
    let invalidPhones = 0
    let withCity = 0

    customers.forEach(c => {
      const p = normalizePhone(c.phone)
      if (p.length >= 11 && p.length <= 13) {
        validPhones++
      } else {
        invalidPhones++
      }
      if (c.city && c.city.trim()) {
        withCity++
      }
    })

    return {
      total: customers.length,
      validPhones,
      invalidPhones,
      withCity
    }
  }, [customers, phonePrefix])

  // Generate CSV Rows
  const { csvHeaders, csvRows, previewRows } = useMemo(() => {
    const headers = selectedColumns.map(k => {
      const col = AVAILABLE_COLUMNS.find(c => c.key === k)
      return col ? col.metaKey : k
    })

    const rows = customers.map(c => {
      const { fn, ln } = splitName(c.name)
      const phoneNorm = normalizePhone(c.phone)
      const safeCity = (c.city || '').replace(/,/g, '').replace(/"/g, '""').trim()
      const safeAddress = (c.address || '').replace(/,/g, '').replace(/"/g, '""').trim()
      const val = (c.total_orders && c.total_orders > 0) ? String(c.total_orders) : defaultValue

      const rowMap: Record<string, string> = {
        phone: phoneNorm,
        fn: fn ? `"${fn.replace(/"/g, '""')}"` : '',
        ln: ln ? `"${ln.replace(/"/g, '""')}"` : '',
        ct: safeCity ? `"${safeCity}"` : '',
        country: defaultCountry,
        value: val,
        email: c.user?.email || '',
        address: safeAddress ? `"${safeAddress}"` : ''
      }

      return selectedColumns.map(col => rowMap[col] ?? '')
    })

    return {
      csvHeaders: headers,
      csvRows: rows,
      previewRows: rows.slice(0, 4)
    }
  }, [customers, selectedColumns, defaultCountry, phonePrefix, defaultValue])

  // Download Trigger
  const handleDownload = () => {
    if (customers.length === 0) return
    const content = '\uFEFF' + [csvHeaders.join(','), ...csvRows.map(r => r.join(','))].join('\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `meta_audience_${preset}_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    onClose()
  }

  // Copy CSV to Clipboard
  const handleCopy = () => {
    const content = [csvHeaders.join(','), ...csvRows.map(r => r.join(','))].join('\n')
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/70 animate-in fade-in duration-150 overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Export Meta Custom Audience
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Customize columns, review format validation & export with 100% Meta auto-match.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto min-h-0 flex-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          
          {/* 1. Meta Template Presets */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              1. Choose Audience Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePresetChange('meta_phone')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  preset === 'meta_phone'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Phone Targeting</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">100% Match</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                  phone, fn, ln, ct, country • Zero unmapped warnings in Ads Manager
                </p>
              </button>

              <button
                type="button"
                onClick={() => handlePresetChange('meta_value')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  preset === 'meta_value'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Value Lookalike</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">LAL</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                  Includes customer purchase order value for high-ROI lookalikes
                </p>
              </button>

              <button
                type="button"
                onClick={() => handlePresetChange('google_contacts')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  preset === 'google_contacts'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Google & WhatsApp</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Contacts</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                  Full name, street address, city & phone for phonebook import
                </p>
              </button>
            </div>
          </div>

          {/* 2. Column Selection Toggles */}
          <div className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                2. Columns Included ({selectedColumns.length}/{AVAILABLE_COLUMNS.length})
              </label>
              {preset === 'custom' && (
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">Custom Columns Active</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AVAILABLE_COLUMNS.map(col => {
                const isChecked = selectedColumns.includes(col.key)
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => toggleColumn(col.key)}
                    disabled={col.required}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition cursor-pointer ${
                      isChecked
                        ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10 text-slate-900 dark:text-slate-100'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                      isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {isChecked && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{col.label}</p>
                      <p className="text-[9px] text-slate-400 font-mono truncate">{col.metaKey}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. Editable Fallbacks */}
          <div className="pt-4 space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              3. Defaults & Formats
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Country ISO Code</label>
                <input
                  type="text"
                  value={defaultCountry}
                  onChange={e => setDefaultCountry(e.target.value.toUpperCase())}
                  maxLength={2}
                  className="w-full h-8 mt-1 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  placeholder="PK"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Calling Code Prefix</label>
                <input
                  type="text"
                  value={phonePrefix}
                  onChange={e => setPhonePrefix(e.target.value.replace(/\D/g, ''))}
                  maxLength={4}
                  className="w-full h-8 mt-1 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  placeholder="92"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Fallback Order Value</label>
                <input
                  type="number"
                  value={defaultValue}
                  onChange={e => setDefaultValue(e.target.value)}
                  min={1}
                  className="w-full h-8 mt-1 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          {/* 4. Format Validation Track (Red/Green) */}
          <div className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                4. Data Format Track & Validation
              </label>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                {validationStats.total} Total Contacts
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    {validationStats.validPhones} Valid Phones
                  </p>
                  <p className="text-[9px] text-emerald-600/80 dark:text-emerald-400/70">100% Normalized with {phonePrefix}</p>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                validationStats.invalidPhones > 0
                  ? 'border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40'
              }`}>
                <span className={`w-2 h-2 rounded-full ${validationStats.invalidPhones > 0 ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`} />
                <div>
                  <p className={`text-[10px] font-bold ${validationStats.invalidPhones > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {validationStats.invalidPhones} Invalid Numbers
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {validationStats.invalidPhones === 0 ? 'Clean list ready' : 'Ignored or fix digits'}
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 flex items-center gap-2 col-span-2 sm:col-span-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400">
                    {validationStats.withCity} Cities Tracked
                  </p>
                  <p className="text-[9px] text-blue-600/80 dark:text-blue-400/70">Matched for Meta geo-targeting</p>
                </div>
              </div>
            </div>

            {/* Live Sample Preview Table */}
            <div className="mt-2 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
              <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/60 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <span>Live CSV Preview (First 4 Rows)</span>
                <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">● Ready for Ads Manager</span>
              </div>
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px]">
                      {csvHeaders.map((h, i) => (
                        <th key={i} className="px-3 py-1.5 font-bold uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {previewRows.map((r, rIdx) => (
                      <tr key={rIdx} className="hover:bg-white dark:hover:bg-slate-900">
                        {r.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-1.5 whitespace-nowrap">
                            {cIdx === 0 ? (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                {cell}
                              </span>
                            ) : (
                              cell || <span className="text-slate-400 italic font-sans text-[10px]">empty</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="h-9 px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                <span>Copy CSV Text</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="h-9 px-4.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>Download CSV ({customers.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
