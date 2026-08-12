import { AnimatePresence, motion } from 'motion/react'
import { Minus, Plus, Trash2, X } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useMediaQuery } from '@/hooks/useSectionObserver'
import { cn, formatCurrency } from '@/utils'

export function Cart() {
  const {
    isOpen,
    closeCart,
    items,
    itemCount,
    subtotal,
    updateQuantity,
    removeItem,
  } = useCart()
  const isMobile = useMediaQuery('(max-width: 767px)')

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="cart-title">
          <motion.button
            type="button"
            aria-label="Fechar carrinho"
            className="absolute inset-0 bg-ink/70 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isMobile ? 0.2 : 0.25 }}
            onClick={closeCart}
          />

          <motion.aside
            className={cn(
              'absolute flex flex-col bg-ink-soft',
              isMobile
                ? 'inset-x-0 bottom-0 max-h-[min(90svh,calc(100dvh-var(--safe-top)))] rounded-t-2xl'
                : 'top-0 right-0 h-full w-full max-w-md border-l border-line',
            )}
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={
              isMobile
                ? { type: 'spring', stiffness: 380, damping: 36 }
                : { type: 'spring', stiffness: 320, damping: 34 }
            }
          >
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1" aria-hidden>
                <span className="h-1 w-10 rounded-full bg-bone/25" />
              </div>
            )}

            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <p className="section-kicker">Pedido</p>
                <h2 id="cart-title" className="font-display text-2xl font-bold text-bone">
                  Seu pedido
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Fechar"
                className="touch-target inline-flex items-center justify-center text-bone/70 hover:text-brass"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <p className="py-16 text-center text-bone/45">
                  Seu pedido ainda está vazio.
                  <br />
                  Explore o cardápio e adicione algo especial.
                </p>
              ) : (
                <ul className="space-y-5">
                  {items.map((item) => (
                    <li key={item.key} className="flex gap-4 border-b border-line/60 pb-5">
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-20 w-16 shrink-0 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display text-base text-bone">{item.name}</h3>
                          <button
                            type="button"
                            aria-label={`Remover ${item.name}`}
                            onClick={() => removeItem(item.key)}
                            className="touch-target text-bone/40 hover:text-danger"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {item.addons.length > 0 && (
                          <p className="mt-1 text-xs text-bone/45">
                            {item.addons.map((a) => a.name).join(', ')}
                          </p>
                        )}
                        {item.notes && (
                          <p className="mt-1 text-xs text-bone/40 italic">{item.notes}</p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center border border-line">
                            <button
                              type="button"
                              aria-label="Diminuir quantidade"
                              className="touch-target px-2 py-1 text-bone hover:text-brass"
                              onClick={() => updateQuantity(item.key, item.quantity - 1)}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="min-w-6 text-center text-sm">{item.quantity}</span>
                            <button
                              type="button"
                              aria-label="Aumentar quantidade"
                              className="touch-target px-2 py-1 text-bone hover:text-brass"
                              onClick={() => updateQuantity(item.key, item.quantity + 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="font-display text-brass">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div
                className="border-t border-line p-5"
                style={{ paddingBottom: 'max(1.25rem, var(--safe-bottom))' }}
              >
                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="text-bone/55">
                    Subtotal · {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                  </span>
                  <span className="font-display text-lg text-bone">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full min-h-12 items-center justify-center bg-brass font-display text-xs tracking-[0.22em] text-ink uppercase"
                >
                  Finalizar pedido
                </motion.button>
                <p className="mt-3 text-center text-[0.7rem] text-bone/35">
                  Checkout conectará à API do painel em breve.
                </p>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
