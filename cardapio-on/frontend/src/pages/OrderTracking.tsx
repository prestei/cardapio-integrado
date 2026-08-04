import { useEffect, useRef } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Header } from '@/components/Header'
import { OrderStatusTimeline } from '@/components/OrderStatus'
import { PixPayment } from '@/components/PixPayment'
import { getOrder } from '@/services/orders'
import { formatCurrency } from '@/utils/currency'
import { formatOrderTime } from '@/utils/formatters'
import { pageTransition } from '@/animations/motion'
import { successCheck } from '@/animations/anime'

export function OrderTrackingPage() {
  const { slug = '', code = '' } = useParams()
  const location = useLocation()
  const state = location.state as
    | { whatsappUrl?: string | null; justCreated?: boolean }
    | null
  const checkRef = useRef<HTMLDivElement>(null)

  const query = useQuery({
    queryKey: ['order', slug, code],
    queryFn: () => getOrder(slug, code),
    enabled: Boolean(slug && code),
    refetchInterval: (q) => {
      const status = q.state.data?.status
      if (!status || status === 'COMPLETED' || status === 'CANCELLED') return false
      return 8000
    },
  })

  useEffect(() => {
    if (state?.justCreated) successCheck(checkRef.current)
  }, [state?.justCreated])

  const order = query.data

  return (
    <div className="min-h-dvh bg-canvas">
      <Header solid />
      <motion.main
        id="main-content"
        className="mx-auto max-w-3xl px-4 py-8 sm:px-6"
        {...pageTransition}
      >
        {state?.justCreated ? (
          <div
            ref={checkRef}
            className="mb-6 rounded-[var(--radius-md)] border border-success/20 bg-success/5 px-4 py-4"
          >
            <p className="font-semibold text-success">Pedido recebido</p>
            <p className="mt-1 text-sm text-ink-soft">
              Seu pedido foi registrado com sucesso.
            </p>
          </div>
        ) : null}

        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Acompanhamento
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink">Pedido {code}</h1>

        {query.isLoading ? (
          <div className="mt-8 space-y-3">
            <div className="h-24 animate-pulse rounded bg-surface-2" />
            <div className="h-40 animate-pulse rounded bg-surface-2" />
          </div>
        ) : query.isError || !order ? (
          <p className="mt-8 text-sm text-muted">
            Não encontramos este pedido. Verifique o código e tente novamente.
          </p>
        ) : (
          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1fr]">
            <section>
              <OrderStatusTimeline
                status={order.status}
                isDelivery={order.type === 'DELIVERY'}
              />
              <dl className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Horário</dt>
                  <dd>{formatOrderTime(order.createdAt)}</dd>
                </div>
                {order.establishment?.estimatedMinutes ? (
                  <div className="flex justify-between">
                    <dt className="text-muted">Tempo estimado</dt>
                    <dd>{order.establishment.estimatedMinutes} min</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">
                Resumo
              </h2>
              <ul className="mt-3 space-y-2 border-b border-line pb-3 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>{formatCurrency(item.total)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Entrega</span>
                  <span>{formatCurrency(order.deliveryFee)}</span>
                </div>
                {order.discount > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-muted">Desconto</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {order &&
        order.payment &&
        (order.payment.method === 'PIX' || order.payment.method === 'ONLINE') &&
        order.payment.status !== 'PAID' &&
        order.status !== 'CANCELLED' ? (
          <PixPayment slug={slug} code={code} />
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {state?.whatsappUrl ? (
            <a
              href={state.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary inline-flex h-11 items-center rounded-[var(--radius-md)] px-5 text-sm font-semibold"
            >
              Enviar no WhatsApp
            </a>
          ) : null}
          <Link
            to={`/${slug}/cardapio`}
            className="inline-flex h-11 items-center rounded-[var(--radius-md)] border border-line px-5 text-sm font-semibold text-ink hover:bg-surface"
          >
            Voltar ao cardápio
          </Link>
        </div>
      </motion.main>
    </div>
  )
}
