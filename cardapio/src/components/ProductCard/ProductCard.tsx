import { useRef } from 'react'
import { motion } from 'motion/react'
import type { Product } from '@/types'
import { cn, formatCurrency, productPrice } from '@/utils'

interface ProductCardProps {
  product: Product
  /** @deprecated Prefer a single portrait layout in menu carousels */
  variant?: 'portrait' | 'featured' | 'compact'
  active?: boolean
  touch?: boolean
  onOpen: (el: HTMLElement) => void
}

export function ProductCard({
  product,
  active,
  touch,
  onOpen,
}: ProductCardProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const price = productPrice(product)
  const hasPromo = product.promoPrice != null

  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={!product.isAvailable}
      onClick={() => ref.current && onOpen(ref.current)}
      whileHover={!touch && active ? { y: -3 } : undefined}
      whileTap={touch ? { scale: 0.985 } : undefined}
      className={cn(
        'group relative block h-full w-full overflow-hidden text-left',
        !product.isAvailable && 'opacity-50 grayscale',
      )}
    >
      <div className="relative aspect-[3/4] h-full overflow-hidden bg-ink">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />

        {product.isFeatured && (
          <span className="absolute top-4 left-4 text-[0.6rem] tracking-[0.22em] text-brass uppercase">
            Destaque
          </span>
        )}

        {!product.isAvailable && (
          <span className="absolute top-4 right-4 bg-ink/80 px-2 py-1 text-[0.6rem] tracking-[0.16em] text-bone/70 uppercase">
            Indisponível
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <h3 className="font-display text-xl font-bold tracking-tight text-bone transition-transform duration-500 group-hover:translate-x-0.5 sm:text-2xl">
            {product.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-bone/60">{product.description}</p>
          <div className="mt-3 flex items-center justify-between gap-3 sm:mt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg text-brass">{formatCurrency(price)}</span>
              {hasPromo && (
                <span className="text-sm text-bone/35 line-through">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>
            <span
              className={cn(
                'font-display text-[0.65rem] tracking-[0.18em] uppercase',
                touch
                  ? 'text-bone/80'
                  : 'translate-y-1 text-bone/0 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:text-bone/80 group-hover:opacity-100',
              )}
            >
              Adicionar
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}
