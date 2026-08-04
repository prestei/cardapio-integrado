import { useRef, type MouseEvent } from 'react'
import { motion } from 'motion/react'
import { Heart, Minus, Plus } from 'lucide-react'
import type { ProductSummary } from '@/types'
import { formatCurrency } from '@/utils/currency'
import { resolveProductImage } from '@/utils/images'
import { getProductTags, TAG_LABELS } from '@/utils/productTags'
import { pulseAddButton } from '@/animations/anime'
import { useCart } from '@/hooks/useCart'
import { useFavorites } from '@/contexts/FavoritesContext'
import { cn } from '@/utils/cn'

interface ProductCardProps {
  product: ProductSummary
  categoryName?: string
  onOpen: (productId: string) => void
}

export function ProductCard({ product, categoryName, onOpen }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()
  const btnRef = useRef<HTMLButtonElement>(null)
  const favorite = isFavorite(product.id)
  const tags = getProductTags(product).slice(0, 2)
  const price = product.promoPrice ?? product.price
  const image = resolveProductImage(product.imageUrl, product.name, categoryName)
  const cartQty = items
    .filter((item) => item.productId === product.id)
    .reduce((sum, item) => sum + item.quantity, 0)

  const handleQuickAdd = (e: MouseEvent) => {
    e.stopPropagation()
    if (!product.isAvailable) return
    if (product.hasAdditionals) {
      onOpen(product.id)
      return
    }
    pulseAddButton(btnRef.current)
    addItem({
      productId: product.id,
      name: product.name,
      imageUrl: image,
      unitPrice: price,
      quantity: 1,
      additionals: [],
    })
  }

  return (
    <motion.article
      layout
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group flex cursor-pointer gap-3 rounded-[var(--radius-lg)] border border-line bg-canvas p-3 shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-lift)] sm:flex-col sm:gap-0 sm:p-0 sm:overflow-hidden',
        !product.isAvailable && 'opacity-60',
      )}
      onClick={() => onOpen(product.id)}
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-surface-2 sm:h-44 sm:w-full sm:rounded-none">
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(product.id)
          }}
          aria-pressed={favorite}
          aria-label={
            favorite ? `Remover ${product.name} dos favoritos` : `Adicionar ${product.name} aos favoritos`
          }
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-canvas/80 text-ink backdrop-blur-sm transition hover:bg-canvas"
        >
          <Heart className={cn('h-4 w-4', favorite && 'fill-danger text-danger')} />
        </button>
        {tags.length > 0 && (
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                style={{ background: 'var(--store-secondary)' }}
              >
                {TAG_LABELS[tag]}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col sm:p-4">
        <h3 className="truncate text-[15px] font-semibold text-ink">{product.name}</h3>
        {product.description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted sm:text-sm">
            {product.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="text-base font-semibold text-ink">{formatCurrency(price)}</p>
            {product.promoPrice != null && product.promoPrice < product.price ? (
              <p className="text-xs text-muted line-through">
                {formatCurrency(product.price)}
              </p>
            ) : null}
          </div>

          {!product.isAvailable ? (
            <span className="text-xs font-medium text-muted">Indisponível</span>
          ) : cartQty > 0 && !product.hasAdditionals ? (
            <div
              className="flex items-center gap-1 rounded-[var(--radius-md)] border border-line"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="grid h-9 w-9 place-items-center text-ink"
                aria-label="Diminuir quantidade"
                onClick={() => {
                  const first = items.find((i) => i.productId === product.id)
                  if (first) updateQuantity(first.key, first.quantity - 1)
                }}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-5 text-center text-sm font-semibold">{cartQty}</span>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center text-ink"
                aria-label="Aumentar quantidade"
                onClick={handleQuickAdd}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              ref={btnRef}
              type="button"
              onClick={handleQuickAdd}
              className="btn-primary h-9 rounded-[var(--radius-md)] px-3 text-sm font-semibold transition"
            >
              Adicionar
            </button>
          )}
        </div>
      </div>
    </motion.article>
  )
}
