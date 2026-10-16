import { 
  ICourierProvider, 
  CourierId, 
  CourierCapabilities, 
  CourierBookingPayload, 
  CourierBookingResult, 
  CourierTrackingStatus, 
  CourierPickupAddress 
} from '../types'
import { 
  createOrder, 
  trackOrder, 
  cancelOrder, 
  printLabels, 
  getMerchantAddresses, 
  getOrderTypes 
} from '../../utils/postexApi'

export class PostExProvider implements ICourierProvider {
  readonly id: CourierId = 'postex'
  readonly name = 'PostEx Courier V3'
  readonly capabilities: CourierCapabilities = {
    supportsNormal: true,
    supportsReplacement: true,
    supportsReversed: true,
    supportsOverland: true,
    supportsAirwayPdf: true,
    supportsLoadsheet: true,
    supportsShipperAdvice: true
  }

  async testConnection(credentials: Record<string, string>): Promise<{
    success: boolean
    latencyMs: number
    message: string
  }> {
    const token = credentials.postex_token || credentials.token
    if (!token) {
      return { success: false, latencyMs: 0, message: 'PostEx merchant API token is missing.' }
    }
    const start = performance.now()
    try {
      const res = await getOrderTypes(token)
      const latencyMs = Math.round(performance.now() - start)
      if (Number(res?.statusCode) === 200 || res?.dist) {
        return { success: true, latencyMs, message: `Connected to PostEx V3 (${latencyMs}ms)` }
      }
      return { success: false, latencyMs, message: res?.statusMessage || 'Invalid PostEx token.' }
    } catch (err: any) {
      return { success: false, latencyMs: 0, message: err.message || 'Connection failed.' }
    }
  }

  async bookOrder(
    payload: CourierBookingPayload,
    credentials: Record<string, string>
  ): Promise<CourierBookingResult> {
    const token = credentials.postex_token || credentials.token
    if (!token) {
      throw new Error('PostEx merchant token is missing.')
    }

    const parcelAdapter = {
      id: payload.orderRefNumber,
      name: payload.customerName,
      phone: payload.customerPhone,
      city: payload.cityName,
      address: payload.deliveryAddress,
      total: payload.invoicePayment,
      items: payload.items,
      weight: payload.weight,
      orderType: payload.orderType,
      detail: payload.orderDetail,
      note: payload.transactionNotes
    }

    const res = await createOrder(parcelAdapter, token, credentials as any)
    const isSuccess = String(res?.statusCode) === '200' || res?.dist?.trackingNumber

    return {
      success: !!isSuccess,
      trackingNumber: res?.dist?.trackingNumber || '',
      referenceNumber: payload.orderRefNumber,
      courier: 'postex',
      courierName: this.name,
      statusCode: res?.statusCode || (isSuccess ? 200 : 400),
      statusMessage: res?.statusMessage || (isSuccess ? 'Order booked successfully' : 'Booking failed'),
      rawResponse: res
    }
  }

  async trackOrder(
    trackingNumber: string,
    credentials: Record<string, string>
  ): Promise<CourierTrackingStatus> {
    const token = credentials.postex_token || credentials.token
    const res = await trackOrder(token || '', trackingNumber)
    return {
      trackingNumber,
      status: res?.dist?.orderStatus || res?.dist?.transactionStatus || 'Unknown',
      statusCode: String(res?.statusCode || ''),
      statusMessage: res?.statusMessage
    }
  }

  async cancelOrder(
    trackingNumber: string,
    credentials: Record<string, string>
  ): Promise<{ success: boolean; message: string }> {
    const token = credentials.postex_token || credentials.token
    const res = await cancelOrder(token || '', trackingNumber)
    const isSuccess = String(res?.statusCode) === '200'
    return {
      success: isSuccess,
      message: res?.statusMessage || (isSuccess ? 'Shipment cancelled' : 'Cancellation failed')
    }
  }

  async printLabels(
    trackingNumbers: string[],
    credentials: Record<string, string>
  ): Promise<Blob | string> {
    const token = credentials.postex_token || credentials.token
    return await printLabels(token || '', trackingNumbers)
  }

  async getPickupAddresses(
    credentials: Record<string, string>
  ): Promise<CourierPickupAddress[]> {
    const token = credentials.postex_token || credentials.token
    const res = await getMerchantAddresses(token || '')
    const list = res?.dist || []
    return list.map((item: any) => ({
      addressCode: item.addressCode,
      address: item.address,
      cityName: item.cityName,
      addressType: item.addressType
    }))
  }
}
