import { api } from './api'
import type { CreateQrCodeInput, QrCodeEntry, UpdateQrCodeInput } from '@/types'

export const qrCodesService = {
  list: () => api.get<QrCodeEntry[]>('/qr-codes'),

  create: (input: CreateQrCodeInput) => api.post<QrCodeEntry>('/qr-codes', input),

  update: (id: string, input: UpdateQrCodeInput) =>
    api.patch<QrCodeEntry>(`/qr-codes/${id}`, input),

  delete: (id: string) => api.delete(`/qr-codes/${id}`),
}

export function buildQrImageUrl(targetUrl: string, size = 200): string {
  const encoded = encodeURIComponent(targetUrl)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`
}
