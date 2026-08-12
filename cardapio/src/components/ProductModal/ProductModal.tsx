import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Minus, Plus, X } from 'lucide-react'
import type { Addon, Product } from '@/types'
import { useCart } from '@/context/CartContext'
import { useUI } from '@/context/UIContext'
import { useMenu } from '@/context/MenuContext'
import { useMediaQuery } from '@/hooks/useSectionObserver'
import { fetchProduct } from '@/services/menu.service'
import { cn, formatCurrency, productPrice } from '@/utils'
import { countUpPrice } from '@/animations/anime'

export function ProductModal() {
  const { productPanel, closeProduct } = useUI()
  const { addItem, openCart } = useCart()
  const { slug } = useMenu()
  const baseProduct = productPanel.product
  const isMobile = useMediaQuery('(max-width: 767px)')

  const [product, setProduct] = useState<Product | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [selected, setSelected] = useState<Record<string, Record<string, number>>>({})
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!baseProduct) {
      setProduct(null)
      return
    }

    setProduct(baseProduct)
    setQuantity(1)
    setNotes('')
    setSelected({})
    setAdding(false)

    let alive = true
    setLoadingDetails(true)
    fetchProduct(slug, baseProduct.id, baseProduct)
      .then((full) => {
        if (alive) setProduct(full)
      })
      .catch(() => {
        /* keep list snapshot */
      })
      .finally(() => {
        if (alive) setLoadingDetails(false)
      })

    return () => {
      alive = false
    }
  }, [baseProduct?.id, slug])

  useEffect(() => {
    if (!baseProduct) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeProduct()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [baseProduct, closeProduct])

  const groups = product?.addonGroups ?? []

  const addonTotal = useMemo(() => {
    let sum = 0
    for (const group of groups) {
      for (const addon of group.addons) {
        const qty = selected[group.id]?.[addon.id] ?? 0
        sum += addon.price * qty
      }
    }
    return sum
  }, [groups, selected])

  const unit = product ? productPrice(product) + addonTotal : 0
  const total = unit * quantity

  useEffect(() => {
    const el = document.getElementById('product-total-price')
    if (el && product) countUpPrice(el, 0, total, formatCurrency)
  }, [total, product])

  const toggleAddon = (groupId: string, addon: Addon, groupMax: number) => {
    setSelected((prev) => {
      const group = { ...(prev[groupId] ?? {}) }
      const current = group[addon.id] ?? 0
      if (current > 0) {
        delete group[addon.id]
      } else {
        const count = Object.values(group).reduce((a, b) => a + b, 0)
        if (groupMax === 1) {
          return { ...prev, [groupId]: { [addon.id]: 1 } }
        }
        if (count >= groupMax) return prev
        group[addon.id] = 1
      }
      return { ...prev, [groupId]: group }
    })
  }

  const canAdd = useMemo(() => {
    if (!product?.isAvailable) return false
    for (const group of groups) {
      if (!group.required) continue
      const count = Object.values(selected[group.id] ?? {}).reduce((a, b) => a + b, 0)
      if (count < group.min) return false
    }
    return true
  }, [product, groups, selected])

  const handleAdd = () => {
    if (!product || !canAdd) return
    setAdding(true)
    const addons = groups.flatMap((g) =>
      g.addons
        .filter((a) => (selected[g.id]?.[a.id] ?? 0) > 0)
        .map((a) => ({
          id: a.id,
          name: a.name,
          price: a.price,
          quantity: selected[g.id][a.id],
        })),
    )
    addItem({ product, quantity, addons, notes: notes.trim() || undefined })
    setTimeout(() => {
      closeProduct()
      openCart()
    }, 280)
  }

  return (
    <AnimatePresence>
      {baseProduct && product && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="product-panel-title">
          <motion.button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-ink/70 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeProduct}
          />

          <motion.div
            className={cn(
              'absolute flex flex-col overflow-hidden bg-ink-soft',
              isMobile
                ? 'inset-x-0 bottom-0 max-h-[min(92svh,calc(100dvh-var(--safe-top)))] rounded-t-2xl'
                : 'top-0 right-0 h-full w-full max-w-lg border-l border-line',
            )}
            initial={
              isMobile
                ? { y: '100%' }
                : { x: '100%', scale: 0.98 }
            }
            animate={isMobile ? { y: 0 } : { x: 0, scale: 1 }}
            exit={isMobile ? { y: '100%' } : { x: '100%', scale: 0.98 }}
            transition={
              isMobile
                ? { type: 'spring', stiffness: 380, damping: 36 }
                : { type: 'spring', stiffness: 320, damping: 34 }
            }
          >
            {isMobile && (
              <div className="flex justify-center pt-3" aria-hidden>
                <span className="h-1 w-10 rounded-full bg-bone/25" />
              </div>
            )}

            <div className="relative aspect-[16/11] shrink-0 sm:aspect-[16/10]">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-soft via-transparent to-ink/30" />
              <button
                type="button"
                onClick={closeProduct}
                aria-label="Fechar produto"
                className="absolute top-4 right-4 touch-target inline-flex items-center justify-center bg-ink/50 text-bone backdrop-blur-sm transition-colors hover:text-brass"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
              <p className="section-kicker mb-2">Produto</p>
              <h2 id="product-panel-title" className="font-display text-3xl font-bold tracking-tight text-bone">
                {product.name}
              </h2>
              <p className="mt-3 text-bone/65">{product.description}</p>
              <p className="mt-4 font-display text-xl text-brass">
                {formatCurrency(productPrice(product))}
                {product.promoPrice != null && (
                  <span className="ml-2 text-sm font-body text-bone/35 line-through">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </p>

              {loadingDetails && (
                <p className="mt-6 text-sm text-bone/40">Carregando opções...</p>
              )}

              {groups.map((group) => (
                <fieldset key={group.id} className="mt-8 border-0 p-0">
                  <legend className="font-display text-sm tracking-[0.14em] text-bone uppercase">
                    {group.name}
                    {group.required && (
                      <span className="ml-2 text-[0.65rem] tracking-normal text-brass normal-case">
                        obrigatório
                      </span>
                    )}
                  </legend>
                  <ul className="mt-3 space-y-2">
                    {group.addons.map((addon) => {
                      const checked = (selected[group.id]?.[addon.id] ?? 0) > 0
                      return (
                        <li key={addon.id}>
                          <button
                            type="button"
                            disabled={!addon.isAvailable}
                            onClick={() => toggleAddon(group.id, addon, group.max)}
                            className={cn(
                              'flex w-full items-center justify-between border px-4 py-3 text-left transition-colors',
                              checked
                                ? 'border-brass bg-brass/10 text-bone'
                                : 'border-line text-bone/70 hover:border-brass/50',
                            )}
                          >
                            <span>{addon.name}</span>
                            <span className="text-sm text-brass">
                              {addon.price > 0 ? `+ ${formatCurrency(addon.price)}` : 'Incluso'}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </fieldset>
              ))}

              <label className="mt-8 block">
                <span className="font-display text-sm tracking-[0.14em] text-bone/70 uppercase">
                  Observações
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Ex.: sem cebola, ponto da carne..."
                  className="mt-2 w-full resize-none border border-line bg-transparent px-3 py-2 text-sm text-bone placeholder:text-bone/30 focus:border-brass focus:outline-none"
                />
              </label>

              <div className="mt-8 mb-4 flex items-center justify-between">
                <span className="font-display text-sm tracking-[0.14em] text-bone/70 uppercase">
                  Quantidade
                </span>
                <div className="flex items-center gap-3 border border-line">
                  <button
                    type="button"
                    aria-label="Diminuir"
                    className="touch-target inline-flex items-center justify-center text-bone hover:text-brass"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-6 text-center font-display">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Aumentar"
                    className="touch-target inline-flex items-center justify-center text-bone hover:text-brass"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div
              className="shrink-0 border-t border-line bg-ink p-4 sm:p-5"
              style={{ paddingBottom: 'max(1rem, var(--safe-bottom))' }}
            >
              <motion.button
                type="button"
                disabled={!canAdd || adding}
                whileTap={{ scale: 0.98 }}
                onClick={handleAdd}
                className="flex w-full min-h-13 items-center justify-between bg-brass px-5 font-display text-xs tracking-[0.2em] text-ink uppercase transition-opacity disabled:opacity-40"
              >
                <span>{adding ? 'Adicionado' : 'Adicionar ao pedido'}</span>
                <span id="product-total-price">{formatCurrency(total)}</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
