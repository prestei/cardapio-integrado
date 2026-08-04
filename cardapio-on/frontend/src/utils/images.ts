const CATEGORY_FALLBACKS: Record<string, string> = {
  hambúrgueres:
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  bebidas:
    'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80',
  sobremesas:
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  porções:
    'https://images.unsplash.com/photo-1573080496680-c8f85e0e0e7b?auto=format&fit=crop&w=800&q=80',
  default:
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
}

const PRODUCT_FALLBACKS: Array<{ match: RegExp; url: string }> = [
  {
    match: /burger|hamb/i,
    url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: /bacon|cheese/i,
    url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: /smash/i,
    url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: /veggie|vegano/i,
    url: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: /coca|refri/i,
    url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: /suco|laranja/i,
    url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: /cerveja|ipa/i,
    url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: /brownie|sorvete/i,
    url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: /shake|milk/i,
    url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: /batata|frita/i,
    url: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: /onion|anel/i,
    url: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: /nugget/i,
    url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
  },
]

export function resolveProductImage(
  imageUrl: string | null | undefined,
  productName: string,
  categoryName?: string,
): string {
  if (imageUrl) return imageUrl
  const byName = PRODUCT_FALLBACKS.find((item) => item.match.test(productName))
  if (byName) return byName.url
  if (categoryName) {
    const key = categoryName.toLowerCase()
    return CATEGORY_FALLBACKS[key] ?? CATEGORY_FALLBACKS.default
  }
  return CATEGORY_FALLBACKS.default
}

export function resolveBanner(bannerUrl: string | null | undefined): string {
  return (
    bannerUrl ||
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1600&q=80'
  )
}
