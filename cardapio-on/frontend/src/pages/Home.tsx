import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { Footer } from '@/components/Footer'
import { HeroScene } from '@/components/HeroScene'
import { ProductCard } from '@/components/ProductCard'
import { ProductModal } from '@/components/ProductModal'
import { BannerCarousel } from '@/components/BannerCarousel'
import { Countdown } from '@/components/Countdown'
import { useStore } from '@/contexts/StoreContext'
import { revealOnScroll } from '@/animations/gsap'
import { resolveProductImage } from '@/utils/images'
import { formatCurrency } from '@/utils/currency'
import { getPromotions } from '@/services/promotions'

function promotionLabel(promo: {
  type: string
  value: number
  buyQuantity: number | null
  getQuantity: number | null
}): string {
  if (promo.type === 'PERCENTAGE') return `${promo.value}% OFF`
  if (promo.type === 'FIXED') return `${formatCurrency(promo.value)} OFF`
  const buy = promo.buyQuantity ?? 1
  const get = promo.getQuantity ?? 1
  return `Compre ${buy} leve ${buy + get}`
}

function PromotionsSection({ slug }: { slug: string }) {
  const { data } = useQuery({
    queryKey: ['public-promotions', slug],
    queryFn: () => getPromotions(slug),
    enabled: Boolean(slug),
    staleTime: 30_000,
  })
  const promotions = data ?? []

  if (promotions.length === 0) return null

  return (
    <section className="border-t border-line bg-surface py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-6">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">Ofertas especiais</h2>
          <p className="mt-1 text-sm text-muted">Promoções por tempo limitado</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="flex gap-3 rounded-[var(--radius-lg)] border border-line bg-canvas p-4"
            >
              {promo.imageUrl ? (
                <img
                  src={promo.imageUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-[var(--radius-md)] object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-semibold text-ink">{promo.name}</p>
                  {promo.endsAt ? <Countdown endsAt={promo.endsAt} /> : null}
                </div>
                {promo.description ? (
                  <p className="mt-1 text-sm text-muted line-clamp-2">{promo.description}</p>
                ) : null}
                <p
                  className="mt-2 text-sm font-semibold"
                  style={{ color: 'var(--store-primary)' }}
                >
                  {promotionLabel(promo)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function HomePage() {
  const { slug, menu } = useStore()
  const promoRef = useRef<HTMLElement>(null)
  const [productId, setProductId] = useState<string | null>(null)

  useEffect(() => revealOnScroll('[data-reveal]', promoRef.current), [menu])

  const featured = menu?.featuredProducts.filter((p) => p.isAvailable) ?? []
  const promos =
    menu?.categories
      .flatMap((c) => c.products)
      .filter((p) => p.isAvailable && p.promoPrice != null && p.promoPrice < p.price)
      .slice(0, 4) ?? []

  return (
    <div className="min-h-dvh bg-canvas">
      <Header />
      <main id="main-content">
        <div className="relative">
          <HeroScene />
          <Hero />
        </div>

        <BannerCarousel slug={slug} />

        <PromotionsSection slug={slug} />

        {featured.length > 0 ? (
        <section className="border-t border-line bg-surface py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-ink sm:text-3xl">
                  Mais pedidos
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Os favoritos de quem já pediu
                </p>
              </div>
              <Link
                to={`/${slug}/cardapio`}
                className="text-sm font-semibold underline-offset-2 hover:underline"
                style={{ color: 'var(--store-primary)' }}
              >
                Ver tudo
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 3).map((product) => (
                <Link
                  key={product.id}
                  to={`/${slug}/cardapio?produto=${product.id}`}
                  className="flex gap-3 rounded-[var(--radius-md)] border border-line bg-canvas p-3 transition hover:shadow-[var(--shadow-soft)]"
                >
                  <img
                    src={resolveProductImage(product.imageUrl, product.name)}
                    alt=""
                    className="h-20 w-20 rounded-[var(--radius-sm)] object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{product.name}</p>
                    <p className="mt-1 text-sm text-muted line-clamp-2">
                      {product.description}
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatCurrency(product.promoPrice ?? product.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {promos.length > 0 ? (
        <section ref={promoRef} className="py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-6">
              <h2 data-reveal className="font-display text-2xl text-ink sm:text-3xl">
                Promoções
              </h2>
              <p data-reveal className="mt-1 text-sm text-muted">
                Preços especiais por tempo limitado
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {promos.map((product) => (
                <div key={product.id} data-reveal>
                  <ProductCard product={product} onOpen={setProductId} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      </main>

      <Footer />
      <ProductModal productId={productId} onClose={() => setProductId(null)} />
    </div>
  )
}
