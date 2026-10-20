import { useState, useEffect, useRef } from 'react'
import { parseParcelText, parseTextFallback, splitRawTextIntoOrderBlocks, Parcel, Settings } from '../utils/groqParser'
import { BookingResult } from '../components/BookingResults'
import { BookedParcel } from '../components/BookedHistory'
import { createOrder, printLabels, cancelOrder } from '../utils/postexApi'
import { logUsage, supabase } from '../utils/supabaseClient'
import { LoadingProgress } from '../components/layout/GlobalLoadingOverlay'
import { buildHistoryIdSet, getNextAvailableSerial, cleanSerialId, isDuplicateRefError } from '../utils/orderSerialHelper'
import { useToast } from '../components/common/Toast'

export function cleanPhoneNumber(phone: string): string {
  if (!phone) return ''
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('923')) {
    digits = '0' + digits.slice(2)
  } else if (digits.startsWith('00923')) {
    digits = '0' + digits.slice(4)
  }
  return digits
}

interface UseParcelOperationsProps {
  settings: Settings
  user: any
  history: BookedParcel[]
  updateHistory: (newHistory: BookedParcel[]) => void
  setActiveTab: (tab: any) => void
  fetchTokenUsage: () => void
  updateSetting?: (key: keyof Settings | Partial<Settings>, value?: string) => void
}

export function useParcelOperations({
  settings,
  user,
  history,
  updateHistory,
  setActiveTab,
  fetchTokenUsage,
  updateSetting,
}: UseParcelOperationsProps) {
  const [parcels, setParcels] = useState<Parcel[]>(() => {
    try {
      const userKey = user?.id ? `zaynah_staged_parcels_${user.id}` : 'zaynah_staged_parcels_guest'
      const stored = localStorage.getItem(userKey) || localStorage.getItem('zaynah_staged_parcels_guest') || localStorage.getItem('staged_parcels_backup')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (err) {
      console.error('Error loading initial staged parcels:', err)
    }
    return []
  })
  const [results, setResults] = useState<BookingResult[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null)
  const [loadingLabels, setLoadingLabels] = useState(false)

  const isLoadedRef = useRef(false)

  // Sync staged parcels with localStorage so they survive page refreshes
  useEffect(() => {
    try {
      const userKey = user?.id ? `zaynah_staged_parcels_${user.id}` : 'zaynah_staged_parcels_guest'
      if (parcels && parcels.length > 0) {
        const serialized = JSON.stringify(parcels)
        localStorage.setItem(userKey, serialized)
        localStorage.setItem('zaynah_staged_parcels_guest', serialized)
        localStorage.setItem('staged_parcels_backup', serialized)
      } else if (isLoadedRef.current) {
        localStorage.removeItem(userKey)
        localStorage.removeItem('zaynah_staged_parcels_guest')
        localStorage.removeItem('staged_parcels_backup')
      }
      isLoadedRef.current = true
    } catch (err) {
      console.error('Error syncing staged parcels to localStorage:', err)
    }
  }, [parcels, user])

  // Sync when user auth loads or switches
  useEffect(() => {
    if (user?.id) {
      const userKey = `zaynah_staged_parcels_${user.id}`
      const stored = localStorage.getItem(userKey) || localStorage.getItem('zaynah_staged_parcels_guest') || localStorage.getItem('staged_parcels_backup')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0 && parcels.length === 0) {
            setParcels(parsed)
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }, [user])

  function splitTextByOrders(text: string): string[] {
    return splitRawTextIntoOrderBlocks(text)
  }

  const toast = useToast()

  async function handleParse(rawText: string) {
    const activeProvider = (settings.ai_provider || 'groq').toLowerCase()
    const activeKeyField = `${activeProvider}_api_key` as keyof Settings
    if (!settings[activeKeyField]) {
      alert(`Please configure the API key for ${activeProvider.toUpperCase()} first in Settings!`)
      setActiveTab('settings')
      return
    }

    // Determine Provider Model & Safe Rate Limit Pacing
    let activeModel = 'llama-3.3-70b-versatile'
    let pacingRPM = '30 RPM Free Tier'
    let pacingDelayMs = 1800

    if (activeProvider === 'gemini') {
      activeModel = settings.gemini_model || 'gemini-1.5-flash'
      pacingRPM = '15 RPM Free Tier'
      pacingDelayMs = 2800 // Gemini free tier allows 15 requests per minute
    } else if (activeProvider === 'groq') {
      activeModel = settings.groq_model || 'llama-3.3-70b-versatile'
      pacingRPM = '30 RPM Free Tier'
      pacingDelayMs = 1800
    } else if (activeProvider === 'openai') {
      activeModel = settings.openai_model || 'gpt-4o-mini'
      pacingRPM = '20 RPM Safe Guard'
      pacingDelayMs = 2200
    } else {
      activeModel = (settings as any)[`${activeProvider}_model`] || activeProvider
      pacingRPM = 'Safe Pacing Guard'
      pacingDelayMs = 1800
    }

    setLoading(true)
    const blocks = splitTextByOrders(rawText)
    const totalOrders = Math.max(1, blocks.length)
    const historyIdSet = buildHistoryIdSet(history)

    try {
      setLoadingProgress({
        title: `Extracting with ${activeProvider.toUpperCase()}`,
        step: `Splitting text into ${totalOrders} order block(s)...`,
        current: 0,
        total: totalOrders,
        done: 0,
        remaining: totalOrders,
        percentage: 10,
        modelName: activeModel,
        providerName: activeProvider,
        rateLimitInfo: pacingRPM
      })

      // Fast-path: For <= 6 orders, parse in a single unified call
      if (blocks.length <= 6) {
        setLoadingMessage(`Extracting & cleaning orders with ${activeProvider.toUpperCase()}...`)
        setLoadingProgress({
          title: `Extracting with ${activeProvider.toUpperCase()}`,
          step: `AI Neural model extracting details for ${totalOrders} order(s)...`,
          current: 1,
          total: totalOrders,
          done: 0,
          remaining: totalOrders,
          percentage: 40,
          estimatedSecondsRemaining: 4,
          modelName: activeModel,
          providerName: activeProvider,
          rateLimitInfo: pacingRPM
        })

        const tStart = performance.now()
        const result = await parseParcelText(rawText, settings, historyIdSet)
        const callLatency = Math.round(performance.now() - tStart)

        if (result.nextSerialNum !== undefined && updateSetting) {
          updateSetting('order_id_next_num', String(result.nextSerialNum))
        }

        setLoadingProgress({
          title: `Normalizing Logistics Data`,
          step: `Matching 500+ PostEx cities & sanitizing phone numbers...`,
          current: result.parcels.length,
          total: totalOrders,
          done: result.parcels.length,
          remaining: 0,
          percentage: 100,
          latencyMs: callLatency,
          estimatedSecondsRemaining: 0,
          modelName: activeModel,
          providerName: activeProvider,
          rateLimitInfo: pacingRPM
        })

        setParcels(result.parcels)
        await logUsage('order_parsed', `Successfully parsed ${result.parcels.length} parcel(s) using ${activeProvider.toUpperCase()}. Tokens used: ${result.tokensUsed}`)
        fetchTokenUsage()
        setActiveTab('table')
        return
      }

      // Multi-Batch Rate-Limit Safe Pipeline for large pastes (> 6 orders)
      const chunkSize = 4 // Safe chunking to prevent TPM overflow and request timeouts
      const totalBatches = Math.ceil(blocks.length / chunkSize)
      let completedCount = 0
      let avgLatencyMs = 1200
      const resultsArray: any[] = []
      let runningSettings = { ...settings }

      for (let i = 0; i < blocks.length; i += chunkSize) {
        const batchNum = Math.floor(i / chunkSize) + 1
        const remainingBatches = totalBatches - (batchNum - 1)
        const estSecondsLeft = Math.max(1, Math.round(remainingBatches * ((avgLatencyMs / 1000) + (pacingDelayMs / 1000))))

        const chunk = blocks.slice(i, i + chunkSize).join('\n\n--- ORDER SEPARATOR ---\n\n')
        const currentBatch = Math.min(chunkSize, blocks.length - i)

        setLoadingMessage(`AI parsing: Batch ${batchNum}/${totalBatches} (${completedCount} of ${blocks.length} orders)...`)
        setLoadingProgress({
          title: `Extracting with ${activeProvider.toUpperCase()}`,
          step: `Processing batch ${batchNum} of ${totalBatches} (${completedCount} of ${blocks.length} completed)...`,
          current: completedCount,
          total: blocks.length,
          done: completedCount,
          remaining: blocks.length - completedCount,
          percentage: Math.round((completedCount / blocks.length) * 100),
          latencyMs: avgLatencyMs,
          estimatedSecondsRemaining: estSecondsLeft,
          modelName: activeModel,
          providerName: activeProvider,
          rateLimitInfo: pacingRPM,
          batchIndex: batchNum,
          totalBatches
        })

        const tBatchStart = performance.now()
        const res = await parseParcelText(chunk, runningSettings, historyIdSet)
        const batchDuration = Math.round(performance.now() - tBatchStart)
        avgLatencyMs = Math.round((avgLatencyMs + batchDuration) / 2)

        if (res) {
          resultsArray.push(res)
          res.parcels.forEach(p => {
            if (p.id) historyIdSet.add(cleanSerialId(p.id))
          })
          if (res.nextSerialNum !== undefined) {
            runningSettings = { ...runningSettings, order_id_next_num: String(res.nextSerialNum) }
          }
        }

        completedCount += currentBatch

        // If another batch remains, insert rate-limit safe delay to safeguard free tier
        if (i + chunkSize < blocks.length) {
          const nextEstSeconds = Math.max(1, Math.round((totalBatches - batchNum) * ((avgLatencyMs / 1000) + (pacingDelayMs / 1000))))
          setLoadingProgress({
            title: `Rate Limit Safe Guard`,
            step: `Pacing ${(pacingDelayMs / 1000).toFixed(1)}s between batches to safeguard ${activeProvider.toUpperCase()} free tier limit...`,
            current: completedCount,
            total: blocks.length,
            done: completedCount,
            remaining: blocks.length - completedCount,
            percentage: Math.round((completedCount / blocks.length) * 100),
            latencyMs: batchDuration,
            estimatedSecondsRemaining: nextEstSeconds,
            modelName: activeModel,
            providerName: activeProvider,
            rateLimitInfo: pacingRPM,
            batchIndex: batchNum,
            totalBatches
          })
          await new Promise(resolve => setTimeout(resolve, pacingDelayMs))
        }
      }

      if (runningSettings.order_id_next_num !== settings.order_id_next_num && updateSetting) {
        updateSetting('order_id_next_num', runningSettings.order_id_next_num)
      }

      const allParsed: Parcel[] = []
      let totalTokens = 0
      resultsArray.forEach(res => {
        if (res) {
          allParsed.push(...res.parcels)
          totalTokens += res.tokensUsed
        }
      })

      setParcels(allParsed)
      await logUsage('order_parsed', `Successfully parsed ${blocks.length} text block(s) into ${allParsed.length} parcel(s) using ${activeProvider.toUpperCase()}. Tokens used: ${totalTokens}`)
      fetchTokenUsage()
      setActiveTab('table')
    } catch (e: any) {
      console.warn('[AI Parse Error] Rate limit or API error encountered. Activating zero-loss fallback:', e)
      setLoadingProgress({
        title: 'Zero-Loss Rule Engine',
        step: 'AI quota/rate limit reached — safeguarding orders with algorithmic parser...',
        current: 0,
        total: blocks.length,
        done: 0,
        remaining: blocks.length,
        percentage: 85,
        modelName: 'Rule Engine',
        rateLimitInfo: 'Zero-Loss Fallback'
      })

      // Zero-Loss Fallback: Extract orders algorithmically so merchant data is NEVER lost
      const fallbackResult = parseTextFallback(rawText, settings, historyIdSet)
      if (fallbackResult.parcels.length > 0) {
        setParcels(fallbackResult.parcels)
        if (fallbackResult.nextSerialNum !== undefined && updateSetting) {
          updateSetting('order_id_next_num', String(fallbackResult.nextSerialNum))
        }
        toast.warning(
          'AI Rate Limit Safeguard Active',
          `Parsed ${fallbackResult.parcels.length} order(s) via rule engine to bypass AI limits. Orders are safe!`
        )
        setActiveTab('table')
        return
      }

      const msg = e?.response?.data?.error?.message || e?.message || 'Unknown error'
      alert('Parsing error: ' + msg)
    } finally {
      setLoading(false)
      setLoadingProgress(null)
    }
  }

  async function bookParcels(parcelsToBook: Parcel[]) {
    if (!settings.postex_token) {
      alert('PostEx token missing! Please configure in Settings.')
      setActiveTab('settings')
      return
    }
    if (!settings.postex_pickup) {
      alert('Pickup address code missing! Please configure in Settings.')
      setActiveTab('settings')
      return
    }

    setLoading(true)
    setLoadingMessage(`Booking ${parcelsToBook.length} parcel(s) on PostEx...`)
    setLoadingProgress({
      title: 'PostEx Dispatch Engine',
      step: `Connecting to PostEx V3 API for ${parcelsToBook.length} parcel(s)...`,
      current: 0,
      total: parcelsToBook.length,
      done: 0,
      remaining: parcelsToBook.length,
      percentage: 5
    })
    const token = settings.postex_token
    const bookingResults: BookingResult[] = []
    const successTrackings: string[] = []
    const newBookings: BookedParcel[] = []
    const updatedParcelsMap = new Map<string, string>()

    const prefix = settings.order_id_prefix !== undefined ? settings.order_id_prefix : 'Ord-'
    let currentNextNum = parseInt(settings.order_id_next_num || '1001', 10)
    if (isNaN(currentNextNum)) currentNextNum = 1001
    const usedSerialsInSession = buildHistoryIdSet(history)
    let serialsAdvanced = false
    let avgBookingLatency = 450
    let lastCallLatency = 0

    for (let i = 0; i < parcelsToBook.length; i++) {
      const originalParcel = parcelsToBook[i]
      let effectiveParcel = { ...originalParcel }
      const originalParcelId = originalParcel.id

      // Proactively auto-assign next available serial if already in DB or earlier in this session
      const cleanId = cleanSerialId(effectiveParcel.id)
      if (cleanId && usedSerialsInSession.has(cleanId)) {
        const { nextId, nextNum } = getNextAvailableSerial(prefix, currentNextNum, usedSerialsInSession)
        effectiveParcel.id = nextId
        currentNextNum = nextNum
        serialsAdvanced = true
      }
      usedSerialsInSession.add(cleanSerialId(effectiveParcel.id))

      const remainingParcels = parcelsToBook.length - i
      const estSeconds = Math.max(1, Math.round(remainingParcels * (avgBookingLatency / 1000)))

      setLoadingMessage(`Booking ${i + 1}/${parcelsToBook.length}: ${effectiveParcel.name} (${effectiveParcel.id})...`)
      setLoadingProgress({
        title: 'Booking on PostEx V3',
        step: `Generating airway bill for ${effectiveParcel.name} (${effectiveParcel.city})...`,
        current: i + 1,
        total: parcelsToBook.length,
        done: i,
        remaining: parcelsToBook.length - i,
        percentage: Math.round(((i) / parcelsToBook.length) * 100),
        modelName: 'PostEx V3',
        rateLimitInfo: 'Safe Dispatch',
        latencyMs: lastCallLatency,
        estimatedSecondsRemaining: estSeconds
      })

      const tCallStart = performance.now()
      try {
        let res = await createOrder(token, effectiveParcel, settings)
        lastCallLatency = Math.round(performance.now() - tCallStart)
        avgBookingLatency = Math.round((avgBookingLatency + lastCallLatency) / 2)
        let initialError = res.message || res.statusMessage || ''

        // If PostEx returns duplicate order error, auto-assign next serial & retry once
        if (Number(res.statusCode) !== 200 && isDuplicateRefError(initialError)) {
          const { nextId, nextNum } = getNextAvailableSerial(prefix, currentNextNum, usedSerialsInSession)
          effectiveParcel.id = nextId
          currentNextNum = nextNum
          serialsAdvanced = true
          usedSerialsInSession.add(cleanSerialId(nextId))
          res = await createOrder(token, effectiveParcel, settings)
        }

        if (Number(res.statusCode) === 200) {
          if (effectiveParcel.id !== originalParcelId) {
            updatedParcelsMap.set(originalParcelId, effectiveParcel.id)
          }
          bookingResults.push({
            ...effectiveParcel,
            status: 'success',
            tracking: res.dist?.trackingNumber,
          })
          if (res.dist?.trackingNumber) {
            successTrackings.push(res.dist.trackingNumber)
            newBookings.push({
              id: effectiveParcel.id,
              name: effectiveParcel.name,
              phone: effectiveParcel.phone,
              city: effectiveParcel.city,
              address: effectiveParcel.address,
              total: effectiveParcel.total,
              items: effectiveParcel.items,
              weight: effectiveParcel.weight,
              detail: effectiveParcel.detail,
              note: effectiveParcel.note,
              orderType: effectiveParcel.orderType || 'Normal',
              tracking: res.dist.trackingNumber,
              bookingDate: new Date().toISOString(),
              status: 'UNBOOKED',
              whatsapp_sent: false,
              whatsappSent: false
            })
          }
        } else {
          bookingResults.push({
            ...effectiveParcel,
            status: 'error',
            error: res.message || res.statusMessage || JSON.stringify(res),
          })
        }
      } catch (e: any) {
        const data = e?.response?.data
        const errMsg = (data && (data.message || data.statusMessage || data.error || (typeof data === 'string' ? data : JSON.stringify(data)))) || e?.message || 'Connection error'

        // If caught error is duplicate reference, auto-assign next serial and retry once
        if (isDuplicateRefError(errMsg)) {
          try {
            const { nextId, nextNum } = getNextAvailableSerial(prefix, currentNextNum, usedSerialsInSession)
            effectiveParcel.id = nextId
            currentNextNum = nextNum
            serialsAdvanced = true
            usedSerialsInSession.add(cleanSerialId(nextId))
            const retryRes = await createOrder(token, effectiveParcel, settings)
            if (Number(retryRes.statusCode) === 200) {
              if (effectiveParcel.id !== originalParcelId) {
                updatedParcelsMap.set(originalParcelId, effectiveParcel.id)
              }
              bookingResults.push({
                ...effectiveParcel,
                status: 'success',
                tracking: retryRes.dist?.trackingNumber,
              })
              if (retryRes.dist?.trackingNumber) {
                successTrackings.push(retryRes.dist.trackingNumber)
                newBookings.push({
                  id: effectiveParcel.id,
                  name: effectiveParcel.name,
                  phone: effectiveParcel.phone,
                  city: effectiveParcel.city,
                  address: effectiveParcel.address,
                  total: effectiveParcel.total,
                  items: effectiveParcel.items,
                  weight: effectiveParcel.weight,
                  detail: effectiveParcel.detail,
                  note: effectiveParcel.note,
                  orderType: effectiveParcel.orderType || 'Normal',
                  tracking: retryRes.dist.trackingNumber,
                  bookingDate: new Date().toISOString(),
                  status: 'UNBOOKED',
                  whatsapp_sent: false,
                  whatsappSent: false
                })
              }
              continue
            }
          } catch (retryErr) {
            // fall through to error push
          }
        }

        bookingResults.push({
          ...effectiveParcel,
          status: 'error',
          error: errMsg,
        })
      }
    }

    if (serialsAdvanced && updateSetting) {
      updateSetting('order_id_next_num', String(currentNextNum))
    }
    if (updatedParcelsMap.size > 0) {
      setParcels(prev => prev.map(p => {
        const newId = updatedParcelsMap.get(p.id)
        return newId ? { ...p, id: newId } : p
      }))
    }

    // Merge with existing results (for "book selected")
    setResults(prev => {
      const incomingIds = new Set(bookingResults.map(r => r.id))
      const oldReplacedIds = new Set(Array.from(updatedParcelsMap.keys()))
      const filtered = prev.filter(r => !incomingIds.has(r.id) && !oldReplacedIds.has(r.id))
      return [...filtered, ...bookingResults]
    })

    if (newBookings.length > 0) {
      updateHistory([...newBookings, ...history])
      
      if (user) {
        // Normalize and deduplicate customers in-memory before upserting
        // RULE D13: snake_case table 'customers', columns 'user_id', 'updated_at'
        const uniqueCustomersMap = new Map<string, { user_id: string; phone: string; name: string }>()
        newBookings.forEach(b => {
          const cleanPhone = cleanPhoneNumber(b.phone)
          const cleanName = (b.name || '').trim()
          if (cleanPhone && cleanName) {
            uniqueCustomersMap.set(cleanPhone, {
              user_id: user.id,
              phone: cleanPhone,
              name: cleanName
            })
          }
        })
        const customerUpserts = Array.from(uniqueCustomersMap.values())

        if (customerUpserts.length > 0) {
          supabase
            .from('customers')
            .upsert(
              customerUpserts.map(c => ({ ...c, updated_at: new Date().toISOString() })),
              { onConflict: 'user_id,phone', ignoreDuplicates: false }
            )
            .then(({ error }) => {
              if (error) console.error('Failed to upsert customers:', error)
            })
        }
      }
    }

    if (successTrackings.length > 0) {
      logUsage('order_booked', `Successfully booked ${successTrackings.length} parcel(s) in bulk. Trackings: ${successTrackings.join(', ')}`)
    }
    const failedCount = bookingResults.filter(r => r.status === 'error').length
    if (failedCount > 0) {
      logUsage('booking_failed', `Failed to book ${failedCount} parcel(s) during bulk booking.`)
    }

    setActiveTab('results')
    setLoading(false)
    setLoadingProgress(null)

    // Auto print labels
    if (successTrackings.length > 0) {
      setLoadingLabels(true)
      try {
        await printLabels(token, successTrackings)
      } catch (e: any) {
        console.error('Label print error:', e?.message)
      } finally {
        setLoadingLabels(false)
      }
    }
  }

  async function handleBookAll() {
    await bookParcels(parcels)
  }

  async function handleBookSelected(selectedIndices: number[]) {
    const selectedParcels = selectedIndices.map(i => parcels[i]).filter(Boolean)
    if (selectedParcels.length === 0) return
    await bookParcels(selectedParcels)
  }

  async function handlePrintLabels() {
    const trackings = results
      .filter(r => r.status === 'success' && r.tracking)
      .map(r => r.tracking!)
    if (trackings.length === 0) return
    setLoadingLabels(true)
    try {
      await printLabels(settings.postex_token, trackings)
    } catch (e: any) {
      alert('Label download error: ' + (e?.message || 'Unknown error'))
    } finally {
      setLoadingLabels(false)
    }
  }

  async function handleCancelOrder(trackingNumber: string) {
    if (!settings.postex_token) return
    const res = await cancelOrder(settings.postex_token, trackingNumber)
    if (res.statusCode === '0200' || res.statusCode === 200 || res.statusMessage === 'Success' || res.statusCode === '200') {
      setResults(prev =>
        prev.map(item =>
          item.tracking === trackingNumber ? { ...item, status: 'cancelled' } : item
        )
      )
      logUsage('order_cancelled', `Cancelled order with tracking: ${trackingNumber}`)
    } else {
      throw new Error(res.message || res.statusMessage || 'Cancellation request rejected by PostEx.')
    }
  }

  async function handleBookSingle(result: BookingResult) {
    if (!settings.postex_token) {
      alert('PostEx token missing! Please configure in Settings.')
      setActiveTab('settings')
      return
    }
    if (!settings.postex_pickup) {
      alert('Pickup address code missing! Please configure in Settings.')
      setActiveTab('settings')
      return
    }

    setLoading(true)
    setLoadingMessage(`Booking ${result.name} on PostEx...`)
    const token = settings.postex_token

    const prefix = settings.order_id_prefix !== undefined ? settings.order_id_prefix : 'Ord-'
    let currentNextNum = parseInt(settings.order_id_next_num || '1001', 10)
    if (isNaN(currentNextNum)) currentNextNum = 1001
    const usedSerialsInSession = buildHistoryIdSet(history)

    const originalParcelId = result.id || `res_${Date.now()}`
    let parcelToBook: Parcel = {
      id: originalParcelId,
      name: result.name,
      phone: result.phone,
      city: result.city,
      address: result.address,
      total: Number(result.total) || 0,
      items: Number(result.items) || Number(settings.default_items) || 1,
      weight: Number(result.weight) || Number(settings.default_weight) || 0.5,
      orderType: result.orderType || 'Normal',
      airwayBillCopy: result.airwayBillCopy || 1,
      detail: result.detail || settings.default_product || 'Kids Clothes',
      note: result.note || settings.default_note || 'Call before delivery',
    }

    let serialChanged = false
    const cleanId = cleanSerialId(parcelToBook.id)
    if (cleanId && usedSerialsInSession.has(cleanId)) {
      const { nextId, nextNum } = getNextAvailableSerial(prefix, currentNextNum, usedSerialsInSession)
      parcelToBook.id = nextId
      currentNextNum = nextNum
      serialChanged = true
      usedSerialsInSession.add(cleanSerialId(nextId))
    }

    try {
      let res = await createOrder(token, parcelToBook, settings)
      let initialError = res.message || res.statusMessage || ''
      if (Number(res.statusCode) !== 200 && isDuplicateRefError(initialError)) {
        const { nextId, nextNum } = getNextAvailableSerial(prefix, currentNextNum, usedSerialsInSession)
        parcelToBook.id = nextId
        currentNextNum = nextNum
        serialChanged = true
        usedSerialsInSession.add(cleanSerialId(nextId))
        res = await createOrder(token, parcelToBook, settings)
      }

      if (Number(res.statusCode) === 200) {
        if (serialChanged && updateSetting) {
          updateSetting('order_id_next_num', String(currentNextNum))
        }
        if (serialChanged) {
          setParcels(prev => prev.map(p => p.id === originalParcelId ? { ...p, id: parcelToBook.id } : p))
        }
        const updatedResult: BookingResult = {
          ...result,
          ...parcelToBook,
          status: 'success',
          tracking: res.dist?.trackingNumber,
          error: undefined
        }

        // Update results state
        setResults(prev => prev.map(r => r.id === originalParcelId ? updatedResult : r))

        // Update history
        if (res.dist?.trackingNumber) {
          const newHistoryItem: BookedParcel = {
            id: parcelToBook.id,
            name: parcelToBook.name,
            phone: parcelToBook.phone,
            city: parcelToBook.city,
            address: parcelToBook.address,
            total: parcelToBook.total,
            items: parcelToBook.items,
            weight: parcelToBook.weight,
            detail: parcelToBook.detail,
            note: parcelToBook.note,
            tracking: res.dist.trackingNumber,
            bookingDate: new Date().toISOString(),
            status: 'UNBOOKED',
            whatsapp_sent: Boolean(parcelToBook.whatsapp_sent || parcelToBook.whatsappSent),
            whatsappSent: Boolean(parcelToBook.whatsapp_sent || parcelToBook.whatsappSent)
          }
          updateHistory([newHistoryItem, ...history])
          logUsage('order_booked', `Successfully booked single parcel for ${parcelToBook.name}. Tracking: ${res.dist.trackingNumber}`)

          if (user) {
            // RULE D13: snake_case table 'customers', columns 'user_id', 'updated_at'
            const cleanPhone = cleanPhoneNumber(parcelToBook.phone)
            const cleanName = (parcelToBook.name || '').trim()
            if (cleanPhone && cleanName) {
              supabase
                .from('customers')
                .upsert({
                  user_id: user.id,
                  phone: cleanPhone,
                  name: cleanName,
                  updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,phone', ignoreDuplicates: false })
                .then(({ error }) => {
                  if (error) console.error('Failed to upsert single customer:', error)
                })
            }
          }

          // Auto print label for this single item
          setLoadingLabels(true)
          try {
            await printLabels(token, [res.dist.trackingNumber])
          } catch (e: any) {
            console.error('Label print error:', e?.message)
          } finally {
            setLoadingLabels(false)
          }
        }
        
        alert(serialChanged ? `Booking Successful! (Auto-assigned new Order ID: ${parcelToBook.id})` : 'Booking Successful!')
      } else {
        const errMsg = res.message || res.statusMessage || JSON.stringify(res)
        const updatedResult: BookingResult = {
          ...result,
          ...parcelToBook,
          status: 'error',
          error: errMsg
        }
        setResults(prev => prev.map(r => r.id === originalParcelId ? updatedResult : r))
        logUsage('booking_failed', `Failed to book single parcel for ${parcelToBook.name}. Error: ${errMsg}`)
        alert('Booking Failed: ' + errMsg)
      }
    } catch (e: any) {
      const data = e?.response?.data
      const errMsg = (data && (data.message || data.statusMessage || data.error || (typeof data === 'string' ? data : JSON.stringify(data)))) || e?.message || 'Connection error'

      if (isDuplicateRefError(errMsg)) {
        try {
          const { nextId, nextNum } = getNextAvailableSerial(prefix, currentNextNum, usedSerialsInSession)
          parcelToBook.id = nextId
          currentNextNum = nextNum
          serialChanged = true
          usedSerialsInSession.add(cleanSerialId(nextId))
          const retryRes = await createOrder(token, parcelToBook, settings)
          if (Number(retryRes.statusCode) === 200) {
            if (serialChanged && updateSetting) {
              updateSetting('order_id_next_num', String(currentNextNum))
            }
            if (serialChanged) {
              setParcels(prev => prev.map(p => p.id === originalParcelId ? { ...p, id: parcelToBook.id } : p))
            }
            const updatedResult: BookingResult = {
              ...result,
              ...parcelToBook,
              status: 'success',
              tracking: retryRes.dist?.trackingNumber,
              error: undefined
            }
            setResults(prev => prev.map(r => r.id === originalParcelId ? updatedResult : r))
            if (retryRes.dist?.trackingNumber) {
              const newHistoryItem: BookedParcel = {
                id: parcelToBook.id,
                name: parcelToBook.name,
                phone: parcelToBook.phone,
                city: parcelToBook.city,
                address: parcelToBook.address,
                total: parcelToBook.total,
                items: parcelToBook.items,
                weight: parcelToBook.weight,
                detail: parcelToBook.detail,
                note: parcelToBook.note,
                tracking: retryRes.dist.trackingNumber,
                bookingDate: new Date().toISOString(),
                status: 'UNBOOKED',
                whatsapp_sent: Boolean(parcelToBook.whatsapp_sent || parcelToBook.whatsappSent),
                whatsappSent: Boolean(parcelToBook.whatsapp_sent || parcelToBook.whatsappSent)
              }
              updateHistory([newHistoryItem, ...history])
              logUsage('order_booked', `Successfully booked single parcel for ${parcelToBook.name}. Tracking: ${retryRes.dist.trackingNumber}`)

              if (user) {
                const cleanPhone = cleanPhoneNumber(parcelToBook.phone)
                const cleanName = (parcelToBook.name || '').trim()
                if (cleanPhone && cleanName) {
                  supabase
                    .from('customers')
                    .upsert({
                      user_id: user.id,
                      phone: cleanPhone,
                      name: cleanName,
                      updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id,phone', ignoreDuplicates: false })
                    .then(({ error }) => {
                      if (error) console.error('Failed to upsert single customer:', error)
                    })
                }
              }

              setLoadingLabels(true)
              try {
                await printLabels(token, [retryRes.dist.trackingNumber])
              } catch (e: any) {
                console.error('Label print error:', e?.message)
              } finally {
                setLoadingLabels(false)
              }
            }
            alert(`Booking Successful! (Auto-assigned new Order ID: ${parcelToBook.id})`)
            return
          }
        } catch (retryErr) {
          // fall through
        }
      }

      const updatedResult: BookingResult = {
        ...result,
        ...parcelToBook,
        status: 'error',
        error: errMsg
      }
      setResults(prev => prev.map(r => r.id === originalParcelId ? updatedResult : r))
      logUsage('booking_failed', `Failed to book single parcel for ${parcelToBook.name}. Error: ${errMsg}`)
      alert('Booking Failed: ' + errMsg)
    } finally {
      setLoading(false)
    }
  }

  return {
    parcels,
    setParcels,
    results,
    setResults,
    loading,
    loadingMessage,
    loadingProgress,
    loadingLabels,
    handleParse,
    handleBookAll,
    handleBookSelected,
    handleBookSingle,
    handlePrintLabels,
    handleCancelOrder,
  }
}
