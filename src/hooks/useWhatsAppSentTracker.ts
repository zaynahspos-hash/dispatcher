import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'zaynah_whatsapp_sent_v1'

export interface WhatsAppSentTracker {
  isSent: (key?: string | null) => boolean
  markSent: (...keys: (string | undefined | null)[]) => void
  toggleSent: (key?: string | null) => void
  sentSet: Set<string>
  sentCount: number
  clearAllSent: () => void
}

/**
 * Global and per-user reactive tracker for sent WhatsApp tracking notifications.
 * Persists sent tracking numbers & order IDs in localStorage so merchants
 * instantly know which customers were notified and which are still pending.
 */
export function useWhatsAppSentTracker(userId?: string): WhatsAppSentTracker {
  const storageKey = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY

  const [sentSet, setSentSet] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const arr = JSON.parse(stored)
        if (Array.isArray(arr)) {
          return new Set(arr.map(s => String(s).trim().toLowerCase()))
        }
      }
    } catch (e) {
      console.warn('[useWhatsAppSentTracker] Failed to load sent set:', e)
    }
    return new Set<string>()
  })

  // Sync across browser tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const arr = JSON.parse(e.newValue)
          if (Array.isArray(arr)) {
            setSentSet(new Set(arr.map(s => String(s).trim().toLowerCase())))
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
        setSentSet(new Set(customEvent.detail.map(s => String(s).trim().toLowerCase())))
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
      window.dispatchEvent(new CustomEvent('zaynah:whatsapp_sent_updated', { detail: arr }))
    } catch (e) {
      console.warn('[useWhatsAppSentTracker] Failed to persist sent set:', e)
    }
  }, [storageKey])

  const cleanKey = (key?: string | null): string => {
    return String(key || '').trim().toLowerCase()
  }

  const isSent = useCallback((key?: string | null): boolean => {
    const cleaned = cleanKey(key)
    return cleaned ? sentSet.has(cleaned) : false
  }, [sentSet])

  const markSent = useCallback((...keys: (string | undefined | null)[]) => {
    const next = new Set(sentSet)
    let modified = false
    keys.forEach(k => {
      const cleaned = cleanKey(k)
      if (cleaned && !next.has(cleaned)) {
        next.add(cleaned)
        modified = true
      }
    })
    if (modified) {
      saveSet(next)
    }
  }, [sentSet, saveSet])

  const toggleSent = useCallback((key?: string | null) => {
    const cleaned = cleanKey(key)
    if (!cleaned) return
    const next = new Set(sentSet)
    if (next.has(cleaned)) {
      next.delete(cleaned)
    } else {
      next.add(cleaned)
    }
    saveSet(next)
  }, [sentSet, saveSet])

  const clearAllSent = useCallback(() => {
    saveSet(new Set())
  }, [saveSet])

  return {
    isSent,
    markSent,
    toggleSent,
    sentSet,
    sentCount: sentSet.size,
    clearAllSent
  }
}
