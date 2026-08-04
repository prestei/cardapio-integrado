import { apiFetch } from './api'
import type { CustomerOrderHistoryItem, ReorderResult } from '@/types'

export function getCustomerOrderHistory(slug: string, phone: string) {
  return apiFetch<CustomerOrderHistoryItem[]>(
    `/public/${slug}/customers/${encodeURIComponent(phone)}/orders`,
  )
}

export function reorder(slug: string, phone: string, orderId: string) {
  return apiFetch<ReorderResult>(`/public/${slug}/reorder`, {
    method: 'POST',
    body: JSON.stringify({ phone, orderId }),
  })
}
