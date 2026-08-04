import type { Category, MenuResponse, ProductSummary } from '@/types'

export function flattenProducts(menu: MenuResponse): ProductSummary[] {
  return menu.categories.flatMap((category) => category.products)
}

export function filterProducts(
  products: ProductSummary[],
  query: string,
  categories: Category[],
): ProductSummary[] {
  const q = query.trim().toLowerCase()
  if (!q) return products

  const categoryById = new Map(categories.map((c) => [c.id, c.name]))

  return products.filter((product) => {
    const categoryName = categoryById.get(product.categoryId) ?? ''
    const haystack = [
      product.name,
      product.description ?? '',
      categoryName,
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}
