import type { MenuData, Product } from '@/types'
import { mockMenu } from '@/data/mock'
import {
  mapMenuResponse,
  mapProduct,
  type ApiMenuResponse,
  type ApiProductDetail,
} from '@/services/mappers'

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/public'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function fetchMenu(slug: string): Promise<MenuData> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200))
    return structuredClone(mockMenu)
  }

  const res = await fetch(`${API_BASE}/${encodeURIComponent(slug)}/menu`)
  if (res.status === 404) {
    throw new Error('Estabelecimento não encontrado.')
  }
  if (!res.ok) {
    throw new Error('Falha ao carregar o cardápio.')
  }

  const data = (await res.json()) as ApiMenuResponse
  return mapMenuResponse(data)
}

export async function fetchProduct(
  slug: string,
  productId: string,
  fallback?: Product,
): Promise<Product> {
  if (USE_MOCK) {
    const all = mockMenu.categories.flatMap((c) => c.products)
    const found = all.find((p) => p.id === productId) ?? fallback
    if (!found) throw new Error('Produto não encontrado')
    await new Promise((r) => setTimeout(r, 80))
    return structuredClone(found)
  }

  const res = await fetch(
    `${API_BASE}/${encodeURIComponent(slug)}/products/${encodeURIComponent(productId)}`,
  )
  if (!res.ok) {
    if (fallback) return fallback
    throw new Error('Produto não encontrado')
  }

  const data = (await res.json()) as ApiProductDetail
  const mapped = mapProduct(data)
  // Preserve list image if detail has none
  if ((!data.imageUrl || !data.images?.length) && fallback?.imageUrl) {
    mapped.imageUrl = fallback.imageUrl
  }
  return mapped
}

export function searchMenu(
  data: MenuData,
  query: string,
): Array<{ product: Product; categoryName: string }> {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const results: Array<{ product: Product; categoryName: string }> = []

  for (const cat of data.categories) {
    const catMatch = cat.name.toLowerCase().includes(q)
    for (const product of cat.products) {
      const hay = [
        product.name,
        product.description,
        ...(product.tags ?? []),
        cat.name,
      ]
        .join(' ')
        .toLowerCase()
      if (catMatch || hay.includes(q)) {
        results.push({ product, categoryName: cat.name })
      }
    }
  }

  return results
}
