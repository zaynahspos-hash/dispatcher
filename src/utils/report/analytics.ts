import { BookedParcel, getStatusCategory, parseCODAmount } from '../../components/history/types'
import {
  ExecutiveReportAnalytics,
  StatusMilestoneMetric,
  CityMetric,
  PrefixMetric
} from './types'

/**
 * Intelligent Reference / Order Number Prefix Extractor
 * Identifies leading alpha channels (e.g. AH858 -> AH), hashtags (#3072529 -> #307),
 * or alphanumeric sequences for deeper channel ranking.
 */
export function extractOrderPrefix(id: string, tracking?: string): string {
  const raw = (id || '').trim()
  if (!raw || raw.toLowerCase() === 'undefined' || raw.toLowerCase() === 'null') {
    if (tracking && tracking.length >= 3) return tracking.slice(0, 3)
    return 'OTHER'
  }

  // 1. Check for leading alphabetic characters (e.g., "AH858", "ORD-123", "ZM_44")
  const alphaMatch = raw.match(/^([a-zA-Z]{2,4})[\-_#\s]?\d+/) || raw.match(/^([a-zA-Z]{2,4})/)
  if (alphaMatch && alphaMatch[1]) {
    return alphaMatch[1].toUpperCase()
  }

  // 2. Check for "#" followed by prefix (e.g. "#3072529" -> "#307" or "#AH12" -> "#AH")
  const hashAlphaMatch = raw.match(/^#([a-zA-Z]{2,4})/)
  if (hashAlphaMatch && hashAlphaMatch[1]) {
    return `#${hashAlphaMatch[1].toUpperCase()}`
  }
  const hashNumMatch = raw.match(/^#(\d{2,3})/)
  if (hashNumMatch && hashNumMatch[1]) {
    return `#${hashNumMatch[1]}`
  }

  // 3. If starts with #, take first 4 chars (e.g. "#307")
  if (raw.startsWith('#') && raw.length >= 4) {
    return raw.slice(0, 4).toUpperCase()
  }

  // 4. Clean alphanumeric prefix
  const clean = raw.replace(/[^a-zA-Z0-9]/g, '')
  if (clean.length >= 3) {
    return clean.slice(0, 3).toUpperCase()
  }

  return raw.slice(0, 3).toUpperCase() || 'OTHER'
}

/**
 * Computes complete executive logistics analytics from a list of parcels.
 */
export function computeExecutiveAnalytics(
  parcels: BookedParcel[],
  reportId?: string
): ExecutiveReportAnalytics {
  const totalParcels = parcels.length
  let totalCOD = 0

  let deliveredCount = 0
  let deliveredCOD = 0
  let returnedCount = 0
  let returnedCOD = 0
  let inTransitCount = 0
  let inTransitCOD = 0
  let outForDeliveryCount = 0
  let outForDeliveryCOD = 0
  let actionRequiredCount = 0
  let actionRequiredCOD = 0
  let pendingLoadsheetCount = 0
  let pendingLoadsheetCOD = 0
  let bookedCount = 0
  let bookedCOD = 0
  let cancelledCount = 0
  let cancelledCOD = 0

  const cityMap = new Map<string, { count: number; cod: number; delivered: number; inTransit: number }>()
  const prefixMap = new Map<string, { count: number; cod: number }>()

  parcels.forEach(p => {
    const cod = parseCODAmount(p.total)
    totalCOD += cod

    const cat = getStatusCategory(p.status, p.tracking, Boolean(p.hasLoadSheet))
    if (cat === 'delivered') {
      deliveredCount++
      deliveredCOD += cod
    } else if (cat === 'returned') {
      returnedCount++
      returnedCOD += cod
    } else if (cat === 'intransit') {
      inTransitCount++
      inTransitCOD += cod
    } else if (cat === 'out_for_delivery') {
      outForDeliveryCount++
      outForDeliveryCOD += cod
    } else if (cat === 'action_required') {
      actionRequiredCount++
      actionRequiredCOD += cod
    } else if (cat === 'pending_loadsheet') {
      pendingLoadsheetCount++
      pendingLoadsheetCOD += cod
    } else if (cat === 'booked') {
      bookedCount++
      bookedCOD += cod
    } else if (cat === 'cancelled') {
      cancelledCount++
      cancelledCOD += cod
    }

    // City metric
    const cityKey = (p.city || 'UNKNOWN').trim().toUpperCase()
    if (!cityMap.has(cityKey)) {
      cityMap.set(cityKey, { count: 0, cod: 0, delivered: 0, inTransit: 0 })
    }
    const cEntry = cityMap.get(cityKey)!
    cEntry.count++
    cEntry.cod += cod
    if (cat === 'delivered') cEntry.delivered++
    if (cat === 'intransit' || cat === 'out_for_delivery') cEntry.inTransit++

    // Prefix metric
    const pfx = extractOrderPrefix(p.id, p.tracking)
    if (!prefixMap.has(pfx)) {
      prefixMap.set(pfx, { count: 0, cod: 0 })
    }
    const pEntry = prefixMap.get(pfx)!
    pEntry.count++
    pEntry.cod += cod
  })

  const avgCOD = totalParcels > 0 ? Math.round(totalCOD / totalParcels) : 0

  // Delivery Success Ratio (standard e-commerce logistics KPI: delivered / (delivered + returned))
  const closedParcels = deliveredCount + returnedCount
  const deliverySuccessRatio = closedParcels > 0 
    ? Math.round((deliveredCount / closedParcels) * 1000) / 10 
    : (totalParcels > 0 ? Math.round((deliveredCount / totalParcels) * 1000) / 10 : 0)

  const returnRatio = closedParcels > 0
    ? Math.round((returnedCount / closedParcels) * 1000) / 10
    : 0

  const activePipelineCount = inTransitCount + outForDeliveryCount + bookedCount + pendingLoadsheetCount
  const pipelineShare = totalParcels > 0 ? Math.round((activePipelineCount / totalParcels) * 1000) / 10 : 0

  // Status breakdown array
  const statusBreakdown: StatusMilestoneMetric[] = [
    {
      key: 'delivered',
      label: 'Delivered',
      count: deliveredCount,
      codAmount: deliveredCOD,
      volumeShare: totalParcels > 0 ? Math.round((deliveredCount / totalParcels) * 1000) / 10 : 0,
      revenueShare: totalCOD > 0 ? Math.round((deliveredCOD / totalCOD) * 1000) / 10 : 0
    },
    {
      key: 'intransit',
      label: 'In Transit',
      count: inTransitCount,
      codAmount: inTransitCOD,
      volumeShare: totalParcels > 0 ? Math.round((inTransitCount / totalParcels) * 1000) / 10 : 0,
      revenueShare: totalCOD > 0 ? Math.round((inTransitCOD / totalCOD) * 1000) / 10 : 0
    },
    {
      key: 'out_for_delivery',
      label: 'Out for Delivery',
      count: outForDeliveryCount,
      codAmount: outForDeliveryCOD,
      volumeShare: totalParcels > 0 ? Math.round((outForDeliveryCount / totalParcels) * 1000) / 10 : 0,
      revenueShare: totalCOD > 0 ? Math.round((outForDeliveryCOD / totalCOD) * 1000) / 10 : 0
    },
    {
      key: 'booked',
      label: 'Booked',
      count: bookedCount,
      codAmount: bookedCOD,
      volumeShare: totalParcels > 0 ? Math.round((bookedCount / totalParcels) * 1000) / 10 : 0,
      revenueShare: totalCOD > 0 ? Math.round((bookedCOD / totalCOD) * 1000) / 10 : 0
    },
    {
      key: 'action_required',
      label: 'Action Required / Advice',
      count: actionRequiredCount,
      codAmount: actionRequiredCOD,
      volumeShare: totalParcels > 0 ? Math.round((actionRequiredCount / totalParcels) * 1000) / 10 : 0,
      revenueShare: totalCOD > 0 ? Math.round((actionRequiredCOD / totalCOD) * 1000) / 10 : 0
    },
    {
      key: 'pending_loadsheet',
      label: 'Pending Loadsheet',
      count: pendingLoadsheetCount,
      codAmount: pendingLoadsheetCOD,
      volumeShare: totalParcels > 0 ? Math.round((pendingLoadsheetCount / totalParcels) * 1000) / 10 : 0,
      revenueShare: totalCOD > 0 ? Math.round((pendingLoadsheetCOD / totalCOD) * 1000) / 10 : 0
    },
    {
      key: 'returned',
      label: 'Returned',
      count: returnedCount,
      codAmount: returnedCOD,
      volumeShare: totalParcels > 0 ? Math.round((returnedCount / totalParcels) * 1000) / 10 : 0,
      revenueShare: totalCOD > 0 ? Math.round((returnedCOD / totalCOD) * 1000) / 10 : 0
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      count: cancelledCount,
      codAmount: cancelledCOD,
      volumeShare: totalParcels > 0 ? Math.round((cancelledCount / totalParcels) * 1000) / 10 : 0,
      revenueShare: totalCOD > 0 ? Math.round((cancelledCOD / totalCOD) * 1000) / 10 : 0
    }
  ]

  // Top Cities ranked by volume
  const topCities: CityMetric[] = Array.from(cityMap.entries())
    .map(([city, data]) => ({
      city,
      count: data.count,
      codAmount: data.cod,
      deliveredCount: data.delivered,
      inTransitCount: data.inTransit,
      volumeShare: totalParcels > 0 ? Math.round((data.count / totalParcels) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.count - a.count || b.codAmount - a.codAmount)
    .slice(0, 15)

  // Top Prefixes ranked by volume
  const topPrefixes: PrefixMetric[] = Array.from(prefixMap.entries())
    .map(([prefix, data]) => ({
      prefix,
      count: data.count,
      codAmount: data.cod,
      avgCOD: data.count > 0 ? Math.round(data.cod / data.count) : 0,
      volumeShare: totalParcels > 0 ? Math.round((data.count / totalParcels) * 1000) / 10 : 0,
      revenueShare: totalCOD > 0 ? Math.round((data.cod / totalCOD) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.count - a.count || b.codAmount - a.codAmount)
    .slice(0, 10)

  return {
    reportId: reportId || `REP-${Date.now().toString().slice(-8)}`,
    generatedAt: new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    }),
    totalParcels,
    totalCOD,
    avgCOD,
    deliveredCount,
    deliveredCOD,
    returnedCount,
    returnedCOD,
    inTransitCount,
    inTransitCOD,
    outForDeliveryCount,
    outForDeliveryCOD,
    actionRequiredCount,
    actionRequiredCOD,
    pendingLoadsheetCount,
    pendingLoadsheetCOD,
    bookedCount,
    bookedCOD,
    cancelledCount,
    cancelledCOD,
    deliverySuccessRatio,
    returnRatio,
    pipelineShare,
    statusBreakdown,
    topCities,
    topPrefixes
  }
}
