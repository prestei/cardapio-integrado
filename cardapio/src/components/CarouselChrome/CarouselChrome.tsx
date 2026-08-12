import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils'

interface CarouselChromeProps {
  onPrev: () => void
  onNext: () => void
  index: number
  length: number
  onGoTo: (i: number) => void
  label?: string
  className?: string
  dark?: boolean
}

export function CarouselChrome({
  onPrev,
  onNext,
  index,
  length,
  onGoTo,
  label = 'Carrossel',
  className,
  dark = true,
}: CarouselChromeProps) {
  if (length <= 1) return null

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        className,
      )}
    >
      <div className="flex items-center gap-2" role="group" aria-label={`Navegação: ${label}`}>
        <button
          type="button"
          aria-label="Anterior"
          onClick={onPrev}
          className={cn(
            'touch-target inline-flex items-center justify-center border transition-colors',
            dark
              ? 'border-line text-bone hover:border-brass hover:text-brass'
              : 'border-ink/20 text-ink hover:border-brass hover:text-brass',
          )}
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          aria-label="Próximo"
          onClick={onNext}
          className={cn(
            'touch-target inline-flex items-center justify-center border transition-colors',
            dark
              ? 'border-line text-bone hover:border-brass hover:text-brass'
              : 'border-ink/20 text-ink hover:border-brass hover:text-brass',
          )}
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </button>
      </div>

      <div
        className="flex items-center gap-2"
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
            onClick={() => onGoTo(i)}
            className={cn(
              'h-1.5 rounded-full transition-all duration-500',
              i === index
                ? 'w-8 bg-brass'
                : dark
                  ? 'w-1.5 bg-bone/25 hover:bg-bone/45'
                  : 'w-1.5 bg-ink/25 hover:bg-ink/45',
            )}
          />
        ))}
      </div>
    </div>
  )
}
