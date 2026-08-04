import { api } from './api'
import type { Coupon, CreateCouponInput, UpdateCouponInput } from '@/types'

export const couponsService = {
  list: () => api.get<Coupon[]>('/coupons'),

  getById: (id: string) => api.get<Coupon>(`/coupons/${id}`),

  create: (input: CreateCouponInput) => api.post<Coupon>('/coupons', input),

  update: (id: string, input: UpdateCouponInput) =>
    api.patch<Coupon>(`/coupons/${id}`, input),

  delete: (id: string) => api.delete(`/coupons/${id}`),

  setArchived: (id: string, isArchived: boolean) =>
    api.patch<Coupon>(`/coupons/${id}`, { isArchived }),
}
