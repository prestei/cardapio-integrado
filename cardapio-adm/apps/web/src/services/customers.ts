import { api } from './api'
import type { CustomerDetail, CustomerListItem, PaginatedResponse, UpdateCustomerInput } from '@/types'

export interface ListCustomersParams {
  search?: string
  page?: number
  pageSize?: number
  isActive?: boolean
}

export const customersService = {
  list: (params: ListCustomersParams = {}) => {
    const searchParams = new URLSearchParams()
    if (params.search) searchParams.set('search', params.search)
    if (params.page) searchParams.set('page', String(params.page))
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
    if (params.isActive !== undefined) {
      searchParams.set('isActive', params.isActive ? 'true' : 'false')
    }
    const query = searchParams.toString()
    return api.get<PaginatedResponse<CustomerListItem>>(`/customers${query ? `?${query}` : ''}`)
  },

  getById: (id: string) => api.get<CustomerDetail>(`/customers/${id}`),

  update: (id: string, input: UpdateCustomerInput) =>
    api.patch<CustomerDetail>(`/customers/${id}`, input),

  delete: (id: string) => api.delete(`/customers/${id}`),
}
