import { api } from './api'
import type {
  CreateProductInput,
  Product,
  UpdateProductInput,
  UpdateProductPriceInput,
} from '@/types'

export const productsService = {
  list: (categoryId?: string) => {
    const query = categoryId ? `?categoryId=${categoryId}` : ''
    return api.get<Product[]>(`/products${query}`)
  },

  getById: (id: string) => api.get<Product>(`/products/${id}`),

  create: (input: CreateProductInput) =>
    api.post<Product>('/products', input),

  update: (id: string, input: UpdateProductInput) =>
    api.patch<Product>(`/products/${id}`, input),

  delete: (id: string) => api.delete(`/products/${id}`),

  duplicate: (id: string) =>
    api.post<Product>(`/products/${id}/duplicate`),

  updatePrice: (id: string, input: UpdateProductPriceInput) =>
    api.patch<Product>(`/products/${id}/price`, input),

  reorder: (items: Array<{ id: string; sortOrder: number }>) =>
    api.patch<Product[]>('/products/reorder', { items }),
}
