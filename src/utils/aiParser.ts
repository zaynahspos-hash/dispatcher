import axios from 'axios'
import { normalizeCityName, detectCityFromAddress, CITY_LIST } from './cityList'

export interface Parcel {
  id: string
  name: string
  phone: string
  city: string
  address: string
  total: number
  items: number
  weight: number
  orderType: string
  airwayBillCopy: number
  detail: string
  note: string
  whatsapp_sent?: boolean
  whatsappSent?: boolean
  isDefaultId?: boolean
  isDefaultItems?: boolean
}

export interface Settings {
  groq_api_key: string
  groq_model?: string
  postex_token: string
  postex_pickup: string
  postex_return: string
  default_weight: string
  default_items: string
  default_product: string
  default_note: string
  postex_type?: string
  postex_handling?: string
  postex_product_check?: string
  postex_sku_check?: string
  postex_weight_check?: string
  postex_pieces_check?: string
  postex_cod_check?: string
  postex_notes_check?: string
  postex_return_city?: string
  postex_pickup_address?: string
  postex_return_address?: string
  ai_provider?: string
  openai_api_key?: string
  openai_model?: string
  openrouter_api_key?: string
  openrouter_model?: string
  gemini_api_key?: string
  gemini_model?: string
  anthropic_api_key?: string
  anthropic_model?: string
  deepseek_api_key?: string
  deepseek_model?: string
  kimi_api_key?: string
  kimi_model?: string
  mistral_api_key?: string
  mistral_model?: string
  whatsapp_template?: string
  whatsapp_note?: string
  avatar_url?: string
  return_address_code?: string
  ai_model?: string
  default_order_type?: string
  order_id_prefix?: string
  order_id_next_num?: string
  whatsapp_enable_booking_alert?: boolean
  whatsapp_enable_out_for_delivery_alert?: boolean
  whatsapp_enable_action_required_alert?: boolean
  whatsapp_enable_delivered_alert?: boolean
  whatsapp_template_booking?: string
  whatsapp_template_out_for_delivery?: string
  whatsapp_template_action_required?: string
  whatsapp_template_delivered?: string
  whatsapp_template_greeting?: string
  whatsapp_greeting_variants?: string[]
  whatsapp_booking_variants?: string[]
  whatsapp_status_variants?: string[]
  whatsapp_antiban_delay_sec?: number
  whatsapp_min_delay_sec?: number
  whatsapp_max_delay_sec?: number
  whatsapp_client_target?: 'auto' | 'web' | 'app'
  postex_token_updated_at?: string
  gemini_key_updated_at?: string
  groq_key_updated_at?: string
  api_history?: ApiHistoryItem[]
}

export interface ApiHistoryItem {
  id: string
  provider: 'postex' | 'gemini' | 'groq' | 'openrouter' | 'openai' | 'deepseek' | 'anthropic' | 'mistral' | 'other'
  key_label: string
  api_key: string
  action: 'replaced' | 'removed' | 'in_use'
  old_model?: string
  replaced_at: string
}


export interface ParseResult {
  parcels: Parcel[]
  tokensUsed: number
  nextSerialNum?: number
}

export async function parseParcelText(
  rawText: string,
  settings: Settings,
  existingIds?: Set<string>
): Promise<ParseResult> {
  const selectedProvider = settings.ai_provider || 'groq'
  const providersOrder = ['groq', 'openai', 'openrouter', 'gemini', 'anthropic', 'deepseek', 'kimi', 'mistral']
  // Reorder so that the user's selectedProvider is tried first
  const orderedProviders = [
    selectedProvider,
    ...providersOrder.filter(p => p !== selectedProvider)
  ]

  let lastError: any = null
  let attemptedAny = false

  for (const provider of orderedProviders) {
    const providerMap: Record<string, { key?: string; model?: string; defaultModel: string }> = {
      groq: { key: settings.groq_api_key, model: settings.groq_model, defaultModel: 'llama-3.1-8b-instant' },
      openrouter: { key: settings.openrouter_api_key, model: settings.openrouter_model, defaultModel: 'meta-llama/llama-3.1-8b-instruct:free' },
      gemini: { key: settings.gemini_api_key, model: settings.gemini_model, defaultModel: 'gemini-3.5-flash' },
      openai: { key: settings.openai_api_key, model: settings.openai_model, defaultModel: 'gpt-4o-mini' },
      anthropic: { key: settings.anthropic_api_key, model: settings.anthropic_model, defaultModel: 'claude-3-haiku-20240307' },
      deepseek: { key: settings.deepseek_api_key, model: settings.deepseek_model, defaultModel: 'deepseek-chat' },
      kimi: { key: settings.kimi_api_key, model: settings.kimi_model, defaultModel: 'moonshot-v1-8k' },
      mistral: { key: settings.mistral_api_key, model: settings.mistral_model, defaultModel: 'ministral-3b-2512' }
    }
    const cfg = providerMap[provider]
    if (!cfg || !cfg.key) continue

    const apiKeyString = cfg.key
    let model = cfg.model || cfg.defaultModel
    if (provider === 'gemini') {
      const VALID_GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash']
      if (!model || !VALID_GEMINI_MODELS.includes(model)) {
        model = 'gemini-3.5-flash'
      }
    }

    const keys = apiKeyString
      .split(/[\n,]+/)
      .map(k => k.trim())
      .filter(k => k.length > 0)

    if (keys.length === 0) continue

    attemptedAny = true

    // Get index for this provider's keys
    const storageKey = `${provider}_api_key_index`
    const storedIndexStr = localStorage.getItem(storageKey)
    let startIndex = parseInt(storedIndexStr || '0', 10)
    if (isNaN(startIndex) || startIndex >= keys.length) {
      startIndex = 0
    }

    const citiesListText = CITY_LIST.join(', ')
    const systemPrompt = `
You are the world's most advanced autonomous Pakistani courier logistics data formatting & geographic intelligence engine for PostEx, Trax, Leopards, and TCS operations.
Extract and clean ALL parcels from the text below and return a valid JSON array matching the exact system schema.
NO CONVERSATIONAL SUMMARY AT THE END. Output ONLY a pure valid JSON array.

APPROVED COURIER CITIES (REFERENCE LIST):
${citiesListText}

CRITICAL FORMATTING & GEOGRAPHIC RULES:

1. RECIPIENT NAME:
   - Extract the TRUE PERSON's name, properly capitalized: 'usman malik' -> 'Usman Malik', 'm imran' -> 'M Imran', 'balil' -> 'Balil', 'rukhshana faqir' -> 'Rukhshana Faqir', 'asad' -> 'Asad'.
   - NEVER confuse a landmark, medical store, electronic shop, hostel, or street with a recipient's name:
     * 'Mehr Al Shifa Medical Hall', 'Yaqoob Electronics', 'New satellite Boys hostal', 'Gulshan Market' are ADDRESS / SHOP LANDMARKS, NOT the customer's name!
     * When a shop name or landmark is written on line 1, look for the actual human person's name on other lines ('Balil', 'M Imran', 'Asad')!
   - Support inline labels:
     * 'Name rukhshana faqir address Ali Abad hunzia connect number 03555184939 tcs p bjo na sir' -> Name is 'Rukhshana Faqir', Address is 'Ali Abad, Hunza', Note is 'TCS p bjo na sir'.
   - NEVER confuse recipient names with cities (e.g. 'Ali' is NOT 'Alipur', 'Hassan' is NOT 'Hasan Abdal').

2. ORDER DELIMITERS & SEPARATION:
   - Orders can be separated by a dot on a line by itself ('.'), dashes ('---'), asterisks ('***'), or multiple newlines.
   - Extract ALL distinct parcels. DO NOT merge separate orders into one!
   - If trailing merchant notes, passwords, or emails appear at the bottom (e.g., 'Mytvpass@.371@m2', 'Shoaibzaynah@gmail.com'), IGNORE them completely — DO NOT include them in any parcel address.

3. PHONE NUMBER:
   - Format: 03XXXXXXXXX (11 digits, starting with 03).
   - Normalize: '+92 300 4455667', '0300-4455667', '923004455667' -> '03004455667'.
   - If multiple phone numbers are provided in an order (e.g. landline '05822-445812' and mobile '03129036969'):
     * Put the mobile 03xx in 'phone'.
     * Append the secondary/landline number to 'address': '(Phone: 05822-445812)'.

4. ORDER ID / REFERENCE:
   - If explicitly given (e.g. 'Id wa1025', 'Id wa 1026', 'Id wa1024', '#1024', 'ORD-99'), extract as 'id' in uppercase without spaces (e.g. 'WA1025', 'WA1026', 'WA1024'). If not given, return "" (empty string).

5. ITEMS / PIECES COUNT:
   - Match 'Pc2', 'Pc 2', 'Pc3', '2 pcs', '3 items', '4 suit', 'qty 2' -> extract as integer number (e.g. 2, 3).
   - If missing in text, return null.

6. CITY DETECTION, GEO-RESEARCH & VALIDATION:
   - Cross-reference and match against the APPROVED COURIER CITIES list above.
   - Auto-correct misspellings and abbreviations (e.g. 'Lahor' -> 'LAHORE', 'Karach' -> 'KARACHI', 'Fsd' -> 'FAISALABAD', 'Isb' -> 'ISLAMABAD', 'Rwp' -> 'RAWALPINDI', 'Mul' -> 'MULTAN', 'Skt' -> 'SIALKOT', 'Grw' -> 'GUJRANWALA', 'Psh' -> 'PESHAWAR', 'Qta' -> 'QUETTA').
   - 'Ali Abad hunzia' -> 'HUNZA–NAGAR'
   - 'Muzaffarabad Azad Kashmir' -> 'MUZAFFARABAD (AJK)'
   - 'HassanaAbbad' -> 'HASAN ABDAL'
   - 'Rawalpindi' -> 'RAWALPINDI'
   - 'Gojra' / 'go jera' -> 'GOJRA'
   - Output 'city' in standard uppercase English matching approved list (e.g. 'LAHORE', 'MIRPUR (AJK)', 'HUNZA–NAGAR', 'GOJRA', 'MUZAFFARABAD (AJK)').

7. ADDRESS FORMATTING:
   - If address is in Urdu or mixed script, convert to Roman Urdu.
   - City name must always be at the end of the address.
   - For location words, use English ('near', 'opposite', 'beside', 'behind', 'in front of').

8. TOTAL / COD AMOUNT:
   - Extract cash amount as integer number only (no 'Rs.' prefix).
   - If value is missing -> set 0.
   - If payment is Advance / Already Paid / Bank Transfer / Non-COD / Easypaisa / Jazzcash -> set 0.

9. ORDER TYPE (RETURN / REPLACEMENT / CHANGING):
   - If keywords appear: Return, Replacement, Replacing, Exchange, Changing, Change, Reverse, Wrong Item -> 'Replacement'.
   - Otherwise set 'orderType': 'Normal'.

10. PRODUCT DETAILS & NOTE:
   - Detail: ALWAYS use merchant's preset "${settings.default_product || 'Kids Clothes'}".
   - Note: Customer delivery remark (e.g. 'TCS p bjo na sir', 'Call before delivery'). If none, use "${settings.default_note || 'Call before delivery'}".
   - Weight: ${settings.default_weight || 0.5}.
   - AirwayBillCopy: 1.

Return ONLY a valid JSON array. Zero markdown fences outside, NO conversational summary at the end.
Format:
[
  {
    "id": "WA1025",
    "name": "Rukhshana Faqir",
    "phone": "03555184939",
    "city": "HUNZA–NAGAR",
    "address": "Ali Abad hunzia",
    "total": 3800,
    "items": 2,
    "weight": 0.5,
    "orderType": "Normal",
    "airwayBillCopy": 1,
    "detail": "${settings.default_product || 'Kids Clothes'}",
    "note": "TCS p bjo na sir"
  }
]
`

    let attempt = 0
    let currentKeyIndex = startIndex
    let success = false
    let resultPayload: any = null

    // Helper: wait ms
    const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

    while (attempt < keys.length * 3 && !success) {
      const apiKey = keys[currentKeyIndex]
      console.log(`Trying ${provider.toUpperCase()} API (key ${currentKeyIndex + 1}/${keys.length})`)

      try {
        let content = ''
        let tokensUsed = 0

        if (provider === 'gemini') {
          let currentModel = model
          const VALID_GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash']
          if (!currentModel || !VALID_GEMINI_MODELS.includes(currentModel)) {
            currentModel = 'gemini-3.5-flash'
          }

          let res: any
          try {
            // Attempt with Google Search Grounding for live research of rural villages & small places
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`
            res = await axios.post(url, {
              contents: [{
                role: 'user',
                parts: [{ text: `WhatsApp Raw Messages to Parse into Parcels:\n\n${rawText}` }]
              }],
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              },
              tools: [{
                googleSearch: {}
              }]
            })
          } catch (groundingErr: any) {
            console.warn(`[Gemini Grounding] Fallback to direct model:`, groundingErr?.message)
            try {
              const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`
              res = await axios.post(fallbackUrl, {
                contents: [{
                  role: 'user',
                  parts: [{ text: `WhatsApp Raw Messages to Parse into Parcels:\n\n${rawText}` }]
                }],
                systemInstruction: {
                  parts: [{ text: systemPrompt }]
                },
                generationConfig: {
                  responseMimeType: "application/json"
                }
              })
            } catch (modelErr: any) {
              currentModel = (currentModel === 'gemini-3.5-flash') ? 'gemini-3.5-flash-lite' : 'gemini-3.8-flash'
              const fallbackUrl2 = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`
              res = await axios.post(fallbackUrl2, {
                contents: [{
                  role: 'user',
                  parts: [{ text: `WhatsApp Raw Messages to Parse into Parcels:\n\n${rawText}` }]
                }],
                systemInstruction: {
                  parts: [{ text: systemPrompt }]
                },
                generationConfig: {
                  responseMimeType: "application/json"
                }
              })
            }
          }

          // Strip internal thoughts (Section 1.6 in guide)
          const parts = res.data?.candidates?.[0]?.content?.parts || []
          const nonThought = parts.filter((p: any) => !p.thought)
          content = (nonThought.length > 0 ? nonThought : parts).map((p: any) => p.text || '').join('').trim()

          if (!content) {
            throw new Error(JSON.stringify(res.data))
          }

          if (res.data?.usageMetadata?.totalTokenCount) {
            tokensUsed = res.data.usageMetadata.totalTokenCount
          }
        }
        else if (provider === 'anthropic') {
          const url = 'https://api.anthropic.com/v1/messages'
          const res = await axios.post(url, {
            model: model,
            max_tokens: 4000,
            system: systemPrompt,
            messages: [{ role: 'user', content: rawText }]
          }, {
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
              'dangerouslyAllowBrowser': 'true'
            }
          })
          if (res.data?.content?.[0]?.text) {
            content = res.data.content[0].text
            if (res.data?.usage) {
              tokensUsed = (res.data.usage.input_tokens || 0) + (res.data.usage.output_tokens || 0)
            }
          } else {
            throw new Error(JSON.stringify(res.data))
          }
        }
        else {
          let url = ''
          const headers: any = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }

          if (provider === 'groq') {
            url = 'https://api.groq.com/openai/v1/chat/completions'
          } else if (provider === 'openrouter') {
            url = 'https://openrouter.ai/api/v1/chat/completions'
            headers['HTTP-Referer'] = window.location.origin
            headers['X-Title'] = 'WhatsApp Parcel Booker'
          } else if (provider === 'openai') {
            url = 'https://api.openai.com/v1/chat/completions'
          } else if (provider === 'deepseek') {
            url = 'https://api.deepseek.com/chat/completions'
          } else if (provider === 'kimi') {
            url = 'https://api.moonshot.cn/v1/chat/completions'
          } else if (provider === 'mistral') {
            url = 'https://api.mistral.ai/v1/chat/completions'
          }

          const res = await axios.post(url, {
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: rawText }
            ],
            temperature: 0.1,
            max_tokens: 4000,
            ...(provider === 'deepseek' ? { enable_thinking: false } : {})
          }, { headers })

          if (res.data?.choices?.[0]?.message?.content) {
            content = res.data.choices[0].message.content
            if (res.data?.usage?.total_tokens) {
              tokensUsed = res.data.usage.total_tokens
            }
          } else {
            throw new Error(JSON.stringify(res.data))
          }
        }

        // Robust JSON extraction:
        // 1. Strip <think>...</think> reasoning blocks (DeepSeek, QwQ, etc)
        // 2. Strip markdown code fences
        // 3. Slice from first '[' to last ']'
        let cleaned = content
          .replace(/<think>[\s\S]*?<\/think>/gi, '')
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim()
        const startIdx = cleaned.indexOf('[')
        const endIdx = cleaned.lastIndexOf(']')
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          cleaned = cleaned.substring(startIdx, endIdx + 1)
        }
        const parsed = JSON.parse(cleaned)
        const rawList = Array.isArray(parsed) ? parsed : [parsed]
        const prefix = settings.order_id_prefix !== undefined ? settings.order_id_prefix : 'Ord-'
        let currentNum = parseInt(settings.order_id_next_num || '1001', 10)
        if (isNaN(currentNum)) currentNum = 1001

        const usedSerials = new Set<string>()
        if (existingIds) {
          existingIds.forEach(id => usedSerials.add(String(id || '').trim().toLowerCase()))
        }

        const normalizedList: Parcel[] = rawList.map((p: any) => {
          let orderId = p.id ? String(p.id).trim() : ''
          let isDefaultId = false
          // If no order ID was given in text, or old fallback hallucinated "ord1", "ord2":
          if (!orderId || (prefix.toLowerCase() !== 'ord' && /^ord\d+$/i.test(orderId))) {
            let candidate = `${prefix}${currentNum}`
            while (usedSerials.has(candidate.toLowerCase())) {
              currentNum++
              candidate = `${prefix}${currentNum}`
            }
            orderId = candidate
            usedSerials.add(orderId.toLowerCase())
            currentNum++
            isDefaultId = true
          } else {
            usedSerials.add(orderId.toLowerCase())
            isDefaultId = false
          }

          let cleanPhone = String(p.phone || '').trim().replace(/[\s-+]/g, '')
          if (cleanPhone.startsWith('923')) cleanPhone = '0' + cleanPhone.substring(2)
          if (cleanPhone.startsWith('00923')) cleanPhone = '0' + cleanPhone.substring(4)

          const hasExplicitItems = p.items !== undefined && p.items !== null && p.items !== '' && Number(p.items) > 0
          const itemsVal = hasExplicitItems ? Number(p.items) : Number(settings.default_items || 1)
          const isDefaultItems = !hasExplicitItems

          const cleanName = String(p.name || '').trim()
          const cleanAddress = String(p.address || '').trim()

          // Deep City Normalization & Geographic Safeguard
          let resolvedCity = normalizeCityName(p.city, cleanAddress)
          const nameUp = cleanName.toUpperCase()
          // Anti-name-collision safeguard (e.g. name "Ali" confused as "Alipur")
          if (resolvedCity === 'ALIPUR' && (nameUp === 'ALI' || nameUp.startsWith('ALI '))) {
            resolvedCity = detectCityFromAddress(cleanAddress) || 'LAHORE'
          }
          if (!resolvedCity || resolvedCity === 'RECIPIENT') {
            resolvedCity = detectCityFromAddress(cleanAddress) || 'LAHORE'
          }

          return {
            id: orderId,
            name: cleanName,
            phone: cleanPhone,
            city: resolvedCity,
            address: cleanAddress,
            total: Number(p.total || 0),
            items: itemsVal,
            weight: Number(p.weight || settings.default_weight || 0.5),
            orderType: p.orderType || 'Normal',
            airwayBillCopy: Number(p.airwayBillCopy || 1),
            detail: String(settings.default_product || 'Kids Clothes').trim(),
            note: String(p.note || settings.default_note || 'Call before delivery'),
            isDefaultId,
            isDefaultItems
          }
        })

        resultPayload = {
          parcels: normalizedList,
          tokensUsed,
          nextSerialNum: currentNum
        }
        success = true

        // Keep this key active since it worked!
        localStorage.setItem(storageKey, String(currentKeyIndex))

      } catch (err: any) {
        const status = err?.response?.status
        const errorMsgDetail = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || err
        console.warn(`[Rate/Error] ${provider.toUpperCase()} key ${currentKeyIndex} HTTP ${status}:`, errorMsgDetail)
        lastError = err

        if (status === 429) {
          // Rate limit — wait with exponential backoff only if 1 key OR tried all keys once
          if (keys.length === 1 || attempt >= keys.length) {
            const retryAfter = parseInt(err?.response?.headers?.['retry-after'] || '0', 10)
            const waitMs = retryAfter > 0 ? retryAfter * 1000 : Math.min(5000 * Math.pow(2, Math.floor(attempt / keys.length)), 30000)
            console.log(`[Rate Limit] ${provider.toUpperCase()} — waiting ${waitMs / 1000}s before retry...`)
            await wait(waitMs)
          }
          // Rotate to next key to utilize other keys
          currentKeyIndex = (currentKeyIndex + 1) % keys.length
          localStorage.setItem(storageKey, String(currentKeyIndex))
          attempt++
        } else {
          // Hard error — rotate to next key
          currentKeyIndex = (currentKeyIndex + 1) % keys.length
          localStorage.setItem(storageKey, String(currentKeyIndex))
          attempt += keys.length
        }
      }
    }

    if (success && resultPayload) {
      return resultPayload
    }
  }

  if (!attemptedAny) {
    throw new Error(`No API keys configured for ${selectedProvider.toUpperCase()} or fallback providers. Please check Settings.`)
  }

  const errorMsg = lastError?.response?.data?.error?.message || lastError?.response?.data?.message || lastError?.message || 'All APIs failed'
  throw new Error(`All configured AI APIs failed. Last error: ${errorMsg}`)
}

/**
 * Single Source of Truth for splitting unstructured raw text into distinct order blocks.
 * Safely handles:
 * 1. Double/multiple blank lines (\n\s*\n+) used in WhatsApp/SMS chats.
 * 2. Explicit numbered lists (1. ... 2. ... or Order 1 ... Order 2).
 * 3. Dense unseparated multi-order text with multiple phone numbers, splitting cleanly at \n li/**
 * Single Source of Truth for splitting unstructured raw text into distinct order blocks.
 * Safely handles:
 * 1. Explicit symbol delimiters on a line by themselves ('.', '---', '***', '===', '___', '•••').
 * 2. Numbered lists (1. ... 2. ... or Order 1: ... Order 2: ...).
 * 3. Double blank lines (\n\s*\n+), while smartly preserving multi-line orders whose address
 *    is followed by empty lines before the phone/name.
 * 4. Strips trailing merchant credentials, passwords, or emails from order blocks.
 */
export function splitRawTextIntoOrderBlocks(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return []

  const clean = rawText.trim()

  // 1. Check for explicit separator lines (e.g. '.', '---', '***', '===', '___')
  const sepRegex = /(?:^|\r?\n)\s*[\.\*\-\_\=\#\•\~]{1,15}\s*(?:\r?\n|$)/
  const explicitCandidates = clean.split(sepRegex)
    .map(b => b.trim())
    .filter(b => b.length > 0 && !/^[\.\*\-\_\=\#\•\~]+$/.test(b))

  if (explicitCandidates.length > 1) {
    const filteredBlocks: string[] = []
    for (let i = 0; i < explicitCandidates.length; i++) {
      const b = explicitCandidates[i]
      const isTrailingNoise = (i === explicitCandidates.length - 1) &&
        !/(?:03\d{2}|923\d{2}|rs\.?|cod|amount|total|wa\d+|ord|pc\d+)/i.test(b) &&
        /(?:password|pass|email|@|\.com)/i.test(b)
      if (isTrailingNoise) continue
      filteredBlocks.push(b)
    }
    if (filteredBlocks.length > 1) {
      return filteredBlocks
    }
  }

  // 2. Check for numbered list markers (1. ... 2. ... or Order 1: ... Order 2: ...)
  const numberedSplit = clean.split(/(?:^|\r?\n)(?=\s*(?:\d+[\.\)]\s+|Order\s*#?\d+[:\s\.-]|Parcel\s*#?\d+[:\s\.-]))/i)
    .map(b => b.trim())
    .filter(b => b.length > 0)

  if (numberedSplit.length > 1) {
    return numberedSplit
  }

  // 3. Check for blank lines, consolidating orphaned fragments (e.g., address with empty line before phone)
  const paragraphBlocks = clean
    .split(/\r?\n\s*\r?\n+/)
    .map(b => b.trim())
    .filter(b => b.length > 0 && !/^[\.\*\-\_\=\#\•\~]+$/.test(b))

  if (paragraphBlocks.length > 1) {
    const consolidated: string[] = []
    for (const b of paragraphBlocks) {
      const hasPhone = /(?:(?:\+92|0092|92)[\s-]?3\d{2}[\s-]?\d{7}|03\d{2}[\s-]?\d{7}|3\d{2}[\s-]?\d{7}|0\d{2,4}[\s-]?\d{6,7})/.test(b)
      const hasAmount = /(?:rs\.?|cod|total|amount|روپے|وصول)\s*[:\-]?\s*\d+/i.test(b)
      const hasOrderId = /(?:wa\s*\d+|ord\s*\d+|order\s*#?\d+)/i.test(b)

      // If this block has no phone, no amount, and no orderId, it is an address/name fragment of the order
      if (consolidated.length > 0 && !hasPhone && !hasAmount && !hasOrderId) {
        consolidated[consolidated.length - 1] += '\n' + b
      } else if (consolidated.length > 0 && !hasPhone && consolidated[consolidated.length - 1].length < 80) {
        consolidated[consolidated.length - 1] += '\n' + b
      } else {
        consolidated.push(b)
      }
    }
    if (consolidated.length > 1) {
      return consolidated
    }
  }

  return [clean]
}

/**
 * Zero-Loss Algorithmic Fallback Parser:
 * High-accuracy Pakistani logistics engine extracting phone numbers, recipient names,
 * COD amounts, IDs, items, and normalized cities so data is NEVER lost or scrambled.
 */
export function parseTextFallback(
  rawText: string,
  settings: Settings,
  existingIds?: Set<string>
): ParseResult {
  const blocks = splitRawTextIntoOrderBlocks(rawText)

  const prefix = settings.order_id_prefix !== undefined ? settings.order_id_prefix : 'Ord-'
  let currentNum = parseInt(settings.order_id_next_num || '1001', 10)
  if (isNaN(currentNum)) currentNum = 1001

  const usedSerials = new Set<string>()
  if (existingIds) {
    existingIds.forEach(id => usedSerials.add(String(id || '').trim().toLowerCase()))
  }

  const parcels: Parcel[] = []

  for (const block of blocks) {
    // Filter out trailing noise lines like merchant passwords, emails, etc.
    const rawLines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    if (rawLines.length === 0) continue

    const lines: string[] = []
    for (const l of rawLines) {
      if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(l)) continue
      if (/(?:mytvpass|password\s*[:\-=]|pass\s*[:\-=])/i.test(l)) continue
      lines.push(l)
    }

    // 1. Phone extraction (primary mobile 03xx + landline preservation)
    let phone = ''
    let secondaryPhone = ''
    const phoneRegex = /(?:(?:\+92|0092|92)[\s-]?3\d{2}[\s-]?\d{7}|03\d{2}[\s-]?\d{7}|3\d{2}[\s-]?\d{7}|058\d{2}[\s-]?\d{6,7}|0\d{2,4}[\s-]?\d{6,7})/g
    const allPhones: string[] = []
    let pm: RegExpExecArray | null
    while ((pm = phoneRegex.exec(block)) !== null) {
      allPhones.push(pm[0])
    }

    const mobilePhone = allPhones.find(p => /(?:03|3\d{2}|923)/.test(p))
    const altPhone = allPhones.find(p => p !== mobilePhone)

    if (mobilePhone) {
      phone = mobilePhone.replace(/[\s-+]/g, '')
      if (phone.startsWith('92')) phone = '0' + phone.substring(2)
      if (phone.startsWith('0092')) phone = '0' + phone.substring(4)
      if (phone.length === 10 && phone.startsWith('3')) phone = '0' + phone
    } else if (allPhones.length > 0) {
      phone = allPhones[0].replace(/[\s-+]/g, '')
    }
    if (altPhone) {
      secondaryPhone = altPhone.trim()
    }

    // 2. COD / Total extraction
    let total = 0
    const codMatch = block.match(/(?:rs\.?|amount|cod|total|cash|price)[\s:]*([0-9,]+)/i)
    if (codMatch) {
      total = Number(codMatch[1].replace(/,/g, '')) || 0
    } else {
      const numMatches = block.match(/\b\d{3,5}\b/g)
      if (numMatches) {
        for (const num of numMatches) {
          const n = Number(num)
          if (n >= 150 && n <= 50000 && (!phone || num !== phone.slice(-4))) {
            total = n
            break
          }
        }
      }
    }

    // 3. Pieces / Items count
    let explicitItems: number | null = null
    const pcMatch = block.match(/\b(?:pc|pcs|pieces?|qty|quantity|items?|suits?|jore?|jori?)\s*[:#\-]?\s*(\d+)\b/i) ||
                    block.match(/\b(\d+)\s*(?:pc|pcs|pieces?|qty|quantity|items?|suits?|jore?|jori?)\b/i)
    if (pcMatch && pcMatch[1]) {
      const parsedItems = parseInt(pcMatch[1], 10)
      if (parsedItems > 0 && parsedItems <= 100) {
        explicitItems = parsedItems
      }
    }
    const itemsVal = explicitItems !== null ? explicitItems : Number(settings.default_items || 1)
    const isDefaultItems = explicitItems === null

    // 4. Order ID extraction
    let explicitId = ''
    const idMatch = block.match(/\b(?:order\s*(?:id|no|#|num)?|ref\s*(?:id|no|#|num)?|inv\s*(?:id|no|#|num)?|\bid)\s*[:#\-]?\s*([A-Za-z0-9\-]+(?:\s*\d+)?)\b/i) ||
                    block.match(/\b(wa\s*\d+|ord\s*\d+|ref\s*\d+)\b/i)
    if (idMatch && idMatch[1] && !/^(name|phone|city|address|amount|cod|total|rs|pc)$/i.test(idMatch[1].trim())) {
      explicitId = idMatch[1].replace(/\s+/g, '').toUpperCase().trim()
    }

    let orderId = ''
    let isDefaultId = false
    if (explicitId) {
      orderId = explicitId
      usedSerials.add(orderId.toLowerCase())
      isDefaultId = false
    } else {
      let candidate = `${prefix}${currentNum}`
      while (usedSerials.has(candidate.toLowerCase())) {
        currentNum++
        candidate = `${prefix}${currentNum}`
      }
      orderId = candidate
      usedSerials.add(orderId.toLowerCase())
      currentNum++
      isDefaultId = true
    }

    // 5. Special Instruction / Courier Note
    let note = settings.default_note || 'Call before delivery'
    const noteMatch = block.match(/(?:tcs\s+p\s+bjo\s+na\s+sir|tcs\s+se\s+bhejo|leopards\s+se|postex\s+se|call\s+before\s+delivery|urgent|call\s+karna|delivery\s+se\s+pehle\s+call)/i)
    if (noteMatch) {
      note = noteMatch[0].trim()
    }

    // 6. Name extraction (never confuse with shops/landmarks/medical halls)
    let name = ''
    // Pattern A: Inline label 'Name rukhshana faqir address...' or 'Name: ...'
    const inlineNameMatch = block.match(/(?:^|\n|\s)name\s*[:\-]?\s*([A-Za-z\s\.]+?)(?=\s+(?:address|addr|pata|phone|contact|connect|mobile|num|no|city|tcs|call|rs|cod|id|wa|pc)\b|$)/i)
    if (inlineNameMatch && inlineNameMatch[1].trim().length > 1) {
      name = inlineNameMatch[1].trim()
    }

    if (!name) {
      // Labeled line: 'Name: ...'
      const nameLine = lines.find(l => /^name\s*[:\-]?\s*[A-Za-z]/i.test(l))
      if (nameLine) {
        name = nameLine.replace(/^name\s*[:\-]?\s*/i, '').trim()
      }
    }

    if (!name) {
      // Scan candidate lines: 1 to 4 words that do NOT contain landmark/shop/address words or labels
      const nonNameWords = /(?:medical\s+hall|electronics|hostal|hostel|hospital|bazar|market|plaza|road|street|galli|house|flat|chowk|near|nazdeek|adha|bangla|tahseel|tehsil|zila|city|phone|connect|contact|id\s+|pc\s*\d+|rs\.?|cod|amount|total)/i
      for (const l of lines) {
        if (nonNameWords.test(l)) continue
        if (/\d{4,}/.test(l)) continue
        const words = l.split(/\s+/).filter(Boolean)
        if (words.length >= 1 && words.length <= 4) {
          name = l.trim()
          break
        }
      }
    }

    if (!name) name = 'Recipient'
    name = name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).trim()

    // 7. Address extraction
    let address = ''
    const inlineAddrMatch = block.match(/(?:^|\n|\s)address\s*[:\-]?\s*(.+?)(?=\s+(?:connect|contact|phone|mobile|num|no|tcs|call|rs|cod|id|wa|pc)\b|$)/i)
    if (inlineAddrMatch) {
      address = inlineAddrMatch[1].trim()
    } else {
      const addrLines = lines.filter(l => {
        if (l.toLowerCase() === name.toLowerCase()) return false
        if (phone && l.includes(phone.slice(-6))) return false
        if (/(?:rs\.?|amount|cod|total|id\s+|pc\s*\d+)/i.test(l)) return false
        if (/^phone\s*[:\-]/i.test(l)) return false
        return true
      })
      address = addrLines.join(', ').trim()
    }

    if (secondaryPhone && !address.includes(secondaryPhone)) {
      address += ` (Phone: ${secondaryPhone})`
    }

    // 8. Intelligent City detection & normalization
    let detectedCity = detectCityFromAddress(address) || detectCityFromAddress(block)
    if (!detectedCity) {
      const cityLine = lines.find(l => /^(city|shehar|destination)\s*[:\-]/i.test(l))
      if (cityLine) {
        const raw = cityLine.replace(/^(city|shehar|destination)\s*[:\-]\s*/i, '').trim()
        detectedCity = normalizeCityName(raw, address)
      }
    }
    if (!detectedCity) {
      const cityLineMatch = block.match(/(?:city|shehar)\s*[:\-]?\s*([A-Za-z\s]+)/i)
      if (cityLineMatch) {
        detectedCity = normalizeCityName(cityLineMatch[1].trim(), address)
      }
    }
    if (!detectedCity) {
      detectedCity = 'LAHORE'
    }

    parcels.push({
      id: orderId,
      name,
      phone,
      city: detectedCity,
      address,
      total,
      items: itemsVal,
      weight: Number(settings.default_weight || 0.5),
      orderType: settings.default_order_type || 'Normal',
      airwayBillCopy: 1,
      detail: settings.default_product || 'Kids Clothes',
      note,
      isDefaultId,
      isDefaultItems
    })
  }

  return {
    parcels,
    tokensUsed: 0,
    nextSerialNum: currentNum
  }
}


