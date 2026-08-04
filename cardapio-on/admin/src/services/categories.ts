import { api } from './api'
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/types'

export const categoriesService = {
  list: () => api.get<Category[]>('/categories'),

  getById: (id: string) => api.get<Category>(`/categories/${id}`),

  create: (input: CreateCategoryInput) =>
    api.post<Category>('/categories', input),

  update: (id: string, input: UpdateCategoryInput) =>
    api.patch<Category>(`/categories/${id}`, input),

  delete: (id: string) => api.delete(`/categories/${id}`),

  reorder: (items: Array<{ id: string; sortOrder: number }>) =>
    api.patch<Category[]>('/categories/reorder', { items }),
}
