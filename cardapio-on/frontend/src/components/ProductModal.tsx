import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Minus, Plus, X } from 'lucide-react'
import { useProductDetail } from '@/hooks/useProducts'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/utils/currency'
import { resolveProductImage } from '@/utils/images'
import { modalMotion } from '@/animations/motion'
import { popPrice, pulseAddButton } from '@/animations/anime'
import type { AdditionalGroup, CartAdditional } from '@/types'
import { cn } from '@/utils/cn'

interface ProductModalProps {
  productId: string | null
  onClose: () => void
}

export function ProductModal({ productId, onClose }: ProductModalProps) {
  const { data: product, isLoading, isError } = useProductDetail(productId)
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [selected, setSelected] = useState<Record<string, Record<string, number>>>({})
  const priceRef = useRef<HTMLSpanElement>(null)
  const addBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!product) return
    setQuantity(1)
    setNotes('')
    const initial: Record<string, Record<string, number>> = {}
    for (const group of product.additionalGroups) {
      initial[group.id] = {}
      if (group.selectionType === 'SINGLE' && group.isRequired) {
        const first = group.additionals[0]
        if (first) initial[group.id][first.id] = 1
      }
    }
    setSelected(initial)
  }, [product])

  useEffect(() => {
    if (!productId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [productId, onClose])

  const unitPrice = useMemo(() => {
    if (!product) return 0
    const base = product.promoPrice ?? product.price
    let extras = 0
    for (const group of product.additionalGroups) {
      const picks = selected[group.id] ?? {}
      for (const add of group.additionals) {
        extras += (picks[add.id] ?? 0) * add.price
      }
    }
    return base + extras
  }, [product, selected])

  useEffect(() => {
    popPrice(priceRef.current)
  }, [unitPrice, quantity])

  const toggleAdditional = (group: AdditionalGroup, additionalId: string) => {
    setSelected((prev) => {
      const current = { ...(prev[group.id] ?? {}) }
      if (group.selectionType === 'SINGLE') {
        return { ...prev, [group.id]: { [additionalId]: 1 } }
      }
      if (current[additionalId]) {
        delete current[additionalId]
      } else {
        const count = Object.values(current).reduce((a, b) => a + b, 0)
        if (count >= group.maxQuantity) return prev
        current[additionalId] = 1
      }
      return { ...prev, [group.id]: current }
    })
  }

  const canSubmit = useMemo(() => {
    if (!product?.isAvailable) return false
    return product.additionalGroups.every((group) => {
      if (!group.isRequired) return true
      const count = Object.values(selected[group.id] ?? {}).reduce((a, b) => a + b, 0)
      return count >= group.minQuantity
    })
  }, [product, selected])

  const handleAdd = () => {
    if (!product || !canSubmit) return
    const additionals: CartAdditional[] = []
    for (const group of product.additionalGroups) {
      const picks = selected[group.id] ?? {}
      for (const add of group.additionals) {
        const qty = picks[add.id] ?? 0
        if (qty > 0) {
          additionals.push({
            additionalId: add.id,
            name: add.name,
            price: add.price,
            quantity: qty,
          })
        }
      }
    }
    pulseAddButton(addBtnRef.current)
    addItem({
      productId: product.id,
      name: product.name,
      imageUrl: resolveProductImage(
        product.imageUrl,
        product.name,
        product.category.name,
      ),
      unitPrice: product.promoPrice ?? product.price,
      quantity,
      notes: notes.trim() || undefined,
      additionals,
    })
    onClose()
  }

  return (
    <AnimatePresence>
      {productId ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          {...modalMotion.overlay}
        >
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Fechar detalhes"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[var(--radius-lg)] bg-canvas shadow-[var(--shadow-lift)] sm:rounded-[var(--radius-lg)]"
            {...modalMotion.panel}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 id="product-modal-title" className="text-base font-semibold text-ink">
                Detalhes
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] text-muted hover:bg-surface-2 hover:text-ink"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-4">
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-48 animate-pulse rounded-[var(--radius-md)] bg-surface-2" />
                  <div className="h-5 w-2/3 animate-pulse rounded bg-surface-2" />
                  <div className="h-16 animate-pulse rounded bg-surface-2" />
                </div>
              ) : isError || !product ? (
                <p className="text-sm text-muted">Não foi possível carregar o produto.</p>
              ) : (
                <>
                  <img
                    src={resolveProductImage(
                      product.imageUrl ?? product.images[0]?.url,
                      product.name,
                      product.category.name,
                    )}
                    alt={product.name}
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <h3 className="mt-4 text-xl font-semibold text-ink">{product.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {product.description}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {product.category.name}
                    {product.prepTimeMinutes
                      ? ` · ${product.prepTimeMinutes} min`
                      : ''}
                  </p>

                  {product.additionalGroups.map((group) => (
                    <fieldset key={group.id} className="mt-6">
                      <legend className="mb-2 flex w-full items-center justify-between text-sm font-semibold text-ink">
                        <span>{group.name}</span>
                        <span className="text-xs font-medium text-muted">
                          {group.isRequired ? 'Obrigatório' : 'Opcional'}
                        </span>
                      </legend>
                      <div className="space-y-2">
                        {group.additionals.map((add) => {
                          const active = Boolean(selected[group.id]?.[add.id])
                          return (
                            <label
                              key={add.id}
                              className={cn(
                                'flex cursor-pointer items-center justify-between rounded-[var(--radius-md)] border px-3 py-2.5 text-sm transition',
                                active
                                  ? 'border-ink/30 bg-surface'
                                  : 'border-line hover:border-line-strong',
                              )}
                            >
                              <span className="flex items-center gap-2.5">
                                <input
                                  type={
                                    group.selectionType === 'SINGLE'
                                      ? 'radio'
                                      : 'checkbox'
                                  }
                                  name={group.id}
                                  checked={active}
                                  onChange={() => toggleAdditional(group, add.id)}
                                  className="accent-[var(--store-primary)]"
                                />
                                {add.name}
                              </span>
                              <span className="text-muted">
                                {add.price > 0
                                  ? `+ ${formatCurrency(add.price)}`
                                  : 'Incluso'}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </fieldset>
                  ))}

                  <label className="mt-6 block">
                    <span className="mb-2 block text-sm font-semibold text-ink">
                      Alguma observação?
                    </span>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder="Ex.: Sem cebola e com pouco molho."
                      className="w-full resize-none rounded-[var(--radius-md)] border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink/30"
                    />
                  </label>
                </>
              )}
            </div>

            {product ? (
              <div className="flex items-center gap-3 border-t border-line px-4 py-3">
                <div className="flex items-center rounded-[var(--radius-md)] border border-line">
                  <button
                    type="button"
                    className="grid h-11 w-11 place-items-center"
                    aria-label="Diminuir"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-6 text-center text-sm font-semibold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="grid h-11 w-11 place-items-center"
                    aria-label="Aumentar"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  ref={addBtnRef}
                  type="button"
                  disabled={!canSubmit}
                  onClick={handleAdd}
                  className="btn-primary flex h-11 flex-1 items-center justify-between rounded-[var(--radius-md)] px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>Adicionar</span>
                  <span ref={priceRef} className="price-pop">
                    {formatCurrency(unitPrice * quantity)}
                  </span>
                </button>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
