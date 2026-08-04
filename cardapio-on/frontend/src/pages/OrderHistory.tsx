import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { RotateCcw } from 'lucide-react'
import { Header } from '@/components/Header'
import { useCart } from '@/hooks/useCart'
import { usePhoneStorage } from '@/hooks/usePhoneStorage'
import { getCustomerOrderHistory, reorder } from '@/services/customers'
import { pageTransition } from '@/animations/motion'
import { formatCurrency } from '@/utils/currency'
import { formatOrderTime, formatPhoneInput, onlyDigits } from '@/utils/formatters'
import { isValidPhone } from '@/utils/validators'
import { ApiError } from '@/services/api'
import type { OrderStatus, ReorderResult } from '@/types'

const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'Recebido',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparo',
  READY: 'Pronto',
  OUT_FOR_DELIVERY: 'Saiu para entrega',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  NEW: 'bg-accent/15 text-accent',
  CONFIRMED: 'bg-accent/15 text-accent',
  PREPARING: 'bg-accent/15 text-accent',
  READY: 'bg-success/15 text-success',
  OUT_FOR_DELIVERY: 'bg-success/15 text-success',
  COMPLETED: 'bg-success/15 text-success',
  CANCELLED: 'bg-danger/15 text-danger',
}

export function OrderHistoryPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [phone, setPhone] = usePhoneStorage(slug)
  const [inputPhone, setInputPhone] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [reorderingId, setReorderingId] = useState<string | null>(null)
  const [reorderResult, setReorderResult] = useState<ReorderResult | null>(null)
  const [reorderError, setReorderError] = useState<string | null>(null)

  const hasPhone = Boolean(phone && isValidPhone(phone))

  const query = useQuery({
    queryKey: ['order-history', slug, phone],
    queryFn: () => getCustomerOrderHistory(slug, phone),
    enabled: Boolean(slug) && hasPhone,
  })

  const lookup = (e: FormEvent) => {
    e.preventDefault()
    if (!isValidPhone(inputPhone)) {
      setInputError('Informe um telefone válido.')
      return
    }
    setInputError(null)
    setPhone(onlyDigits(inputPhone))
  }

  const changePhone = () => {
    setPhone('')
    setInputPhone('')
  }

  const handleReorder = async (orderId: string) => {
    setReorderingId(orderId)
    setReorderError(null)
    setReorderResult(null)
    try {
      const result = await reorder(slug, phone, orderId)
      setReorderResult(result)
      for (const item of result.available) {
        addItem({
          productId: item.productId,
          name: item.name,
          imageUrl: item.imageUrl,
          unitPrice: item.currentPrice,
          quantity: item.quantity,
          additionals: [],
        })
      }
      if (result.available.length > 0) {
        navigate(`/${slug}/checkout`)
      }
    } catch (err) {
      setReorderError(
        err instanceof ApiError ? err.message : 'Não foi possível repetir este pedido.',
      )
    } finally {
      setReorderingId(null)
    }
  }

  const orders = query.data ?? []

  return (
    <div className="min-h-dvh bg-canvas">
      <Header solid />
      <motion.main
        id="main-content"
        className="mx-auto max-w-3xl px-4 py-8 sm:px-6"
        {...pageTransition}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Histórico
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink">Meus pedidos</h1>
        <p className="mt-2 text-sm text-muted">
          Informe seu telefone para ver seus pedidos anteriores e pedir de novo em poucos
          cliques.
        </p>

        {!hasPhone ? (
          <form
            onSubmit={lookup}
            className="mt-8 max-w-sm rounded-[var(--radius-lg)] border border-line bg-surface p-4 sm:p-5"
          >
            <label className="block">
              <span className="mb-1.5 block text-sm text-ink-soft">Telefone</span>
              <input
                required
                inputMode="tel"
                autoComplete="tel"
                value={inputPhone}
                onChange={(e) => {
                  setInputPhone(formatPhoneInput(e.target.value))
                  setInputError(null)
                }}
                placeholder="(11) 91234-5678"
                className="h-11 w-full rounded-[var(--radius-md)] border border-line bg-canvas px-3 text-sm outline-none focus:border-ink/30"
              />
            </label>
            {inputError ? <p className="mt-2 text-sm text-danger">{inputError}</p> : null}
            <button
              type="submit"
              className="btn-primary mt-4 flex h-11 w-full items-center justify-center rounded-[var(--radius-md)] text-sm font-semibold transition"
            >
              Ver meus pedidos
            </button>
          </form>
        ) : (
          <>
            <div className="mt-6 flex items-center justify-between gap-3">
              <p className="text-sm text-muted">
                Pedidos para <span className="font-medium text-ink">{phone}</span>
              </p>
              <button
                type="button"
                onClick={changePhone}
                className="text-sm font-semibold underline-offset-2 hover:underline"
              >
                Trocar telefone
              </button>
            </div>

            {reorderError ? (
              <p className="mt-4 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                {reorderError}
              </p>
            ) : null}

            {reorderResult && reorderResult.unavailable.length > 0 ? (
              <div className="mt-4 rounded-[var(--radius-md)] border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
                <p className="font-medium text-ink">Alguns itens não puderam ser adicionados:</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  {reorderResult.unavailable.map((item, i) => (
                    <li key={`${item.productId ?? item.name}-${i}`}>
                      {item.name} — {item.reason}
                    </li>
                  ))}
                </ul>
                {reorderResult.available.length > 0 ? (
                  <p className="mt-2 text-xs text-muted">
                    Observação: adicionais do pedido original não são reaplicados
                    automaticamente — revise os itens no carrinho.
                  </p>
                ) : null}
              </div>
            ) : null}

            {query.isLoading ? (
              <div className="mt-6 space-y-3">
                <div className="h-24 animate-pulse rounded-[var(--radius-md)] bg-surface-2" />
                <div className="h-24 animate-pulse rounded-[var(--radius-md)] bg-surface-2" />
              </div>
            ) : query.isError ? (
              <p className="mt-8 text-sm text-muted">
                Não foi possível carregar seus pedidos. Tente novamente mais tarde.
              </p>
            ) : orders.length === 0 ? (
              <div className="mt-8 rounded-[var(--radius-md)] border border-line bg-surface px-4 py-8 text-center">
                <p className="text-sm text-muted">Nenhum pedido encontrado para este telefone.</p>
                <Link
                  to={`/${slug}/cardapio`}
                  className="mt-4 inline-block text-sm font-semibold underline-offset-2 hover:underline"
                >
                  Ver cardápio
                </Link>
              </div>
            ) : (
              <ul className="mt-6 space-y-3">
                {orders.map((order) => (
                  <li
                    key={order.id}
                    className="rounded-[var(--radius-lg)] border border-line bg-surface p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-ink">Pedido {order.code}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {formatOrderTime(order.createdAt)}
                          {order.isScheduled ? ' · Agendado' : ''}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[order.status]}`}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-muted">
                      {order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-base font-semibold text-ink">
                        {formatCurrency(order.total)}
                      </p>
                      <div className="flex gap-2">
                        <Link
                          to={`/${slug}/pedido/${order.code}`}
                          className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-line px-4 text-sm font-semibold text-ink hover:bg-surface-2"
                        >
                          Ver detalhes
                        </Link>
                        <button
                          type="button"
                          disabled={reorderingId === order.id}
                          onClick={() => void handleReorder(order.id)}
                          className="btn-primary inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] px-4 text-sm font-semibold transition disabled:opacity-60"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          {reorderingId === order.id ? 'Repetindo…' : 'Pedir de novo'}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </motion.main>
    </div>
  )
}
