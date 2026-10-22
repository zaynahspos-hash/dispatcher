import { BookedParcel, getParcelDateStr } from '../components/history/types'
import { CustomerEntry } from '../components/admin/types'

/**
 * High-performance, quota-free client database (IndexedDB) for parcels and customer directory.
 * Standard browser localStorage has a 5MB total limit which crashes silently when holding 30,000+ parcels.
 * IndexedDB provides 100MB+ quota, fast structured storage, and zero-loss persistence across reloads.
 */

const DB_NAME = 'zaynah_logistics_v1'
const DB_VERSION = 1
const STORE_PARCELS = 'portal_parcels'
const STORE_CUSTOMERS = 'portal_customers'

let dbPromise: Promise<IDBDatabase> | null = null

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_PARCELS)) {
        db.createObjectStore(STORE_PARCELS, { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains(STORE_CUSTOMERS)) {
        db.createObjectStore(STORE_CUSTOMERS, { keyPath: 'key' })
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })

  return dbPromise
}

export interface StoredParcelsRecord {
  key: string
  userId: string
  range: string
  saved_at: number
  parcels: BookedParcel[]
}

export async function idbSaveParcels(
  userId: string | undefined,
  range: string,
  parcels: BookedParcel[]
): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORE_PARCELS, 'readwrite')
    const store = tx.objectStore(STORE_PARCELS)
    const key = `${userId || 'guest'}_${range}`
    const record: StoredParcelsRecord = {
      key,
      userId: userId || 'guest',
      range,
      saved_at: Date.now(),
      parcels
    }
    store.put(record)
  } catch (e) {
    console.warn('[IndexedDB] Save parcels failed:', e)
  }
}

export async function idbGetParcels(
  userId: string | undefined,
  range: string
): Promise<BookedParcel[] | null> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORE_PARCELS, 'readonly')
    const store = tx.objectStore(STORE_PARCELS)
    const key = `${userId || 'guest'}_${range}`
    return new Promise(resolve => {
      const req = store.get(key)
      req.onsuccess = () => {
        const val = req.result as StoredParcelsRecord | undefined
        if (val && Array.isArray(val.parcels) && val.parcels.length > 0) {
          resolve(val.parcels)
        } else {
          resolve(null)
        }
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function idbFindEncompassingParcels(
  userId: string | undefined,
  fromDate: string,
  toDate: string
): Promise<BookedParcel[] | null> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORE_PARCELS, 'readonly')
    const store = tx.objectStore(STORE_PARCELS)
    const targetUid = userId || 'guest'
    return new Promise(resolve => {
      const req = store.getAll()
      req.onsuccess = () => {
        const all = (req.result || []) as StoredParcelsRecord[]
        for (const item of all) {
          if (item.userId === targetUid && Array.isArray(item.parcels) && item.parcels.length > 0) {
            const parts = item.range.split('|')
            if (parts.length === 2) {
              const [storedFrom, storedTo] = parts
              if (storedFrom <= fromDate && storedTo >= toDate) {
                const filtered = item.parcels.filter(p => {
                  const pDate = getParcelDateStr(p.bookingDate)
                  return Boolean(pDate && pDate >= fromDate && pDate <= toDate)
                })
                if (filtered.length > 0) {
                  resolve(filtered)
                  return
                }
              }
            }
          }
        }
        resolve(null)
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function idbSaveCustomers(customers: CustomerEntry[]): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORE_CUSTOMERS, 'readwrite')
    const store = tx.objectStore(STORE_CUSTOMERS)
    store.put({
      key: 'all_customers',
      saved_at: Date.now(),
      customers
    })
  } catch (e) {
    console.warn('[IndexedDB] Save customers failed:', e)
  }
}

export async function idbGetCustomers(): Promise<CustomerEntry[] | null> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORE_CUSTOMERS, 'readonly')
    const store = tx.objectStore(STORE_CUSTOMERS)
    return new Promise(resolve => {
      const req = store.get('all_customers')
      req.onsuccess = () => {
        const res = req.result
        if (res && Array.isArray(res.customers) && res.customers.length > 0) {
          resolve(res.customers)
        } else {
          resolve(null)
        }
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}
