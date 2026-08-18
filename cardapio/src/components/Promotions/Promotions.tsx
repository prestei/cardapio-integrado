import type { Promotion, Product, MenuSectionCopy } from '@/types'
import { useUI } from '@/context/UIContext'
import { EditorialCard } from '@/components/EditorialCard/EditorialCard'
import { EditorialCarousel } from '@/components/EditorialCard/EditorialCarousel'

interface PromotionsProps {
  promotions: Promotion[]
  products: Product[]
  copy?: MenuSectionCopy
}

export function Promotions({ promotions, products, copy }: PromotionsProps) {
  const { openProduct } = useUI()
  const title = copy?.title ?? 'Hoje tem mais'
  const kicker = copy?.kicker ?? 'Promoções'
  const description =
    copy?.description ?? 'Peças especiais do dia — para quem quer mais sabor por menos.'

  if (!promotions.length) return null

  const handleCta = (promo: Promotion) => {
    const firstId = promo.productIds[0]
    const product = products.find((p) => p.id === firstId)
    if (product) openProduct(product)
  }

  return (
    <section
      id="promocoes"
      className="relative overflow-hidden bg-ink py-16 sm:py-24 lg:py-28"
      aria-labelledby="promocoes-title"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          background:
            'radial-gradient(ellipse at 20% 0%, #d4a574 0%, transparent 50%), radial-gradient(ellipse at 90% 80%, #d4a574 0%, transparent 40%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-8 px-4 sm:mb-12 sm:px-6 lg:mb-16 lg:px-8">
          <div data-reveal>
            <p className="section-kicker mb-3">{kicker}</p>
            <h2 id="promocoes-title" className="section-title">
              {title}
            </h2>
            <p className="mt-3 max-w-md text-sm text-bone-muted sm:mt-4 sm:text-base">
              {description}
            </p>
          </div>
        </div>

        <div className="sm:px-6 lg:px-8">
          <EditorialCarousel
            items={promotions}
            label={title}
            getKey={(p) => p.id}
            autoplayMs={8000}
            renderCard={(promo, { stacked }) => (
              <EditorialCard
                imageUrl={promo.imageUrl}
                imageAlt={promo.title}
                eyebrow={promo.subtitle}
                title={promo.title}
                description={promo.description}
                price={promo.promoPrice}
                compareAtPrice={promo.originalPrice}
                badge={`−${promo.discountPercent}%`}
                meta={promo.validUntil ? `Até ${promo.validUntil}` : undefined}
                ctaLabel={promo.ctaLabel}
                stacked={stacked}
                onCta={() => handleCta(promo)}
              />
            )}
          />
        </div>
      </div>
    </section>
  )
}
