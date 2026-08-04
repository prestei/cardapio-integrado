import { api } from './api'

export interface NotificationChannelSettings {
  establishmentId: string
  whatsappEnabled: boolean
  emailEnabled: boolean
  pushEnabled: boolean
  eventsJson?: Record<string, boolean> | null
}

export const notificationSettingsService = {
  get: () => api.get<NotificationChannelSettings>('/notification-settings'),

  update: (input: Partial<NotificationChannelSettings>) =>
    api.patch<NotificationChannelSettings>('/notification-settings', input),
}
