import { apiFetch } from './api'
import type { FavoriteItem } from '@/types'

export function listFavorites(slug: string, phone: string) {
  return apiFetch<FavoriteItem[]>(
    `/public/${slug}/favorites?phone=${encodeURIComponent(phone)}`,
  )
}

export function addFavorite(slug: string, phone: string, productId: string) {
  return apiFetch<FavoriteItem>(`/public/${slug}/favorites`, {
    method: 'POST',
    body: JSON.stringify({ phone, productId }),
  })
}

export function removeFavorite(slug: string, phone: string, productId: string) {
  return apiFetch<void>(
    `/public/${slug}/favorites/${productId}?phone=${encodeURIComponent(phone)}`,
    { method: 'DELETE' },
  )
}
