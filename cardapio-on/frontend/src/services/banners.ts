import { apiFetch } from './api'
import type { PublicBanner } from '@/types'

export function getBanners(slug: string) {
  return apiFetch<PublicBanner[]>(`/public/${slug}/banners`)
}

export function registerBannerView(slug: string, bannerId: string) {
  return apiFetch<void>(`/public/${slug}/banners/${bannerId}/view`, { method: 'POST' })
}

export function registerBannerClick(slug: string, bannerId: string) {
  return apiFetch<void>(`/public/${slug}/banners/${bannerId}/click`, { method: 'POST' })
}
