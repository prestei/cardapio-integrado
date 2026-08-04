import type { ProductSummary, ProductTag } from '@/types'

const VEGAN_HINTS = ['veggie', 'vegano', 'vegan', 'vegetal']
const SPICY_HINTS = ['apimentado', 'picante', 'spicy', 'chili']

export function getProductTags(product: ProductSummary): ProductTag[] {
  const tags: ProductTag[] = []
  const haystack = `${product.name} ${product.description ?? ''}`.toLowerCase()

  if (product.promoPrice != null && product.promoPrice < product.price) {
    tags.push('promocao')
  }
  if (product.isFeatured) {
    tags.push('destaque')
    tags.push('mais-pedido')
  }
  if (VEGAN_HINTS.some((h) => haystack.includes(h))) tags.push('vegano')
  if (SPICY_HINTS.some((h) => haystack.includes(h))) tags.push('apimentado')

  return [...new Set(tags)]
}

export const TAG_LABELS: Record<ProductTag, string> = {
  'mais-pedido': 'Mais pedido',
  novo: 'Novo',
  promocao: 'Promoção',
  destaque: 'Destaque',
  vegano: 'Vegano',
  apimentado: 'Apimentado',
}
