import { api } from './api'
import type { Order, OrderFilters, OrderStatus } from '@/types'

export const ordersService = {
  list: (filters: OrderFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.type) params.set('type', filters.type)
    if (filters.search) params.set('search', filters.search)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    const query = params.toString()
    return api.get<Order[]>(`/orders${query ? `?${query}` : ''}`)
  },

  getById: (id: string) => api.get<Order>(`/orders/${id}`),

  updateStatus: (id: string, status: OrderStatus) =>
    api.patch<Order>(`/orders/${id}/status`, { status }),
}
