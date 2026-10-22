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
  whatsapp_min_delay_sec?: number
  whatsapp_max_delay_sec?: number
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
   - Properly capitalized: 'usman malik' -> 'Usman Malik', 'ali' -> 'Ali', 'fatima bibi' -> 'Fatima Bibi'.
   - NEVER confuse a recipient's name with a city (e.g. 'Ali' is NOT 'Alipur', 'Umar' is NOT 'Umerkot', 'Hassan' is NOT 'Hasan Abdal', 'Zahid' is NOT 'Zahir Pir'). The person's name belongs strictly in 'name'!

2. PHONE NUMBER:
   - Always format as: 03XXXXXXXXX (11 digits, starting with 03).
   - Normalize: '+92 300 4455667', '0300-4455667', '923004455667' -> '03004455667'.
   - If multiple phone numbers are provided in an order:
     * Put the primary number in 'phone'.
     * Move additional numbers to the end of 'address': '(Alternate: 03XXXXXXXXX)'.

3. CITY DETECTION, GEO-RESEARCH & VALIDATION:
   - Cross-reference and match against the APPROVED COURIER CITIES list above.
   - Auto-correct misspellings and abbreviations (e.g. 'Lahor' -> 'LAHORE', 'Karach' -> 'KARACHI', 'Fsd' -> 'FAISALABAD', 'Isb' -> 'ISLAMABAD', 'Rwp' -> 'RAWALPINDI', 'Mul' -> 'MULTAN', 'Skt' -> 'SIALKOT', 'Grw' -> 'GUJRANWALA', 'Psh' -> 'PESHAWAR', 'Qta' -> 'QUETTA').
   - If city is missing or if the customer wrote only a local area, landmark, commercial market, or sector:
     * Research and deduce the true parent courier city in Pakistan:
       - 'Chungi Amar Sidhu', 'Makki Complex Chungi', 'Kahna', 'Kot Lakhpat', 'Township', 'Green Town', 'Wapda Town', 'Valencia', 'Johar Town', 'Model Town', 'Gulberg', 'Faisal Town', 'Garden Town', 'Allama Iqbal Town', 'Samanabad', 'Ichhra', 'Anarkali', 'Shadman', 'Shahdara', 'Baghbanpura', 'Mughalpura', 'Dharampura', 'Harbanspura', 'Walton', 'Cavalry Ground', 'Chung', 'Thokar Niaz Baig', 'Lake City', 'Paragon City', 'Bahria Town Lahore', 'DHA Lahore' -> 'LAHORE'.
       - 'Clifton', 'DHA Karachi', 'Korangi', 'Landhi', 'Malir', 'Malir Cantt', 'Gulshan-e-Iqbal', 'Gulistan-e-Johar', 'North Nazimabad', 'Nazimabad', 'Federal B Area', 'FB Area', 'Liaquatabad', 'PECHS', 'Saddar Karachi', 'Tariq Road', 'Bahadurabad', 'Orangi', 'Baldia', 'SITE', 'Lyari', 'Surjani', 'Scheme 33', 'Bahria Town Karachi' -> 'KARACHI'.
       - Sectors 'F-6', 'F-7', 'F-8', 'F-10', 'F-11', 'G-6', 'G-7', 'G-8', 'G-9', 'G-10', 'G-11', 'G-13', 'G-15', 'H-8', 'H-9', 'H-12', 'I-8', 'I-9', 'I-10', 'E-11', 'Blue Area', 'PWD', 'Soan Gardens', 'Bani Gala', 'DHA Islamabad' -> 'ISLAMABAD'.
       - 'Satellite Town', 'Raja Bazar', 'Commercial Market', 'Chaklala', 'Westridge', 'Tench Bhatta', 'Adyala Road', 'Peshawar Road', 'Bahria Town Rawalpindi' -> 'RAWALPINDI'.
       - 'D-Ground', 'Madina Town', 'Peoples Colony', 'Ghulam Muhammad Abad', 'Jinnah Colony', 'Millat Town' -> 'FAISALABAD'.
       - 'Bosan Road', 'Gulgasht', 'Shah Rukn-e-Alam', 'Chungi No 9', 'Mumtazabad', 'Cantt Multan' -> 'MULTAN'.
       - 'Hayatabad', 'University Town', 'Karkhano', 'Gulbahar', 'Warsak Road' -> 'PESHAWAR'.
   - RURAL AREAS & SMALL TOWNS:
     * If an order is from a village, Chak (e.g. 'Chak 45/12L', 'Chak 14 Tehsil Chunian', 'Chak 229 GB'), Basti, Mouza, or Tehsil:
     * Research its parent administrative district/tehsil and output the valid approved courier city name from the approved list above (e.g. 'Pattoki', 'Daska', 'Chunian', 'Kot Radha Kishan', 'Kamoke', 'Samundri', 'Tandlianwala', 'Taxila', 'Wah Cantt', 'Muridke', 'Lalamusa', 'Shakargarh', 'Haroonabad', 'Chishtian', 'Mian Channu', 'Burewala', 'Vehari', 'Hasilpur', 'Sadiqabad', 'Liaquatpur', 'Khanpur', 'Uch Sharif', 'Jalalpur Pirwala', 'Alipur Chatha', 'Wazirabad', 'Sambrial', 'Pasrur', 'Zafarwal', 'Narowal', 'Bhakkar', 'Layyah', 'Taunsa', 'Kot Addu', 'Muzaffargarh', 'Rajanpur', 'Chiniot', 'Lalian', 'Sangla Hill', 'Nankana Sahib', 'Pindi Bhattian', 'Bhalwal', 'Talagang', 'Chakwal', 'Pind Dadan Khan', 'Sohawa', 'Dina', 'Kharian', 'Mandi Bahauddin', 'Phalia', 'Ghotki', 'Mirpur Mathelo', 'Daharki', 'Pano Akil', 'Rohri', 'Khairpur', 'Gambat', 'Ranipur', 'Moro', 'Naushahro Feroze', 'Kandiaro', 'Daur', 'Sakrand', 'Qazi Ahmed', 'Sanghar', 'Shahdadpur', 'Sinjhoro', 'Tando Adam', 'Mirpur Khas', 'Digri', 'Umerkot', 'Kunri', 'Mithi', 'Badin', 'Matli', 'Talhar', 'Thatta', 'Sujawal', 'Tando Jam', 'Tando Allahyar', 'Tando Muhammad Khan', 'Matiari', 'Hala', 'Jamshoro', 'Kotri', 'Sehwan', 'Dadu', 'Mehar', 'Larkana', 'Ratodero', 'Qambar', 'Shahdadkot', 'Shikarpur', 'Jacobabad', 'Thul', 'Kashmore', 'Kandhkot', 'Swat', 'Mingora', 'Mardan', 'Swabi', 'Topi', 'Charsadda', 'Nowshera', 'Abbottabad', 'Havelian', 'Haripur', 'Mansehra', 'Bannu', 'Kohat', 'Dera Ismail Khan', 'Tank', 'Batkhela', 'Timergara', 'Dir', 'Chitral', 'Hub', 'Gwadar', 'Turbat', 'Khuzdar', 'Chaman', 'Sibi', 'Loralai', 'Pishin', 'Usta Muhammad', 'Muzaffarabad', 'Mirpur AJK', 'Kotli', 'Bhimber', 'Rawalakot').
   - Output 'city' in standard uppercase English (e.g. 'LAHORE').

4. ADDRESS FORMATTING:
   - If address is in Urdu or mixed script, convert to Roman Urdu.
   - For location words, ALWAYS use English:
     * 'near' (not 'qareeb' or 'nazd')
     * 'opposite' (not 'samne' or 'mukhalif')
     * 'beside' (not 'saath' or 'baghal')
     * 'behind' (not 'peechay' or 'aqab')
     * 'in front of' (not 'samne')
   - City name must always be at the end of the address (e.g. 'G77 Makki Complex, Chungi Amar Sidhu, Lahore').
   - If multiple phone numbers exist, append alternate number at the end: '(Alternate: 03XXXXXXXXX)'.
   - Avoid redundant repeated city names and junk conversational phrases.

5. TOTAL / COD AMOUNT:
   - Extract cash amount as integer number only (no 'Rs.' prefix).
   - If value is missing -> set 0.
   - If payment is Advance / Already Paid / Bank Transfer / Non-COD / Easypaisa / Jazzcash -> set 0.

6. ORDER TYPE (RETURN / REPLACEMENT / CHANGING):
   - If any of these keywords appear: Return, Replacement, Replacing, Exchange, Changing, Change, Reverse, Wrong Item, Wrong Product, Sending Back
   - Set 'orderType': 'Replacement'.
   - Otherwise set 'orderType': 'Normal'.

7. ORDER ID / REFERENCE:
   - If explicitly given (e.g. #1024, ORD-99, Ref 55), extract as 'id'. If not given, return "" (empty string).

8. ITEMS / PIECES COUNT:
   - If explicitly given (e.g. 2 pcs, 3 items, 4 suit, qty 2), extract as integer number.
   - If missing in text, return null.

9. PRODUCT DETAILS & NOTE:
   - Detail: ALWAYS use merchant's preset "${settings.default_product || 'Kids Clothes'}".
   - Note: Customer delivery remark (e.g. 'Call before delivery'). If none, use "${settings.default_note || 'Call before delivery'}".
   - Weight: ${settings.default_weight || 0.5}.
   - AirwayBillCopy: 1.

Return ONLY a valid JSON array. Zero markdown fences outside, NO conversational summary at the end.
Format:
[
  {
    "id": "",
    "name": "Ali",
    "phone": "03030303003",
    "city": "LAHORE",
    "address": "G77 Makki Complex, Chungi Amar Sidhu, Lahore",
    "total": 500,
    "items": null,
    "weight": 0.5,
    "orderType": "Normal",
    "airwayBillCopy": 1,
    "detail": "${settings.default_product || 'Kids Clothes'}",
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

    // 3. Name extraction (first line or labeled line)
    let name = ''
    const nameLine = lines.find(l => /^name\s*[:\-]/i.test(l))
    if (nameLine) {
      name = nameLine.replace(/^name\s*[:\-]\s*/i, '').trim()
    } else {
      const firstCandidate = lines[0].replace(/^\d+[\.\)]\s*/, '').trim()
      if (!firstCandidate.match(/\d{5,}/) && !/^(phone|contact|mobile|address|amount|rs|cod)/i.test(firstCandidate)) {
        name = firstCandidate
      } else if (lines.length > 1 && !lines[1].match(/\d{5,}/) && !/^(phone|contact|mobile|address|amount|rs|cod)/i.test(lines[1])) {
        name = lines[1].trim()
      } else {
        name = 'Recipient'
      }
    }

    // 4. Address extraction
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

    // 5. Intelligent City extraction
    // Priority A: Scan address for known major cities or area landmarks (e.g. "Chungi Amar Sidhu" -> "LAHORE")
    let detectedCity = detectCityFromAddress(address) || detectCityFromAddress(block)
    
    // Priority B: Labeled city/destination line
    if (!detectedCity) {
      const cityLine = lines.find(l => /^(city|shehar|destination)\s*[:\-]/i.test(l))
      if (cityLine) {
        const raw = cityLine.replace(/^(city|shehar|destination)\s*[:\-]\s*/i, '').trim()
        detectedCity = normalizeCityName(raw, address)
      }
    }

    // Priority C: Scan words in address from right to left (cities are written at the end of addresses in Pakistan)
    if (!detectedCity) {
      const addrWords = address.toUpperCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length >= 4)
      for (let wIdx = addrWords.length - 1; wIdx >= 0; wIdx--) {
        const w = addrWords[wIdx]
        const norm = normalizeCityName(w, address)
        if (norm && norm.length >= 4 && norm !== 'RECIPIENT') {
          detectedCity = norm
          break
        }
      }
    }

    if (!detectedCity) {
      detectedCity = 'LAHORE'
    }

    // Anti-name-collision safeguard (e.g. name "Ali" confused as "Alipur")
    if (detectedCity === 'ALIPUR' && (name.toUpperCase() === 'ALI' || name.toUpperCase().startsWith('ALI '))) {
      detectedCity = detectCityFromAddress(address) || 'LAHORE'
    }

    // 6. Order ID check: explicit or fallback
    let explicitId = ''
    const idMatch = block.match(/(?:order\s*(?:id|no|#|num)?|ref\s*(?:id|no|#|num)?|inv\s*(?:id|no|#|num)?)\s*[:#\-]?\s*([A-Za-z0-9\-]+)/i)
    if (idMatch && idMatch[1] && !/^(name|phone|city|address|amount|cod|total|rs)$/i.test(idMatch[1])) {
      explicitId = idMatch[1].trim()
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

    // 7. Explicit items check
    let explicitItems: number | null = null
    const itemsMatch = block.match(/(?:qty|quantity|pieces?|pcs?|items?|suits?|jore?|jori?)\s*[:#\-]?\s*(\d+)/i) ||
                       block.match(/(\d+)\s*(?:pieces?|pcs?|items?|suits?|jore?|jori?)\b/i)
    if (itemsMatch && itemsMatch[1]) {
      const parsedItems = parseInt(itemsMatch[1], 10)
      if (parsedItems > 0 && parsedItems <= 100) {
        explicitItems = parsedItems
      }
    }

    const itemsVal = explicitItems !== null ? explicitItems : Number(settings.default_items || 1)
    const isDefaultItems = explicitItems === null

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
      note: settings.default_note || 'Call before delivery',
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

