import axios from 'axios'
import { Parcel, Settings } from './aiParser'

const IS_DEV = (import.meta as any).env.DEV;
const POSTEX_HOST = IS_DEV ? '/postex-api' : 'https://api.postex.pk';
const BASE = `${POSTEX_HOST}/services/integration/api`
const POSTEX_PUBLIC_HOST = IS_DEV ? '/postex-public' : 'https://postex.pk';

function headers(token: string) {
  return { token, 'Content-Type': 'application/json' }
}

export async function getMerchantAddresses(token: string) {
  const res = await axios.get(`${BASE}/order/v1/get-merchant-address`, {
    headers: headers(token)
  })
  return res.data
}

export async function getOrderTypes(token: string) {
  const res = await axios.get(`${BASE}/order/v1/get-order-types`, {
    headers: headers(token)
  })
  return res.data
}

export function cleanPhone(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('92') && digits.length === 12) {
    digits = '0' + digits.substring(2)
  }
  if (digits.length === 10 && digits.startsWith('3')) {
    digits = '0' + digits
  }
  return digits
}

export function toTitleCase(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export async function getOperationalCities(token: string): Promise<string[]> {
  const endpoints = [
    `${BASE}/order/v2/get-operational-city?operationalCityType=delivery`,
    `${BASE}/order/v2/get-operational-city?operationalCityType=Delivery`,
    `${BASE}/order/v2/get-operational-city?operationalCityType=pickup`,
    `${BASE}/order/v2/get-operational-city`
  ]

  for (const url of endpoints) {
    try {
      const res = await axios.get(url, {
        headers: headers(token)
      })
      if (res.data && Array.isArray(res.data.dist) && res.data.dist.length > 0) {
        // Double-check if the objects contain operationalCityName or cityName
        const list = res.data.dist
          .map((c: any) => {
            const name = c.operationalCityName || c.cityName || '';
            return typeof name === 'string' ? name.trim().toUpperCase() : '';
          })
          .filter((name: string) => name.length > 0)
        
        if (list.length > 0) {
          console.log(`Successfully loaded ${list.length} cities from ${url}`)
          return list
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch cities from ${url}:`, e)
    }
  }

  console.error('All operational cities API fallbacks failed.')
  return []
}

export async function cancelOrder(token: string, trackingNumber: string) {
  const res = await axios.put(
    `${BASE}/order/v1/cancel-order`,
    { trackingNumber },
    { headers: headers(token) }
  )
  return res.data
}

export async function createOrder(token: string, parcel: Parcel, settings: Settings) {

  // Apply default product preset from settings
  const deliveryDetail = (settings.default_product && settings.default_product.trim())
    ? settings.default_product.trim()
    : (parcel.detail || 'Kids Clothes')

  // Apply auto weight calculation
  let weight = parseFloat(String(parcel.weight)) || parseFloat(settings.default_weight) || 0.5
  if (settings.postex_weight_check === '0') {
    weight = parseFloat(settings.default_weight) || 0.5
  }

  // Apply auto pieces calculation
  let items = parseInt(String(parcel.items)) || parseInt(settings.default_items) || 1
  if (settings.postex_pieces_check === '0') {
    items = parseInt(settings.default_items) || 1
  }

  // Apply COD amount logic: non-COD as zero
  let totalAmount = parseFloat(String(parcel.total)) || 0
  if (settings.postex_cod_check === '1') {
    const textToSearch = `${parcel.note || ''} ${parcel.detail || ''}`.toLowerCase()
    if (textToSearch.includes('paid') || textToSearch.includes('prepaid') || textToSearch.includes('non-cod') || textToSearch.includes('non cod')) {
      totalAmount = 0
    }
  }

  // Apply remarks
  let remarks = ''
  const pNote = (parcel.note || '').trim()
  const dNote = (settings.default_note || '').trim()

  if (settings.postex_notes_check === '1') {
    if (pNote && dNote) {
      if (pNote.toLowerCase().includes(dNote.toLowerCase())) {
        remarks = pNote
      } else if (dNote.toLowerCase().includes(pNote.toLowerCase())) {
        remarks = dNote
      } else {
        remarks = `${pNote} ${dNote}`
      }
    } else {
      remarks = pNote || dNote
    }
  } else {
    remarks = dNote || pNote
  }

  if (!remarks) {
    remarks = 'Call before delivery'
  }

  // Auto-resolve return city if empty
  let returnCity = (settings.postex_return_city || '').trim().toUpperCase()
  let pickupAddressText = settings.postex_pickup || ''
  let returnAddressText = settings.postex_return || settings.postex_pickup || ''

  try {
    const lists = await getMerchantAddresses(token)
    if (lists && Array.isArray(lists.dist)) {
      // Find return address
      let retMatched = lists.dist.find((a: any) => a.addressCode === settings.postex_return)
      if (!retMatched) retMatched = lists.dist.find((a: any) => a.addressCode === settings.postex_pickup)
      if (!retMatched) retMatched = lists.dist.find((a: any) => a.addressType === 'Return Address') || lists.dist[0]
      
      if (retMatched) {
        if (!returnCity && retMatched.cityName) {
          returnCity = retMatched.cityName.trim().toUpperCase()
          console.log(`Auto-resolved return city: ${returnCity}`)
        }
        returnAddressText = retMatched.address || returnAddressText
      }

      // Find pickup address
      let pickMatched = lists.dist.find((a: any) => a.addressCode === settings.postex_pickup)
      if (pickMatched) {
        pickupAddressText = pickMatched.address || pickupAddressText
      }
    }
  } catch (err) {
    console.warn('Failed to auto-resolve addresses:', err)
  }

  if (!returnCity) {
    returnCity = 'LAHORE'
  }

  let pickupCode = settings.postex_pickup
  let returnCode = settings.postex_return || settings.postex_pickup

  // Typo corrections for PostEx merchant database errors
  if (pickupCode === '5450') pickupCode = '54500'
  if (returnCode === '5450') returnCode = '54500'

  // Normalize addresses to see if they are the same physical address
  const normPickup = pickupAddressText.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  const normReturn = returnAddressText.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  if (normPickup === normReturn && pickupCode) {
    returnCode = pickupCode
  }

  // PostEx V3 create-order order types: Normal, Reversed, Replacement, Overland
  let safeOrderType: 'Normal' | 'Reversed' | 'Replacement' | 'Overland' = 'Normal'
  const rawType = String(parcel.orderType || settings.postex_type || 'Normal').trim().toLowerCase()
  if (rawType.includes('replace') || rawType.includes('exchange')) {
    safeOrderType = 'Replacement'
  } else if (rawType.includes('reverse')) {
    safeOrderType = 'Reversed'
  } else if (rawType.includes('overland') || rawType.includes('cargo')) {
    safeOrderType = 'Overland'
  } else {
    safeOrderType = 'Normal'
  }

  const body = {
    cityName: parcel.city,
    customerName: parcel.name,
    customerPhone: cleanPhone(parcel.phone),
    deliveryAddress: parcel.address,
    invoiceDivision: 1,
    invoicePayment: totalAmount,
    items: items,
    orderDetail: deliveryDetail,
    orderRefNumber: parcel.id,
    orderType: safeOrderType,
    transactionNotes: remarks,
    pickupAddressCode: pickupCode,
    weight: weight,
  }

  const res = await axios.post(`${BASE}/order/v3/create-order`, body, {
    headers: headers(token)
  })
  return res.data
}

export async function printLabels(token: string, trackingNumbers: string[]) {
  const res = await axios.post(
    `${POSTEX_HOST}/services/reporting/api/report/integration/airway-bill`,
    trackingNumbers,
    { headers: headers(token) }
  )
  if (res.data.statusCode === '200' || res.data.statusCode === 200) {
    const b64 = res.data.dist
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const blob = new Blob([bytes.buffer], { type: 'application/pdf' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'postex-labels.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return true
  }
  return false
}

export function printFallbackLoadSheetManifest(params: {
  pickupCode: string
  pickupAddress?: string
  trackingNumbers: string[]
  batchName?: string
  totalCOD?: number
}): boolean {
  if (typeof window === 'undefined') return false
  const { pickupCode, pickupAddress, trackingNumbers, batchName, totalCOD } = params
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })


  const rowsHtml = trackingNumbers.map((cn, i) => `
    <tr>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">${i + 1}</td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; font-size: 13px;">${cn}</td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">PostEx</td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;"><div style="width: 14px; height: 14px; border: 1.5px solid #000; margin: 0 auto;"></div></td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>PostEx Courier Load Sheet — ${batchName || 'Dispatch'}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 20px; color: #0f172a; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
        .title { font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0; }
        .subtitle { font-size: 12px; color: #64748b; margin: 2px 0 0; }
        .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; font-size: 12px; }
        .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; }
        .meta-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; }
        .meta-val { font-size: 13px; font-weight: 700; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px; }
        th { background: #0f172a; color: #ffffff; padding: 8px; font-size: 11px; text-transform: uppercase; border: 1px solid #0f172a; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; font-size: 12px; page-break-inside: avoid; }
        .sig-box { border-top: 1.5px dashed #0f172a; padding-top: 8px; }
        @media print {
          body { margin: 10mm; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div style="text-align: right; margin-bottom: 10px;">
        <button onclick="window.print()" style="padding: 8px 16px; background: #059669; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Print Load Sheet</button>
      </div>
      <div class="header">
        <div>
          <h1 class="title">PostEx Courier Handover Load Sheet</h1>
          <p class="subtitle">Official Merchant Dispatch & Rider Receiving Manifest</p>
        </div>
        <div style="text-align: right; font-size: 11px;">
          <strong>Date:</strong> ${dateStr} ${timeStr}<br/>
          <strong>Batch:</strong> ${batchName || 'Handover Sheet'}
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-card">
          <div class="meta-label">Pickup Address Code</div>
          <div class="meta-val font-mono">${pickupCode || '001'}</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Total Parcels</div>
          <div class="meta-val">${trackingNumbers.length} Parcels</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Total COD Value</div>
          <div class="meta-val">${totalCOD ? 'Rs. ' + totalCOD.toLocaleString() : 'N/A'}</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Courier Partner</div>
          <div class="meta-val">PostEx Logistics V3</div>
        </div>
      </div>

      ${pickupAddress ? `<p style="font-size: 11px; color: #475569; margin: -8px 0 14px;"><strong>Pickup Location:</strong> ${pickupAddress}</p>` : ''}

      <table>
        <thead>
          <tr>
            <th style="width: 45px;">#</th>
            <th style="text-align: left;">Tracking Number (CN)</th>
            <th style="width: 100px;">Courier</th>
            <th style="width: 60px;">Received</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="signatures">
        <div class="sig-box">
          <p><strong>Merchant Dispatcher Signature:</strong></p>
          <p style="color: #64748b; font-size: 11px; margin-top: 25px;">Name: ______________________ &bull; Date: ${dateStr}</p>
        </div>
        <div class="sig-box">
          <p><strong>PostEx Rider Receiving Signature:</strong></p>
          <p style="color: #64748b; font-size: 11px; margin-top: 25px;">Rider Name / CNIC / Phone: ______________________</p>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 400);
        };
      </script>
    </body>
    </html>
  `

  let targetDoc: Document | null = null
  let isIframe = false

  try {
    const win = window.open('', '_blank')
    if (win && win.document) {
      targetDoc = win.document
    }
  } catch {}

  let iframe: HTMLIFrameElement | null = null
  if (!targetDoc) {
    isIframe = true
    iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    targetDoc = iframe.contentWindow?.document || null
  }

  if (!targetDoc) return false

  targetDoc.open()
  targetDoc.write(html)
  targetDoc.close()

  if (isIframe && iframe) {
    setTimeout(() => {
      iframe?.contentWindow?.focus()
      iframe?.contentWindow?.print()
      setTimeout(() => {
        if (iframe && document.body.contains(iframe)) document.body.removeChild(iframe)
      }, 4000)
    }, 500)
  }
  return true
}

export async function generateLoadSheet(
  token: string, 
  pickupAddressCode: string, 
  trackingNumbers: string[],
  batchDetails?: { totalCOD?: number; batchName?: string }
): Promise<{ success: boolean; base64?: string }> {
  const cleanCNs = (trackingNumbers || []).map(cn => String(cn).trim()).filter(Boolean)
  if (cleanCNs.length === 0) {
    throw new Error('No tracking numbers provided for load sheet')
  }

  // Try to resolve the actual address text for the code
  let pickupAddressText = pickupAddressCode
  try {
    const lists = await getMerchantAddresses(token)
    if (lists && Array.isArray(lists.dist)) {
      const pickMatched = lists.dist.find((a: any) => a.addressCode === pickupAddressCode)
      if (pickMatched && pickMatched.address) {
        pickupAddressText = pickMatched.address
      }
    }
  } catch (err) {
    console.warn('Failed to auto-resolve pickup address text for load sheet:', err)
  }

  const payload = {
    pickupAddress: pickupAddressText,
    pickupAddressCode: pickupAddressCode,
    pickUpAddressCode: pickupAddressCode,
    merchantAddressCode: pickupAddressCode,
    trackingNumbers: cleanCNs
  }

  let blob: Blob | null = null
  let base64String: string | undefined

  try {
    const res = await axios.post(
      `${BASE}/order/v2/generate-load-sheet`,
      payload,
      { 
        headers: headers(token),
        responseType: 'blob'
      }
    )
    blob = res.data
  } catch (err) {
    console.warn('PostEx Load Sheet API v2 (object) failed, trying raw array payload...', err)
    try {
      const res = await axios.post(
        `${BASE}/order/v2/generate-load-sheet`,
        cleanCNs,
        { 
          headers: headers(token),
          responseType: 'blob'
        }
      )
      blob = res.data
    } catch (err2: any) {
      console.warn('PostEx Load Sheet API v2 failed, trying v1...', err2)
      try {
        const res = await axios.post(
          `${BASE}/order/v1/generate-load-sheet`,
          payload,
          { 
            headers: headers(token),
            responseType: 'blob'
          }
        )
        blob = res.data
      } catch (err3: any) {
        console.warn('PostEx direct loadsheet API rejected (likely already closed/in-transit on PostEx portal). Opening Handover Manifest...', err3)
        printFallbackLoadSheetManifest({
          pickupCode: pickupAddressCode || '001',
          pickupAddress: pickupAddressText,
          trackingNumbers: cleanCNs,
          batchName: batchDetails?.batchName,
          totalCOD: batchDetails?.totalCOD
        })
        return { success: true }
      }
    }
  }

  if (blob) {
    // Check if the blob is actually a JSON response
    if (blob.type.includes('application/json') || blob.type.includes('text/plain')) {
      const text = await blob.text()
      try {
        const parsed = JSON.parse(text)
        if (parsed.statusCode === '200' || parsed.statusCode === 200 || parsed.statusCode === '0200') {
          const b64 = parsed.dist
          if (b64) {
            base64String = b64
            const bin = atob(b64)
            const bytes = new Uint8Array(bin.length)
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
            blob = new Blob([bytes.buffer], { type: 'application/pdf' })
          } else {
            printFallbackLoadSheetManifest({
              pickupCode: pickupAddressCode || '001',
              pickupAddress: pickupAddressText,
              trackingNumbers: cleanCNs,
              batchName: batchDetails?.batchName,
              totalCOD: batchDetails?.totalCOD
            })
            return { success: true }
          }
        } else {
          printFallbackLoadSheetManifest({
            pickupCode: pickupAddressCode || '001',
            pickupAddress: pickupAddressText,
            trackingNumbers: cleanCNs,
            batchName: batchDetails?.batchName,
            totalCOD: batchDetails?.totalCOD
          })
          return { success: true }
        }
      } catch {
        printFallbackLoadSheetManifest({
          pickupCode: pickupAddressCode || '001',
          pickupAddress: pickupAddressText,
          trackingNumbers: cleanCNs,
          batchName: batchDetails?.batchName,
          totalCOD: batchDetails?.totalCOD
        })
        return { success: true }
      }
    }
    
    // Download the PDF blob
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `load-sheet-${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return { success: true, base64: base64String }
  }

  return { success: false }
}

export async function saveShipperAdvice(token: string, trackingNumber: string, statusId: number, remarks: string) {
  const res = await axios.put(
    `${BASE}/order/v2/save-shipper-advice`,
    { trackingNumber, statusId, remarks },
    { headers: headers(token) }
  )
  return res.data
}

export async function trackOrder(token: string, trackingNumber: string) {
  const cleanCN = (trackingNumber || '').trim()
  if (!cleanCN) {
    return { statusCode: 400, statusMessage: 'Tracking number is missing' }
  }

  // 1. High-fidelity Serverless Tracking Proxy (/api/track)
  // Queries https://postex.pk/api/tracking-order directly on the server without browser CORS blocks.
  // This guarantees 100% exact match with postex.pk/tracking portal in real time.
  try {
    const proxyRes = await axios.post(
      '/api/track',
      { trackingNumber: cleanCN },
      { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
    )
    if (proxyRes?.data && (proxyRes.data.statusCode === 200 || proxyRes.data.statusCode === '200' || proxyRes.data.dist)) {
      return proxyRes.data
    }
  } catch (proxyErr: any) {
    console.warn('Real-time tracking proxy failed, falling back to direct merchant API:', proxyErr?.message)
  }

  // 2. Fallback: Authenticated Merchant API
  if (token && token.trim()) {
    try {
      const res = await axios.get(
        `${BASE}/order/v1/track-order/${cleanCN}`,
        { headers: headers(token) }
      )
      if (res?.data && (res.data.statusCode === 200 || res.data.statusCode === '200' || res.data.dist)) {
        return res.data
      }
    } catch (err: any) {
      console.warn('Merchant track-order failed:', err?.message)
    }
  }

  // 3. Fallback: Direct public tracking endpoint (in case proxy is bypassed)
  try {
    const pubRes = await axios.post(
      `${POSTEX_PUBLIC_HOST}/api/tracking-order`,
      { trackingNumber: cleanCN },
      { headers: { 'Content-Type': 'application/json' } }
    )
    if (pubRes?.data && (pubRes.data.statusCode === 200 || pubRes.data.statusCode === '200' || pubRes.data.dist)) {
      return pubRes.data
    }
  } catch (pubErr: any) {
    console.warn('Public tracking-order fallback failed:', pubErr?.message)
  }

  return { statusCode: 400, statusMessage: 'Tracking status not found' }
}

export async function fetchAllMerchantOrders(
  token: string, 
  startDate?: string, 
  endDate?: string
): Promise<any[]> {
  if (!token || !token.trim()) return []
  const now = new Date()
  const end = endDate || new Date(now.getTime() + 86400000).toISOString().split('T')[0]
  const past = new Date(now.getTime() - 180 * 86400000)
  const start = startDate || past.toISOString().split('T')[0]

  try {
    const res = await axios.get(
      `${BASE}/order/v1/get-all-order?startDate=${start}&endDate=${end}&orderStatusId=0`,
      { headers: headers(token) }
    )
    if (res.data && Array.isArray(res.data.dist)) {
      return res.data.dist
    }
  } catch (err: any) {
    console.warn('Failed to fetch all orders from PostEx API:', err?.response?.data || err.message)
  }
  return []
}
