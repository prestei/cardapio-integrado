import { api } from './api'
import type { Banner, CreateBannerInput, UpdateBannerInput } from '@/types'

export const bannersService = {
  list: () => api.get<Banner[]>('/banners?includeInactive=true'),

  getById: (id: string) => api.get<Banner>(`/banners/${id}`),

  create: (input: CreateBannerInput) => api.post<Banner>('/banners', input),

  update: (id: string, input: UpdateBannerInput) =>
    api.patch<Banner>(`/banners/${id}`, input),

  delete: (id: string) => api.delete(`/banners/${id}`),

  setActive: (id: string, isActive: boolean) =>
    api.patch<Banner>(`/banners/${id}`, { isActive }),

  reorder: (id: string, sortOrder: number) =>
    api.patch<Banner>(`/banners/${id}`, { sortOrder }),
}
