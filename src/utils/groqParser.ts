import axios from 'axios'
import { normalizeCityName } from './cityList'

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
  whatsapp_min_delay_sec?: number
  whatsapp_max_delay_sec?: number
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
      gemini: { key: settings.gemini_api_key, model: settings.gemini_model, defaultModel: 'gemini-1.5-flash' },
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
      const VALID_GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro']
      if (!model || !VALID_GEMINI_MODELS.includes(model)) {
        model = 'gemini-1.5-flash'
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

    const systemPrompt = `
You are an expert Pakistani courier logistics parcel data extractor.
Extract ALL parcels from the text below and return a valid JSON array.

CRITICAL MANDATORY RULES:
1. ABSOLUTE BAN ON ARABIC / URDU SCRIPT IN ALL OUTPUT FIELDS:
   - Courier booking APIs (PostEx, Trax, Leopards, TCS) and thermal airway bill label printers in Pakistan strictly CANNOT print Urdu script characters.
   - You MUST dynamically transliterate and translate ALL Arabic/Urdu script into clean, readable Latin / Roman Urdu or English alphabet.
   - NEVER output Arabic/Urdu script in ANY field (Name, Address, City, Product Details, Note).
   - Recipient Names: Transliterate dynamically into natural English/Roman Urdu spelling (e.g., 'فاطمہ بی بی' -> 'Fatima Bibi', 'محمد احمد' -> 'Muhammad Ahmad', 'علی رضا' -> 'Ali Raza', 'عائشہ خان' -> 'Ayesha Khan', 'حمزہ شیخ' -> 'Hamza Sheikh', 'کاشف محمود' -> 'Kashif Mehmood', 'سعدیہ بانو' -> 'Sadia Bano').
   - Addresses: Transliterate Urdu text into clean, structured Roman Urdu/English. Format incomplete or conversational addresses intelligently (e.g. 'Ghar no 12, Gali 4, Mohalla Qazi Abad, Near Jamia Masjid'). Preserve all landmarks, chowks, sectors, blocks, and directions.
   - Cities (CRITICAL - ANY PAKISTANI CITY/TOWN/TEHSIL):
     * The input may contain ANY city, tehsil, district, town, or village in Pakistan (not limited to major cities; e.g. Daska, Chunian, Kamoke, Kot Addu, Pattoki, Swabi, Vehari, Shakargarh, Haripur, Chiniot, Lodhran, Toba Tek Singh, Larkana, Nawabshah, Kohat, Bannu, Turbat, Hub, Muzaffarabad, Mirpur AJK, etc.).
     * You must accurately extract the geographic destination and output its standard, recognized English courier hub/city name (e.g., Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta, Sialkot, Gujranwala, Sargodha, Bahawalpur, Sukkur, Jhang, Kasur, Dera Ghazi Khan, Rahim Yar Khan, Abbottabad, Mardan, Gujrat, Sheikhupura, Sahiwal, Okara, etc.).
     * If a small village, tehsil, or rural union council is given (e.g., 'Chak 45 Tehsil Pattoki'), map to the primary operational courier delivery city.
   - Product Details: Translate/clean to English or Roman Urdu (e.g., '3 Lawn Suits', '1 Watch', 'Makeup Kit', 'Kids Clothes', '2 Pcs Unstitched Clothes', '1 Track Suit').

2. PHONE NUMBER EXTRACTION:
   - Always 03XXXXXXXXX (11 digits, starting with 03).
   - Normalize: '+92 300 4455667', '0300-4455667', '923004455667', '0300 44 55 667' -> '03004455667'.
   - If multiple phones exist in an order: put the primary in 'phone', and append '(Alternate: 03XXXXXXXXX)' at the end of 'address'.

3. CASH ON DELIVERY (COD) / TOTAL:
   - Extract cash amount as integer number only.
   - Recognize cues in English, Roman Urdu, and Urdu: '2200 cod', '1800 روپے', '3400 rs', 'rs 1500', '4500', '3300 وصول کرنا', '7800 rs lena', 'kitchen set rs 5500 wasool krna', 'cod 1950', 'amount 7600'.
   - Discard labels ('روپے', 'rs', 'cod', 'وصول کرنا', 'lena', 'amount') and output integer (e.g. 2200, 1800, 3400, 3300, 7800).
   - If non-COD, advance paid, or already paid ('advance paid', 'already paid', 'easypaisa', 'jazzcash'): total is 0.

4. ORDER ID / REFERENCE:
   - If the text explicitly mentions an order reference (e.g. #1024, ORD-99, Ref 55), extract as 'id'. If NO order ID is explicitly given, return "" (empty string). NEVER make up or invent fake IDs like ord1, ord2.

5. CUSTOMER NOTE & INSTRUCTIONS:
   - Extract delivery remarks into 'note' ('dukan wala ghar ke samne' -> 'Shop in front of house', 'fragile hai' -> 'Fragile item', 'dukan pe dena' -> 'Deliver at shop', 'call before delivery' -> 'Call before delivery'). If none specified, use default_note.

6. ORDER TYPE:
   - 'Normal' or 'Replacement' (if keywords: Return/Exchange/Replacement/Changing/Wrong Item).

DEFAULT SETTINGS:
- default_items: ${settings.default_items || 1}
- default_product: ${settings.default_product || 'Kids Clothes'}
- default_note: ${settings.default_note || 'Call before delivery'}
- default_weight: ${settings.default_weight || 0.5}

Return ONLY a valid JSON array. No markdown fences, no conversational text.
Format:
[
  {
    "id": "",
    "name": "Fatima Bibi",
    "phone": "03339876543",
    "city": "Karachi",
    "address": "Gulshan-e-Iqbal Block 7, Karachi",
    "total": 1800,
    "items": 3,
    "weight": 0.5,
    "orderType": "Normal",
    "airwayBillCopy": 1,
    "detail": "3 Lawn Suits",
    "note": "Call before delivery"
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
          const VALID_GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro']
          if (!currentModel || !VALID_GEMINI_MODELS.includes(currentModel)) {
            currentModel = 'gemini-1.5-flash'
          }

          const generationConfig: any = {
            responseMimeType: "application/json"
          }

          let res: any
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`
            res = await axios.post(url, {
              contents: [{
                role: 'user',
                parts: [{ text: `WhatsApp Raw Messages to Parse into Parcels:\n\n${rawText}` }]
              }],
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              },
              generationConfig
            })
          } catch (modelErr: any) {
            // Auto fallback if model is unavailable, hits 503 capacity limit, or has error
            const errMsg = modelErr.response?.data?.error?.message || modelErr.message || ''
            const status = modelErr.response?.status
            console.warn(`[Gemini] Model ${currentModel} error (${status}): ${errMsg}. Auto-switching to working alternative...`)
            currentModel = (currentModel === 'gemini-1.5-flash') ? 'gemini-2.0-flash' : 'gemini-1.5-flash'
            const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`
            res = await axios.post(fallbackUrl, {
              contents: [{
                role: 'user',
                parts: [{ text: `WhatsApp Raw Messages to Parse into Parcels:\n\n${rawText}` }]
              }],
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              },
              generationConfig
            })
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
          } else {
            usedSerials.add(orderId.toLowerCase())
          }

          let cleanPhone = String(p.phone || '').trim().replace(/[\s-+]/g, '')
          if (cleanPhone.startsWith('923')) cleanPhone = '0' + cleanPhone.substring(2)
          if (cleanPhone.startsWith('00923')) cleanPhone = '0' + cleanPhone.substring(4)

          return {
            id: orderId,
            name: String(p.name || '').trim(),
            phone: cleanPhone,
            city: normalizeCityName(p.city),
            address: String(p.address || '').trim(),
            total: Number(p.total || 0),
            items: Number(p.items || settings.default_items || 1),
            weight: Number(p.weight || settings.default_weight || 0.5),
            orderType: p.orderType || 'Normal',
            airwayBillCopy: Number(p.airwayBillCopy || 1),
            detail: String(p.detail || settings.default_product || 'Kids Clothes'),
            note: String(p.note || settings.default_note || 'Call before delivery')
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
 * 3. Dense unseparated multi-order text with multiple phone numbers, splitting cleanly at \n line boundaries
 *    (NEVER using naive midpoints that chop addresses, customer names, or products in half).
 */
export function splitRawTextIntoOrderBlocks(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return []

  const clean = rawText.trim()

  // 1. Check if separated by blank lines (standard WhatsApp multi-order format)
  const paragraphBlocks = clean
    .split(/\r?\n\s*\r?\n+/)
    .map(b => b.trim())
    .filter(b => b.length > 0)

  // If we found multiple paragraph blocks, check if they contain phone numbers or order signals
  if (paragraphBlocks.length > 1) {
    const hasOrderSignals = paragraphBlocks.filter(b =>
      /(?:(?:\+92|0092|92)[\s-]?3\d{2}[\s-]?\d{7}|03\d{2}[\s-]?\d{7}|3\d{2}[\s-]?\d{7})/.test(b) ||
      /(?:rs\.?|cod|total|amount|روپے|وصول|suit|shirt|shoes|dress)/i.test(b)
    ).length

    if (hasOrderSignals >= Math.max(1, Math.floor(paragraphBlocks.length * 0.4))) {
      // Re-stitch any accidental short fragments (< 15 chars without phone) to the previous block
      const consolidated: string[] = []
      for (const b of paragraphBlocks) {
        if (consolidated.length > 0 && b.length < 15 && !/(?:03\d{2}|923\d{2})/.test(b)) {
          consolidated[consolidated.length - 1] += '\n' + b
        } else {
          consolidated.push(b)
        }
      }
      return consolidated
    }
  }

  // 2. Check for numbered list markers (1. ... 2. ... or Order 1: ... Order 2: ...)
  const numberedSplit = clean.split(/(?:^|\r?\n)(?=\s*(?:\d+[\.\)]\s+|Order\s*#?\d+[:\s\.-]))/i)
    .map(b => b.trim())
    .filter(b => b.length > 0)

  if (numberedSplit.length > 1) {
    return numberedSplit
  }

  // 3. Fallback for dense text without blank lines: split at \n line breaks near phone numbers
  const phoneRegex = /(?:(?:\+92|0092|92)[\s-]?3\d{2}[\s-]?\d{7}|03\d{2}[\s-]?\d{7}|3\d{2}[\s-]?\d{7})/g
  const phoneMatches: { index: number; text: string }[] = []
  let match: RegExpExecArray | null
  while ((match = phoneRegex.exec(clean)) !== null) {
    phoneMatches.push({ index: match.index, text: match[0] })
  }

  if (phoneMatches.length <= 1) {
    return [clean]
  }

  // Find all line boundaries (\n)
  const lines = clean.split(/\r?\n/)
  const lineOffsets: number[] = []
  let curOffset = 0
  for (const l of lines) {
    lineOffsets.push(curOffset)
    curOffset += l.length + 1
  }

  // Assign each line cleanly to its respective order without cutting words
  const blocks: string[] = []
  let curBlockLines: string[] = []
  let currentPhoneIdx = 0

  for (let i = 0; i < lines.length; i++) {
    const lineStart = lineOffsets[i]
    if (currentPhoneIdx + 1 < phoneMatches.length) {
      const nextPhoneOffset = phoneMatches[currentPhoneIdx + 1].index
      const currentPhoneOffset = phoneMatches[currentPhoneIdx].index
      const splitBoundary = (currentPhoneOffset + nextPhoneOffset) / 2

      if (lineStart >= splitBoundary && curBlockLines.length > 0) {
        blocks.push(curBlockLines.join('\n').trim())
        curBlockLines = []
        currentPhoneIdx++
      }
    }
    curBlockLines.push(lines[i])
  }

  if (curBlockLines.length > 0) {
    blocks.push(curBlockLines.join('\n').trim())
  }

  return blocks.filter(b => b.length > 0)
}

/**
 * Zero-Loss Algorithmic Fallback Parser:
 * If all AI APIs hit rate limits or are unavailable, this high-accuracy regex engine
 * extracts Pakistani phone numbers, customer names, COD amounts, and addresses directly
 * so the merchant's orders are NEVER lost or discarded.
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
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) continue

    // 1. Phone extraction
    let phone = ''
    const pMatch = block.match(/(?:(?:\+92|0092|92)[\s-]?3\d{2}[\s-]?\d{7}|03\d{2}[\s-]?\d{7}|3\d{2}[\s-]?\d{7})/)
    if (pMatch) {
      phone = pMatch[0].replace(/[\s-+]/g, '')
      if (phone.startsWith('92')) phone = '0' + phone.substring(2)
      if (phone.startsWith('0092')) phone = '0' + phone.substring(4)
      if (phone.length === 10 && phone.startsWith('3')) phone = '0' + phone
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

    // 3. City extraction
    let detectedCity = 'LAHORE'
    const words = block.toUpperCase().replace(/[^\w\s]/g, ' ').split(/\s+/)
    for (const w of words) {
      const normalized = normalizeCityName(w)
      if (normalized && normalized !== 'LAHORE') {
        detectedCity = normalized
        break
      }
    }

    // 4. Name extraction
    let name = ''
    const nameLine = lines.find(l => /^name\s*[:\-]/i.test(l))
    if (nameLine) {
      name = nameLine.replace(/^name\s*[:\-]\s*/i, '').trim()
    } else {
      const firstCandidate = lines[0].replace(/^\d+[\.\)]\s*/, '').trim()
      if (!firstCandidate.match(/\d{5,}/) && !/^(phone|contact|mobile|address|amount|rs|cod)/i.test(firstCandidate)) {
        name = firstCandidate
      } else {
        name = 'Recipient'
      }
    }

    // 5. Address extraction
    let address = ''
    const addressLine = lines.find(l => /^(address|pata|ghar|street|house)\s*[:\-]/i.test(l))
    if (addressLine) {
      address = addressLine.replace(/^(address|pata|ghar|street|house)\s*[:\-]\s*/i, '').trim()
    } else {
      const remainingLines = lines.filter(l => {
        if (l.includes(name) || (phone && l.includes(phone.slice(-7)))) return false
        if (/(?:rs\.?|amount|cod|total)[\s:]*\d+/i.test(l)) return false
        return true
      })
      address = remainingLines.join(', ') || block
    }

    // 6. Unique serial assignment
    let candidate = `${prefix}${currentNum}`
    while (usedSerials.has(candidate.toLowerCase())) {
      currentNum++
      candidate = `${prefix}${currentNum}`
    }
    const orderId = candidate
    usedSerials.add(orderId.toLowerCase())
    currentNum++

    parcels.push({
      id: orderId,
      name,
      phone,
      city: detectedCity,
      address,
      total,
      items: Number(settings.default_items || 1),
      weight: Number(settings.default_weight || 0.5),
      orderType: settings.default_order_type || 'Normal',
      airwayBillCopy: 1,
      detail: settings.default_product || 'Kids Clothes',
      note: settings.default_note || 'Call before delivery'
    })
  }

  return {
    parcels,
    tokensUsed: 0,
    nextSerialNum: currentNum
  }
}

