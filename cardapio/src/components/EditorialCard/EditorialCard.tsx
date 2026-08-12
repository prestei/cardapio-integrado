import { motion } from 'motion/react'
import { cn, formatCurrency } from '@/utils'

export interface EditorialCardProps {
  imageUrl: string
  imageAlt: string
  eyebrow?: string
  title: string
  description: string
  price: number
  compareAtPrice?: number | null
  badge?: string
  meta?: string
  ctaLabel: string
  stacked?: boolean
  unavailable?: boolean
  onCta: () => void
}

export function EditorialCard({
  imageUrl,
  imageAlt,
  eyebrow,
  title,
  description,
  price,
  compareAtPrice,
  badge,
  meta,
  ctaLabel,
  stacked,
  unavailable,
  onCta,
}: EditorialCardProps) {
  const hasCompare =
    compareAtPrice != null && compareAtPrice > price

  return (
    <article
      className={cn(
        'relative overflow-hidden bg-ink-elevated',
        stacked
          ? 'flex h-auto w-full flex-col'
          : 'grid h-[380px] w-full grid-cols-[1.05fr_0.95fr]',
        unavailable && 'opacity-60',
      )}
    >
      <div
        className={cn(
          'relative min-h-0 overflow-hidden',
          stacked ? 'aspect-[16/11] w-full' : 'h-full',
        )}
      >
        <img
          src={imageUrl}
          alt={imageAlt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          draggable={false}
        />
        <div
          className={cn(
            'absolute inset-0',
            stacked
              ? 'bg-gradient-to-t from-ink-elevated via-transparent to-transparent'
              : 'bg-gradient-to-r from-transparent to-ink-elevated/80',
          )}
        />
        {badge && (
          <span className="absolute top-3 left-3 bg-brass px-2.5 py-1 font-display text-[0.7rem] tracking-[0.12em] text-ink sm:top-4 sm:left-4 sm:px-3 sm:text-xs">
            {badge}
          </span>
        )}
      </div>

      <div
        className={cn(
          'flex min-h-0 flex-col',
          stacked ? 'justify-center p-5' : 'justify-between p-6 lg:p-8',
        )}
      >
        <div className="min-h-0">
          {eyebrow && (
            <p className="text-[0.65rem] tracking-[0.22em] text-brass uppercase">
              {eyebrow}
            </p>
          )}
          <h3
            className={cn(
              'font-display font-bold tracking-tight text-bone',
              eyebrow ? 'mt-2' : '',
              stacked ? 'text-2xl' : 'line-clamp-2 text-2xl lg:text-3xl',
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              'mt-2 text-sm text-bone/60',
              stacked ? 'line-clamp-2' : 'line-clamp-2 lg:mt-3',
            )}
          >
            {description}
          </p>
        </div>

        <div className={cn(stacked ? 'mt-5' : 'mt-4 shrink-0')}>
          <div className="flex flex-wrap items-baseline gap-3">
            {hasCompare && (
              <span className="text-sm text-bone/35 line-through">
                {formatCurrency(compareAtPrice!)}
              </span>
            )}
            <span
              className={cn(
                'font-display text-brass',
                stacked ? 'text-2xl' : 'text-2xl lg:text-3xl',
              )}
            >
              {formatCurrency(price)}
            </span>
          </div>

          <p className="mt-2 min-h-[1rem] text-[0.7rem] tracking-wide text-bone/40">
            {meta ?? '\u00A0'}
          </p>

          <motion.button
            type="button"
            data-no-drag
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            disabled={unavailable}
            onClick={(e) => {
              e.stopPropagation()
              onCta()
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
              'relative z-10 inline-flex min-h-12 items-center justify-center border border-brass bg-transparent px-6 font-display text-xs tracking-[0.22em] text-brass uppercase transition-colors hover:bg-brass hover:text-ink disabled:cursor-not-allowed disabled:opacity-40',
              stacked ? 'mt-5 w-full' : 'mt-4 w-full max-w-[200px]',
            )}
          >
            {unavailable ? 'Indisponível' : ctaLabel}
          </motion.button>
        </div>
      </div>
    </article>
  )
}
