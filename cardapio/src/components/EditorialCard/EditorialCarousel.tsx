import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useCarousel } from '@/hooks/useCarousel'
import { useMediaQuery } from '@/hooks/useSectionObserver'
import { CarouselChrome } from '@/components/CarouselChrome/CarouselChrome'
import { MobileSnapCarousel, SnapSlide } from '@/components/MobileSnapCarousel/MobileSnapCarousel'
import { cn, prefersReducedMotion } from '@/utils'

const CARD_W = 560
const CARD_H = 380
const STEP_PX = 420

const SLIDE_SPRING = { type: 'spring' as const, stiffness: 200, damping: 28, mass: 0.95 }
const SLIDE_TWEEN = { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const }

interface EditorialCarouselProps<T> {
  items: T[]
  label: string
  getKey: (item: T) => string
  renderCard: (item: T, opts: { stacked: boolean; active: boolean }) => ReactNode
  autoplayMs?: number | null
  emptyMessage?: string
}

export function EditorialCarousel<T>({
  items,
  label,
  getKey,
  renderCard,
  autoplayMs = null,
  emptyMessage = 'Nenhum item nesta seção.',
}: EditorialCarouselProps<T>) {
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const reducedMotion = prefersReducedMotion()
  const n = items.length
  const {
    index,
    next,
    prev,
    setIndex,
    dragOffset,
    isDragging,
    containerRef,
    handlers,
  } = useCarousel({
    length: n,
    loop: n > 1,
    autoplayMs: isMobile ? null : autoplayMs,
  })

  if (!n) {
    return <p className="py-16 text-center text-bone/40">{emptyMessage}</p>
  }

  if (isMobile) {
    return (
      <MobileSnapCarousel
        length={n}
        label={label}
        showArrows={false}
        peekPadding="pl-[5vw] pr-[5vw]"
      >
        {items.map((item) => (
          <SnapSlide key={getKey(item)} widthClass="w-[90vw] max-w-[400px]">
            {renderCard(item, { stacked: true, active: true })}
          </SnapSlide>
        ))}
      </MobileSnapCarousel>
    )
  }

  const slots = n === 1 ? [0] : n === 2 ? [0, 1] : ([-1, 0, 1] as const)

  const slides: Array<{ item: T; i: number; slot: number }> = []
  const seen = new Set<number>()
  for (const slot of slots) {
    const i = ((index + slot) % n + n) % n
    if (seen.has(i)) continue
    seen.add(i)
    slides.push({ item: items[i]!, i, slot: n === 2 && slot === 1 ? 1 : slot })
  }

  const slideTransition = isDragging
    ? { duration: 0 }
    : reducedMotion
      ? { duration: 0.2 }
      : SLIDE_SPRING

  return (
    <div>
      <div className="mb-6 flex justify-end px-6 lg:px-0">
        <CarouselChrome
          onPrev={prev}
          onNext={next}
          index={index}
          length={n}
          onGoTo={setIndex}
          label={label}
          className="w-auto min-w-[220px]"
        />
      </div>

      <div
        ref={containerRef}
        className="carousel-surface relative outline-none"
        role="region"
        aria-roledescription="carrossel"
        aria-label={label}
        tabIndex={0}
        {...handlers}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[320px] w-[min(640px,90%)] -translate-x-1/2 -translate-y-[42%] rounded-full bg-[radial-gradient(ellipse,rgb(212_146_58/0.14)_0%,transparent_70%)] blur-2xl"
          animate={{ opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div
          className="relative mx-auto flex items-center justify-center"
          style={{ height: CARD_H + 40, maxWidth: CARD_W + STEP_PX * 2 }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {slides.map(({ item, i, slot }) => {
              const isActive = i === index
              const dragPull = isDragging ? dragOffset * 0.55 : 0
              const x = slot * STEP_PX + dragPull

              return (
                <motion.div
                  key={getKey(item)}
                  aria-hidden={!isActive}
                  className={cn(
                    'absolute',
                    isActive ? 'z-20' : 'z-10 pointer-events-none',
                  )}
                  style={{ width: CARD_W, height: CARD_H }}
                  initial={
                    reducedMotion
                      ? false
                      : { opacity: 0, scale: 0.88, x: x + slot * 24 }
                  }
                  animate={{
                    x,
                    y: isActive ? -12 : 18,
                    scale: isActive ? 1 : 0.84,
                    opacity: isActive ? 1 : 0.32,
                    filter: isActive
                      ? 'blur(0px) brightness(1)'
                      : 'blur(4px) brightness(0.55)',
                  }}
                  exit={
                    reducedMotion
                      ? undefined
                      : { opacity: 0, scale: 0.82, transition: { duration: 0.35 } }
                  }
                  transition={slideTransition}
                >
                <motion.div
                  className={cn('h-full w-full', isActive && 'pointer-events-auto')}
                  animate={{
                    boxShadow: isActive
                      ? '0 28px 70px rgb(0 0 0 / 0.55), 0 0 40px rgb(212 146 58 / 0.14)'
                      : '0 12px 32px rgb(0 0 0 / 0.35)',
                  }}
                  transition={isDragging ? { duration: 0 } : SLIDE_TWEEN}
                >
                  {renderCard(item, { stacked: false, active: isActive })}
                </motion.div>
              </motion.div>
            )
          })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
