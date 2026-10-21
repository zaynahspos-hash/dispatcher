import { useState, useEffect, useCallback } from 'react'
import { Settings } from '../utils/groqParser'
import { supabase } from '../utils/supabaseClient'
import { clearCachedAvatar } from '../utils/avatarCache'
import { DEFAULT_MILESTONE_TEMPLATES, isCorruptText } from '../components/history/types'
import { getMerchantAddresses } from '../utils/postexApi'

// Automatically purge corrupted emoji keys from localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('whatsapp_template') || key.includes('whatsapp_note'))) {
        const val = localStorage.getItem(key)
        if (val && isCorruptText(val)) {
          localStorage.removeItem(key)
        }
      }
    }
  } catch {}
}

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
  gemini_model: 'gemini-1.5-flash',
  anthropic_api_key: '',
  anthropic_model: 'claude-haiku-4-5',
  deepseek_api_key: '',
  deepseek_model: 'deepseek-v4-flash',
  kimi_api_key: '',
  kimi_model: 'moonshot-v1-8k',
  mistral_api_key: '',
  whatsapp_template: '📦 postex.pk • Tracking Alert 🚚\n\nDear {customer_name}, aap ka order book ho gaya hai! 🎉\nAap ise yahan live track kar sakti hain:\n🔗 {portal_link}\n\n{note}',
  whatsapp_note: 'Meharbani farma kar apna local SIM phone number ON rakhain 📱🔔 taake delivery rider asani se rabta kar sake 🚚💨\n\nReview dejye ga lazmi is number pe ⭐📝 aur agar 2-5 din mein parcel receive nahi hota ⏳ to is number pe rabta karna hai 📞\n\nHappy Shopping! 🛍️😊🎉',
  avatar_url: '',
  order_id_prefix: 'Ord-',
  order_id_next_num: '1001',
  whatsapp_enable_booking_alert: false,
  whatsapp_enable_out_for_delivery_alert: true,
  whatsapp_enable_action_required_alert: true,
  whatsapp_enable_delivered_alert: false,
  whatsapp_template_booking: DEFAULT_MILESTONE_TEMPLATES.booking,
  whatsapp_template_out_for_delivery: DEFAULT_MILESTONE_TEMPLATES.out_for_delivery,
  whatsapp_template_action_required: DEFAULT_MILESTONE_TEMPLATES.action_required,
  whatsapp_template_delivered: DEFAULT_MILESTONE_TEMPLATES.delivered,
  whatsapp_min_delay_sec: 30,
  whatsapp_max_delay_sec: 50,
}

const DEFAULT_WHATSAPP_TEMPLATE = DEFAULT_MILESTONE_TEMPLATES.booking
const DEFAULT_WHATSAPP_NOTE = 'Meharbani farma kar apna local SIM phone number ON rakhain 📱🔔 taake delivery rider asani se rabta kar sake 🚚💨\n\nReview dejye ga lazmi is number pe ⭐📝 aur agar 2-5 din mein parcel receive nahi hota ⏳ to is number pe rabta karna hai 📞\n\nHappy Shopping! 🛍️😊🎉'

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

function userVaultKey(userId: string, field: keyof Settings) {
  return `zaynah_vault_${userId}_${field}`
}

function userVersionKey(userId: string) {
  return `u_${userId}_settings_version`
}

function readLocal(userId: string, field: keyof Settings): any {
  let val = localStorage.getItem(userSettingsKey(userId, field))
  
  // Anti-Wipe: If critical secret is missing from primary slot, check persistent resilient vault
  if ((!val || val === '') && CRITICAL_SECRET_KEYS.includes(field)) {
    const vaultVal = localStorage.getItem(userVaultKey(userId, field)) || localStorage.getItem(`zaynah_vault_${field}`)
    if (vaultVal) {
      val = vaultVal
      localStorage.setItem(userSettingsKey(userId, field), vaultVal)
    }
  }

  if (field === 'whatsapp_note') {
    if (!val || val === 'Thank you for shopping with us!' || isCorruptText(val) || !val.includes('📱')) {
      writeLocal(userId, 'whatsapp_note', DEFAULTS.whatsapp_note)
      return DEFAULTS.whatsapp_note
    }
  }
  if (field === 'whatsapp_template' || field === 'whatsapp_template_booking') {
    if (!val || isCorruptText(val) || !val.includes('📦')) {
      writeLocal(userId, field, DEFAULTS.whatsapp_template)
      return DEFAULTS.whatsapp_template
    }
  }
  if (field === 'whatsapp_template_out_for_delivery') {
    if (!val || isCorruptText(val) || !val.includes('🛵')) {
      writeLocal(userId, field, DEFAULT_MILESTONE_TEMPLATES.out_for_delivery)
      return DEFAULT_MILESTONE_TEMPLATES.out_for_delivery
    }
  }
  if (field === 'whatsapp_template_action_required') {
    if (!val || isCorruptText(val) || !val.includes('⚠️')) {
      writeLocal(userId, field, DEFAULT_MILESTONE_TEMPLATES.action_required)
      return DEFAULT_MILESTONE_TEMPLATES.action_required
    }
  }
  if (field === 'whatsapp_template_delivered') {
    if (!val || isCorruptText(val) || !val.includes('✅')) {
      writeLocal(userId, field, DEFAULT_MILESTONE_TEMPLATES.delivered)
      return DEFAULT_MILESTONE_TEMPLATES.delivered
    }
  }
  if (field.startsWith('whatsapp_enable_')) {
    if (val === 'true') return true
    if (val === 'false') return false
    return Boolean(DEFAULTS[field])
  }
  if (field === 'whatsapp_min_delay_sec' || field === 'whatsapp_max_delay_sec') {
    if (val !== null && val !== '') return Number(val)
    return Number(DEFAULTS[field]) || 30
  }
  return val !== null ? val : (DEFAULTS[field] ?? '')
}

/** Write a single field to localStorage strictly for this user (RULE D15) */
function writeLocal(userId: string, field: keyof Settings, value: any) {
  const strVal = value === undefined || value === null ? '' : String(value)
  localStorage.setItem(userSettingsKey(userId, field), strVal)

  // Maintain persistent resilient vault for secrets so they survive browser cache clear
  if (CRITICAL_SECRET_KEYS.includes(field)) {
    if (strVal) {
      localStorage.setItem(userVaultKey(userId, field), strVal)
      localStorage.setItem(`zaynah_vault_${field}`, strVal)
    } else {
      localStorage.removeItem(userVaultKey(userId, field))
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
  const VALID_GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro']
  if (!result.gemini_model || !VALID_GEMINI_MODELS.includes(result.gemini_model)) {
    result.gemini_model = 'gemini-1.5-flash'
  }
  return result as Settings
}

/** Remove ALL cached settings for this user from localStorage (RULE C10 — no stale on logout) */
function clearLocalForUser(userId: string) {
  ;(Object.keys(DEFAULTS) as Array<keyof Settings>).forEach(k => {
    localStorage.removeItem(userSettingsKey(userId, k))
    localStorage.removeItem(userVaultKey(userId, k))
  })
  localStorage.removeItem(userVersionKey(userId))
}

// ─────────────────────────────────────────────────────────────────────────────

export function useSettings() {
  // Start with DEFAULTS — we'll hydrate from DB once we know who the user is
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [user, setUser] = useState<any>(null)
  const [isBlocked, setIsBlocked] = useState(false)
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
      const localSettings = readAllLocal(currentUser.id)

      const { data, error } = await supabase
        .from('user_settings')      // [OK] snake_case table
        .select('settings, updated_at')
        .eq('user_id', currentUser.id)  // [OK] snake_case FK column
        .maybeSingle()

      if (error) {
        console.error('[useSettings] DB fetch error:', error)
        // Fall back to user-specific localStorage cache
        setSettings(localSettings)
        return
      }

      // Check if merchant account has been paused by admin
      try {
        const { data: userRow } = await supabase
          .from('users')
          .select('status, is_blocked')
          .eq('id', currentUser.id)
          .maybeSingle()
        setIsBlocked(!!(userRow?.is_blocked || userRow?.status === 'suspended' || (data?.settings as any)?.is_blocked))
      } catch {
        setIsBlocked(!!((data?.settings as any)?.is_blocked))
      }

      if (data && data.settings) {
        // DB has settings — load them and refresh local cache
        const dbSettings = { ...(data.settings as unknown as Settings) }

        // ANTI-WIPE PROTECTION (RULE C12 & RULE AI-INTEG):
        // If local storage has a valid secret key, but the database row had an empty/missing string,
        // NEVER overwrite local token with blank! Instead, preserve local token and auto-repair DB!
        let needsDbRepair = false
        CRITICAL_SECRET_KEYS.forEach(secKey => {
          if (localSettings[secKey] && !dbSettings[secKey]) {
            console.log(`[useSettings] Preserved local ${secKey} against empty DB row; syncing back to cloud`)
            dbSettings[secKey] = localSettings[secKey]
            needsDbRepair = true
          }
        })

        const VALID_GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro']
        if (!dbSettings.gemini_model || !VALID_GEMINI_MODELS.includes(dbSettings.gemini_model)) {
          dbSettings.gemini_model = 'gemini-1.5-flash'
          writeLocal(currentUser.id, 'gemini_model', 'gemini-1.5-flash')
          needsDbRepair = true
        }
        if (
          !dbSettings.whatsapp_note || 
          dbSettings.whatsapp_note === 'Thank you for shopping with us!' || 
          isCorruptText(dbSettings.whatsapp_note) ||
          !dbSettings.whatsapp_note.includes('📱')
        ) {
          dbSettings.whatsapp_note = DEFAULT_WHATSAPP_NOTE
          needsDbRepair = true
        }
        if (
          !dbSettings.whatsapp_template || 
          dbSettings.whatsapp_template.includes('Dear {name}, your order has been booked.') || 
          isCorruptText(dbSettings.whatsapp_template) ||
          !dbSettings.whatsapp_template.includes('📦')
        ) {
          dbSettings.whatsapp_template = DEFAULT_WHATSAPP_TEMPLATE
          needsDbRepair = true
        }
        if (!dbSettings.whatsapp_template_booking || isCorruptText(dbSettings.whatsapp_template_booking) || !dbSettings.whatsapp_template_booking.includes('📦')) {
          dbSettings.whatsapp_template_booking = DEFAULT_MILESTONE_TEMPLATES.booking
          needsDbRepair = true
        }
        if (!dbSettings.whatsapp_template_out_for_delivery || isCorruptText(dbSettings.whatsapp_template_out_for_delivery) || !dbSettings.whatsapp_template_out_for_delivery.includes('🛵')) {
          dbSettings.whatsapp_template_out_for_delivery = DEFAULT_MILESTONE_TEMPLATES.out_for_delivery
          needsDbRepair = true
        }
        if (!dbSettings.whatsapp_template_action_required || isCorruptText(dbSettings.whatsapp_template_action_required) || !dbSettings.whatsapp_template_action_required.includes('⚠️')) {
          dbSettings.whatsapp_template_action_required = DEFAULT_MILESTONE_TEMPLATES.action_required
          needsDbRepair = true
        }
        if (!dbSettings.whatsapp_template_delivered || isCorruptText(dbSettings.whatsapp_template_delivered) || !dbSettings.whatsapp_template_delivered.includes('✅')) {
          dbSettings.whatsapp_template_delivered = DEFAULT_MILESTONE_TEMPLATES.delivered
          needsDbRepair = true
        }
        // Auto-heal legacy 'tv-' prefix to 'Ord-' in DB
        if (dbSettings.order_id_prefix === 'tv-' || !dbSettings.order_id_prefix) {
          dbSettings.order_id_prefix = 'Ord-'
          needsDbRepair = true
        }
        // Auto-switch to gemini if gemini key is provided but provider was left as groq
        if (dbSettings.gemini_api_key && !dbSettings.groq_api_key && (dbSettings.ai_provider === 'groq' || !dbSettings.ai_provider)) {
          dbSettings.ai_provider = 'gemini'
          needsDbRepair = true
        }
        // Auto-sync return address code with postex_return
        if (!dbSettings.postex_return && (dbSettings as any).return_address_code) {
          dbSettings.postex_return = (dbSettings as any).return_address_code
          needsDbRepair = true
        }
        // Auto-fetch and assign pickup address if PostEx token exists but pickup address is unassigned
        if (dbSettings.postex_token && !dbSettings.postex_pickup) {
          try {
            const addrRes = await getMerchantAddresses(dbSettings.postex_token)
            if (addrRes?.dist && Array.isArray(addrRes.dist) && addrRes.dist.length > 0) {
              dbSettings.postex_pickup = addrRes.dist[0].addressCode
              if (!dbSettings.postex_return) {
                dbSettings.postex_return = addrRes.dist[0].addressCode
              }
              needsDbRepair = true
            }
          } catch (e) {
            console.warn('[useSettings] Auto-fetch pickup address on load error:', e)
          }
        }

        const merged = { ...DEFAULTS, ...localSettings, ...dbSettings }
        
        // RULE D15: Enforce strict multi-tenant ownership on avatar_url
        if (merged.avatar_url && merged.avatar_url.includes('/avatars/')) {
          const match = merged.avatar_url.match(/\/avatars\/([a-f0-9-]+)\//i)
          if (match && match[1] && match[1].toLowerCase() !== currentUser.id.toLowerCase()) {
            console.warn(`[useSettings] Stripped cross-tenant avatar leak for ${currentUser.email}`)
            merged.avatar_url = ''
            writeLocal(currentUser.id, 'avatar_url', '')
            supabase.auth.updateUser({ data: { avatar_url: '' } }).catch(() => {})
          }
        }

        setSettings(merged)
        writeAllLocal(currentUser.id, merged)

        const now = new Date().toISOString()
        if (needsDbRepair) {
          try {
            await supabase
              .from('user_settings')
              .upsert({
                user_id: currentUser.id,
                settings: merged,
                updated_at: now
              }, { onConflict: 'user_id' })
            localStorage.setItem(userVersionKey(currentUser.id), now)
            console.log('[useSettings] Auto-healed settings and synced to Supabase DB')
          } catch (err) {
            console.error('[useSettings] Failed to save repaired settings to DB:', err)
          }
        } else if (data.updated_at) {
          localStorage.setItem(userVersionKey(currentUser.id), data.updated_at)
        }
      } else {
        // No DB record yet — pull existing local/vault settings and sync to DB
        setSettings(localSettings)
        const now = new Date().toISOString()
        try {
          await supabase.from('user_settings').upsert({
            user_id: currentUser.id,
            settings: localSettings,
            updated_at: now
          }, { onConflict: 'user_id' })
          localStorage.setItem(userVersionKey(currentUser.id), now)
        } catch (err) {
          console.error('[useSettings] Failed to create initial user_settings row in DB:', err)
        }
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
        if (v) (guestSettings as any)[k] = v
      })
      setSettings(guestSettings)
      return
    }

    loadDbSettings(user)

    const interval = setInterval(() => loadDbSettings(user), 60 * 1_000)
    return () => clearInterval(interval)
  }, [user, loadDbSettings])

  // ── Update a single field (or multiple fields) with direct awaited DB persistence ──
  const updateSetting = useCallback(async (key: keyof Settings | Partial<Settings>, value?: string): Promise<boolean> => {
    const uId = user?.id || 'guest'
    let updated: Settings

    if (typeof key === 'object') {
      updated = { ...settings, ...key }
      writeAllLocal(uId, updated)
    } else {
      const val = value ?? ''
      updated = { ...settings, [key]: val }
      writeLocal(uId, key, val)
    }

    setSettings(updated)

    if (user?.id) {
      // If avatar_url was modified, sync with Supabase Auth metadata for multi-device persistence
      const avatarTouch = typeof key === 'object' ? key.avatar_url : (key === 'avatar_url' ? value : undefined)
      if (avatarTouch !== undefined) {
        supabase.auth.updateUser({ data: { avatar_url: avatarTouch || '' } }).catch(e => {
          console.warn('[useSettings] Auth metadata avatar sync error:', e)
        })
      }

      try {
        const now = new Date().toISOString()
        // RULE D13: snake_case table + column
        const { error } = await supabase.from('user_settings').upsert({
          user_id: user.id,           // [OK] snake_case
          settings: updated,
          updated_at: now
        }, { onConflict: 'user_id' }) // [OK] snake_case

        if (error) {
          console.error('[updateSetting] Failed to persist to DB:', error)
          return false
        } else {
          localStorage.setItem(userVersionKey(user.id), now)
          return true
        }
      } catch (err) {
        console.error('[updateSetting] Network exception during DB upsert:', err)
        return false
      }
    }

    return true
  }, [user, settings])

  // ── Force-sync (e.g. bulk import from Settings page) ────────────────────
  async function forceSyncSettings(newSettings: Settings): Promise<boolean> {
    setSettings(newSettings)
    const uId = user?.id || 'guest'
    writeAllLocal(uId, newSettings)

    if (user?.id) {
      const now = new Date().toISOString()
      try {
        const { error } = await supabase.from('user_settings').upsert({
          user_id: user.id,             // [OK] snake_case
          settings: newSettings,
          updated_at: now
        }, { onConflict: 'user_id' })   // [OK] snake_case

        if (error) {
          console.error('[forceSyncSettings] DB error:', error)
          return false
        }
        localStorage.setItem(userVersionKey(user.id), now)
        return true
      } catch (err) {
        console.error('[forceSyncSettings] Exception:', err)
        return false
      }
    }
    return true
  }

  // ── Logout helper: wipe local cache so nothing bleeds to next user ───────
  // RULE C10: After logout, zero stale data remains in localStorage
  async function logout() {
    if (user) {
      clearLocalForUser(user.id)
      localStorage.removeItem(`booked_history_${user.id}`)
      localStorage.removeItem(`booking_results_${user.id}`)
      localStorage.removeItem(`booked_history_synced_at_${user.id}`)
      localStorage.removeItem(`postex_portal_synced_at_${user.id}`)
      clearCachedAvatar(user.id)
      if (user.email) clearCachedAvatar(user.email)
    }
    // Purge any legacy global keys to guarantee zero cross-tenant bleeding (RULE D15)
    localStorage.removeItem('zaynah_vault_avatar_url')
    localStorage.removeItem('zaynah_vault_postex_token')
    await supabase.auth.signOut()
    setSettings(DEFAULTS)
    setUser(null)
  }

  return {
    settings,
    updateSetting,
    user,
    isBlocked,
    loadingSettings: loading,
    initialAuthChecked,
    forceSyncSettings,
    logout,
  }
}
