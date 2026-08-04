import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProduct } from '@/services/products'
import { filterProducts, flattenProducts } from '@/services/categories'
import { useStore } from '@/contexts/StoreContext'

export function useProducts(search = '', categoryFilter: string | null = null) {
  const { menu } = useStore()

  return useMemo(() => {
    if (!menu) return []
    let products = flattenProducts(menu).filter((p) => p.isAvailable !== false)

    if (categoryFilter === 'featured') {
      products = menu.featuredProducts.filter((p) => p.isAvailable !== false)
    } else if (categoryFilter === 'promo') {
      products = products.filter(
        (p) => p.promoPrice != null && p.promoPrice < p.price,
      )
    } else if (categoryFilter && categoryFilter !== 'all') {
      products = products.filter((p) => p.categoryId === categoryFilter)
    }

    return filterProducts(products, search, menu.categories)
  }, [menu, search, categoryFilter])
}

export function useProductDetail(productId: string | null) {
  const { slug } = useStore()
  return useQuery({
    queryKey: ['product', slug, productId],
    queryFn: () => getProduct(slug, productId!),
    enabled: Boolean(productId),
  })
}
