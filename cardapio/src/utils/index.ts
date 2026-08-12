export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function productPrice(product: {
  price: number
  promoPrice: number | null
}): number {
  return product.promoPrice != null ? product.promoPrice : product.price
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function cartItemKey(
  productId: string,
  addons: Array<{ id: string; quantity: number }>,
  notes?: string,
): string {
  const addonPart = [...addons]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((a) => `${a.id}:${a.quantity}`)
    .join('|')
  return `${productId}::${addonPart}::${notes ?? ''}`
}
