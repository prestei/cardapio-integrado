import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { UtensilsCrossed, FolderOpen, Package, ArrowRight } from 'lucide-react'
import { categoriesService } from '@/services/categories'
import { productsService } from '@/services/products'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency } from '@/utils/format'

export function CardapioPage() {
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.list,
  })

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsService.list(),
  })

  const isLoading = loadingCategories || loadingProducts

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const activeCategories = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div>
      <PageHeader
        title="Cardápio"
        description="Visão geral das categorias e produtos"
        actions={
          <div className="flex gap-2">
            <Link to="/categorias">
              <Badge variant="accent" className="cursor-pointer px-3 py-1.5">
                <FolderOpen className="mr-1 inline h-3.5 w-3.5" />
                Categorias
              </Badge>
            </Link>
            <Link to="/produtos">
              <Badge variant="accent" className="cursor-pointer px-3 py-1.5">
                <Package className="mr-1 inline h-3.5 w-3.5" />
                Produtos
              </Badge>
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-5 w-5 text-accent" />
            <div>
              <p className="text-2xl font-semibold text-text">{categories.length}</p>
              <p className="text-sm text-muted">Categorias</p>
            </div>
          </div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-accent" />
            <div>
              <p className="text-2xl font-semibold text-text">{products.length}</p>
              <p className="text-sm text-muted">Produtos</p>
            </div>
          </div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="h-5 w-5 text-accent" />
            <div>
              <p className="text-2xl font-semibold text-text">
                {products.filter((p) => p.isAvailable).length}
              </p>
              <p className="text-sm text-muted">Disponíveis</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {activeCategories.map((category) => {
          const categoryProducts = products.filter(
            (p) => p.categoryId === category.id,
          )

          return (
            <section
              key={category.id}
              className="rounded-[var(--radius-lg)] border border-border bg-surface"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="font-display text-lg font-medium text-text">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-sm text-muted">{category.description}</p>
                  )}
                </div>
                <span className="text-sm text-muted">
                  {categoryProducts.length} item(s)
                </span>
              </div>

              {categoryProducts.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">
                  Nenhum produto nesta categoria
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {categoryProducts.map((product) => (
                    <li
                      key={product.id}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium text-text">{product.name}</p>
                          {!product.isAvailable && (
                            <Badge variant="muted" className="mt-0.5">Indisponível</Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-accent">
                        {formatCurrency(product.promoPrice ?? product.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}

        {activeCategories.length === 0 && (
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center">
            <UtensilsCrossed className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-3 text-text">Seu cardápio ainda está vazio</p>
            <p className="text-sm text-muted">
              Comece criando categorias e adicionando produtos
            </p>
            <Link
              to="/categorias"
              className="mt-4 inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              Criar categorias <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
