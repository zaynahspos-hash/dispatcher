import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../utils/supabaseClient'
import { BookedParcel } from '../components/BookedHistory'
import { getCached, setCached, getTTL } from '../utils/cacheWithExpiry'

function mergeHistory(db: BookedParcel[], local: BookedParcel[]): BookedParcel[] {
  const map = new Map<string, BookedParcel>()
  ;[...local, ...db].forEach(p => {
    const existing = map.get(p.tracking)
    if (!existing || new Date(p.bookingDate) > new Date(existing.bookingDate)) {
      map.set(p.tracking, p)
    }
  })
  return Array.from(map.values())
    .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
}

export function useUserHistorySync(user: User | null) {
  const [history, setHistory] = useState<BookedParcel[]>([])
  const [dailyTokens, setDailyTokens] = useState<number>(0)
  const [monthlyTokens, setMonthlyTokens] = useState<number>(0)
  const [dailyRequests, setDailyRequests] = useState<number>(0)

  async function fetchTokenUsage() {
    if (!user) return
    try {
      const now = new Date()
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      // RULE D13: snake_case table 'usage_logs', columns 'user_id', 'action', 'created_at'
      const { data, error } = await supabase
        .from('usage_logs')
        .select('details, created_at')
        .eq('user_id', user.id)
        .eq('action', 'order_parsed')
        .gte('created_at', monthStart.toISOString())

      if (error) throw error

      let daily = 0
      let monthly = 0
      let dailyReqs = 0
      data?.forEach(log => {
        const isToday = new Date(log.created_at) >= todayStart
        if (isToday) dailyReqs++

        const match = log.details?.match(/Tokens used:\s*(\d+)/)
        if (match) {
          const t = parseInt(match[1], 10)
          monthly += t
          if (isToday) daily += t
        }
      })
      setDailyTokens(daily)
      setMonthlyTokens(monthly)
      setDailyRequests(dailyReqs)
    } catch (err) {
      console.error('Failed to load token usage:', err)
    }
  }

  // Synchronize user-specific caches and fetch user history when user changes
  useEffect(() => {
    if (!user) {
      setHistory([])
      return
    }

    fetchTokenUsage()

    const userHistoryKey = `booked_history_${user.id}`
    const cachedHistory = getCached<BookedParcel[]>(userHistoryKey) || []
    setHistory(cachedHistory)

    // RULE D13: snake_case table 'booked_history', column 'user_id'
    supabase
      .from('booked_history')
      .select('history, updated_at')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching history from db:', error)
          return
        }
        if (data && data.history) {
          const dbHistory = data.history as unknown as BookedParcel[]
          const cacheKey = `booked_history_synced_at_${user.id}`
          const lastSync = localStorage.getItem(cacheKey)
          const dbUpdated = new Date(data.updated_at || 0).getTime()
          if (!lastSync || dbUpdated > Number(lastSync)) {
            const merged = mergeHistory(dbHistory, cachedHistory)
            setHistory(merged)
            setCached(userHistoryKey, merged, getTTL('days', 30))
            localStorage.setItem(cacheKey, String(dbUpdated))
          }
        } else {
          if (cachedHistory.length > 0) {
            supabase
              .from('booked_history')
              .upsert({
                user_id: user.id,
                history: cachedHistory,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' })
              .then(({ error }) => {
                if (error) console.error('Failed to sync initial history to db:', error)
              })
          }
        }
      })
  }, [user])

  const updateHistory = (updated: BookedParcel[]) => {
    setHistory(updated)

    if (user) {
      const userHistoryKey = `booked_history_${user.id}`
      setCached(userHistoryKey, updated, getTTL('days', 30))

      // RULE C10: optimistic update above is already done. Now persist to DB.
      // RULE D13: snake_case table 'booked_history', column 'user_id'
      supabase
        .from('booked_history')
        .upsert({
          user_id: user.id,
          history: updated,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .then(({ error }) => {
          if (error) console.error('Failed to sync history to db:', error)
        })
    } else {
      setCached('booked_history', updated, getTTL('days', 30))
    }
  }

  return {
    history,
    updateHistory,
    dailyTokens,
    monthlyTokens,
    dailyRequests,
    fetchTokenUsage
  }
}
