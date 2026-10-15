/**
 * Local Airway Bill & CN Document Vault
 * Allows every user to store generated PostEx Airway Bills & CN lists locally on their device.
 * Includes Date Range Filtering, 1-by-1 Deletion, Bulk Multi-Select Deletion, and Clear All.
 * Strictly scoped per user UUID (RULE D15 - Multi-Tenant Isolation).
 */

export interface SavedAirwayDocument {
  id: string
  userId: string
  batchName: string
  trackingNumbers: string[]
  count: number
  totalCOD: number
  createdAt: string
  pdfBase64?: string
}

function getVaultStorageKey(userId: string): string {
  return `u_${userId || 'guest'}_airway_vault_v1`
}

/** Get all locally stored airway bills for this user */
export function getSavedAirwayDocuments(userId: string): SavedAirwayDocument[] {
  try {
    const raw = localStorage.getItem(getVaultStorageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('[AirwayVault] Failed to load airway bills from local vault:', err)
    return []
  }
}

/** Save a new airway bill batch to the user's local vault */
export function saveAirwayDocument(
  userId: string,
  doc: {
    batchName?: string
    trackingNumbers: string[]
    totalCOD?: number
    pdfBase64?: string
  }
): SavedAirwayDocument {
  const current = getSavedAirwayDocuments(userId)
  const id = `cn_vault_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const newEntry: SavedAirwayDocument = {
    id,
    userId,
    batchName: doc.batchName || `Batch #${current.length + 1} (${doc.trackingNumbers.length} Parcels)`,
    trackingNumbers: doc.trackingNumbers,
    count: doc.trackingNumbers.length,
    totalCOD: doc.totalCOD || 0,
    createdAt: new Date().toISOString(),
    pdfBase64: doc.pdfBase64
  }

  // Prepend so latest appears first
  const updated = [newEntry, ...current]
  try {
    localStorage.setItem(getVaultStorageKey(userId), JSON.stringify(updated))
  } catch (err) {
    // If quota exceeded due to large base64, save without base64 to preserve CN tracking metadata
    const slim = updated.map(item => ({ ...item, pdfBase64: undefined }))
    try {
      localStorage.setItem(getVaultStorageKey(userId), JSON.stringify(slim))
    } catch {}
  }
  return newEntry
}

/** Delete a single document by ID */
export function deleteAirwayDocument(userId: string, docId: string): SavedAirwayDocument[] {
  const current = getSavedAirwayDocuments(userId)
  const filtered = current.filter(d => d.id !== docId)
  localStorage.setItem(getVaultStorageKey(userId), JSON.stringify(filtered))
  return filtered
}

/** Delete multiple documents by IDs */
export function bulkDeleteAirwayDocuments(userId: string, docIds: string[]): SavedAirwayDocument[] {
  const set = new Set(docIds)
  const current = getSavedAirwayDocuments(userId)
  const filtered = current.filter(d => !set.has(d.id))
  localStorage.setItem(getVaultStorageKey(userId), JSON.stringify(filtered))
  return filtered
}

/** Clear all stored documents for this user */
export function clearAllAirwayDocuments(userId: string): void {
  localStorage.removeItem(getVaultStorageKey(userId))
}

/** Download or open PDF from saved base64 */
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
    a.download = `postex-airway-bill-${doc.trackingNumbers[0] || 'batch'}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return true
  } catch (err) {
    console.error('[AirwayVault] Failed to trigger PDF download:', err)
    return false
  }
}
