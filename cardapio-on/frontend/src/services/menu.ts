import { apiFetch } from './api'
import type { MenuResponse } from '@/types'

export function getMenu(slug: string) {
  return apiFetch<MenuResponse>(`/public/${slug}/menu`)
}
