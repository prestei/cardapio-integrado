import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  UtensilsCrossed,
  FolderOpen,
  Package,
  ArrowRight,
  Star,
  CheckCircle2,
  Sparkles,
  Plus,
} from 'lucide-react'
import { categoriesService } from '@/services/categories'
import { productsService } from '@/services/products'
import type { Category, Product } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'

const PALETTE = [
  { wrap: 'bg-accent-muted text-accent', bar: 'bg-accent' },
  { wrap: 'bg-gold-muted text-gold', bar: 'bg-gold' },
  { wrap: 'bg-success/15 text-success', bar: 'bg-success' },
  { wrap: 'bg-[#3b82f6]/15 text-[#60a5fa]', bar: 'bg-[#3b82f6]' },
  { wrap: 'bg-danger/15 text-danger', bar: 'bg-danger' },
  { wrap: 'bg-[#818cf8]/15 text-[#a5b4fc]', bar: 'bg-[#818cf8]' },
] as const

function paletteFor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

function hasPromo(product: Pick<Product, 'price' | 'promoPrice'>) {
  return product.promoPrice != null && product.promoPrice < product.price
}

function itemCountLabel(count: number) {
  if (count === 0) return 'Nenhum item'
  if (count === 1) return '1 item'
  return `${count} itens`
}

function SectionCover({ category }: { category: Category }) {
  const palette = paletteFor(category.id)

  if (category.imageUrl) {
    return (
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-elevated">
        <img src={category.imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] font-display text-xl font-semibold',
        palette.wrap,
      )}
    >
      {category.name.slice(0, 1).toUpperCase()}
    </div>
  )
}

function ProductRow({ product }: { product: Product }) {
  const promo = hasPromo(product)
  const displayPrice = promo ? product.promoPrice! : product.price

  return (
    <li
      className={cn(
        'flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5',
        !product.isAvailable && 'opacity-60',
      )}
    >
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt=""
          className={cn(
            'h-16 w-16 shrink-0 rounded-[var(--radius-md)] object-cover',
            !product.isAvailable && 'grayscale',
          )}
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-elevated">
          <Package className="h-6 w-6 text-muted/35" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-text">{product.name}</p>
          {product.isFeatured && (
            <Star className="h-3.5 w-3.5 shrink-0 fill-gold text-gold" aria-label="Destaque" />
          )}
          {promo && <Badge variant="accent">Promo</Badge>}
          {!product.isAvailable && <Badge variant="muted">Indisponível</Badge>}
        </div>
        {product.description && (
          <p className="mt-0.5 line-clamp-1 text-sm text-muted">{product.description}</p>
        )}
      </div>

      <div className="shrink-0 text-right">
        {promo && (
          <p className="text-xs text-muted line-through">{formatCurrency(product.price)}</p>
        )}
        <p
          className={cn(
            'font-display text-base font-semibold sm:text-lg',
            !product.isAvailable ? 'text-muted' : promo ? 'text-gold' : 'text-accent',
          )}
        >
          {formatCurrency(displayPrice)}
        </p>
      </div>
    </li>
  )
}

function CardapioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[4.5rem] w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
      <Skeleton className="h-56 w-full rounded-[var(--radius-lg)]" />
    </div>
  )
}

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
  const activeCategories = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const inactiveCount = categories.length - activeCategories.length
  const availableCount = products.filter((p) => p.isAvailable).length
  const featured = products
    .filter((p) => p.isFeatured)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Cardápio"
          description="Como o cliente vê as seções ativas — com foto, preço e destaques."
        />
        <CardapioSkeleton />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Cardápio"
        description="Como o cliente vê as seções ativas — com foto, preço e destaques."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/categorias"
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-elevated px-4 text-sm text-text transition-colors hover:border-accent hover:text-accent"
            >
              <FolderOpen className="h-4 w-4" />
              Categorias
            </Link>
            <Link
              to="/produtos"
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-accent px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-hover"
            >
              <Package className="h-4 w-4" />
              Produtos
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-muted">
            <FolderOpen className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-text">{activeCategories.length}</p>
            <p className="text-sm text-muted">Seções ativas</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-gold-muted">
            <Package className="h-5 w-5 text-gold" />
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-text">{products.length}</p>
            <p className="text-sm text-muted">Produtos</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-success/15">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-text">{availableCount}</p>
            <p className="text-sm text-muted">Disponíveis</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-gold-muted">
            <Sparkles className="h-5 w-5 text-gold" />
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-text">{featured.length}</p>
            <p className="text-sm text-muted">Destaques</p>
          </div>
        </div>
      </div>

      {inactiveCount > 0 && (
        <p className="mb-5 text-sm text-muted">
          {inactiveCount === 1
            ? '1 categoria inativa fica oculta no cardápio público.'
            : `${inactiveCount} categorias inativas ficam ocultas no cardápio público.`}
        </p>
      )}

      {featured.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium tracking-[0.18em] text-gold uppercase">
                Seleção
              </p>
              <h2 className="font-display text-lg font-semibold text-text">Destaques da casa</h2>
            </div>
            <Link to="/produtos" className="text-sm text-accent hover:underline">
              Gerenciar
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {featured.map((product) => {
              const promo = hasPromo(product)
              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface"
                >
                  <div className="relative aspect-[16/10] bg-elevated">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-8 w-8 text-muted/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-gold px-2 py-0.5 text-xs font-medium text-bg">
                      <Star className="h-3 w-3 fill-current" />
                      Destaque
                    </span>
                  </div>
                  <div className="p-4 pt-3">
                    <h3 className="truncate font-display font-semibold text-text">{product.name}</h3>
                    <div className="mt-1 flex items-baseline gap-2">
                      {promo && (
                        <span className="text-xs text-muted line-through">
                          {formatCurrency(product.price)}
                        </span>
                      )}
                      <span className={cn('font-display font-semibold', promo ? 'text-gold' : 'text-accent')}>
                        {formatCurrency(promo ? product.promoPrice! : product.price)}
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {activeCategories.length === 0 ? (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          <div className="h-1.5 bg-gradient-to-r from-accent via-gold to-success" />
          <EmptyState
            icon={UtensilsCrossed}
            title="Seu cardápio ainda está vazio"
            description="Crie categorias e adicione produtos. A ordem e as fotos daqui são as mesmas do cardápio público."
          />
          <div className="-mt-4 pb-10 text-center">
            <Link
              to="/categorias"
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              Criar categorias <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {activeCategories.map((category) => {
            const palette = paletteFor(category.id)
            const categoryProducts = products
              .filter((p) => p.categoryId === category.id)
              .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))

            return (
              <section
                key={category.id}
                className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface"
              >
                <span className={cn('absolute inset-y-0 left-0 w-1', palette.bar)} aria-hidden="true" />
                <div className="flex items-center gap-3 border-b border-border px-4 py-4 pl-5 sm:px-5">
                  <SectionCover category={category} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold text-text">{category.name}</h2>
                      <span className="rounded-full bg-elevated px-2.5 py-0.5 text-xs text-muted">
                        {itemCountLabel(categoryProducts.length)}
                      </span>
                    </div>
                    {category.description && (
                      <p className="mt-0.5 line-clamp-1 text-sm text-muted">{category.description}</p>
                    )}
                  </div>
                  <Link
                    to="/produtos"
                    className="hidden shrink-0 text-sm text-accent hover:underline sm:inline"
                  >
                    Gerenciar
                  </Link>
                </div>

                {categoryProducts.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm text-muted">Nenhum produto nesta categoria</p>
                    <Link
                      to="/produtos"
                      className="mt-2 inline-flex items-center gap-1 text-sm text-accent hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar produto
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {categoryProducts.map((product) => (
                      <ProductRow key={product.id} product={product} />
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
