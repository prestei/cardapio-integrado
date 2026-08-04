import { api } from './api'
import type { CustomerDetail, CustomerListItem, UpdateCustomerInput } from '@/types'

export const customersService = {
  list: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    return api.get<CustomerListItem[]>(`/customers${query}`)
  },

  getById: (id: string) => api.get<CustomerDetail>(`/customers/${id}`),

  update: (id: string, input: UpdateCustomerInput) =>
    api.patch<CustomerDetail>(`/customers/${id}`, input),

  delete: (id: string) => api.delete(`/customers/${id}`),
}
