import { api } from './api'
import type { Campaign, CreateCampaignInput, UpdateCampaignInput } from '@/types'

export const campaignsService = {
  list: () => api.get<Campaign[]>('/campaigns'),

  getById: (id: string) => api.get<Campaign>(`/campaigns/${id}`),

  create: (input: CreateCampaignInput) => api.post<Campaign>('/campaigns', input),

  update: (id: string, input: UpdateCampaignInput) =>
    api.patch<Campaign>(`/campaigns/${id}`, input),

  delete: (id: string) => api.delete(`/campaigns/${id}`),

  setStatus: (id: string, status: CreateCampaignInput['status']) =>
    api.patch<Campaign>(`/campaigns/${id}`, { status }),
}
