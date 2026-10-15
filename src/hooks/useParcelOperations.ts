import { useState, useEffect, useRef } from 'react'
import { parseParcelText, Parcel, Settings } from '../utils/groqParser'
import { BookingResult } from '../components/BookingResults'
import { BookedParcel } from '../components/BookedHistory'
import { createOrder, printLabels, cancelOrder } from '../utils/postexApi'
import { logUsage, supabase } from '../utils/supabaseClient'

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
}

export function useParcelOperations({
  settings,
  user,
  history,
  updateHistory,
  setActiveTab,
  fetchTokenUsage,
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
    const phoneRegex = /(?:(?:\+92|0092|92)[\s-]?3\d{2}[\s-]?\d{7}|03\d{2}[\s-]?\d{7}|3\d{2}[\s-]?\d{7})/g;
    const matches: { number: string; index: number }[] = [];
    let match;
    while ((match = phoneRegex.exec(text)) !== null) {
      matches.push({ number: match[0], index: match.index });
    }

    if (matches.length <= 1) {
      return [text];
    }

    const blocks: string[] = [];
    for (let i = 0; i < matches.length; i++) {
      const start = i === 0 ? 0 : Math.floor((matches[i - 1].index + matches[i].index) / 2);
      const end = i === matches.length - 1 ? text.length : Math.floor((matches[i].index + matches[i + 1].index) / 2);
      blocks.push(text.substring(start, end).trim());
    }
    return blocks;
  }

  async function handleParse(rawText: string) {
    const activeProvider = settings.ai_provider || 'groq'
    const activeKeyField = `${activeProvider}_api_key` as keyof Settings
    if (!settings[activeKeyField]) {
      alert(`Please configure the API key for ${activeProvider.toUpperCase()} first in Settings!`)
      setActiveTab('settings')
      return
    }
    setLoading(true)
    try {
      const blocks = splitTextByOrders(rawText)
      let completedCount = 0
      setLoadingMessage(`AI parsing: 0 of ${blocks.length} completed...`)
      
      const promises = blocks.map(async (block) => {
        try {
          const result = await parseParcelText(block, settings)
          completedCount++
          setLoadingMessage(`AI parsing: ${completedCount} of ${blocks.length} completed...`)
          return result
        } catch (error) {
          completedCount++
          setLoadingMessage(`AI parsing: ${completedCount} of ${blocks.length} completed...`)
          throw error
        }
      })
      
      const resultsArray = await Promise.all(promises)
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
      const msg = e?.response?.data?.error?.message || e?.message || 'Unknown error'
      alert('Parsing error: ' + msg)
    } finally {
      setLoading(false)
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
    const token = settings.postex_token
    const bookingResults: BookingResult[] = []
    const successTrackings: string[] = []
    const newBookings: BookedParcel[] = []

    for (let i = 0; i < parcelsToBook.length; i++) {
      const parcel = parcelsToBook[i]
      setLoadingMessage(`Booking ${i + 1}/${parcelsToBook.length}: ${parcel.name}...`)
      try {
        const res = await createOrder(token, parcel, settings)
        if (Number(res.statusCode) === 200) {
          bookingResults.push({
            ...parcel,
            status: 'success',
            tracking: res.dist?.trackingNumber,
          })
          if (res.dist?.trackingNumber) {
            successTrackings.push(res.dist.trackingNumber)
            newBookings.push({
              id: parcel.id,
              name: parcel.name,
              phone: parcel.phone,
              city: parcel.city,
              address: parcel.address,
              total: parcel.total,
              items: parcel.items,
              weight: parcel.weight,
              detail: parcel.detail,
              note: parcel.note,
              orderType: parcel.orderType || 'Normal',
              tracking: res.dist.trackingNumber,
              bookingDate: new Date().toISOString(),
              status: 'UNBOOKED'
            })
          }
        } else {
          bookingResults.push({
            ...parcel,
            status: 'error',
            error: res.message || res.statusMessage || JSON.stringify(res),
          })
        }
      } catch (e: any) {
        const data = e?.response?.data
        const errMsg = (data && (data.message || data.statusMessage || data.error || (typeof data === 'string' ? data : JSON.stringify(data)))) || e?.message || 'Connection error'
        bookingResults.push({
          ...parcel,
          status: 'error',
          error: errMsg,
        })
      }
    }

    // Merge with existing results (for "book selected")
    setResults(prev => {
      const existingIds = new Set(bookingResults.map(r => r.id))
      const filtered = prev.filter(r => !existingIds.has(r.id))
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

    const parcelToBook: Parcel = {
      id: result.id || `res_${Date.now()}`,
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

    try {
      const res = await createOrder(token, parcelToBook, settings)
      if (Number(res.statusCode) === 200) {
        const updatedResult: BookingResult = {
          ...result,
          ...parcelToBook,
          status: 'success',
          tracking: res.dist?.trackingNumber,
          error: undefined
        }

        // Update results state
        setResults(prev => prev.map(r => r.id === result.id ? updatedResult : r))

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
            status: 'UNBOOKED'
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
        
        alert('Booking Successful!')
      } else {
        const errMsg = res.message || res.statusMessage || JSON.stringify(res)
        const updatedResult: BookingResult = {
          ...result,
          ...parcelToBook,
          status: 'error',
          error: errMsg
        }
        setResults(prev => prev.map(r => r.id === result.id ? updatedResult : r))
        logUsage('booking_failed', `Failed to book single parcel for ${parcelToBook.name}. Error: ${errMsg}`)
        alert('Booking Failed: ' + errMsg)
      }
    } catch (e: any) {
      const data = e?.response?.data
      const errMsg = (data && (data.message || data.statusMessage || data.error || (typeof data === 'string' ? data : JSON.stringify(data)))) || e?.message || 'Connection error'
      const updatedResult: BookingResult = {
        ...result,
        ...parcelToBook,
        status: 'error',
        error: errMsg
      }
      setResults(prev => prev.map(r => r.id === result.id ? updatedResult : r))
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
    loadingLabels,
    handleParse,
    handleBookAll,
    handleBookSelected,
    handleBookSingle,
    handlePrintLabels,
    handleCancelOrder,
  }
}
