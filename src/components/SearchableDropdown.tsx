import React, { useState, useRef, useEffect, useMemo } from 'react'

export type SearchableDropdownOption = {
  value: string
  label: string
  subLabel?: string
  searchKeywords?: string
}

export type SearchableDropdownItem = string | SearchableDropdownOption

interface SearchableDropdownProps {
  value: string
  onChange: (val: string) => void
  options: SearchableDropdownItem[]
  placeholder?: string
  className?: string
  emptyLabel?: string
  allOptionLabel?: string // Optional label for "All" option (e.g. "All Cities", "All Merchants")
  allOptionValue?: string // Optional value representing "All"
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  emptyLabel = 'No options found',
  allOptionLabel,
  allOptionValue
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const normalizedOptions = useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'string') {
        return {
          value: opt,
          label: opt,
          subLabel: undefined,
          searchKeywords: opt.toLowerCase()
        }
      }
      return {
        value: opt.value,
        label: opt.label,
        subLabel: opt.subLabel,
        searchKeywords: `${opt.label} ${opt.subLabel || ''} ${opt.searchKeywords || ''} ${opt.value}`.toLowerCase()
      }
    })
  }, [options])

  const filteredOptions = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return normalizedOptions
    return normalizedOptions.filter(opt => opt.searchKeywords.includes(q))
  }, [normalizedOptions, search])

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
  }

  // Determine what text to display as the current selection
  let displayValue = value
  if (allOptionValue !== undefined && value === allOptionValue) {
    displayValue = allOptionLabel || allOptionValue
  } else if (!value) {
    displayValue = placeholder
  } else {
    const matched = normalizedOptions.find(opt => opt.value === value)
    if (matched) {
      displayValue = matched.label
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setSearch('')
        }}
        className="w-full h-9 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left flex justify-between items-center cursor-pointer shadow-xs transition-colors"
      >
        <span className="truncate font-medium">{displayValue}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform text-slate-400 dark:text-slate-500 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-1.5 w-full bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#070b12] sticky top-0 z-10">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              autoFocus
              className="w-full border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-[#0c121e] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
            />
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {allOptionLabel && allOptionValue !== undefined && (
              <button
                type="button"
                onClick={() => handleSelect(allOptionValue)}
                className={`w-full text-left px-3.5 py-2 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  value === allOptionValue 
                    ? 'bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span>{allOptionLabel}</span>
                {value === allOptionValue && (
                  <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 dark:text-slate-500 text-center font-medium">
                {emptyLabel}
              </div>
            ) : (
              filteredOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3.5 py-2 text-xs transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    value === option.value 
                      ? 'bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{option.label}</span>
                    {option.subLabel && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {option.subLabel}
                      </span>
                    )}
                  </div>
                  {value === option.value && (
                    <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
