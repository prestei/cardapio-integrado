import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils'

interface MobileSnapCarouselProps {
  length: number
  label: string
  children: ReactNode
  className?: string
  trackClassName?: string
  showArrows?: boolean
  showDots?: boolean
  onIndexChange?: (index: number) => void
  /** Extra side padding so peek of neighbors is visible */
  peekPadding?: string
}

export function MobileSnapCarousel({
  length,
  label,
  children,
  className,
  trackClassName,
  showArrows = true,
  showDots = true,
  onIndexChange,
  peekPadding = 'pl-[6vw] pr-[6vw]',
}: MobileSnapCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  const syncIndex = useCallback(() => {
    const el = scrollerRef.current
    if (!el || length <= 0) return
    const childrenEls = Array.from(el.children) as HTMLElement[]
    if (!childrenEls.length) return

    const center = el.scrollLeft + el.clientWidth / 2
    let best = 0
    let bestDist = Infinity
    childrenEls.forEach((child, i) => {
      const mid = child.offsetLeft + child.offsetWidth / 2
      const dist = Math.abs(mid - center)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    setIndex((prev) => {
      if (prev !== best) onIndexChange?.(best)
      return best
    })
  }, [length, onIndexChange])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    syncIndex()
    el.addEventListener('scroll', syncIndex, { passive: true })
    return () => el.removeEventListener('scroll', syncIndex)
  }, [syncIndex, length])

  const goTo = useCallback(
    (next: number) => {
      const el = scrollerRef.current
      if (!el) return
      const clamped = Math.max(0, Math.min(length - 1, next))
      const child = el.children[clamped] as HTMLElement | undefined
      if (!child) return
      child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    },
    [length],
  )

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goTo(index + 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goTo(index - 1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        goTo(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        goTo(length - 1)
      }
    },
    [goTo, index, length],
  )

  if (length <= 0) return null

  return (
    <div className={cn('relative', className)}>
      <div
        ref={scrollerRef}
        role="region"
        aria-roledescription="carrossel"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={cn(
          'snap-x-mandatory flex w-full gap-3 overflow-x-auto outline-none',
          peekPadding,
          trackClassName,
        )}
      >
        {children}
      </div>

      {(showArrows || showDots) && length > 1 && (
        <div className="mt-5 flex items-center justify-between gap-3 px-1">
          {showArrows ? (
            <div className="flex items-center gap-2" role="group" aria-label={`Navegação: ${label}`}>
              <button
                type="button"
                aria-label="Anterior"
                disabled={index <= 0}
                onClick={() => goTo(index - 1)}
                className="touch-target inline-flex items-center justify-center border border-line text-bone transition-colors hover:border-brass hover:text-brass disabled:opacity-30"
              >
                <ChevronLeft size={18} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                aria-label="Próximo"
                disabled={index >= length - 1}
                onClick={() => goTo(index + 1)}
                className="touch-target inline-flex items-center justify-center border border-line text-bone transition-colors hover:border-brass hover:text-brass disabled:opacity-30"
              >
                <ChevronRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <span />
          )}

          {showDots && (
            <div
              className="flex items-center gap-1.5"
              role="tablist"
              aria-label={`Indicadores: ${label}`}
            >
              {Array.from({ length }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Ir para item ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-500',
                    i === index ? 'w-7 bg-brass' : 'w-1.5 bg-bone/25',
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Wrapper for each snap slide */
export function SnapSlide({
  children,
  className,
  widthClass = 'w-[88vw] max-w-[380px]',
}: {
  children: ReactNode
  className?: string
  widthClass?: string
}) {
  return (
    <div className={cn('snap-center-item shrink-0', widthClass, className)}>
      {children}
    </div>
  )
}
