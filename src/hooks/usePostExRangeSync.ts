import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAllMerchantOrders } from '../utils/postexApi'
import { hasExternalParcels, getLastRangeSyncTime, recordRangeSync } from '../utils/portalParcelStore'

/**
 * Loads external PostEx parcels for the exact date range the merchant is
 * looking at. Smart cached: does not auto-sync if parcels are already present in store.
 */

const AUTO_SYNC_DEBOUNCE_MS = 300
const AUTO_SYNC_COOLDOWN_MS = 60 * 1000

interface UsePostExRangeSyncOptions {
  token?: string
  userId?: string
  fromDate: string
  toDate: string
  onOrders: (orders: any[], range: string) => void
}

export function usePostExRangeSync({ token, userId, fromDate, toDate, onOrders }: UsePostExRangeSyncOptions) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const activeRangeRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const onOrdersRef = useRef(onOrders)
  const timerRef = useRef<any>(null)

  useEffect(() => {
    onOrdersRef.current = onOrders
  }, [onOrders])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Timer increments every second while syncing
  useEffect(() => {
    if (isSyncing) {
      setElapsedSeconds(0)
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isSyncing])

  const rangeKey = `${fromDate}|${toDate}`

  const sync = useCallback(
    async (force = true): Promise<number | null> => {
      const cleanToken = (token || '').trim()
      if (!cleanToken || !fromDate || !toDate) return null
      if (activeRangeRef.current === rangeKey && !force) return null

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      activeRangeRef.current = rangeKey

      if (mountedRef.current) {
        setIsSyncing(true)
        setError(null)
        setProgress('Connecting to PostEx API...')
      }

      try {
        const orders = await fetchAllMerchantOrders(cleanToken, fromDate, toDate, {
          signal: controller.signal,
          on_progress: message => {
            if (mountedRef.current) setProgress(message)
          }
        })

        recordRangeSync(userId, rangeKey)
        if (mountedRef.current) {
          onOrdersRef.current(orders, rangeKey)
        }
        return orders.length
      } catch (err: any) {
        const isCancelled = err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError'
        if (!isCancelled && mountedRef.current) {
          setError(err?.message || 'Could not load parcels from PostEx.')
        }
        return null
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
          activeRangeRef.current = null
          if (mountedRef.current) {
            setIsSyncing(false)
            setProgress('')
          }
        }
      }
    },
    [token, userId, fromDate, toDate, rangeKey]
  )

  // Intelligent Auto-Sync on Date Range Change:
  // Automatically loads parcels from PostEx API if the selected range is not yet cached or if cooldown expired.
  useEffect(() => {
    const cleanToken = (token || '').trim()
    if (!cleanToken || !fromDate || !toDate) return

    const lastSync = getLastRangeSyncTime(userId, rangeKey)
    const isCooldownActive = Date.now() - lastSync < AUTO_SYNC_COOLDOWN_MS
    const alreadyHasData = hasExternalParcels(userId, fromDate, toDate)

    if (alreadyHasData && isCooldownActive) {
      return
    }

    const timer = setTimeout(() => {
      void sync(false)
    }, AUTO_SYNC_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [sync, token, userId, fromDate, toDate, rangeKey])

  return { isSyncing, progress, error, elapsedSeconds, sync }
}
