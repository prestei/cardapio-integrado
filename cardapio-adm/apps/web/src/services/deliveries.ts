import { api } from './api'
import type {
  CreateDeliveryZoneInput,
  DeliveryOrder,
  DeliveryZone,
  OrderStatus,
  UpdateDeliveryZoneInput,
} from '@/types'

export const deliveryZonesService = {
  list: () => api.get<DeliveryZone[]>('/delivery/zones'),

  create: (input: CreateDeliveryZoneInput) =>
    api.post<DeliveryZone>('/delivery/zones', input),

  update: (id: string, input: UpdateDeliveryZoneInput) =>
    api.patch<DeliveryZone>(`/delivery/zones/${id}`, input),

  delete: (id: string) => api.delete(`/delivery/zones/${id}`),
}

export interface DeliveryOrderFilters {
  status?: OrderStatus
  search?: string
}

export const deliveriesService = {
  list: (filters: DeliveryOrderFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.search) params.set('search', filters.search)
    const qs = params.toString()
    return api.get<DeliveryOrder[]>(`/delivery/orders${qs ? `?${qs}` : ''}`)
  },

  assignDeliveryUser: (orderId: string, userId: string | null) =>
    api.patch<DeliveryOrder>(`/delivery/orders/${orderId}/assign`, { userId }),

  markLeft: (orderId: string) =>
    api.patch<DeliveryOrder>(`/delivery/orders/${orderId}/times`, {
      deliveryLeftAt: new Date().toISOString(),
    }),

  markCompleted: (orderId: string) =>
    api.patch<DeliveryOrder>(`/delivery/orders/${orderId}/times`, {
      deliveryCompletedAt: new Date().toISOString(),
    }),
}
