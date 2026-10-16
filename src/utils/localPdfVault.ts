/**
 * Local Airway Bill & Load Sheet Document Vault
 * Stores PostEx Airway Bills (CNs) and Load Sheets locally on the user's device.
 * Categorized by Airway Bills (CNs) vs Load Sheets with date filtering, search, and one-click re-download.
 * Scoped safely per user account in localStorage (RULE D15 - Multi-Tenant Isolation).
 */

export type DocumentCategory = 'airway_bill' | 'load_sheet'

export interface VaultParcelItem {
  tracking: string
  name?: string
  phone?: string
  city?: string
  amount?: number
  orderRef?: string
}

export interface SavedAirwayDocument {
  id: string
  userId: string
  type: DocumentCategory
  batchName: string
  trackingNumbers: string[]
  items?: VaultParcelItem[]
  count: number
  totalCOD: number
  createdAt: string
  pickupCode?: string
  pdfBase64?: string
  notes?: string
}

function normalizeUserKey(userId?: string): string {
  if (!userId || userId === 'merchant' || userId === 'guest') return 'active_tenant'
  return userId.replace(/[^a-zA-Z0-9_-]/g, '_')
}

function getVaultStorageKey(userId?: string): string {
  return `u_${normalizeUserKey(userId)}_document_vault_v2`
}

function notifyVaultChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zaynah_vault_updated'))
  }
}

/** Get all locally stored documents for this user, with automatic v1 fallback migration */
export function getSavedAirwayDocuments(userId?: string): SavedAirwayDocument[] {
  try {
    const key = getVaultStorageKey(userId)
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          ...item,
          type: item.type || 'airway_bill'
        }))
      }
    }

    // Fallback: Check older v1 storage key if v2 is empty
    const v1Key = `u_${userId || 'guest'}_airway_vault_v1`
    const oldRaw = localStorage.getItem(v1Key)
    if (oldRaw) {
      const oldParsed = JSON.parse(oldRaw)
      if (Array.isArray(oldParsed) && oldParsed.length > 0) {
        const migrated: SavedAirwayDocument[] = oldParsed.map(item => ({
          ...item,
          type: 'airway_bill'
        }))
        localStorage.setItem(key, JSON.stringify(migrated))
        return migrated
      }
    }
    return []
  } catch (err) {
    console.error('[AirwayVault] Failed to load documents from local vault:', err)
    return []
  }
}

/** Save a new airway bill batch to the user's local vault */
export function saveAirwayDocument(
  userId: string | undefined,
  doc: {
    batchName?: string
    trackingNumbers: string[]
    totalCOD?: number
    items?: VaultParcelItem[]
    pdfBase64?: string
    notes?: string
  }
): SavedAirwayDocument {
  const current = getSavedAirwayDocuments(userId)
  const id = `cn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const newEntry: SavedAirwayDocument = {
    id,
    userId: normalizeUserKey(userId),
    type: 'airway_bill',
    batchName: doc.batchName || `CN Batch #${current.length + 1} (${doc.trackingNumbers.length} Parcels)`,
    trackingNumbers: doc.trackingNumbers,
    items: doc.items,
    count: doc.trackingNumbers.length,
    totalCOD: doc.totalCOD || 0,
    createdAt: new Date().toISOString(),
    pdfBase64: doc.pdfBase64,
    notes: doc.notes
  }

  const updated = [newEntry, ...current]
  try {
    localStorage.setItem(getVaultStorageKey(userId), JSON.stringify(updated))
  } catch {
    const slim = updated.map(item => ({ ...item, pdfBase64: undefined }))
    try {
      localStorage.setItem(getVaultStorageKey(userId), JSON.stringify(slim))
    } catch {}
  }

  notifyVaultChange()
  return newEntry
}

/** Save a generated Load Sheet to the user's local vault */
export function saveLoadSheetDocument(
  userId: string | undefined,
  doc: {
    pickupCode: string
    trackingNumbers: string[]
    batchName?: string
    totalCOD?: number
    items?: VaultParcelItem[]
    notes?: string
  }
): SavedAirwayDocument {
  const current = getSavedAirwayDocuments(userId)
  const id = `ls_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const newEntry: SavedAirwayDocument = {
    id,
    userId: normalizeUserKey(userId),
    type: 'load_sheet',
    batchName: doc.batchName || `Load Sheet (${doc.trackingNumbers.length} Parcels)`,
    trackingNumbers: doc.trackingNumbers,
    items: doc.items,
    count: doc.trackingNumbers.length,
    totalCOD: doc.totalCOD || 0,
    createdAt: new Date().toISOString(),
    pickupCode: doc.pickupCode,
    notes: doc.notes
  }

  const updated = [newEntry, ...current]
  try {
    localStorage.setItem(getVaultStorageKey(userId), JSON.stringify(updated))
  } catch {}

  notifyVaultChange()
  return newEntry
}

/** Delete a single document by ID */
export function deleteAirwayDocument(userId: string | undefined, docId: string): SavedAirwayDocument[] {
  const current = getSavedAirwayDocuments(userId)
  const filtered = current.filter(d => d.id !== docId)
  localStorage.setItem(getVaultStorageKey(userId), JSON.stringify(filtered))
  notifyVaultChange()
  return filtered
}

/** Delete multiple documents by IDs */
export function bulkDeleteAirwayDocuments(userId: string | undefined, docIds: string[]): SavedAirwayDocument[] {
  const set = new Set(docIds)
  const current = getSavedAirwayDocuments(userId)
  const filtered = current.filter(d => !set.has(d.id))
  localStorage.setItem(getVaultStorageKey(userId), JSON.stringify(filtered))
  notifyVaultChange()
  return filtered
}

/** Clear all stored documents for this user */
export function clearAllAirwayDocuments(userId: string | undefined): void {
  localStorage.removeItem(getVaultStorageKey(userId))
  notifyVaultChange()
}

/** Trigger download of a base64 PDF */
export function downloadSavedPdf(doc: SavedAirwayDocument): boolean {
  if (!doc.pdfBase64) return false
  try {
    const bin = atob(doc.pdfBase64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const blob = new Blob([bytes.buffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.type === 'load_sheet' ? 'postex-loadsheet' : 'postex-airway-bill'}-${doc.trackingNumbers[0] || 'batch'}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return true
  } catch (err) {
    console.error('[AirwayVault] Failed to trigger PDF download:', err)
    return false
  }
}

/** Auto-sync and populate the local vault using booked history parcels */
export function syncVaultFromBookedParcels(
  userId: string | undefined,
  parcels: Array<{
    tracking: string
    name?: string
    phone?: string
    city?: string
    total?: number
    bookingDate?: string
    detail?: string
  }>
): SavedAirwayDocument[] {
  if (!parcels || parcels.length === 0) return getSavedAirwayDocuments(userId)
  
  const current = getSavedAirwayDocuments(userId)
  const existingCNs = new Set<string>()
  current.forEach(doc => doc.trackingNumbers.forEach(cn => existingCNs.add(cn.trim())))
  
  // Find parcels with valid tracking that aren't already represented in vault
  const unindexed = parcels.filter(p => p.tracking && p.tracking.trim() && !existingCNs.has(p.tracking.trim()))
  if (unindexed.length === 0) return current

  // Group by booking date (e.g. YYYY-MM-DD)
  const grouped: { [date: string]: typeof unindexed } = {}
  unindexed.forEach(p => {
    let dateKey = 'Recent Batch'
    if (p.bookingDate) {
      try {
        dateKey = p.bookingDate.split('T')[0] || p.bookingDate.substring(0, 10)
      } catch {
        dateKey = 'Recent Batch'
      }
    }
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(p)
  })

  const newDocs: SavedAirwayDocument[] = []
  Object.keys(grouped).forEach(dateKey => {
    const list = grouped[dateKey]
    const trackingNumbers = list.map(p => p.tracking.trim())
    const totalCOD = list.reduce((acc, p) => acc + (Number(p.total) || 0), 0)
    const items: VaultParcelItem[] = list.map(p => ({
      tracking: p.tracking.trim(),
      name: p.name,
      phone: p.phone,
      city: p.city,
      amount: p.total,
      orderRef: p.detail
    }))
    
    newDocs.push({
      id: `cn_sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: normalizeUserKey(userId),
      type: 'airway_bill',
      batchName: `CN Batch — ${dateKey} (${list.length} Parcels)`,
      trackingNumbers,
      items,
      count: list.length,
      totalCOD,
      createdAt: dateKey !== 'Recent Batch' && !isNaN(Date.parse(dateKey)) ? new Date(dateKey).toISOString() : new Date().toISOString(),
      notes: 'Synced from Booked History'
    })
  })

  const updated = [...newDocs, ...current]
  try {
    localStorage.setItem(getVaultStorageKey(userId), JSON.stringify(updated))
  } catch {}
  notifyVaultChange()
  return updated
}
