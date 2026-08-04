import { api } from './api'
import type { CreateEmployeeInput, Employee, UpdateEmployeeInput } from '@/types'

export const usersService = {
  list: () => api.get<Employee[]>('/users'),

  getById: (id: string) => api.get<Employee>(`/users/${id}`),

  create: (input: CreateEmployeeInput) => api.post<Employee>('/users', input),

  update: (id: string, input: UpdateEmployeeInput) =>
    api.patch<Employee>(`/users/${id}`, input),

  delete: (id: string) => api.delete(`/users/${id}`),
}
