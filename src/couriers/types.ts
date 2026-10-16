/**
 * Unified Multi-Courier Logistics Architecture
 * Standardized interfaces for PostEx, Trax, Leopards, TCS, CallCourier, etc.
 */

export type CourierId = 'postex' | 'trax' | 'leopards' | 'tcs' | 'callcourier' | 'mnp'

export interface CourierCapabilities {
  supportsNormal: boolean
  supportsReplacement: boolean
  supportsReversed: boolean
  supportsOverland: boolean
  supportsAirwayPdf: boolean
  supportsLoadsheet: boolean
  supportsShipperAdvice: boolean
}

export interface CourierBookingPayload {
  orderRefNumber: string
  customerName: string
  customerPhone: string
  deliveryAddress: string
  cityName: string
  invoicePayment: number
  items: number
  weight: number
  orderDetail: string
  transactionNotes: string
  pickupAddressCode?: string
  orderType: 'Normal' | 'Reversed' | 'Replacement' | 'Overland'
  airwayBillCopy?: number
}

export interface CourierBookingResult {
  success: boolean
  trackingNumber: string
  referenceNumber: string
  courier: CourierId
  courierName: string
  statusCode: string | number
  statusMessage: string
  slipUrl?: string
  rawResponse?: any
}

export interface CourierTrackingStatus {
  trackingNumber: string
  status: string
  statusCode?: string
  statusMessage?: string
  history?: Array<{
    status: string
    timestamp: string
    location?: string
    remarks?: string
  }>
}

export interface CourierPickupAddress {
  addressCode: string
  address: string
  cityName: string
  addressType?: string
}

export interface ICourierProvider {
  readonly id: CourierId
  readonly name: string
  readonly capabilities: CourierCapabilities

  /**
   * Ping / verify merchant credentials
   */
  testConnection(credentials: Record<string, string>): Promise<{
    success: boolean
    latencyMs: number
    message: string
  }>

  /**
   * Book an order for delivery
   */
  bookOrder(
    payload: CourierBookingPayload,
    credentials: Record<string, string>
  ): Promise<CourierBookingResult>

  /**
   * Track real-time status of a booked consignment
   */
  trackOrder(
    trackingNumber: string,
    credentials: Record<string, string>
  ): Promise<CourierTrackingStatus>

  /**
   * Cancel an active booking
   */
  cancelOrder(
    trackingNumber: string,
    credentials: Record<string, string>
  ): Promise<{ success: boolean; message: string }>

  /**
   * Generate & download airway bill labels
   */
  printLabels(
    trackingNumbers: string[],
    credentials: Record<string, string>
  ): Promise<Blob | string>

  /**
   * Fetch registered merchant pickup locations
   */
  getPickupAddresses(
    credentials: Record<string, string>
  ): Promise<CourierPickupAddress[]>
}
