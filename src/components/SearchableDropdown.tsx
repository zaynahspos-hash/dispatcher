import React, { useState, useRef, useEffect } from 'react'

interface SearchableDropdownProps {
  value: string
  onChange: (val: string) => void
  options: string[]
  placeholder?: string
  className?: string
  emptyLabel?: string
  allOptionLabel?: string // Optional label for "All" option (e.g. "All Cities")
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

  const filteredOptions = options.filter(option =>
    (option || '').toLowerCase().includes(search.toLowerCase())
  )

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
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setSearch('')
        }}
        className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white dark:bg-[#0c121e] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-left flex justify-between items-center cursor-pointer shadow-xs transition-colors"
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
                className={`w-full text-left px-3.5 py-2 text-xs transition-colors cursor-pointer ${
                  value === allOptionValue 
                    ? 'bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {allOptionLabel}
              </button>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 dark:text-slate-500 text-center font-medium">
                {emptyLabel}
              </div>
            ) : (
              filteredOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-3.5 py-2 text-xs transition-colors cursor-pointer ${
                    value === option 
                      ? 'bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {option}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
