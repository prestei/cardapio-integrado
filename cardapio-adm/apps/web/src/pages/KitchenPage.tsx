import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChefHat, Maximize, Minimize, Clock, RefreshCw } from 'lucide-react'
import { kdsService, subscribeKdsEvents } from '@/services/kds'
import { ordersService } from '@/services/orders'
import type { Order, OrderStatus } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { orderTypeLabels } from '@/utils/format'
import { cn } from '@/utils/cn'

const KITCHEN_STATUSES: OrderStatus[] = ['NEW', 'CONFIRMED', 'PREPARING']
const DELAY_THRESHOLD_MINUTES = 15

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  NEW: { label: 'Confirmar', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Preparar', next: 'PREPARING' },
  PREPARING: { label: 'Pronto', next: 'READY' },
}

function useElapsedMinutes(createdAt: string) {
  const [minutes, setMinutes] = useState(() => Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000))

  useEffect(() => {
    const interval = setInterval(() => {
      setMinutes(Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000))
    }, 15_000)
    return () => clearInterval(interval)
  }, [createdAt])

  return minutes
}

function OrderCard({
  order,
  onAdvance,
  isAdvancing,
}: {
  order: Order
  onAdvance: (id: string, status: OrderStatus) => void
  isAdvancing: boolean
}) {
  const minutes = useElapsedMinutes(order.createdAt)
  const isDelayed = minutes >= DELAY_THRESHOLD_MINUTES
  const action = NEXT_ACTION[order.status]

  return (
    <div
      className={cn(
        'flex flex-col rounded-[var(--radius-lg)] border-2 bg-surface p-4 transition-colors',
        isDelayed ? 'border-danger animate-pulse' : 'border-border',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-2xl font-bold text-text">#{order.code}</span>
        <span
          className={cn(
            'flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-sm font-semibold',
            isDelayed ? 'bg-danger/15 text-danger' : 'bg-elevated text-muted',
          )}
        >
          <Clock className="h-4 w-4" />
          {minutes}min
        </span>
      </div>

      <p className="mt-1 text-sm text-muted">
        {orderTypeLabels[order.type]} {order.customer?.name ? `· ${order.customer.name}` : ''}
      </p>

      {order.items && order.items.length > 0 && (
        <ul className="mt-3 flex-1 space-y-1.5 border-t border-border pt-3">
          {order.items.map((item) => (
            <li key={item.id} className="text-base text-text">
              <span className="font-semibold">{item.quantity}x</span> {item.name}
              {item.additionals && item.additionals.length > 0 && (
                <span className="block text-sm text-muted">
                  + {item.additionals.map((a) => a.name).join(', ')}
                </span>
              )}
              {item.notes && <span className="block text-sm italic text-muted">Obs: {item.notes}</span>}
            </li>
          ))}
        </ul>
      )}

      {order.notes && (
        <p className="mt-3 rounded-[var(--radius-sm)] bg-elevated px-2 py-1.5 text-sm italic text-muted">
          {order.notes}
        </p>
      )}

      {action && (
        <button
          type="button"
          disabled={isAdvancing}
          onClick={() => onAdvance(order.id, action.next)}
          className="mt-4 flex h-14 items-center justify-center rounded-[var(--radius-md)] bg-accent text-lg font-bold text-bg transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export function KitchenPage() {
  const queryClient = useQueryClient()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: kdsOrders, error: kdsError } = useQuery({
    queryKey: ['kds-orders'],
    queryFn: kdsService.list,
    refetchInterval: 15_000,
    retry: 1,
  })

  const { data: fallbackOrders, isLoading: fallbackLoading } = useQuery({
    queryKey: ['orders', 'kitchen-fallback'],
    queryFn: () => ordersService.list({}),
    refetchInterval: 15_000,
    enabled: Boolean(kdsError),
  })

  const orders = (kdsError ? fallbackOrders : kdsOrders) ?? []
  const isLoading = kdsError ? fallbackLoading : !kdsOrders && !kdsError

  useEffect(() => {
    const unsubscribe = subscribeKdsEvents(() => {
      queryClient.invalidateQueries({ queryKey: ['kds-orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders', 'kitchen-fallback'] })
    })
    return unsubscribe
  }, [queryClient])

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void containerRef.current?.requestFullscreen()
    }
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kds-orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const kitchenOrders = orders
    .filter((o) => KITCHEN_STATUSES.includes(o.status))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  return (
    <div ref={containerRef} className={cn(isFullscreen && 'min-h-dvh bg-bg p-6')}>
      <PageHeader
        title="Cozinha"
        description="Painel de produção (KDS) — acompanhe e avance os pedidos"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['kds-orders'] })}
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              {isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            </Button>
          </div>
        }
      />

      {isLoading && (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && kitchenOrders.length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
          <EmptyState
            icon={ChefHat}
            title="Nenhum pedido na cozinha"
            description="Novos pedidos aparecerão aqui automaticamente."
          />
        </div>
      )}

      {!isLoading && kitchenOrders.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kitchenOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAdvance={(id, status) => statusMutation.mutate({ id, status })}
              isAdvancing={statusMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
