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
  gemini_model: 'gemini-3.5-flash-lite',
  anthropic_api_key: '',
  anthropic_model: 'claude-haiku-4-5',
  deepseek_api_key: '',
  deepseek_model: 'deepseek-v4-flash',
  kimi_api_key: '',
  kimi_model: 'moonshot-v1-8k',
  mistral_api_key: '',
  whatsapp_template: 'postex.pk \u2022 Tracking Alert \u{1F4E6}\u2728\n\nDear {customer_name}, aap ka order book ho gaya hai \u2705\nAap ise yahan track kar sakti hain \u{1F50D}\u{1F447}\n{portal_link}\n\n{note}',
  whatsapp_note: 'Meharbani farma kar apna local SIM phone number ON rakhain \u{1F4F1}\u{1F514} taake delivery rider asani se rabta kar sake \u{1F69A}\u{1F4A8}\n\nReview dejye ga lazmi is number pe \u2B50\u{1F4DD} aur agar 2-5 din mein parcel receive nahi hota \u23F3 to is number pe rabta karna hai \u260E\uFE0F\n\nHappy Shopping! \u{1F6CD}\uFE0F\u{1F60A}\u{1F389}',
  avatar_url: '',
  order_id_prefix: 'tv-',
  order_id_next_num: '1001',
}

const DEFAULT_WHATSAPP_TEMPLATE = 'postex.pk \u2022 Tracking Alert \u{1F4E6}\u2728\n\nDear {customer_name}, aap ka order book ho gaya hai \u2705\nAap ise yahan track kar sakti hain \u{1F50D}\u{1F447}\n{portal_link}\n\n{note}'
const DEFAULT_WHATSAPP_NOTE = 'Meharbani farma kar apna local SIM phone number ON rakhain \u{1F4F1}\u{1F514} taake delivery rider asani se rabta kar sake \u{1F69A}\u{1F4A8}\n\nReview dejye ga lazmi is number pe \u2B50\u{1F4DD} aur agar 2-5 din mein parcel receive nahi hota \u23F3 to is number pe rabta karna hai \u260E\uFE0F\n\nHappy Shopping! \u{1F6CD}\uFE0F\u{1F60A}\u{1F389}'

// ─── Per-user localStorage helpers ───────────────────────────────────────────
// All keys are namespaced with the user's UUID so that two tenants on the
// same browser/device never share cached settings. (RULE D15 — zero cross-tenant)

const CRITICAL_SECRET_KEYS: Array<keyof Settings> = [
  'postex_token', 'groq_api_key', 'gemini_api_key', 'openai_api_key',
  'anthropic_api_key', 'deepseek_api_key', 'openrouter_api_key'
]

function userSettingsKey(userId: string, field: keyof Settings) {
  return `u_${userId}_${field}`
}

function userVersionKey(userId: string) {
  return `u_${userId}_settings_version`
}

/** Read a single field from localStorage for this user */
function readLocal(userId: string, field: keyof Settings): string {
  let val = localStorage.getItem(userSettingsKey(userId, field))
  if (!val && CRITICAL_SECRET_KEYS.includes(field)) {
    val = localStorage.getItem(`zaynah_vault_${field}`) || ''
  }
  if (field === 'whatsapp_note') {
    if (!val || val === 'Thank you for shopping with us!' || !val.includes('\u{1F4F1}') || !val.includes('\u{1F69A}')) {
      return DEFAULT_WHATSAPP_NOTE
    }
  }
  if (field === 'whatsapp_template') {
    if (!val || val.includes('Dear {name}, your order has been booked.') || !val.includes('\u2705')) {
      return DEFAULT_WHATSAPP_TEMPLATE
    }
  }
  return val || (DEFAULTS[field] as string) || ''
}

/** Write a single field to localStorage for this user */
function writeLocal(userId: string, field: keyof Settings, value: string) {
  localStorage.setItem(userSettingsKey(userId, field), value)
  if (CRITICAL_SECRET_KEYS.includes(field)) {
    if (value) {
      localStorage.setItem(`zaynah_vault_${field}`, value)
    } else {
      localStorage.removeItem(`zaynah_vault_${field}`)
    }
  }
}

/** Write all settings to localStorage for this user */
function writeAllLocal(userId: string, data: Settings) {
  ;(Object.keys(DEFAULTS) as Array<keyof Settings>).forEach(k => {
    writeLocal(userId, k, data[k] || '')
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
        .from('user_settings')      // [OK] snake_case table
        .select('settings, updated_at')
        .eq('user_id', currentUser.id)  // [OK] snake_case FK column
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
        if (!dbSettings.whatsapp_note || dbSettings.whatsapp_note === 'Thank you for shopping with us!' || !dbSettings.whatsapp_note.includes('\u{1F4F1}')) {
          dbSettings.whatsapp_note = DEFAULT_WHATSAPP_NOTE
        }
        if (!dbSettings.whatsapp_template || dbSettings.whatsapp_template.includes('Dear {name}, your order has been booked.') || !dbSettings.whatsapp_template.includes('\u2705')) {
          dbSettings.whatsapp_template = DEFAULT_WHATSAPP_TEMPLATE
        }
        const dbUpdatedAt = data.updated_at || ''
        const localVersion = localStorage.getItem(userVersionKey(currentUser.id))

        if (dbUpdatedAt && localVersion !== dbUpdatedAt) {
          const merged = { ...DEFAULTS, ...dbSettings }
          CRITICAL_SECRET_KEYS.forEach(k => {
            if (!merged[k]) {
              const fallback = readLocal(currentUser.id, k) || localStorage.getItem(`zaynah_vault_${k}`)
              if (fallback) merged[k] = fallback
            }
          })
          setSettings(merged)
          writeAllLocal(currentUser.id, merged)
          localStorage.setItem(userVersionKey(currentUser.id), dbUpdatedAt)
        } else {
          const localSettings = readAllLocal(currentUser.id)
          setSettings(localSettings)
        }
      } else {
        // No DB record yet — pull existing local/vault settings
        const currentLocal = readAllLocal(currentUser.id)
        setSettings(currentLocal)
        await supabase.from('user_settings').upsert({
          user_id: currentUser.id,
          settings: currentLocal,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
      }
    } catch (err) {
      console.error('[useSettings] Failed to sync from database:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      // Hydrate with local vault fallback so API keys don't blank out on reload
      const guestSettings = { ...DEFAULTS }
      CRITICAL_SECRET_KEYS.forEach(k => {
        const v = localStorage.getItem(`zaynah_vault_${k}`)
        if (v) guestSettings[k] = v
      })
      setSettings(guestSettings)
      return
    }

    loadDbSettings(user)

    const interval = setInterval(() => loadDbSettings(user), 60 * 1_000)
    return () => clearInterval(interval)
  }, [user, loadDbSettings])

  // ── Update a single field (or multiple fields) ───────────────────────────
  async function updateSetting(key: keyof Settings | Partial<Settings>, value?: string) {
    setSettings(prev => {
      let updated: Settings
      const uId = user?.id || 'guest'
      if (typeof key === 'object') {
        updated = { ...prev, ...key }
        Object.entries(key).forEach(([k, val]) => {
          writeLocal(uId, k as keyof Settings, (val as string) || '')
        })
      } else {
        const val = value || ''
        updated = { ...prev, [key]: val }
        writeLocal(uId, key, val)
      }

      if (user) {
        const now = new Date().toISOString()
        // RULE D13: snake_case table + column
        supabase.from('user_settings').upsert({
          user_id: user.id,           // [OK] snake_case
          settings: updated,
          updated_at: now
        }, { onConflict: 'user_id' }) // [OK] snake_case
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
        user_id: user.id,             // [OK] snake_case
        settings: newSettings,
        updated_at: now
      }, { onConflict: 'user_id' })   // [OK] snake_case
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
