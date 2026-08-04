import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useParams } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart, getCartItemTotal } from '@/hooks/useCart'
import { useStore } from '@/contexts/StoreContext'
import { formatCurrency } from '@/utils/currency'
import { modalMotion } from '@/animations/motion'
import { bounceCartBadge } from '@/animations/anime'
import { resolveProductImage } from '@/utils/images'

export function Cart() {
  const { slug } = useParams()
  const { menu } = useStore()
  const {
    items,
    itemCount,
    subtotal,
    isOpen,
    closeCart,
    openCart,
    updateQuantity,
    removeItem,
    bumpToken,
  } = useCart()
  const mobileBadgeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (bumpToken > 0) bounceCartBadge(mobileBadgeRef.current)
  }, [bumpToken])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, closeCart])

  const minOrder = menu?.settings.minOrderValue ?? 0
  const belowMin = minOrder > 0 && subtotal < minOrder
  const storeSlug = slug ?? menu?.establishment.slug

  return (
    <>
      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas p-3 shadow-[var(--shadow-lift)] md:hidden">
          <button
            type="button"
            onClick={openCart}
            className="btn-primary flex h-12 w-full items-center justify-between rounded-[var(--radius-md)] px-4 text-sm font-semibold"
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span ref={mobileBadgeRef}>{itemCount} itens</span>
            </span>
            <span>
              {formatCurrency(subtotal)} · Ver Pedido
            </span>
          </button>
        </div>
      )}

      <AnimatePresence>
        {isOpen ? (
          <motion.div className="fixed inset-0 z-50" {...modalMotion.overlay}>
            <button
              type="button"
              className="absolute inset-0 bg-ink/40"
              aria-label="Fechar carrinho"
              onClick={closeCart}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Carrinho"
              className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-canvas shadow-[var(--shadow-lift)]"
              {...modalMotion.drawer}
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h2 className="text-base font-semibold">Seu pedido</h2>
                <button
                  type="button"
                  onClick={closeCart}
                  className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] text-muted hover:bg-surface-2"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {items.length === 0 ? (
                  <p className="text-sm text-muted">
                    Seu carrinho está vazio. Explore o cardápio e adicione itens.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {items.map((item) => (
                      <li key={item.key} className="flex gap-3 border-b border-line pb-4">
                        <img
                          src={resolveProductImage(item.imageUrl, item.name)}
                          alt=""
                          className="h-16 w-16 rounded-[var(--radius-sm)] object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-ink">{item.name}</p>
                              {item.additionals.length > 0 ? (
                                <p className="mt-0.5 text-xs text-muted">
                                  {item.additionals
                                    .map((a) =>
                                      a.quantity > 1
                                        ? `${a.quantity}x ${a.name}`
                                        : a.name,
                                    )
                                    .join(', ')}
                                </p>
                              ) : null}
                              {item.notes ? (
                                <p className="mt-0.5 text-xs italic text-muted">
                                  {item.notes}
                                </p>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.key)}
                              className="text-muted hover:text-danger"
                              aria-label={`Remover ${item.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center rounded-[var(--radius-sm)] border border-line">
                              <button
                                type="button"
                                className="grid h-8 w-8 place-items-center"
                                onClick={() =>
                                  updateQuantity(item.key, item.quantity - 1)
                                }
                                aria-label="Diminuir"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="min-w-5 text-center text-sm font-semibold">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                className="grid h-8 w-8 place-items-center"
                                onClick={() =>
                                  updateQuantity(item.key, item.quantity + 1)
                                }
                                aria-label="Aumentar"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="text-sm font-semibold">
                              {formatCurrency(getCartItemTotal(item))}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-line p-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                {belowMin ? (
                  <p className="mb-3 text-xs text-muted">
                    Pedido mínimo: {formatCurrency(minOrder)}
                  </p>
                ) : null}
                {storeSlug && items.length > 0 ? (
                  <Link
                    to={`/${storeSlug}/checkout`}
                    onClick={closeCart}
                    className="btn-primary flex h-12 items-center justify-center rounded-[var(--radius-md)] text-sm font-semibold transition"
                  >
                    Finalizar pedido
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] bg-line text-sm font-semibold text-muted"
                  >
                    Finalizar pedido
                  </button>
                )}
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
