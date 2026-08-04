import { api } from './api'
import type { Establishment } from '@/types'

export const establishmentService = {
  get: () => api.get<Establishment>('/establishment'),

  update: (input: Partial<Establishment>) =>
    api.patch<Establishment>('/establishment', input),
}
