import { useState, useEffect, useCallback, useRef } from 'react'
import { BookedParcel } from '../components/history/types'

const STORAGE_KEY = 'zaynah_whatsapp_sent_v1'

export interface WhatsAppSentTracker {
  isSent: (key?: string | null) => boolean
  markSent: (...keys: (string | undefined | null)[]) => void
  toggleSent: (key?: string | null) => void
  sentSet: Set<string>
  sentCount: number
  clearAllSent: () => void
}

const cleanKey = (key?: string | null): string => {
  return String(key || '').trim().toLowerCase()
}

/**
 * Global and per-user reactive tracker for sent WhatsApp tracking notifications.
 * Persists sent tracking numbers & order IDs in:
 * 1. Fast client-side localStorage (for 0ms instant UI rendering on refresh)
 * 2. Supabase booked_history table (for multi-device sync across mobile & desktop)
 */
export function useWhatsAppSentTracker(
  userId?: string,
  history?: BookedParcel[],
  onUpdateHistory?: (updated: BookedParcel[]) => void
): WhatsAppSentTracker {
  const storageKey = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY
  const migrationDoneRef = useRef(false)

  // Helper to load keys from localStorage (combines scoped key and global fallback)
  const loadLocalKeys = useCallback((key: string): Set<string> => {
    const set = new Set<string>()
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const arr = JSON.parse(stored)
        if (Array.isArray(arr)) {
          arr.forEach(s => {
            const c = cleanKey(s)
            if (c) set.add(c)
          })
        }
      }
      // Also check fallback global key for backward-compatibility
      const globalStored = localStorage.getItem(STORAGE_KEY)
      if (globalStored && globalStored !== stored) {
        const arr = JSON.parse(globalStored)
        if (Array.isArray(arr)) {
          arr.forEach(s => {
            const c = cleanKey(s)
            if (c) set.add(c)
          })
        }
      }
    } catch (e) {
      console.warn('[useWhatsAppSentTracker] Failed to load sent set:', e)
    }
    return set
  }, [])

  const [sentSet, setSentSet] = useState<Set<string>>(() => {
    const initial = loadLocalKeys(storageKey)
    // Seed from history if provided on initial mount
    if (history && history.length > 0) {
      history.forEach(p => {
        if (p.whatsapp_sent || p.whatsappSent) {
          if (p.tracking) initial.add(cleanKey(p.tracking))
          if (p.id) initial.add(cleanKey(p.id))
        }
      })
    }
    return initial
  })

  // Re-sync whenever storageKey (e.g. userId resolves) or history changes
  useEffect(() => {
    const localKeys = loadLocalKeys(storageKey)
    const combined = new Set<string>(localKeys)

    let historyHasNew = false
    if (history && history.length > 0) {
      history.forEach(p => {
        if (p.whatsapp_sent || p.whatsappSent) {
          const t = cleanKey(p.tracking)
          const i = cleanKey(p.id)
          if (t && !combined.has(t)) {
            combined.add(t)
            historyHasNew = true
          }
          if (i && !combined.has(i)) {
            combined.add(i)
            historyHasNew = true
          }
        }
      })
    }

    setSentSet(prev => {
      let isDifferent = prev.size !== combined.size
      if (!isDifferent) {
        for (const item of combined) {
          if (!prev.has(item)) {
            isDifferent = true
            break
          }
        }
      }
      return isDifferent ? combined : prev
    })

    // If history brought new keys, sync them to localStorage
    if (historyHasNew) {
      try {
        const arr = Array.from(combined)
        localStorage.setItem(storageKey, JSON.stringify(arr))
      } catch {
        // ignore
      }
    }
  }, [storageKey, history, loadLocalKeys])

  // One-time self-healing migration: if localStorage has keys that history lacks, push to history & DB
  useEffect(() => {
    if (migrationDoneRef.current || !history || history.length === 0 || !onUpdateHistory) return

    let needsUpdate = false
    const updated = history.map(p => {
      const isAlreadySent = Boolean(p.whatsapp_sent || p.whatsappSent)
      if (!isAlreadySent) {
        const t = cleanKey(p.tracking)
        const i = cleanKey(p.id)
        if ((t && sentSet.has(t)) || (i && sentSet.has(i))) {
          needsUpdate = true
          return {
            ...p,
            whatsapp_sent: true,
            whatsappSent: true,
            whatsapp_sent_at: p.whatsapp_sent_at || new Date().toISOString()
          }
        }
      }
      return p
    })

    if (needsUpdate) {
      migrationDoneRef.current = true
      onUpdateHistory(updated)
    }
  }, [history, sentSet, onUpdateHistory])

  // Sync across browser tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if ((e.key === storageKey || e.key === STORAGE_KEY) && e.newValue) {
        try {
          const arr = JSON.parse(e.newValue)
          if (Array.isArray(arr)) {
            setSentSet(prev => {
              const next = new Set(prev)
              arr.forEach(s => {
                const c = cleanKey(s)
                if (c) next.add(c)
              })
              return next
            })
          }
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [storageKey])

  // Sync across components in the same window
  useEffect(() => {
    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setSentSet(prev => {
          const next = new Set(prev)
          customEvent.detail.forEach(s => {
            const c = cleanKey(s)
            if (c) next.add(c)
          })
          return next
        })
      }
    }
    window.addEventListener('zaynah:whatsapp_sent_updated', handleCustom)
    return () => window.removeEventListener('zaynah:whatsapp_sent_updated', handleCustom)
  }, [])

  const saveSet = useCallback((newSet: Set<string>) => {
    setSentSet(newSet)
    try {
      const arr = Array.from(newSet)
      localStorage.setItem(storageKey, JSON.stringify(arr))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
      window.dispatchEvent(new CustomEvent('zaynah:whatsapp_sent_updated', { detail: arr }))
    } catch (e) {
      console.warn('[useWhatsAppSentTracker] Failed to persist sent set:', e)
    }
  }, [storageKey])

  const isSent = useCallback((key?: string | null): boolean => {
    const cleaned = cleanKey(key)
    if (!cleaned) return false

    if (sentSet.has(cleaned)) return true

    if (history && history.length > 0) {
      const matched = history.find(p => cleanKey(p.tracking) === cleaned || cleanKey(p.id) === cleaned)
      if (matched && (matched.whatsapp_sent || matched.whatsappSent)) {
        return true
      }
    }

    return false
  }, [sentSet, history])

  const markSent = useCallback((...keys: (string | undefined | null)[]) => {
    const next = new Set(sentSet)
    const normalizedToMark: string[] = []

    keys.forEach(k => {
      const cleaned = cleanKey(k)
      if (cleaned) {
        normalizedToMark.push(cleaned)
        if (!next.has(cleaned)) {
          next.add(cleaned)
        }
      }
    })

    saveSet(next)

    // Persist to history & cloud Supabase if history handler provided
    if (onUpdateHistory && history && history.length > 0 && normalizedToMark.length > 0) {
      let modified = false
      const updated = history.map(p => {
        const t = cleanKey(p.tracking)
        const i = cleanKey(p.id)
        const matches = (t && normalizedToMark.includes(t)) || (i && normalizedToMark.includes(i))
        if (matches && !p.whatsapp_sent) {
          modified = true
          return {
            ...p,
            whatsapp_sent: true,
            whatsappSent: true,
            whatsapp_sent_at: new Date().toISOString()
          }
        }
        return p
      })
      if (modified) {
        onUpdateHistory(updated)
      }
    }
  }, [sentSet, saveSet, onUpdateHistory, history])

  const toggleSent = useCallback((key?: string | null) => {
    const cleaned = cleanKey(key)
    if (!cleaned) return

    const next = new Set(sentSet)
    let nextVal = false
    if (next.has(cleaned)) {
      next.delete(cleaned)
      nextVal = false
    } else {
      next.add(cleaned)
      nextVal = true
    }
    saveSet(next)

    // Sync to history & cloud Supabase
    if (onUpdateHistory && history && history.length > 0) {
      let modified = false
      const updated = history.map(p => {
        const t = cleanKey(p.tracking)
        const i = cleanKey(p.id)
        if (t === cleaned || i === cleaned) {
          modified = true
          return {
            ...p,
            whatsapp_sent: nextVal,
            whatsappSent: nextVal,
            whatsapp_sent_at: nextVal ? new Date().toISOString() : undefined
          }
        }
        return p
      })
      if (modified) {
        onUpdateHistory(updated)
      }
    }
  }, [sentSet, saveSet, onUpdateHistory, history])

  const clearAllSent = useCallback(() => {
    saveSet(new Set())
    if (onUpdateHistory && history && history.length > 0) {
      const updated = history.map(p => ({
        ...p,
        whatsapp_sent: false,
        whatsappSent: false,
        whatsapp_sent_at: undefined
      }))
      onUpdateHistory(updated)
    }
  }, [saveSet, onUpdateHistory, history])

  return {
    isSent,
    markSent,
    toggleSent,
    sentSet,
    sentCount: sentSet.size,
    clearAllSent
  }
}
