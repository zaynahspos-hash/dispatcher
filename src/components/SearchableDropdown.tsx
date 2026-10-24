import React, { useState, useRef, useEffect, useMemo } from 'react'

export type SearchableDropdownOption = {
  value: string
  label: string
  subLabel?: string
  searchKeywords?: string
}

export type SearchableDropdownItem = string | SearchableDropdownOption

interface SearchableDropdownProps {
  value?: string
  onChange?: (val: string) => void
  isMulti?: boolean
  values?: string[]
  onMultiChange?: (vals: string[]) => void
  multiLabelFormatter?: (selectedCount: number, totalCount: number) => string
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
  isMulti = false,
  values = [],
  onMultiChange,
  multiLabelFormatter,
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
    if (onChange) onChange(val)
    setIsOpen(false)
  }

  // Multi-select state helpers
  const isAllSelected = useMemo(() => {
    if (!isMulti) return false
    if (!values || values.length === 0) return true
    if (allOptionValue !== undefined && values.includes(allOptionValue)) return true
    if (values.length === normalizedOptions.length) return true
    return false
  }, [isMulti, values, allOptionValue, normalizedOptions.length])

  const selectedCount = useMemo(() => {
    if (!isMulti) return 0
    if (isAllSelected) return normalizedOptions.length
    return (values || []).filter(v => allOptionValue === undefined || v !== allOptionValue).length
  }, [isMulti, isAllSelected, values, allOptionValue, normalizedOptions.length])

  const handleToggleMulti = (optValue: string) => {
    if (!onMultiChange) return

    // Clicking the "all" option
    if (allOptionValue !== undefined && optValue === allOptionValue) {
      if (isAllSelected) {
        onMultiChange([])
      } else {
        onMultiChange([allOptionValue])
      }
      return
    }

    const currentClean = (values || []).filter(v => allOptionValue === undefined || v !== allOptionValue)
    let nextVals: string[] = []

    if (isAllSelected) {
      // If was in "All" mode and clicked specific item, isolate to that item
      nextVals = [optValue]
    } else {
      if (currentClean.includes(optValue)) {
        nextVals = currentClean.filter(v => v !== optValue)
      } else {
        nextVals = [...currentClean, optValue]
      }
    }

    // If all items selected or none selected, reset to all
    if (nextVals.length === normalizedOptions.length || nextVals.length === 0) {
      onMultiChange(allOptionValue !== undefined ? [allOptionValue] : [])
    } else {
      onMultiChange(nextVals)
    }
  }

  // Determine what text to display as the current selection
  let displayValue = value || ''
  let countBadge: number | null = null

  if (isMulti) {
    const cleanVals = (values || []).filter(v => allOptionValue === undefined || v !== allOptionValue)
    if (isAllSelected || cleanVals.length === 0) {
      displayValue = allOptionLabel || 'All'
    } else if (cleanVals.length === 1) {
      const matched = normalizedOptions.find(opt => opt.value === cleanVals[0])
      displayValue = matched ? matched.label : cleanVals[0]
      countBadge = 1
    } else {
      if (multiLabelFormatter) {
        displayValue = multiLabelFormatter(cleanVals.length, normalizedOptions.length)
      } else {
        displayValue = `${cleanVals.length} Selected`
      }
      countBadge = cleanVals.length
    }
  } else {
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
        <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
          <span className="truncate font-medium">{displayValue}</span>
          {isMulti && !isAllSelected && countBadge !== null && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shrink-0">
              {countBadge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isMulti && !isAllSelected && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (onMultiChange) {
                  onMultiChange(allOptionValue !== undefined ? [allOptionValue] : [])
                }
              }}
              className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Reset to All"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            className={`w-4 h-4 ml-1 transition-transform text-slate-400 dark:text-slate-500 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-1.5 w-full min-w-[280px] bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search Box */}
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

          {/* Multi-Select Action Bar */}
          {isMulti && (
            <div className="px-3 py-1.5 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {isAllSelected ? (
                  <span>All ({normalizedOptions.length}) selected</span>
                ) : (
                  <span>{selectedCount} of {normalizedOptions.length} selected</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onMultiChange && onMultiChange(allOptionValue !== undefined ? [allOptionValue] : normalizedOptions.map(o => o.value))}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={() => onMultiChange && onMultiChange([])}
                  className="font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {allOptionLabel && allOptionValue !== undefined && (!search.trim() || allOptionLabel.toLowerCase().includes(search.toLowerCase().trim())) && (
              <button
                type="button"
                onClick={() => {
                  if (isMulti) {
                    handleToggleMulti(allOptionValue)
                  } else {
                    handleSelect(allOptionValue)
                  }
                }}
                className={`w-full text-left px-3.5 py-2 text-xs transition-colors cursor-pointer flex items-center justify-between gap-2.5 ${
                  (isMulti ? isAllSelected : value === allOptionValue)
                    ? 'bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isMulti && (
                    <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                      isAllSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}>
                      {isAllSelected && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  )}
                  <span className="truncate">{allOptionLabel}</span>
                </div>

                {!isMulti && value === allOptionValue && (
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
              filteredOptions.map(option => {
                const isSelected = isMulti
                  ? (!isAllSelected && (values || []).includes(option.value))
                  : value === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (isMulti) {
                        handleToggleMulti(option.value)
                      } else {
                        handleSelect(option.value)
                      }
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs transition-colors cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {isMulti && (
                        <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{option.label}</span>
                        {option.subLabel && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-normal">
                            {option.subLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {!isMulti && isSelected && (
                      <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer Bar for Multi-select */}
          {isMulti && (
            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#070b12] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onMultiChange && onMultiChange(allOptionValue !== undefined ? [allOptionValue] : [])}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer px-2 py-1"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition active:scale-95 shadow-2xs cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
