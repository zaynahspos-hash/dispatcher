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
}

export interface ParseResult {
  parcels: Parcel[]
  tokensUsed: number
}

export async function parseParcelText(rawText: string, settings: Settings): Promise<ParseResult> {
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
    let apiKeyString = ''
    let model = ''

    if (provider === 'groq') {
      apiKeyString = settings.groq_api_key || ''
      model = settings.groq_model || 'llama-3.1-8b-instant'
      if (model === 'custom') model = 'llama-3.1-8b-instant'
    } else if (provider === 'openrouter') {
      apiKeyString = settings.openrouter_api_key || ''
      model = settings.openrouter_model || 'meta-llama/llama-3.1-8b-instruct:free'
      if (model === 'custom') model = 'meta-llama/llama-3.1-8b-instruct:free'
    } else if (provider === 'gemini') {
      apiKeyString = settings.gemini_api_key || ''
      let rawModel = settings.gemini_model || 'gemini-3.5-flash-lite'
      if (!rawModel || rawModel === 'custom' || rawModel.includes('2.0') || rawModel.includes('1.5') || rawModel.includes('2.5') || rawModel.includes('preview')) {
        rawModel = 'gemini-3.5-flash-lite'
      }
      model = rawModel
    } else if (provider === 'openai') {
      apiKeyString = settings.openai_api_key || ''
      model = settings.openai_model || 'gpt-4o-mini'
      if (model === 'custom') model = 'gpt-4o-mini'
    } else if (provider === 'anthropic') {
      apiKeyString = settings.anthropic_api_key || ''
      model = settings.anthropic_model || 'claude-3-haiku-20240307'
      if (model === 'custom') model = 'claude-3-haiku-20240307'
    } else if (provider === 'deepseek') {
      apiKeyString = settings.deepseek_api_key || ''
      model = settings.deepseek_model || 'deepseek-chat'
      if (model === 'custom') model = 'deepseek-chat'
    } else if (provider === 'kimi') {
      apiKeyString = settings.kimi_api_key || ''
      model = settings.kimi_model || 'moonshot-v1-8k'
      if (model === 'custom') model = 'moonshot-v1-8k'
    } else if (provider === 'mistral') {
      apiKeyString = settings.mistral_api_key || ''
      model = settings.mistral_model || 'ministral-3b-2512'
      if (model === 'custom') model = 'ministral-3b-2512'
    }

    const keys = apiKeyString
      .split(/[\n,]+/)
      .map(k => k.trim())
      .filter(k => k.length > 0)

    if (keys.length === 0) {
      continue // Skip if this provider doesn't have keys configured
    }

    attemptedAny = true

    // Get index for this provider's keys
    const storageKey = `${provider}_api_key_index`
    const storedIndexStr = localStorage.getItem(storageKey)
    let startIndex = parseInt(storedIndexStr || '0', 10)
    if (isNaN(startIndex) || startIndex >= keys.length) {
      startIndex = 0
    }

    const systemPrompt = `
You are a Pakistani courier parcel data extractor.
Extract ALL parcels from the WhatsApp text below and return a JSON array.

RULES:
- Name: Customer's full name, properly capitalized.
- Phone: Always 03XXXXXXXXX format (fix +92 303 → 03035..., remove spaces/dashes)
- If multiple phones: first in phone field, rest as "(Alternate: 03XXXXXXXXX)" at end of address
- City: Extract Pakistani destination city (e.g. Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Gujranwala, Sialkot, Quetta, Hyderabad, etc.).
- Address: Street address. Do NOT prefix with city name; place city name at end.
- Total: COD cash amount as number only (0 if advance paid / non-cod).
- Items: number. If missing → use default_items setting
- OrderType: "Normal" or "Replacement" (if keywords: Return/Exchange/Replacement/Changing/Wrong Item)
- AirwayBillCopy: 1 (default)
- Note: customer note if given, else use default_note setting
- Detail: default_product setting
- Weight: default_weight setting

DEFAULT SETTINGS:
- default_items: ${settings.default_items || 1}
- default_product: ${settings.default_product || 'Kids Clothes'}
- default_note: ${settings.default_note || 'Call before delivery'}
- default_weight: ${settings.default_weight || 0.5}

Return ONLY a valid JSON array. No markdown, no explanation.
Format:
[
  {
    "id": "ord1",
    "name": "Muhammad Ali",
    "phone": "03001234567",
    "city": "Lahore",
    "address": "House 5, Street 3, DHA Phase 1, Lahore",
    "total": 2500,
    "items": 2,
    "weight": 0.5,
    "orderType": "Normal",
    "airwayBillCopy": 1,
    "detail": "Kids Clothes",
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
          if (!currentModel || currentModel.includes('2.0') || currentModel.includes('1.5') || currentModel.includes('2.5') || currentModel === 'custom') {
            currentModel = 'gemini-3.5-flash-lite'
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
            // Auto fallback if model is unavailable / discontinued
            const errMsg = modelErr.response?.data?.error?.message || modelErr.message || ''
            const status = modelErr.response?.status
            console.warn(`[Gemini] Model ${currentModel} error (${status}): ${errMsg}. Auto-switching to working alternative...`)
            currentModel = (currentModel === 'gemini-3.5-flash-lite') ? 'gemini-3.8-flash' : 'gemini-flash-lite-latest'
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
        const normalizedList: Parcel[] = rawList.map((p: any, idx: number) => ({
          id: p.id ? String(p.id) : `ORD-${Date.now()}-${idx + 1}`,
          name: String(p.name || '').trim(),
          phone: String(p.phone || '').trim(),
          city: normalizeCityName(p.city),
          address: String(p.address || '').trim(),
          total: Number(p.total || 0),
          items: Number(p.items || settings.default_items || 1),
          weight: Number(p.weight || settings.default_weight || 0.5),
          orderType: p.orderType || 'Normal',
          airwayBillCopy: Number(p.airwayBillCopy || 1),
          detail: String(p.detail || settings.default_product || 'Kids Clothes'),
          note: String(p.note || settings.default_note || 'Call before delivery')
        }))

        resultPayload = {
          parcels: normalizedList,
          tokensUsed
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
