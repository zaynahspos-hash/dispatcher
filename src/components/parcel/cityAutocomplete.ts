export const POPULAR_CITIES = [
  'LAHORE', 'KARACHI', 'ISLAMABAD', 'RAWALPINDI', 'FAISALABAD',
  'MULTAN', 'PESHAWAR', 'GUJRANWALA', 'SIALKOT', 'QUETTA',
  'HYDERABAD', 'BAHAWALPUR', 'SARGODHA', 'SUKKUR', 'GUJRAT',
  'SHEIKHUPURA', 'JHELUM', 'SAHIWAL', 'KASUR', 'MARDAN', 'WAH CANTT',
  'ATTOCK', 'CHAKWAL', 'OKARA', 'DERA GHAZI KHAN', 'RAHIM YAR KHAN'
]

export const CITY_ALIASES: Record<string, string> = {
  lhr: 'LAHORE',
  lah: 'LAHORE',
  khi: 'KARACHI',
  kar: 'KARACHI',
  isb: 'ISLAMABAD',
  isl: 'ISLAMABAD',
  rwp: 'RAWALPINDI',
  pindi: 'RAWALPINDI',
  fsd: 'FAISALABAD',
  fai: 'FAISALABAD',
  mul: 'MULTAN',
  psh: 'PESHAWAR',
  gjw: 'GUJRANWALA',
  guj: 'GUJRANWALA',
  skt: 'SIALKOT',
  qta: 'QUETTA',
  hyd: 'HYDERABAD',
  bwp: 'BAHAWALPUR',
  sgd: 'SARGODHA',
  skr: 'SUKKUR',
  ryk: 'RAHIM YAR KHAN',
  dgk: 'DERA GHAZI KHAN'
}

export function getFilteredCities(query: string, allCities: string[]): string[] {
  const uniqueCities = Array.from(new Set(allCities))
  const clean = (query || '').trim().toLowerCase()

  if (!clean) {
    const popularInList = POPULAR_CITIES.filter(c => uniqueCities.includes(c))
    const remainder = uniqueCities.filter(c => !popularInList.includes(c)).slice(0, 10)
    return Array.from(new Set([...popularInList, ...remainder]))
  }

  const results: string[] = []

  // Alias lookup
  const aliasMatch = CITY_ALIASES[clean]
  if (aliasMatch && uniqueCities.includes(aliasMatch)) {
    results.push(aliasMatch)
  }

  // Exact prefix matches first
  const prefixMatches = uniqueCities.filter(c => c.toLowerCase().startsWith(clean))
  prefixMatches.sort((a, b) => a.localeCompare(b))
  for (const c of prefixMatches) {
    if (!results.includes(c)) results.push(c)
  }

  // Substring matches next
  const substringMatches = uniqueCities.filter(
    c => c.toLowerCase().includes(clean) && !c.toLowerCase().startsWith(clean)
  )
  substringMatches.sort((a, b) => a.localeCompare(b))
  for (const c of substringMatches) {
    if (!results.includes(c)) results.push(c)
  }

  return results.slice(0, 25)
}
