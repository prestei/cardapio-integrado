import { api } from './api'
import type { CreatePromotionInput, Promotion, UpdatePromotionInput } from '@/types'

export const promotionsService = {
  list: () => api.get<Promotion[]>('/promotions?includeInactive=true'),

  getById: (id: string) => api.get<Promotion>(`/promotions/${id}`),

  create: (input: CreatePromotionInput) => api.post<Promotion>('/promotions', input),

  update: (id: string, input: UpdatePromotionInput) =>
    api.patch<Promotion>(`/promotions/${id}`, input),

  delete: (id: string) => api.delete(`/promotions/${id}`),

  setActive: (id: string, isActive: boolean) =>
    api.patch<Promotion>(`/promotions/${id}`, { isActive }),
}
