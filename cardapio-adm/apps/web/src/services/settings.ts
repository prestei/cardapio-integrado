import { api } from './api'
import type {
  BusinessHours,
  Establishment,
  EstablishmentSettings,
  UpdateEstablishmentSettingsInput,
} from '@/types'

type EstablishmentPayload = Establishment & {
  settings?: EstablishmentSettings | null
  businessHours?: BusinessHours[]
}

export const settingsService = {
  async getSettings() {
    const est = await api.get<EstablishmentPayload>('/establishment')
    return est.settings ?? ({} as EstablishmentSettings)
  },

  async getHours() {
    const est = await api.get<EstablishmentPayload>('/establishment')
    return est.businessHours ?? []
  },

  updateHours: (hours: BusinessHours[]) =>
    api.put<BusinessHours[]>('/establishment/business-hours', { hours }),

  async updateSettings(input: UpdateEstablishmentSettingsInput) {
    const est = await api.patch<EstablishmentPayload>('/establishment/settings', input)
    return est.settings ?? ({} as EstablishmentSettings)
  },
}
