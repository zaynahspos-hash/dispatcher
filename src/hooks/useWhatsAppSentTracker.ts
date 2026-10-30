import { useState, useEffect, useCallback } from 'react'
import { BookedParcel, WhatsAppAlertState } from '../components/history/types'
import { purgeEmergencyStorage } from '../utils/cacheWithExpiry'
import { supabase } from '../utils/supabaseClient'

const STORAGE_KEY_BOOKING = 'zaynah_wa_booking_sent_v2'
const STORAGE_KEY_STATUS = 'zaynah_wa_status_sent_v2'

export interface WhatsAppSentTracker {
  isSent: (key?: string | null) => boolean
  isBookingSent: (tracking?: string | null, id?: string | null) => boolean
  isStatusSent: (tracking?: string | null, id?: string | null) => boolean
  getAlertState: (tracking?: string | null, id?: string | null) => WhatsAppAlertState
  markSent: (key: string | undefined | null, type?: 'booking' | 'status' | 'both', id?: string | null) => void
  toggleSent: (key?: string | null) => void
  sentSet: Set<string>
  sentCount: number
  clearAllSent: () => void
}

const cleanKey = (key?: string | null): string => {
  return String(key || '').trim().toLowerCase()
}

/**
 * Multi-device, real-time reactive tracker for WhatsApp notifications.
 * Distinguishes:
 * 1. Booking Alert Sent (Sky Blue indicator)
 * 2. Real Status Alert Sent (Amber indicator)
 * 3. Both Alerts Sent (Solid Emerald indicator)
 * 4. None Sent (Soft outline)
 *
 * Persists in:
 * 1. Fast client-side localStorage (for 0ms instant UI rendering)
 * 2. Supabase booked_history table (for multi-device sync across mobile & desktop)
 */
export function useWhatsAppSentTracker(
  userId?: string,
  history?: BookedParcel[],
  onUpdateHistory?: (updated: BookedParcel[]) => void
): WhatsAppSentTracker {
  const bookingKey = userId ? `${STORAGE_KEY_BOOKING}_${userId}` : STORAGE_KEY_BOOKING
  const statusKey = userId ? `${STORAGE_KEY_STATUS}_${userId}` : STORAGE_KEY_STATUS

  const loadLocalSet = useCallback((key: string): Set<string> => {
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
    } catch (e) {
      console.warn('[useWhatsAppSentTracker] Failed to load local set:', e)
    }
    return set
  }, [])

  const [bookingSet, setBookingSet] = useState<Set<string>>(() => {
    const initial = loadLocalSet(bookingKey)
    if (history && history.length > 0) {
      history.forEach(p => {
        const isBooking = p.whatsapp_booking_sent === true || (p.whatsapp_booking_sent === undefined && p.whatsapp_status_sent !== true && (p.whatsapp_sent || p.whatsappSent))
        if (isBooking) {
          if (p.tracking) initial.add(cleanKey(p.tracking))
          if (p.id) initial.add(cleanKey(p.id))
        }
      })
    }
    return initial
  })

  const [statusSet, setStatusSet] = useState<Set<string>>(() => {
    const initial = loadLocalSet(statusKey)
    if (history && history.length > 0) {
      history.forEach(p => {
        if (p.whatsapp_status_sent === true) {
          if (p.tracking) initial.add(cleanKey(p.tracking))
          if (p.id) initial.add(cleanKey(p.id))
        }
      })
    }
    return initial
  })

  // Synchronize state when history updates from Supabase Realtime
  useEffect(() => {
    if (!history || history.length === 0) return

    setBookingSet(prev => {
      const next = new Set(prev)
      let changed = false
      history.forEach(p => {
        const isBooking = p.whatsapp_booking_sent === true || (p.whatsapp_booking_sent === undefined && p.whatsapp_status_sent !== true && (p.whatsapp_sent || p.whatsappSent))
        const t = cleanKey(p.tracking)
        const i = cleanKey(p.id)
        if (isBooking) {
          if (t && !next.has(t)) { next.add(t); changed = true }
          if (i && !next.has(i)) { next.add(i); changed = true }
        } else if (p.whatsapp_booking_sent === false) {
          if (t && next.has(t)) { next.delete(t); changed = true }
          if (i && next.has(i)) { next.delete(i); changed = true }
        }
      })
      if (changed) {
        try {
          localStorage.setItem(bookingKey, JSON.stringify(Array.from(next)))
        } catch {}
        return next
      }
      return prev
    })

    setStatusSet(prev => {
      const next = new Set(prev)
      let changed = false
      history.forEach(p => {
        const isStatus = p.whatsapp_status_sent === true
        const t = cleanKey(p.tracking)
        const i = cleanKey(p.id)
        if (isStatus) {
          if (t && !next.has(t)) { next.add(t); changed = true }
          if (i && !next.has(i)) { next.add(i); changed = true }
        } else if (p.whatsapp_status_sent === false) {
          if (t && next.has(t)) { next.delete(t); changed = true }
          if (i && next.has(i)) { next.delete(i); changed = true }
        }
      })
      if (changed) {
        try {
          localStorage.setItem(statusKey, JSON.stringify(Array.from(next)))
        } catch {}
        return next
      }
      return prev
    })
  }, [history, bookingKey, statusKey])

  // Cross-device cloud sync: Load sent states directly from Supabase booked_history on mount
  useEffect(() => {
    if (!userId || userId === 'guest' || userId === 'default') return
    supabase
      .from('booked_history')
      .select('history')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.history && Array.isArray(data.history)) {
          const dbItems = data.history as BookedParcel[]
          setBookingSet(prev => {
            const next = new Set(prev)
            let changed = false
            dbItems.forEach(p => {
              const isBooking = p.whatsapp_booking_sent === true || (p.whatsapp_booking_sent === undefined && p.whatsapp_status_sent !== true && (p.whatsapp_sent || p.whatsappSent))
              const t = cleanKey(p.tracking)
              const i = cleanKey(p.id)
              if (isBooking) {
                if (t && !next.has(t)) { next.add(t); changed = true }
                if (i && !next.has(i)) { next.add(i); changed = true }
              }
            })
            return changed ? next : prev
          })
          setStatusSet(prev => {
            const next = new Set(prev)
            let changed = false
            dbItems.forEach(p => {
              if (p.whatsapp_status_sent === true) {
                const t = cleanKey(p.tracking)
                const i = cleanKey(p.id)
                if (t && !next.has(t)) { next.add(t); changed = true }
                if (i && !next.has(i)) { next.add(i); changed = true }
              }
            })
            return changed ? next : prev
          })
        }
      })
  }, [userId])

  const saveBookingSet = useCallback((newSet: Set<string>) => {
    setBookingSet(newSet)
    const arr = Array.from(newSet)
    try {
      localStorage.setItem(bookingKey, JSON.stringify(arr))
      window.dispatchEvent(new CustomEvent('zaynah:wa_booking_updated', { detail: arr }))
    } catch (e: any) {
      if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.number === -2147024882)) {
        purgeEmergencyStorage()
        try {
          localStorage.setItem(bookingKey, JSON.stringify(arr))
        } catch {}
      }
    }
  }, [bookingKey])

  const saveStatusSet = useCallback((newSet: Set<string>) => {
    setStatusSet(newSet)
    const arr = Array.from(newSet)
    try {
      localStorage.setItem(statusKey, JSON.stringify(arr))
      window.dispatchEvent(new CustomEvent('zaynah:wa_status_updated', { detail: arr }))
    } catch (e: any) {
      if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.number === -2147024882)) {
        purgeEmergencyStorage()
        try {
          localStorage.setItem(statusKey, JSON.stringify(arr))
        } catch {}
      }
    }
  }, [statusKey])

  const getAlertState = useCallback((tracking?: string | null, id?: string | null): WhatsAppAlertState => {
    const t = cleanKey(tracking)
    const i = cleanKey(id)

    // Check history (authoritative Supabase cloud source)
    if (history && history.length > 0) {
      const matched = history.find(p => (t && cleanKey(p.tracking) === t) || (i && cleanKey(p.id) === i))
      if (matched) {
        let bSent = matched.whatsapp_booking_sent === true || (t && bookingSet.has(t)) || (i && bookingSet.has(i))
        let sSent = matched.whatsapp_status_sent === true || (t && statusSet.has(t)) || (i && statusSet.has(i))

        // If legacy whatsapp_sent / whatsappSent is true, booking is definitely sent
        if (matched.whatsapp_sent === true || matched.whatsappSent === true) {
          bSent = true
        }

        if (bSent && sSent) return 'both'
        if (bSent) return 'booking_only'
        if (sSent) return 'status_only'
        return 'none'
      }
    }

    const bSent = (t && bookingSet.has(t)) || (i && bookingSet.has(i))
    const sSent = (t && statusSet.has(t)) || (i && statusSet.has(i))
    if (bSent && sSent) return 'both'
    if (bSent) return 'booking_only'
    if (sSent) return 'status_only'

    return 'none'
  }, [history, bookingSet, statusSet])

  const isBookingSent = useCallback((tracking?: string | null, id?: string | null): boolean => {
    const state = getAlertState(tracking, id)
    return state === 'booking_only' || state === 'both'
  }, [getAlertState])

  const isStatusSent = useCallback((tracking?: string | null, id?: string | null): boolean => {
    const state = getAlertState(tracking, id)
    return state === 'status_only' || state === 'both'
  }, [getAlertState])

  const isSent = useCallback((key?: string | null): boolean => {
    const cleaned = cleanKey(key)
    if (!cleaned) return false
    if (bookingSet.has(cleaned) || statusSet.has(cleaned)) return true
    if (history && history.length > 0) {
      const matched = history.find(p => (p.tracking && cleanKey(p.tracking) === cleaned) || (p.id && cleanKey(p.id) === cleaned))
      if (matched && (matched.whatsapp_sent || matched.whatsappSent || matched.whatsapp_booking_sent || matched.whatsapp_status_sent)) {
        return true
      }
    }
    return false
  }, [bookingSet, statusSet, history])

  const markSent = useCallback((
    key: string | undefined | null, 
    type: 'booking' | 'status' | 'both' = 'booking',
    id?: string | null
  ) => {
    const t = cleanKey(key)
    const i = cleanKey(id)
    const keysToMark = [t, i].filter(Boolean)
    if (keysToMark.length === 0) return

    const nextBooking = new Set(bookingSet)
    const nextStatus = new Set(statusSet)

    if (type === 'booking' || type === 'both') {
      keysToMark.forEach(k => nextBooking.add(k))
      saveBookingSet(nextBooking)
    }
    if (type === 'status' || type === 'both') {
      keysToMark.forEach(k => nextStatus.add(k))
      saveStatusSet(nextStatus)
    }

    // Persist to history & cloud Supabase (RULE D15 / Realtime cloud broadcast)
    if (onUpdateHistory && history && history.length > 0) {
      let modified = false
      const updated = history.map(p => {
        const pT = cleanKey(p.tracking)
        const pI = cleanKey(p.id)
        const matches = (pT && keysToMark.includes(pT)) || (pI && keysToMark.includes(pI))
        if (matches) {
          modified = true
          const hasBooking = (type === 'booking' || type === 'both') ? true : Boolean(p.whatsapp_booking_sent)
          const hasStatus = (type === 'status' || type === 'both') ? true : Boolean(p.whatsapp_status_sent)
          return {
            ...p,
            whatsapp_sent: true,
            whatsappSent: true,
            whatsapp_booking_sent: hasBooking,
            whatsapp_status_sent: hasStatus,
            whatsapp_sent_at: new Date().toISOString()
          }
        }
        return p
      })
      if (modified) {
        onUpdateHistory(updated)
      }
    }
  }, [bookingSet, statusSet, saveBookingSet, saveStatusSet, onUpdateHistory, history])

  const toggleSent = useCallback((key?: string | null) => {
    const cleaned = cleanKey(key)
    if (!cleaned) return

    const isCurrentlySent = bookingSet.has(cleaned) || statusSet.has(cleaned)
    const nextBooking = new Set(bookingSet)
    const nextStatus = new Set(statusSet)

    if (isCurrentlySent) {
      nextBooking.delete(cleaned)
      nextStatus.delete(cleaned)
    } else {
      nextBooking.add(cleaned)
    }

    saveBookingSet(nextBooking)
    saveStatusSet(nextStatus)

    if (onUpdateHistory && history && history.length > 0) {
      let modified = false
      const updated = history.map(p => {
        const pT = cleanKey(p.tracking)
        const pI = cleanKey(p.id)
        if (pT === cleaned || pI === cleaned) {
          modified = true
          return {
            ...p,
            whatsapp_sent: !isCurrentlySent,
            whatsappSent: !isCurrentlySent,
            whatsapp_booking_sent: !isCurrentlySent,
            whatsapp_status_sent: false,
            whatsapp_sent_at: !isCurrentlySent ? new Date().toISOString() : undefined
          }
        }
        return p
      })
      if (modified) {
        onUpdateHistory(updated)
      }
    }
  }, [bookingSet, statusSet, saveBookingSet, saveStatusSet, onUpdateHistory, history])

  const clearAllSent = useCallback(() => {
    saveBookingSet(new Set())
    saveStatusSet(new Set())
    if (onUpdateHistory && history && history.length > 0) {
      const updated = history.map(p => ({
        ...p,
        whatsapp_sent: false,
        whatsappSent: false,
        whatsapp_booking_sent: false,
        whatsapp_status_sent: false,
        whatsapp_sent_at: undefined
      }))
      onUpdateHistory(updated)
    }
  }, [saveBookingSet, saveStatusSet, onUpdateHistory, history])

  return {
    isSent,
    isBookingSent,
    isStatusSent,
    getAlertState,
    markSent,
    toggleSent,
    sentSet: new Set([...bookingSet, ...statusSet]),
    sentCount: new Set([...bookingSet, ...statusSet]).size,
    clearAllSent
  }
}
