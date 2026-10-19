import axios from 'axios'
import { Parcel, Settings } from './groqParser'

const IS_DEV = (import.meta as any).env.DEV;
const POSTEX_HOST = IS_DEV ? '/postex-api' : 'https://api.postex.pk';
const BASE = `${POSTEX_HOST}/services/integration/api`

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

  // Apply default product name if checked, otherwise override with default_product
  const deliveryDetail = settings.postex_product_check === '0'
    ? (settings.default_product || 'Kids Clothes')
    : (parcel.detail || settings.default_product || 'Kids Clothes')

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

export async function generateLoadSheet(token: string, pickupAddressCode: string, trackingNumbers: string[]) {
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
    trackingNumbers
  }

  let blob: Blob | null = null

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
  } catch (err) {
    console.warn('PostEx Load Sheet API v1 failed, trying v2...', err)
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
    } catch (err2: any) {
      console.error('PostEx Load Sheet API v2 failed too:', err2)
      if (err2.response?.data instanceof Blob) {
        const text = await err2.response.data.text()
        try {
          const parsed = JSON.parse(text)
          const errorMsg = parsed.statusMessage || parsed.message || parsed.error || text
          throw new Error(errorMsg)
        } catch {
          throw new Error(text || `PostEx Load Sheet API v2 failed with status ${err2.response.status}`)
        }
      }
      throw err2
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
            const bin = atob(b64)
            const bytes = new Uint8Array(bin.length)
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
            blob = new Blob([bytes.buffer], { type: 'application/pdf' })
          } else {
            return false
          }
        } else {
          throw new Error(parsed.statusMessage || parsed.message || 'API error generating load sheet')
        }
      } catch (e: any) {
        throw new Error(e.message || 'API error generating load sheet')
      }
    }
    
    // Download the PDF blob
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `load-sheet-${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return true
  }
  return false
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
  const res = await axios.get(
    `${BASE}/order/v1/track-order/${trackingNumber}`,
    { headers: headers(token) }
  )
  return res.data
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
