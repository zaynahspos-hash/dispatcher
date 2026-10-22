import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAllMerchantOrders } from '../utils/postexApi'

/**
 * Loads external PostEx parcels for the exact date range the merchant is
 * looking at. The history tab used to request 180 days in one call, which
 * routinely timed out (HTTP 524) and left the "External / Portal" list empty.
 */

const AUTO_SYNC_DEBOUNCE_MS = 450
const AUTO_SYNC_COOLDOWN_MS = 5 * 60 * 1000

interface UsePostExRangeSyncOptions {
  token?: string
  fromDate: string
  toDate: string
  onOrders: (orders: any[], range: string) => void
}

export function usePostExRangeSync({ token, fromDate, toDate, onOrders }: UsePostExRangeSyncOptions) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)

  const lastSyncRef = useRef<Record<string, number>>({})
  const activeRangeRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const onOrdersRef = useRef(onOrders)

  useEffect(() => {
    onOrdersRef.current = onOrders
  }, [onOrders])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  const rangeKey = `${fromDate}|${toDate}`

  const sync = useCallback(
    async (force = false): Promise<number | null> => {
      const cleanToken = (token || '').trim()
      if (!cleanToken || !fromDate || !toDate) return null
      if (activeRangeRef.current === rangeKey) return null

      const lastSyncedAt = lastSyncRef.current[rangeKey] || 0
      if (!force && Date.now() - lastSyncedAt < AUTO_SYNC_COOLDOWN_MS) return null

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      activeRangeRef.current = rangeKey

      if (mountedRef.current) {
        setIsSyncing(true)
        setError(null)
        setProgress('Connecting to PostEx...')
      }

      try {
        const orders = await fetchAllMerchantOrders(cleanToken, fromDate, toDate, {
          signal: controller.signal,
          on_progress: message => {
            if (mountedRef.current) setProgress(message)
          }
        })

        lastSyncRef.current[rangeKey] = Date.now()
        if (mountedRef.current && orders.length > 0) {
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
    [token, fromDate, toDate, rangeKey]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      void sync(false)
    }, AUTO_SYNC_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [sync])

  return { isSyncing, progress, error, sync }
}
