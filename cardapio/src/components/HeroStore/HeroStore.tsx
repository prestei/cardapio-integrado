import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { motion } from 'motion/react'
import type { Store } from '@/types'
import { useCarousel } from '@/hooks/useCarousel'
import { createHeroTimeline, ensureGsap } from '@/animations/gsap'
import { CarouselChrome } from '@/components/CarouselChrome/CarouselChrome'
import { scrollToSection, useMediaQuery } from '@/hooks/useSectionObserver'
import { cn, prefersReducedMotion } from '@/utils'

interface HeroStoreProps {
  store: Store
}

export function HeroStore({ store }: HeroStoreProps) {
  const rootRef = useRef<HTMLElement>(null)
  const [ready, setReady] = useState(false)
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const images = store.images
  const {
    index,
    next,
    prev,
    setIndex,
    dragOffset,
    isDragging,
    containerRef,
    handlers,
  } = useCarousel({ length: images.length, loop: true, autoplayMs: isMobile ? 9000 : 7000 })

  useEffect(() => {
    if (!rootRef.current) return
    const tl = createHeroTimeline(rootRef.current, {
      onComplete: () => setReady(true),
    })
    return () => {
      const cleanup = (tl as { __cleanup?: () => void }).__cleanup
      cleanup?.()
      tl.kill()
    }
  }, [])

  useEffect(() => {
    if (!ready || prefersReducedMotion()) return
    ensureGsap()
    const img = rootRef.current?.querySelector(
      `[data-slide="${index}"] img`,
    ) as HTMLElement | null
    if (!img) return

    const fromBlur = isMobile ? 'blur(3px)' : 'blur(6px)'
    const fromScale = isMobile ? 1.08 : 1.12

    const tween = gsap.fromTo(
      img,
      { scale: fromScale, filter: fromBlur, opacity: 0.75 },
      {
        scale: 1.03,
        filter: 'blur(0px)',
        opacity: 1,
        duration: isMobile ? 0.85 : 1.15,
        ease: 'power2.out',
      },
    )
    return () => {
      tween.kill()
    }
  }, [index, ready, isMobile])

  useEffect(() => {
    if (!rootRef.current || prefersReducedMotion() || isMobile) return
    ensureGsap()
    const parallaxImg = rootRef.current.querySelectorAll('[data-parallax]')
    const ctx = gsap.context(() => {
      parallaxImg.forEach((el) => {
        gsap.to(el, {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        })
      })
    }, rootRef)
    return () => ctx.revert()
  }, [ready, isMobile])

  return (
    <section
      id="loja"
      ref={rootRef}
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden grain"
      aria-label="A loja"
    >
      <div
        ref={containerRef}
        className="carousel-surface absolute inset-0"
        role="region"
        aria-roledescription="carrossel"
        aria-label="Ambientes do estabelecimento"
        tabIndex={0}
        {...handlers}
      >
        {images.map((image, i) => {
          const isActive = i === index
          const offsetRatio = dragOffset / (containerRef.current?.offsetWidth || 1)
          return (
            <div
              key={image.id}
              data-slide={i}
              aria-hidden={!isActive}
              className={cn(
                'absolute inset-0 transition-[clip-path,opacity,transform] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]',
                isActive ? 'z-10 opacity-100' : 'z-0 opacity-0',
              )}
              style={
                isActive
                  ? {
                      clipPath: isDragging
                        ? `inset(0 ${Math.max(0, -offsetRatio * 40)}% 0 ${Math.max(0, offsetRatio * 40)}%)`
                        : 'inset(0 0% 0 0%)',
                      transform: `translateX(${dragOffset * 0.08}px) scale(${isDragging ? 1.02 : 1})`,
                    }
                  : {
                      clipPath: isMobile ? 'inset(0 0 0 0)' : 'inset(12% 18% 12% 18%)',
                    }
              }
            >
              <div
                data-parallax
                className={cn(
                  'absolute will-change-transform',
                  isMobile ? 'inset-0' : 'inset-[-8%]',
                )}
              >
                <img
                  data-hero-image={i === 0 ? true : undefined}
                  src={image.url}
                  alt={image.alt}
                  width={1920}
                  height={1080}
                  fetchPriority={i === 0 ? 'high' : 'low'}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/20" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgb(12_11_10/0.4)_100%)]" />
            </div>
          )
        })}
      </div>

      <div
        className="relative z-20 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:gap-8 sm:px-6 lg:px-8"
        style={{
          paddingTop: 'calc(var(--header-h) + var(--safe-top) + 1.25rem)',
          paddingBottom: 'calc(var(--dock-offset) + 1.25rem)',
        }}
      >
        <div className="max-w-xl">
          <div data-hero-logo className="mb-4 flex items-center gap-3 opacity-0 sm:mb-6">
            <span className="h-px w-8 bg-brass sm:w-10" />
            <span className="section-kicker">Estabelecimento</span>
          </div>

          <h1 data-hero-name className="hero-title opacity-0">
            {store.name}
          </h1>

          <p data-hero-tagline className="hero-tagline mt-5 max-w-lg opacity-0 sm:mt-6">
            {store.tagline}
          </p>

          <div data-hero-cta className="mt-7 flex flex-wrap items-center gap-3 opacity-0 sm:mt-9 sm:gap-4">
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => scrollToSection('cardapio')}
              className="inline-flex min-h-12 items-center justify-center border border-brass bg-brass px-6 font-display text-xs tracking-[0.22em] text-ink uppercase transition-colors hover:bg-transparent hover:text-brass sm:px-7"
            >
              Explorar cardápio
            </motion.button>
            <button
              type="button"
              onClick={() => scrollToSection('favoritos')}
              className="hidden min-h-12 items-center justify-center px-2 font-display text-xs tracking-[0.2em] text-bone/70 uppercase transition-colors hover:text-brass sm:inline-flex"
            >
              Ver favoritos
            </button>
          </div>
        </div>

        <div data-hero-chrome className="opacity-0">
          {/* Mobile: dots only */}
          <div className="flex items-center justify-between gap-4 lg:hidden">
            <p className="text-[0.65rem] tracking-[0.2em] text-bone/45 uppercase">
              {images[index]?.label}
            </p>
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Ambientes">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={img.label}
                  onClick={() => setIndex(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-500',
                    i === index ? 'w-7 bg-brass' : 'w-1.5 bg-bone/25',
                  )}
                />
              ))}
            </div>
          </div>

          {/* Desktop chrome */}
          <div className="hidden lg:block">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-[0.7rem] tracking-[0.24em] text-bone/50 uppercase">
                {images[index]?.label}
              </p>
              <p className="font-display text-sm text-bone/40">
                {String(index + 1).padStart(2, '0')}
                <span className="mx-1 text-bone/25">/</span>
                {String(images.length).padStart(2, '0')}
              </p>
            </div>
            <CarouselChrome
              onPrev={prev}
              onNext={next}
              index={index}
              length={images.length}
              onGoTo={setIndex}
              label="Ambientes"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
