import { apiFetch } from './api'
import type { ProductDetail } from '@/types'

export function getProduct(slug: string, productId: string) {
  return apiFetch<ProductDetail>(`/public/${slug}/products/${productId}`)
}
