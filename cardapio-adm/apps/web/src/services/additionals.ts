import { api } from './api'
import type {
  Additional,
  AdditionalGroup,
  CreateAdditionalGroupInput,
  CreateAdditionalInput,
  UpdateAdditionalGroupInput,
  UpdateAdditionalInput,
} from '@/types'

export const additionalsService = {
  list: () => api.get<AdditionalGroup[]>('/additional-groups'),

  getById: (id: string) => api.get<AdditionalGroup>(`/additional-groups/${id}`),

  create: (input: CreateAdditionalGroupInput) =>
    api.post<AdditionalGroup>('/additional-groups', input),

  update: (id: string, input: UpdateAdditionalGroupInput) =>
    api.patch<AdditionalGroup>(`/additional-groups/${id}`, input),

  delete: (id: string) => api.delete(`/additional-groups/${id}`),

  async linkProducts(groupId: string, productIds: string[]) {
    const current = await api.get<AdditionalGroup & { products?: Array<{ id: string }> }>(
      `/additional-groups/${groupId}`,
    )
    const linkedIds = new Set((current.products ?? []).map((p) => p.id))

    for (const productId of productIds) {
      if (!linkedIds.has(productId)) {
        await api.post(`/additional-groups/${groupId}/products`, { productId })
      }
    }

    for (const id of linkedIds) {
      if (!productIds.includes(id)) {
        await api.delete(`/additional-groups/${groupId}/products/${id}`)
      }
    }

    return api.get<AdditionalGroup>(`/additional-groups/${groupId}`)
  },

  createOption: (groupId: string, input: CreateAdditionalInput) =>
    api.post<Additional>(`/additional-groups/${groupId}/additionals`, input),

  updateOption: (_groupId: string, optionId: string, input: UpdateAdditionalInput) =>
    api.patch<Additional>(`/additional-groups/additionals/${optionId}`, input),

  deleteOption: (_groupId: string, optionId: string) =>
    api.delete(`/additional-groups/additionals/${optionId}`),
}
