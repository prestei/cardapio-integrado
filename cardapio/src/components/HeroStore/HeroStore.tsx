import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { motion } from 'motion/react'
import type { Store } from '@/types'
import { createHeroTimeline, ensureGsap } from '@/animations/gsap'
import { scrollToSection, useMediaQuery } from '@/hooks/useSectionObserver'
import { prefersReducedMotion } from '@/utils'
import { StoreMark } from '@/components/StoreMark'

interface HeroStoreProps {
  store: Store
}

export function HeroStore({ store }: HeroStoreProps) {
  const rootRef = useRef<HTMLElement>(null)
  const [ready, setReady] = useState(false)
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const image = store.images[0]

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
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden grain"
      aria-label="A loja"
    >
      <div className="absolute inset-0">
        {image ? (
          <div data-parallax className="absolute inset-[-8%] will-change-transform max-lg:inset-0">
            <img
              data-hero-image
              src={image.url}
              alt={image.alt}
              width={1920}
              height={1080}
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>
        ) : (
          <div
            data-hero-image
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(212_146_58/0.22),transparent_42%),linear-gradient(180deg,#1a1c26_0%,#0d0f17_70%)]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/15" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgb(13_15_23/0.45)_100%)]" />
      </div>

      <div
        className="relative z-20 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:gap-8 sm:px-6 lg:-translate-y-[5vh] lg:px-8"
        style={{
          paddingTop: 'calc(var(--header-h) + var(--safe-top))',
          paddingBottom: 'calc(var(--dock-offset) + 2rem)',
        }}
      >
        <div className="max-w-xl">
          <div data-hero-logo className="mb-5 opacity-0 sm:mb-7">
            <StoreMark store={store} size="lg" />
          </div>

          <div className="mb-4 flex items-center gap-3 sm:mb-5">
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
              className="inline-flex min-h-12 items-center justify-center border border-cta bg-cta px-6 font-display text-xs tracking-[0.22em] text-white uppercase transition-colors hover:bg-transparent hover:text-cta sm:px-7"
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
      </div>
    </section>
  )
}
