import { api } from './api'
import type { UpdateEmployeeInput, Employee } from '@/types'

/** Perfil do usuário logado (conta). Gestão de equipe foi removida do painel. */
export const usersService = {
  update: (id: string, input: UpdateEmployeeInput) =>
    api.patch<Employee>(`/users/${id}`, input),
}
