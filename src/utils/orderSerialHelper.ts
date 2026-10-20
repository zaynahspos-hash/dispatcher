import { Parcel } from './groqParser'

export interface SerialConflictInfo {
  conflictedIndices: Set<number>
  conflictReasons: Map<number, 'already_in_db' | 'duplicate_in_table'>
  totalConflicts: number
}

/**
 * Standardize an order ID for case-insensitive comparison
 */
export function cleanSerialId(id: string | undefined | null): string {
  return String(id || '').trim().toLowerCase()
}

/**
 * Build a Set of all existing order IDs from history / database
 */
export function buildHistoryIdSet(history?: Array<{ id: string }>): Set<string> {
  const set = new Set<string>()
  if (!history || !Array.isArray(history)) return set
  for (const item of history) {
    const clean = cleanSerialId(item.id)
    if (clean) set.add(clean)
  }
  return set
}

/**
 * Find the next unused serial ID starting from startNum that does not collide with usedIds
 */
export function getNextAvailableSerial(
  prefix: string = 'Ord-',
  startNum: number = 1001,
  usedIds: Set<string> = new Set()
): { nextId: string; nextNum: number } {
  let current = isNaN(startNum) || startNum < 1 ? 1001 : startNum
  let candidate = `${prefix}${current}`
  
  // Keep advancing until candidate is NOT in usedIds
  while (usedIds.has(cleanSerialId(candidate))) {
    current++
    candidate = `${prefix}${current}`
  }

  return {
    nextId: candidate,
    nextNum: current + 1
  }
}

/**
 * Detect all conflicts in the staged parcels list:
 * 1. Parcel ID already booked in database (history)
 * 2. Parcel ID duplicated within the current table
 */
export function detectSerialConflicts(
  parcels: Parcel[],
  historyIds: Set<string>
): SerialConflictInfo {
  const conflictedIndices = new Set<number>()
  const conflictReasons = new Map<number, 'already_in_db' | 'duplicate_in_table'>()

  // Track occurrences within current table
  const tableCounts = new Map<string, number>()
  parcels.forEach(p => {
    const key = cleanSerialId(p.id)
    if (key) {
      tableCounts.set(key, (tableCounts.get(key) || 0) + 1)
    }
  })

  parcels.forEach((p, idx) => {
    const key = cleanSerialId(p.id)
    if (!key) return

    if (historyIds.has(key)) {
      conflictedIndices.add(idx)
      conflictReasons.set(idx, 'already_in_db')
    } else if ((tableCounts.get(key) || 0) > 1) {
      conflictedIndices.add(idx)
      conflictReasons.set(idx, 'duplicate_in_table')
    }
  })

  return {
    conflictedIndices,
    conflictReasons,
    totalConflicts: conflictedIndices.size
  }
}

/**
 * Automatically resolve all conflicting / already-in-DB serials to the next available unique numbers
 */
export function resolveAllSerialConflicts(
  parcels: Parcel[],
  historyIds: Set<string>,
  prefix: string = 'Ord-',
  startNum: number = 1001
): { updatedParcels: Parcel[]; nextNum: number; resolvedCount: number } {
  const used = new Set<string>(historyIds)
  
  // First, add all valid, non-conflicting IDs to used set so they aren't overtaken
  const counts = new Map<string, number>()
  parcels.forEach(p => {
    const key = cleanSerialId(p.id)
    if (key) counts.set(key, (counts.get(key) || 0) + 1)
  })

  parcels.forEach(p => {
    const key = cleanSerialId(p.id)
    if (key && !historyIds.has(key) && counts.get(key) === 1) {
      used.add(key)
    }
  })

  let currentNum = isNaN(startNum) || startNum < 1 ? 1001 : startNum
  let resolvedCount = 0

  const updatedParcels = parcels.map(p => {
    const key = cleanSerialId(p.id)
    const isConflict = !key || historyIds.has(key) || (counts.get(key) || 0) > 1

    if (isConflict) {
      const next = getNextAvailableSerial(prefix, currentNum, used)
      used.add(cleanSerialId(next.nextId))
      currentNum = next.nextNum
      resolvedCount++
      return {
        ...p,
        id: next.nextId
      }
    }

    used.add(key)
    return p
  })

  return {
    updatedParcels,
    nextNum: currentNum,
    resolvedCount
  }
}

/**
 * Detect whether a PostEx API error indicates a duplicate order reference number
 */
export function isDuplicateRefError(errorMsg?: string | null): boolean {
  if (!errorMsg) return false
  const lower = String(errorMsg).toLowerCase()
  return (
    lower.includes('already exists') ||
    lower.includes('already exist') ||
    lower.includes('duplicate') ||
    lower.includes('already been booked') ||
    lower.includes('already placed') ||
    lower.includes('order with orderrefnumber') ||
    lower.includes('reference number already') ||
    lower.includes('orderrefnumber already exists')
  )
}
