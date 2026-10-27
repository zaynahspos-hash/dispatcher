import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'wa_last_sent_timestamp'
const COOLDOWN_DURATION_KEY = 'wa_cooldown_duration_sec'
export const DEFAULT_ANTI_BAN_DELAY_SEC = 120 // 2 minutes strict anti-ban cooling window

/**
 * Records that a WhatsApp message was sent right now and begins the anti-ban cooling window.
 */
export function recordWhatsAppSend(durationSec: number = DEFAULT_ANTI_BAN_DELAY_SEC): void {
  if (typeof window === 'undefined') return
  try {
    const now = Date.now()
    localStorage.setItem(STORAGE_KEY, String(now))
    localStorage.setItem(COOLDOWN_DURATION_KEY, String(durationSec))
    window.dispatchEvent(new CustomEvent('wa_message_sent', { detail: { timestamp: now, duration: durationSec } }))
  } catch {}
}

/**
 * Returns the remaining seconds in the active cooling window (0 if ready).
 */
export function getRemainingCooldownSeconds(defaultDurationSec: number = DEFAULT_ANTI_BAN_DELAY_SEC): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return 0
    const lastSent = parseInt(raw, 10)
    if (!lastSent || isNaN(lastSent)) return 0

    const rawDuration = localStorage.getItem(COOLDOWN_DURATION_KEY)
    const duration = rawDuration ? parseInt(rawDuration, 10) || defaultDurationSec : defaultDurationSec

    const elapsedSec = Math.floor((Date.now() - lastSent) / 1000)
    const remaining = duration - elapsedSec
    return remaining > 0 ? remaining : 0
  } catch {
    return 0
  }
}

/**
 * Clears the active cooldown (manual override if merchant urgently needs to skip).
 */
export function clearWhatsAppCooldown(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new CustomEvent('wa_cooldown_cleared'))
  } catch {}
}

/**
 * Formats seconds into MM:SS display.
 */
export function formatCooldownTime(seconds: number): string {
  if (seconds <= 0) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * React hook to reactively track WhatsApp anti-ban cooldown countdown.
 */
export function useWhatsAppCooldown(configuredCooldownSec: number = DEFAULT_ANTI_BAN_DELAY_SEC) {
  const [remaining, setRemaining] = useState<number>(() => getRemainingCooldownSeconds(configuredCooldownSec))
  const [totalDuration, setTotalDuration] = useState<number>(() => {
    if (typeof window === 'undefined') return configuredCooldownSec
    const raw = localStorage.getItem(COOLDOWN_DURATION_KEY)
    return raw ? parseInt(raw, 10) || configuredCooldownSec : configuredCooldownSec
  })

  useEffect(() => {
    const updateTick = () => {
      const rem = getRemainingCooldownSeconds(configuredCooldownSec)
      setRemaining(rem)
    }

    updateTick()
    const timer = setInterval(updateTick, 1000)

    const handleSentEvent = (e: any) => {
      if (e?.detail?.duration) {
        setTotalDuration(e.detail.duration)
      }
      updateTick()
    }

    const handleClearedEvent = () => {
      setRemaining(0)
    }

    window.addEventListener('wa_message_sent', handleSentEvent)
    window.addEventListener('wa_cooldown_cleared', handleClearedEvent)

    return () => {
      clearInterval(timer)
      window.removeEventListener('wa_message_sent', handleSentEvent)
      window.removeEventListener('wa_cooldown_cleared', handleClearedEvent)
    }
  }, [configuredCooldownSec])

  const triggerCooldown = useCallback((sec: number = configuredCooldownSec) => {
    setTotalDuration(sec)
    recordWhatsAppSend(sec)
    setRemaining(sec)
  }, [configuredCooldownSec])

  const skipCooldown = useCallback(() => {
    clearWhatsAppCooldown()
    setRemaining(0)
  }, [])

  const isCooling = remaining > 0
  const progressPercent = totalDuration > 0 ? Math.min(100, Math.round(((totalDuration - remaining) / totalDuration) * 100)) : 100

  return {
    isCooling,
    remainingSeconds: remaining,
    formattedRemaining: formatCooldownTime(remaining),
    progressPercent,
    totalDuration,
    triggerCooldown,
    skipCooldown
  }
}
