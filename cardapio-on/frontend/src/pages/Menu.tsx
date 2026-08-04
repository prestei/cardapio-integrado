import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Header } from '@/components/Header'
import { CategoryMenu } from '@/components/CategoryMenu'
import { SearchBar } from '@/components/SearchBar'
import { ProductCard } from '@/components/ProductCard'
import { ProductModal } from '@/components/ProductModal'
import { Footer } from '@/components/Footer'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { useStore } from '@/contexts/StoreContext'

export function MenuPage() {
  const { menu } = useStore()
  const categories = useCategories()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const products = useProducts(search, search ? 'all' : activeCategory)
  const selectedProductId = searchParams.get('produto')

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    menu?.categories.forEach((c) => map.set(c.id, c.name))
    return map
  }, [menu])

  useEffect(() => {
    if (!search && activeCategory !== 'all' && activeCategory !== 'featured' && activeCategory !== 'promo') {
      const el = document.getElementById(`cat-${activeCategory}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [activeCategory, search])

  const openProduct = (id: string) => {
    setSearchParams({ produto: id })
  }

  const closeProduct = () => {
    setSearchParams({})
  }

  const grouped = useMemo(() => {
    if (search || activeCategory !== 'all') return null
    return menu?.categories
      .map((category) => ({
        ...category,
        products: category.products.filter((p) => p.isAvailable !== false),
      }))
      .filter((c) => c.products.length > 0)
  }, [menu, search, activeCategory])

  return (
    <div className="min-h-dvh bg-canvas pb-24 md:pb-0">
      <Header solid />
      <main id="main-content">
      <CategoryMenu
        categories={categories}
        activeId={search ? 'all' : activeCategory}
        onSelect={(id) => {
          setSearch('')
          setActiveCategory(id)
        }}
      />

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <SearchBar value={search} onChange={setSearch} />

        {search ? (
          <section className="mt-6">
            <h1 className="text-lg font-semibold text-ink">
              Resultados para “{search}”
            </h1>
            {products.length === 0 ? (
              <p className="mt-8 text-sm text-muted">
                Nenhum produto encontrado. Tente outro termo.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryName={categoryNameById.get(product.categoryId)}
                    onOpen={openProduct}
                  />
                ))}
              </div>
            )}
          </section>
        ) : grouped ? (
          grouped.length === 0 ? (
            <p className="mt-10 text-center text-sm text-muted">
              Nenhum produto cadastrado no cardápio no momento.
            </p>
          ) : (
            <div className="mt-6 space-y-10">
              {grouped.map((category) => (
                <section key={category.id} id={`cat-${category.id}`}>
                  <h2 className="font-display text-2xl text-ink">{category.name}</h2>
                  {category.description ? (
                    <p className="mt-1 text-sm text-muted">{category.description}</p>
                  ) : null}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {category.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        categoryName={category.name}
                        onOpen={openProduct}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )
        ) : (
          <section className="mt-6">
            <h1 className="font-display text-2xl text-ink">
              {categories.find((c) => c.id === activeCategory)?.name ?? 'Cardápio'}
            </h1>
            {products.length === 0 ? (
              <p className="mt-8 text-sm text-muted">Nenhum produto nesta categoria.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryName={categoryNameById.get(product.categoryId)}
                    onOpen={openProduct}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
      </main>

      <Footer />
      <ProductModal productId={selectedProductId} onClose={closeProduct} />
    </div>
  )
}
