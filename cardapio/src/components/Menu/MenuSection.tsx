import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import gsap from 'gsap'
import type { Category, MenuSectionCopy } from '@/types'
import { useUI } from '@/context/UIContext'
import { useMediaQuery } from '@/hooks/useSectionObserver'
import { EditorialCard } from '@/components/EditorialCard/EditorialCard'
import { EditorialCarousel } from '@/components/EditorialCard/EditorialCarousel'
import { cn, prefersReducedMotion, productPrice } from '@/utils'
import { ensureGsap } from '@/animations/gsap'

interface MenuSectionProps {
  categories: Category[]
  sectionCopy?: MenuSectionCopy
}

export function MenuSection({ categories, sectionCopy }: MenuSectionProps) {
  const { openProduct } = useUI()
  const [activeCat, setActiveCat] = useState(categories[0]?.id ?? '')
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const isMobile = useMediaQuery('(max-width: 1023px)')

  const current = categories.find((c) => c.id === activeCat) ?? categories[0]
  const products = current?.products ?? []

  useEffect(() => {
    const btn = tabRefs.current.get(activeCat)
    const indicator = indicatorRef.current
    if (!btn || !indicator || prefersReducedMotion()) {
      if (btn && indicator) {
        indicator.style.width = `${btn.offsetWidth}px`
        indicator.style.transform = `translateX(${btn.offsetLeft}px)`
      }
      return
    }
    ensureGsap()
    gsap.to(indicator, {
      width: btn.offsetWidth,
      x: btn.offsetLeft,
      duration: 0.45,
      ease: 'power3.out',
    })
    btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeCat, categories])

  if (!categories.length) return null

  return (
    <section
      id="cardapio"
      className="relative bg-ink-soft py-16 sm:py-24 lg:py-28"
      aria-labelledby="cardapio-title"
    >
      <div className="mx-auto max-w-7xl">
          <div className="mb-8 px-4 sm:mb-12 sm:px-6 lg:mb-14 lg:px-8" data-reveal>
            <p className="section-kicker mb-3">{sectionCopy?.kicker ?? 'Cardápio'}</p>
            <h2 id="cardapio-title" className="section-title">
              {sectionCopy?.title ?? 'Nosso cardápio'}
            </h2>
            <p className="mt-3 max-w-lg text-sm text-bone-muted sm:mt-4 sm:text-base">
              {sectionCopy?.description ??
                'Navegue pelas categorias. Cada prato foi pensado para ser escolhido com calma — ou com fome.'}
            </p>
          </div>

        <div
          className={cn(
            'relative z-20 mb-8 overflow-x-auto mask-fade-r border-b border-line/40 bg-ink-soft/95 px-4 pb-0 backdrop-blur-md sm:px-6 lg:static lg:mb-10 lg:border-0 lg:bg-transparent lg:px-8 lg:backdrop-blur-none',
            isMobile && 'sticky',
          )}
          style={
            isMobile
              ? { top: 'calc(var(--header-h) + var(--safe-top))' }
              : undefined
          }
          role="tablist"
          aria-label="Categorias"
        >
          <div className="relative flex min-w-max gap-5 sm:gap-8">
            <span
              ref={indicatorRef}
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-0 h-px bg-brass"
              style={{ width: 0 }}
            />
            {categories.map((cat) => {
              const selected = cat.id === activeCat
              return (
                <button
                  key={cat.id}
                  ref={(el) => {
                    if (el) tabRefs.current.set(cat.id, el)
                  }}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveCat(cat.id)}
                  className={cn(
                    'relative min-h-11 pb-3 font-display text-xs tracking-[0.14em] uppercase transition-colors sm:text-sm lg:text-base',
                    selected ? 'text-bone' : 'text-bone/40 hover:text-bone/70',
                  )}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>
        </div>

        <motion.div
          key={activeCat}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="sm:px-6 lg:px-8"
        >
          {current?.description && (
            <p className="mb-5 px-4 text-sm text-bone/50 sm:px-0">{current.description}</p>
          )}
          <EditorialCarousel
            items={products}
            label={`Produtos: ${current?.name ?? ''}`}
            getKey={(p) => p.id}
            emptyMessage="Nenhum produto nesta categoria."
            renderCard={(product, { stacked, active }) => (
              <EditorialCard
                imageUrl={product.imageUrl}
                imageAlt={product.name}
                eyebrow={current?.name}
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
        </motion.div>
      </div>
    </section>
  )
}
