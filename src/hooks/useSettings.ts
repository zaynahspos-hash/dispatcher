import { useState, useEffect, useCallback } from 'react'
import { Settings } from '../utils/groqParser'
import { supabase } from '../utils/supabaseClient'

const DEFAULTS: Settings = {
  groq_api_key: '',
  postex_token: '',
  postex_pickup: '',
  postex_return: '',
  default_weight: '0.5',
  default_items: '3',
  default_product: 'Kids Clothes',
  default_note: 'Call before delivery, customer is a serious buyer',
  postex_type: 'Normal',
  postex_handling: 'No',
  postex_product_check: '1',
  postex_sku_check: '0',
  postex_weight_check: '1',
  postex_pieces_check: '1',
  postex_cod_check: '0',
  postex_notes_check: '1',
  postex_return_city: '',
  postex_pickup_address: '',
  postex_return_address: '',
  groq_model: 'llama-3.1-8b-instant',
  ai_provider: 'groq',
  openai_api_key: '',
  openai_model: 'gpt-4o-mini',
  openrouter_api_key: '',
  openrouter_model: 'meta-llama/llama-3.1-8b-instruct:free',
  gemini_api_key: '',
  gemini_model: 'gemini-3-flash-preview',
  anthropic_api_key: '',
  anthropic_model: 'claude-haiku-4-5',
  deepseek_api_key: '',
  deepseek_model: 'deepseek-v4-flash',
  kimi_api_key: '',
  kimi_model: 'moonshot-v1-8k',
  mistral_api_key: '',
  mistral_model: 'ministral-3b-2512',
  whatsapp_template: 'Dear {name}, your order has been booked. You can track it here: {url}\n{note}',
  whatsapp_note: 'Thank you for shopping with us!',
  avatar_url: '',
}

// ─── Per-user localStorage helpers ───────────────────────────────────────────
// All keys are namespaced with the user's UUID so that two tenants on the
// same browser/device never share cached settings. (RULE D15 — zero cross-tenant)

function userSettingsKey(userId: string, field: keyof Settings) {
  return `u_${userId}_${field}`
}

function userVersionKey(userId: string) {
  return `u_${userId}_settings_version`
}

/** Read a single field from localStorage for this user */
function readLocal(userId: string, field: keyof Settings): string {
  return localStorage.getItem(userSettingsKey(userId, field)) || (DEFAULTS[field] as string) || ''
}

/** Write a single field to localStorage for this user */
function writeLocal(userId: string, field: keyof Settings, value: string) {
  localStorage.setItem(userSettingsKey(userId, field), value)
}

/** Write all settings to localStorage for this user */
function writeAllLocal(userId: string, data: Settings) {
  ;(Object.keys(DEFAULTS) as Array<keyof Settings>).forEach(k => {
    localStorage.setItem(userSettingsKey(userId, k), data[k] || '')
  })
}

/** Read all settings from localStorage for this user */
function readAllLocal(userId: string): Settings {
  const result: Partial<Settings> = {}
  ;(Object.keys(DEFAULTS) as Array<keyof Settings>).forEach(k => {
    result[k] = readLocal(userId, k)
  })
  if (!result.gemini_model || result.gemini_model.includes('2.0') || result.gemini_model.includes('1.5')) {
    result.gemini_model = 'gemini-3-flash-preview'
  }
  return result as Settings
}

/** Remove ALL cached settings for this user from localStorage (RULE C10 — no stale on logout) */
function clearLocalForUser(userId: string) {
  ;(Object.keys(DEFAULTS) as Array<keyof Settings>).forEach(k => {
    localStorage.removeItem(userSettingsKey(userId, k))
  })
  localStorage.removeItem(userVersionKey(userId))
}

// ─────────────────────────────────────────────────────────────────────────────

export function useSettings() {
  // Start with DEFAULTS — we'll hydrate from DB once we know who the user is
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [user, setUser] = useState<any>(null)
  const [initialAuthChecked, setInitialAuthChecked] = useState(false)
  const [loading, setLoading] = useState(false)

  // ── Track auth state ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setInitialAuthChecked(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null
      setUser((prev: any) => {
        // If user switched accounts, reset settings to DEFAULTS so the old
        // user's values are never visible to the new user even for a moment.
        // RULE C10: Zero stale data showing
        if (prev?.id !== newUser?.id) {
          setSettings(DEFAULTS)
        }
        return newUser
      })
      setInitialAuthChecked(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Load settings from DB whenever user changes ──────────────────────────
  // RULE D13: snake_case table = user_settings, column = user_id
  const loadDbSettings = useCallback(async (currentUser: any) => {
    if (!currentUser) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_settings')      // ✅ snake_case table
        .select('settings, updated_at')
        .eq('user_id', currentUser.id)  // ✅ snake_case FK column
        .maybeSingle()

      if (error) {
        console.error('[useSettings] DB fetch error:', error)
        // Fall back to user-specific localStorage cache
        const cached = readAllLocal(currentUser.id)
        setSettings(cached)
        return
      }

      if (data && data.settings) {
        // DB has settings — load them and refresh local cache
        const dbSettings = data.settings as unknown as Settings
        if (!dbSettings.gemini_model || dbSettings.gemini_model.includes('2.0') || dbSettings.gemini_model.includes('1.5') || dbSettings.gemini_model.includes('1.0') || dbSettings.gemini_model === 'custom') {
          dbSettings.gemini_model = 'gemini-3-flash-preview'
        }
        const dbUpdatedAt = data.updated_at || ''
        const localVersion = localStorage.getItem(userVersionKey(currentUser.id))

        if (dbUpdatedAt && localVersion !== dbUpdatedAt) {
          const merged = { ...DEFAULTS, ...dbSettings }
          setSettings(merged)
          writeAllLocal(currentUser.id, merged)
          localStorage.setItem(userVersionKey(currentUser.id), dbUpdatedAt)
        } else {
          // Local cache is already up-to-date; just set state from it
          setSettings({ ...DEFAULTS, ...dbSettings })
        }
      } else {
        // No DB record yet — start fresh with DEFAULTS (RULE C10: no stale bleed)
        setSettings(DEFAULTS)
        // Create a blank record in DB so future updates can upsert into it
        await supabase.from('user_settings').upsert({
          user_id: currentUser.id,       // ✅ snake_case
          settings: DEFAULTS,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })    // ✅ snake_case conflict column
      }
    } catch (err) {
      console.error('[useSettings] Failed to sync from database:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      // Reset to DEFAULTS when logged out — nothing leaks between sessions
      setSettings(DEFAULTS)
      return
    }

    loadDbSettings(user)

    const interval = setInterval(() => loadDbSettings(user), 60 * 1_000)
    return () => clearInterval(interval)
  }, [user, loadDbSettings])

  // ── Update a single field (or multiple fields) ───────────────────────────
  // RULE C10: Optimistic update first — local state + localStorage immediately,
  // then async Supabase write in background
  async function updateSetting(key: keyof Settings | Partial<Settings>, value?: string) {
    setSettings(prev => {
      let updated: Settings
      if (typeof key === 'object') {
        updated = { ...prev, ...key }
        if (user) {
          Object.entries(key).forEach(([k, val]) => {
            writeLocal(user.id, k as keyof Settings, val || '')
          })
        }
      } else {
        const val = value || ''
        updated = { ...prev, [key]: val }
        if (user) writeLocal(user.id, key, val)
      }

      if (user) {
        const now = new Date().toISOString()
        // RULE D13: snake_case table + column
        supabase.from('user_settings').upsert({
          user_id: user.id,           // ✅ snake_case
          settings: updated,
          updated_at: now
        }, { onConflict: 'user_id' }) // ✅ snake_case
          .then(({ error }) => {
            if (error) {
              console.error('[updateSetting] Failed to persist to DB:', error)
            } else {
              localStorage.setItem(userVersionKey(user.id), now)
            }
          })
      }
      return updated
    })
  }

  // ── Force-sync (e.g. bulk import from Settings page) ────────────────────
  async function forceSyncSettings(newSettings: Settings) {
    setSettings(newSettings)
    if (user) {
      writeAllLocal(user.id, newSettings)
      const now = new Date().toISOString()
      await supabase.from('user_settings').upsert({
        user_id: user.id,             // ✅ snake_case
        settings: newSettings,
        updated_at: now
      }, { onConflict: 'user_id' })   // ✅ snake_case
      localStorage.setItem(userVersionKey(user.id), now)
    }
  }

  // ── Logout helper: wipe local cache so nothing bleeds to next user ───────
  // RULE C10: After logout, zero stale data remains in localStorage
  async function logout() {
    if (user) {
      clearLocalForUser(user.id)
      // Also clear tenant-scoped booked_history and booking_results caches
      localStorage.removeItem(`booked_history_${user.id}`)
      localStorage.removeItem(`booking_results_${user.id}`)
      localStorage.removeItem(`booked_history_synced_at_${user.id}`)
    }
    await supabase.auth.signOut()
    setSettings(DEFAULTS)
    setUser(null)
  }

  return {
    settings,
    updateSetting,
    user,
    loadingSettings: loading,
    initialAuthChecked,
    forceSyncSettings,
    logout,
  }
}
