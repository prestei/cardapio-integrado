import { motion } from 'motion/react'
import { Search, ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useUI } from '@/context/UIContext'
import type { Store } from '@/types'
import { cn, formatCurrency } from '@/utils'
import { StoreMark } from '@/components/StoreMark'

interface HeaderProps {
  store: Store
  compact?: boolean
}

function HeaderIconButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full',
        'border border-white/10 bg-white/[0.06] text-bone/90 backdrop-blur-md',
        'transition-colors hover:border-brass/35 hover:bg-white/10 hover:text-brass',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Header({ store, compact }: HeaderProps) {
  const { openSearch } = useUI()
  const { itemCount, subtotal, openCart, lastAddedAt } = useCart()
  const hideMobileCart = itemCount > 0
  const showHeaderMark = compact || !store.logoUrl

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-[background,backdrop-filter,box-shadow,border-color] duration-500',
        compact
          ? 'border-b border-line/50 bg-ink/92 shadow-[0_10px_40px_rgb(0_0_0/0.45)] backdrop-blur-xl'
          : 'border-b border-white/[0.06] bg-gradient-to-b from-ink/90 via-ink/55 to-transparent backdrop-blur-md',
      )}
      style={{ paddingTop: 'var(--safe-top)' }}
    >
      <div
        className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8"
        style={{ height: 'var(--header-h)' }}
      >
        <a
          href="#loja"
          className="group flex min-w-0 items-center gap-2.5 no-underline sm:gap-3"
          aria-label={`${store.name} — início`}
        >
          {showHeaderMark && (
            <StoreMark
              store={store}
              size="sm"
              className="ring-offset-transparent transition-transform group-hover:scale-[1.03]"
            />
          )}
          <div className="min-w-0">
            <span
              className={cn(
                'block truncate font-display font-bold tracking-[0.14em] text-bone sm:tracking-[0.18em]',
                compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl',
                !compact && 'drop-shadow-[0_2px_12px_rgb(0_0_0/0.55)]',
              )}
            >
              {store.name}
            </span>
            {store.isOpen && (
              <span
                className={cn(
                  'mt-0.5 hidden items-center gap-1.5 text-[0.62rem] tracking-[0.2em] uppercase sm:inline-flex',
                  compact ? 'text-brass' : 'text-brass drop-shadow-[0_1px_8px_rgb(0_0_0/0.5)]',
                )}
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brass" />
                Aberto agora
              </span>
            )}
          </div>
        </a>

        <div className="flex shrink-0 items-center gap-2">
          <HeaderIconButton label="Buscar no cardápio" onClick={openSearch}>
            <Search size={18} strokeWidth={1.75} />
          </HeaderIconButton>

          <motion.button
            type="button"
            onClick={openCart}
            aria-label={`Carrinho, ${itemCount} itens, ${formatCurrency(subtotal)}`}
            className={cn(
              'relative inline-flex items-center justify-center gap-2 rounded-full transition-colors',
              'border border-white/10 bg-white/[0.06] text-bone/90 backdrop-blur-md',
              'hover:border-brass/35 hover:bg-white/10 hover:text-brass',
              itemCount > 0 ? 'h-10 px-3.5' : 'h-10 w-10',
              hideMobileCart && 'lg:inline-flex max-lg:hidden',
            )}
            key={lastAddedAt || 'cart'}
            animate={lastAddedAt ? { scale: [1, 1.06, 1] } : undefined}
            transition={{ duration: 0.35 }}
          >
            <ShoppingBag size={18} strokeWidth={1.75} />
            {itemCount > 0 && (
              <>
                <span className="hidden font-display text-[0.65rem] tracking-[0.14em] uppercase sm:inline">
                  {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                </span>
                <span className="hidden text-sm font-semibold text-brass lg:inline">
                  {formatCurrency(subtotal)}
                </span>
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cta px-1 font-display text-[0.58rem] font-bold text-white sm:hidden">
                  {itemCount}
                </span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </header>
  )
}
