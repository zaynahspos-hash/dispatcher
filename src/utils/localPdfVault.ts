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

/**
 * Resolves the active tenant UUID cleanly across all contexts.
 * Prioritizes: (1) Valid user UUID, (2) Cached active user ID, (3) Supabase session in localStorage.
 */
export function resolveVaultTenantKey(userId?: string): string {
  // 1. If explicit UUID or custom identifier passed
  if (userId && userId !== 'merchant' && userId !== 'guest') {
    // Check if it's a standard UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      try { localStorage.setItem('zaynah_active_user_id', userId) } catch {}
      return userId
    }
    // If it's a token or other string, check if we already have a real user UUID in localStorage
    try {
      const active = localStorage.getItem('zaynah_active_user_id')
      if (active) return active
    } catch {}
    return userId.replace(/[^a-zA-Z0-9_-]/g, '_')
  }

  // 2. Check cached active user id
  try {
    const cached = localStorage.getItem('zaynah_active_user_id')
    if (cached) return cached
  } catch {}

  // 3. Check Supabase auth session token in localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        const item = localStorage.getItem(k)
        if (item) {
          const parsed = JSON.parse(item)
          const uid = parsed?.user?.id
          if (uid) {
            localStorage.setItem('zaynah_active_user_id', uid)
            return uid
          }
        }
      }
    }
  } catch {}

  return 'active_tenant'
}

function getVaultStorageKey(userId?: string): string {
  const tenantKey = resolveVaultTenantKey(userId)
  return `u_${tenantKey}_document_vault_v2`
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
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return parsed.map(item => ({
            ...item,
            type: item.type || 'airway_bill'
          }))
        }
      } catch {
        return []
      }
    }

    // Only if raw === null (key has never been written, not even '[]'):
    // Check if documents exist in u_active_tenant_document_vault_v2 (if key was different)
    if (key !== 'u_active_tenant_document_vault_v2') {
      const activeTenantRaw = localStorage.getItem('u_active_tenant_document_vault_v2')
      if (activeTenantRaw !== null) {
        try {
          const parsed = JSON.parse(activeTenantRaw)
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(key, activeTenantRaw)
            localStorage.removeItem('u_active_tenant_document_vault_v2')
            return parsed.map(item => ({ ...item, type: item.type || 'airway_bill' }))
          }
        } catch {}
      }
    }

    // Fallback: Check older v1 storage key only if v2 has never been initialized
    const tenantKey = resolveVaultTenantKey(userId)
    const legacyKeys = [
      `u_${userId || 'guest'}_airway_vault_v1`,
      `u_${tenantKey}_airway_vault_v1`,
      'u_active_tenant_airway_vault_v1',
      'u_guest_airway_vault_v1'
    ]
    for (const v1Key of legacyKeys) {
      const oldRaw = localStorage.getItem(v1Key)
      if (oldRaw) {
        localStorage.removeItem(v1Key)
        try {
          const oldParsed = JSON.parse(oldRaw)
          if (Array.isArray(oldParsed) && oldParsed.length > 0) {
            const migrated: SavedAirwayDocument[] = oldParsed.map(item => ({
              ...item,
              type: 'airway_bill'
            }))
            localStorage.setItem(key, JSON.stringify(migrated))
            return migrated
          }
        } catch {}
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
    userId: resolveVaultTenantKey(userId),
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
    userId: resolveVaultTenantKey(userId),
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
  const key = getVaultStorageKey(userId)
  
  localStorage.setItem(key, JSON.stringify(filtered))
  // Keep active_tenant key synchronized if present
  try {
    const rawActive = localStorage.getItem('u_active_tenant_document_vault_v2')
    if (rawActive) {
      const parsed = JSON.parse(rawActive)
      if (Array.isArray(parsed)) {
        localStorage.setItem('u_active_tenant_document_vault_v2', JSON.stringify(parsed.filter((d: any) => d.id !== docId)))
      }
    }
  } catch {}

  notifyVaultChange()
  return filtered
}

/** Delete multiple documents by IDs */
export function bulkDeleteAirwayDocuments(userId: string | undefined, docIds: string[]): SavedAirwayDocument[] {
  const idSet = new Set(docIds)
  const current = getSavedAirwayDocuments(userId)
  const filtered = current.filter(d => !idSet.has(d.id))
  const key = getVaultStorageKey(userId)

  localStorage.setItem(key, JSON.stringify(filtered))
  try {
    const rawActive = localStorage.getItem('u_active_tenant_document_vault_v2')
    if (rawActive) {
      const parsed = JSON.parse(rawActive)
      if (Array.isArray(parsed)) {
        localStorage.setItem('u_active_tenant_document_vault_v2', JSON.stringify(parsed.filter((d: any) => !idSet.has(d.id))))
      }
    }
  } catch {}

  notifyVaultChange()
  return filtered
}

/** Clear all stored documents for this user */
export function clearAllAirwayDocuments(userId: string | undefined): void {
  const key = getVaultStorageKey(userId)
  const tenantKey = resolveVaultTenantKey(userId)
  
  // Set empty array so future gets return [] and do NOT trigger fallback migration
  try {
    localStorage.setItem(key, '[]')
    localStorage.setItem('u_active_tenant_document_vault_v2', '[]')
    localStorage.setItem('u_guest_document_vault_v2', '[]')
  } catch {}

  // Remove all legacy keys
  const legacyKeys = [
    `u_${userId || 'guest'}_airway_vault_v1`,
    `u_${tenantKey}_airway_vault_v1`,
    'u_active_tenant_airway_vault_v1',
    'u_guest_airway_vault_v1'
  ]
  legacyKeys.forEach(k => {
    try { localStorage.removeItem(k) } catch {}
  })

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
      userId: resolveVaultTenantKey(userId),
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
