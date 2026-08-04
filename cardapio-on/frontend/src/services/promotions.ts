import { apiFetch } from './api'
import type { PublicPromotion } from '@/types'

export function getPromotions(slug: string) {
  return apiFetch<PublicPromotion[]>(`/public/${slug}/promotions`)
}
