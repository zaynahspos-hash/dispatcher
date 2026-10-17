import { ICourierProvider, CourierId } from './types'
import { PostExProvider } from './providers/PostExProvider'
import { TraxProvider } from './providers/TraxProvider'
import { LeopardsProvider } from './providers/LeopardsProvider'
import { TCSProvider } from './providers/TCSProvider'

/**
 * Pluggable Multi-Courier Registry
 * Provides zero-friction extensibility for Pakistani and international couriers.
 */
class CourierRegistry {
  private providers = new Map<CourierId, ICourierProvider>()

  constructor() {
    // Register standard pluggable providers
    this.register(new PostExProvider())
    this.register(new TraxProvider())
    this.register(new LeopardsProvider())
    this.register(new TCSProvider())
  }

  register(provider: ICourierProvider): void {
    this.providers.set(provider.id, provider)
  }

  get(id: CourierId): ICourierProvider {
    const provider = this.providers.get(id)
    if (!provider) {
      throw new Error(`Courier provider "${id}" is not registered. Available: ${Array.from(this.providers.keys()).join(', ')}`)
    }
    return provider
  }

  getAll(): ICourierProvider[] {
    return Array.from(this.providers.values())
  }

  getSupportedIds(): CourierId[] {
    return Array.from(this.providers.keys())
  }
}

export const courierRegistry = new CourierRegistry()

export function getCourier(id: CourierId = 'postex'): ICourierProvider {
  return courierRegistry.get(id)
}

export function getAllCouriers(): ICourierProvider[] {
  return courierRegistry.getAll()
}
