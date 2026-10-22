import { POPULAR_CITIES } from './cityAutocomplete'

interface CityDropdownMenuProps {
  filteredCities: string[]
  isNearBottom?: boolean
  selectedCity?: string
  onSelectCity: (city: string) => void
}

export function CityDropdownMenu({
  filteredCities,
  isNearBottom = false,
  selectedCity,
  onSelectCity
}: CityDropdownMenuProps) {
  return (
    <div
      className={`absolute z-50 left-0 min-w-[260px] w-full ${
        isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
      } bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in duration-100 ring-1 ring-black/5 dark:ring-white/10`}
    >
      <div className="p-2 bg-slate-50 dark:bg-[#070b12] text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800">
        <span>Matching Cities ({filteredCities.length})</span>
        {filteredCities.length > 0 && (
          <span className="text-emerald-600 dark:text-emerald-400 text-[9px] font-medium">Select</span>
        )}
      </div>
      {filteredCities.length === 0 ? (
        <div className="p-3 text-center text-xs text-slate-400 italic">
          No matching PostEx cities
        </div>
      ) : (
        <div className="p-1">
          {filteredCities.map(city => (
            <button
              key={city}
              type="button"
              onMouseDown={e => {
                e.preventDefault()
                onSelectCity(city)
              }}
              className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                selectedCity?.toUpperCase() === city
                  ? 'bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
              }`}
            >
              <span>{city}</span>
              {POPULAR_CITIES.includes(city) && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 font-medium">
                  Major
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
