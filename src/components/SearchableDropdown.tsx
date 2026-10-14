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
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 text-left flex justify-between items-center cursor-pointer text-slate-800"
      >
        <span className="truncate">{displayValue}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform text-slate-400 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              autoFocus
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-slate-800"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {allOptionLabel && allOptionValue !== undefined && (
              <button
                type="button"
                onClick={() => handleSelect(allOptionValue)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-slate-50 cursor-pointer border-b border-slate-100 ${
                  value === allOptionValue ? 'bg-blue-50 font-bold text-blue-600' : 'text-slate-700'
                }`}
              >
                {allOptionLabel}
              </button>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 text-center">{emptyLabel}</div>
            ) : (
              filteredOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-slate-50 cursor-pointer ${
                    value === option ? 'bg-blue-50 font-bold text-blue-600' : 'text-slate-700'
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
