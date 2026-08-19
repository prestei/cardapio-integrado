import type { Product, MenuSectionCopy } from '@/types'
import { useUI } from '@/context/UIContext'
import { EditorialCard } from '@/components/EditorialCard/EditorialCard'
import { EditorialCarousel } from '@/components/EditorialCard/EditorialCarousel'
import { productPrice } from '@/utils'

interface FavoritesProps {
  products: Product[]
  copy?: MenuSectionCopy
}

export function Favorites({ products, copy }: FavoritesProps) {
  const { openProduct } = useUI()
  const title = copy?.title ?? 'Favoritos da casa'
  const kicker = copy?.kicker ?? 'Seleção'
  const description =
    copy?.description ??
    'Os pratos que definem a casa — escolhidos para despertar desejo antes da escolha.'

  if (!products.length) return null

  return (
    <section
      id="favoritos"
      className="relative overflow-hidden bg-ink py-16 sm:py-24 lg:py-28"
      aria-labelledby="favoritos-title"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 px-4 sm:mb-12 sm:px-6 lg:mb-16 lg:px-8">
          <div data-reveal>
            <p className="section-kicker mb-3">{kicker}</p>
            <h2 id="favoritos-title" className="section-title">
              {title}
            </h2>
            <p className="mt-3 max-w-md text-sm text-bone-muted sm:mt-4 sm:text-base">
              {description}
            </p>
          </div>
        </div>

        <div className="sm:px-6 lg:px-8">
          <EditorialCarousel
            items={products}
            label={title}
            getKey={(p) => p.id}
            autoplayMs={7000}
            renderCard={(product, { stacked, active }) => (
              <EditorialCard
                imageUrl={product.imageUrl}
                imageAlt={product.name}
                eyebrow={product.tags?.[0] ?? 'Favorito'}
                title={product.name}
                description={product.description}
                price={productPrice(product)}
                compareAtPrice={product.promoPrice != null ? product.price : null}
                badge={product.isFeatured ? 'Destaque' : undefined}
                meta={
                  product.prepTimeMinutes
                    ? `Preparo · ${product.prepTimeMinutes} min`
                    : undefined
                }
                ctaLabel="Adicionar"
                stacked={stacked}
                active={active}
                unavailable={!product.isAvailable}
                onCta={() => openProduct(product)}
              />
            )}
          />
        </div>
      </div>
    </section>
  )
}
