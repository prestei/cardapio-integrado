import { api } from './api'
import type {
  CashMovement,
  CashRegister,
  CloseCashInput,
  CreateCashMovementInput,
  OpenCashInput,
} from '@/types'

export const cashService = {
  getCurrent: () => api.get<CashRegister | null>('/cash/current'),

  history: (page = 1, pageSize = 50) =>
    api.get<{ items: CashRegister[]; pagination: { total: number } }>(
      `/cash/history?page=${page}&pageSize=${pageSize}`,
    ),

  open: (input: OpenCashInput) => api.post<CashRegister>('/cash/open', input),

  close: (id: string, input: CloseCashInput) =>
    api.post<CashRegister>(`/cash/${id}/close`, input),

  addMovement: (id: string, input: CreateCashMovementInput) =>
    api.post<CashMovement>(`/cash/${id}/movements`, input),
}
