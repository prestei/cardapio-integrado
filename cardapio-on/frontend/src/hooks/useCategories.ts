import { useMemo } from 'react'
import { useStore } from '@/contexts/StoreContext'

export interface NavCategory {
  id: string
  name: string
  kind: 'all' | 'featured' | 'promo' | 'category'
}

export function useCategories() {
  const { menu } = useStore()

  return useMemo<NavCategory[]>(() => {
    if (!menu) return []
    const hasPromo = menu.categories.some((c) =>
      c.products.some((p) => p.promoPrice != null && p.promoPrice < p.price),
    )
    const items: NavCategory[] = [
      { id: 'all', name: 'Todos', kind: 'all' },
      { id: 'featured', name: 'Mais pedidos', kind: 'featured' },
    ]
    if (hasPromo) {
      items.push({ id: 'promo', name: 'Promoções', kind: 'promo' })
    }
    for (const category of menu.categories) {
      if (category.products.some((p) => p.isAvailable !== false)) {
        items.push({
          id: category.id,
          name: category.name,
          kind: 'category',
        })
      }
    }
    return items
  }, [menu])
}
