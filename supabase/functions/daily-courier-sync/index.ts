// ==============================================================================
// 🚀 ZAYNAHS COURIER MANAGER — SERVERLESS DAILY COURIER HARVEST & RETENTION ENGINE
// Automatically fetches live customer contacts from PostEx V3 for all active merchants,
// saves unique contacts permanently in PostgreSQL (2-5+ years retention),
// and auto-prunes raw parcel tracking logs older than 90 days to keep DB ultra-fast.
// Can run completely hands-free via pg_cron, Supabase Scheduled Functions, or HTTP webhook.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
}

interface PostExOrder {
  orderRefNumber?: string
  trackingNumber?: string
  customerName?: string
  customerPhone?: string
  cityName?: string
  deliveryAddress?: string
  invoicePayment?: number | string
  orderAmount?: number | string
  orderDate?: string
  bookingDate?: string
  transactionDate?: string
  createdDatetime?: string
  modifiedDatetime?: string
}

function cleanDigits(phone?: string): string {
  if (!phone) return ''
  const p = phone.replace(/\D/g, '')
  if (p.startsWith('92')) return '0' + p.slice(2)
  return p
}

function isDemoOrInvalidPhone(phone?: string): boolean {
  if (!phone) return true
  const digits = cleanDigits(phone)
  if (digits.length < 10 || digits.length > 12) return true
  if (/^0+$/.test(digits)) return true
  if (digits.startsWith('03000000000')) return true
  if (digits === '03001234567' || digits === '03339876543' || digits === '03451234567') return true
  return false
}

function getIsoDate(raw?: string): string {
  if (!raw) return new Date().toISOString()
  try {
    const normalized = raw.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
    const dt = new Date(normalized)
    return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function formatDateYMD(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const startTime = Date.now()
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase server environment credentials." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  try {
    let customStartDate = ""
    let customEndDate = ""
    let retentionDays = 90

    if (req.method === "POST") {
      try {
        const body = await req.json()
        if (body.startDate) customStartDate = String(body.startDate)
        if (body.endDate) customEndDate = String(body.endDate)
        if (typeof body.retentionDays === "number") retentionDays = body.retentionDays
      } catch {
        // Fall back to automatic default window
      }
    }

    // Default window: last 3 days to catch every recent dispatched order
    const now = new Date()
    const d3Ago = new Date(now)
    d3Ago.setDate(d3Ago.getDate() - 3)

    const startDate = customStartDate || formatDateYMD(d3Ago)
    const endDate = customEndDate || formatDateYMD(now)

    // 1. Fetch all active merchants
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("id, email, status")
      .eq("status", "active")

    if (usersErr || !users) {
      throw new Error(`Failed to query users: ${usersErr?.message}`)
    }

    // 2. Fetch user_settings for tokens
    const { data: settingsList, error: settingsErr } = await supabase
      .from("user_settings")
      .select("user_id, settings")

    if (settingsErr) {
      throw new Error(`Failed to query user settings: ${settingsErr.message}`)
    }

    const settingsMap = new Map<string, any>()
    settingsList?.forEach(s => {
      let parsed = s.settings
      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed) } catch {}
      }
      settingsMap.set(s.user_id, parsed || {})
    })

    const results = []
    let totalHarvestedContacts = 0

    // 3. Process each merchant
    for (const user of users) {
      const s = settingsMap.get(user.id) || {}
      const postexToken = (
        s.postex_token ||
        s.settings?.postex_token ||
        s.postex_api_token ||
        s.api_token ||
        ""
      ).trim()

      if (!postexToken) {
        continue
      }

      const merchantUniqueContacts = new Map<string, any>()

      try {
        const postexUrl = `https://api.postex.pk/services/integration/api/order/v3/get-merchant-orders?startDate=${startDate}&endDate=${endDate}`
        const res = await fetch(postexUrl, {
          method: "GET",
          headers: {
            "token": postexToken,
            "Accept": "application/json"
          }
        })

        if (!res.ok) {
          results.push({
            merchant_id: user.id,
            email: user.email,
            status: "postex_api_error",
            http_status: res.status
          })
          continue
        }

        const data = await res.json()
        const orderList: PostExOrder[] = Array.isArray(data.dist) ? data.dist : []

        for (const order of orderList) {
          const rawPhone = (order.customerPhone || "").trim()
          if (isDemoOrInvalidPhone(rawPhone)) continue

          const cleanPhone = cleanDigits(rawPhone)
          const name = (order.customerName || "Valued Customer").trim()
          const city = (order.cityName || "").trim()
          const address = (order.deliveryAddress || "").trim()
          const rawDate = order.orderDate || order.bookingDate || order.transactionDate || order.createdDatetime || order.modifiedDatetime
          const isoDate = getIsoDate(rawDate)
          const amount = Number(order.invoicePayment || order.orderAmount || 0) || 0

          if (!merchantUniqueContacts.has(cleanPhone)) {
            merchantUniqueContacts.set(cleanPhone, {
              user_id: user.id,
              phone: cleanPhone,
              name: name,
              city: city,
              address: address,
              source: "postex_portal",
              created_at: isoDate,
              updated_at: new Date().toISOString(),
              total_orders: 1,
              total_spend: amount
            })
          } else {
            const existing = merchantUniqueContacts.get(cleanPhone)
            existing.total_orders += 1
            existing.total_spend += amount
            if (!existing.city && city) existing.city = city
            if (!existing.address && address) existing.address = address
          }
        }

        const upsertBatch = Array.from(merchantUniqueContacts.values())
        if (upsertBatch.length > 0) {
          const BATCH_SIZE = 100
          for (let i = 0; i < upsertBatch.length; i += BATCH_SIZE) {
            const chunk = upsertBatch.slice(i, i + BATCH_SIZE)
            const { error: upsertErr } = await supabase
              .from("customers")
              .upsert(chunk, {
                onConflict: "user_id,phone",
                ignoreDuplicates: false
              })

            if (upsertErr) {
              console.error(`Failed to upsert chunk for ${user.email}:`, upsertErr)
            }
          }
          totalHarvestedContacts += upsertBatch.length
        }

        results.push({
          merchant_id: user.id,
          email: user.email,
          status: "success",
          orders_scanned: orderList.length,
          contacts_upserted: upsertBatch.length
        })

      } catch (merchantErr: any) {
        results.push({
          merchant_id: user.id,
          email: user.email,
          status: "error",
          error: merchantErr.message
        })
      }
    }

    // 4. Run 90-day parcel history auto-pruning to keep booked_history lightweight
    let pruneResult: any = null
    try {
      const { data: pruneData, error: pruneErr } = await supabase.rpc(
        "purge_old_booked_parcels",
        { retention_days: retentionDays }
      )
      pruneResult = pruneErr ? { error: pruneErr.message } : pruneData
    } catch (e: any) {
      pruneResult = { error: e.message }
    }

    // 5. Audit log
    await supabase.from("usage_logs").insert({
      user_id: users[0]?.id || "00000000-0000-0000-0000-000000000000",
      action: "daily_serverless_sync_completed",
      details: `Daily automated courier sync executed in ${Date.now() - startTime}ms. Range: ${startDate} to ${endDate}. Contacts harvested: ${totalHarvestedContacts}. Merchants: ${results.length}.`
    })

    return new Response(
      JSON.stringify({
        success: true,
        execution_time_ms: Date.now() - startTime,
        window: { startDate, endDate },
        total_contacts_harvested: totalHarvestedContacts,
        merchants_processed: results.length,
        retention_pruning: pruneResult,
        merchants: results
      }, null, 2),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Unknown error during daily courier sync"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
