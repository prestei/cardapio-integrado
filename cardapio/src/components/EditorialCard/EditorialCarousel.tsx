import type { ReactNode } from 'react'
import { useCarousel } from '@/hooks/useCarousel'
import { useMediaQuery } from '@/hooks/useSectionObserver'
import { CarouselChrome } from '@/components/CarouselChrome/CarouselChrome'
import { MobileSnapCarousel, SnapSlide } from '@/components/MobileSnapCarousel/MobileSnapCarousel'
import { cn } from '@/utils'

const CARD_W = 560
const CARD_H = 380
const STEP_PX = 420

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

  // Fixed slots so every category (2 or 20 items) peeks the same way
  const slots =
    n === 1 ? [0] : n === 2 ? [0, 1] : ([-1, 0, 1] as const)

  const slides: Array<{ item: T; i: number; slot: number }> = []
  const seen = new Set<number>()
  for (const slot of slots) {
    const i = ((index + slot) % n + n) % n
    if (seen.has(i)) continue
    seen.add(i)
    slides.push({ item: items[i]!, i, slot: n === 2 && slot === 1 ? 1 : slot })
  }

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
        <div
          className="relative mx-auto flex items-center justify-center"
          style={{ height: CARD_H + 24, maxWidth: CARD_W + STEP_PX * 2 }}
        >
          {slides.map(({ item, i, slot }) => {
            const isActive = i === index
            const x = slot * STEP_PX + (isDragging ? dragOffset * 0.55 : 0)
            const scale = isActive ? 1 : 0.88
            const opacity = isActive ? 1 : 0.4

            return (
              <div
                key={`${getKey(item)}-${slot}`}
                aria-hidden={!isActive}
                className={cn(
                  'absolute transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
                  isActive ? 'z-20' : 'z-10 pointer-events-none',
                )}
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  transform: `translateX(${x}px) scale(${scale})`,
                  opacity,
                }}
              >
                <div className={cn(isActive && 'pointer-events-auto')}>
                  {renderCard(item, { stacked: false, active: isActive })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
