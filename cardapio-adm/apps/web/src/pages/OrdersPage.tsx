import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  LayoutGrid,
  List,
  Printer,
  ChevronRight,
  Phone,
  ShoppingBag,
  Clock,
  CheckCircle2,
  DollarSign,
  Sparkles,
  Truck,
  Store,
  UtensilsCrossed,
  X,
  ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ordersService } from '@/services/orders'
import type { Order, OrderStatus, OrderType } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useDebounce } from '@/hooks/useDebounce'
import {
  formatCurrency,
  formatDateTime,
  orderStatusLabels,
  orderStatusColors,
  orderTypeLabels,
  paymentMethodLabels,
  ORDER_STATUS_FLOW,
} from '@/utils/format'
import { cn } from '@/utils/cn'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  ...Object.entries(orderStatusLabels).map(([value, label]) => ({ value, label })),
]

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  ...Object.entries(orderTypeLabels).map(([value, label]) => ({ value, label })),
]

const QUICK_STATUS_FILTERS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'NEW', label: 'Novos' },
  { value: 'PREPARING', label: 'Preparando' },
  { value: 'READY', label: 'Prontos' },
  { value: 'OUT_FOR_DELIVERY', label: 'Em entrega' },
  { value: 'COMPLETED', label: 'Concluídos' },
]

const ORDER_TYPE_ICONS: Record<OrderType, LucideIcon> = {
  DELIVERY: Truck,
  PICKUP: Store,
  DINE_IN: UtensilsCrossed,
}

function OrderTypeChip({ type }: { type: OrderType }) {
  const Icon = ORDER_TYPE_ICONS[type]
  return (
    <span className="inline-flex items-center gap-1.5 text-muted">
      <Icon className="h-3.5 w-3.5 shrink-0 text-accent/80" aria-hidden="true" />
      {orderTypeLabels[type]}
    </span>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'accent',
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'accent' | 'gold' | 'success' | 'blue'
}) {
  const tones = {
    accent: 'bg-accent-muted text-accent',
    gold: 'bg-gold-muted text-gold',
    success: 'bg-success/15 text-success',
    blue: 'bg-[#3b82f6]/15 text-[#60a5fa]',
  }

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 transition-colors hover:border-accent/25">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]',
          tones[tone],
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-display text-xl font-semibold text-text">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  )
}

function OrderDetailContent({ order }: { order: Order }) {
  return (
    <div className="space-y-6 print:text-black">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-xl font-semibold">Pedido #{order.code}</h3>
          <p className="text-sm text-muted">{formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Tipo</p>
          <p className="text-sm text-text">{orderTypeLabels[order.type]}</p>
        </div>
        {order.customer && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Cliente</p>
            <p className="text-sm text-text">{order.customer.name}</p>
            {order.customer.phone && (
              <p className="flex items-center gap-1 text-sm text-muted">
                <Phone className="h-3 w-3" /> {order.customer.phone}
              </p>
            )}
          </div>
        )}
        {order.payment && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Pagamento</p>
            <p className="text-sm text-text">
              {paymentMethodLabels[order.payment.method]} — {order.payment.status}
            </p>
          </div>
        )}
      </div>

      {order.items && order.items.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Itens</p>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between rounded-[var(--radius-md)] border border-border bg-elevated px-3 py-2"
              >
                <div>
                  <p className="text-sm text-text">
                    {item.quantity}x {item.name}
                  </p>
                  {item.additionals?.map((a) => (
                    <p key={a.id} className="text-xs text-muted">+ {a.name}</p>
                  ))}
                  {item.notes && (
                    <p className="text-xs italic text-muted">Obs: {item.notes}</p>
                  )}
                </div>
                <span className="text-sm text-text">{formatCurrency(item.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-1 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-muted">
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        {order.deliveryFee > 0 && (
          <div className="flex justify-between text-muted">
            <span>Taxa de entrega</span>
            <span>{formatCurrency(order.deliveryFee)}</span>
          </div>
        )}
        {order.discount > 0 && (
          <div className="flex justify-between text-muted">
            <span>Desconto</span>
            <span>-{formatCurrency(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-medium text-text">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      {order.notes && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Observações</p>
          <p className="text-sm text-text">{order.notes}</p>
        </div>
      )}
    </div>
  )
}

function KanbanColumn({
  status,
  orders,
  onSelect,
  onStatusChange,
}: {
  status: OrderStatus
  orders: Order[]
  onSelect: (order: Order) => void
  onStatusChange: (id: string, status: OrderStatus) => void
}) {
  const nextStatus = ORDER_STATUS_FLOW[ORDER_STATUS_FLOW.indexOf(status) + 1]
  const color = orderStatusColors[status]

  return (
    <div className="flex w-72 shrink-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm">
      <div
        className="flex items-center justify-between border-b border-border px-4 py-3"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${color} 12%, transparent), transparent)`,
        }}
      >
        <StatusBadge status={status} size="sm" />
        <span
          className="flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold"
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
            color,
          }}
        >
          {orders.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3" style={{ maxHeight: 'calc(100dvh - 280px)' }}>
        {orders.length === 0 && (
          <p className="py-6 text-center text-xs text-muted/70">Nenhum pedido aqui</p>
        )}
        {orders.map((order) => (
          <div
            key={order.id}
            data-order-id={order.id}
            className="cursor-pointer rounded-[var(--radius-md)] border border-border bg-elevated p-3 transition-all hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-md"
            onClick={() => onSelect(order)}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(order)}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-display font-semibold text-text">#{order.code}</span>
              <span className="font-medium text-accent">{formatCurrency(order.total)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              {order.customer?.name ? (
                <>
                  <p className="truncate text-xs text-muted">{order.customer.name}</p>
                  <OrderTypeChip type={order.type} />
                </>
              ) : (
                <OrderTypeChip type={order.type} />
              )}
            </div>
            {nextStatus && status !== 'COMPLETED' && status !== 'CANCELLED' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onStatusChange(order.id, nextStatus)
                }}
                className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-[var(--radius-sm)] bg-accent py-1.5 text-xs font-medium text-white transition-transform active:scale-[0.98] hover:bg-accent-hover"
              >
                {orderStatusLabels[nextStatus]}
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const debouncedSearch = useDebounce(search)
  const queryClient = useQueryClient()

  const statusFilter = (searchParams.get('status') as OrderStatus) || undefined
  const typeFilter = (searchParams.get('type') as OrderType) || undefined

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['orders', statusFilter, typeFilter, debouncedSearch],
    queryFn: () =>
      ordersService.list({
        status: statusFilter,
        type: typeFilter,
        search: debouncedSearch || undefined,
      }),
  })

  const { data: allOrders = [] } = useQuery({
    queryKey: ['orders', 'summary'],
    queryFn: () => ordersService.list(),
  })

  const stats = useMemo(() => {
    const active = allOrders.filter(
      (o) => !['COMPLETED', 'CANCELLED'].includes(o.status),
    )
    const completedToday = allOrders.filter((o) => {
      if (o.status !== 'COMPLETED') return false
      const created = new Date(o.createdAt)
      const today = new Date()
      return (
        created.getDate() === today.getDate() &&
        created.getMonth() === today.getMonth() &&
        created.getFullYear() === today.getFullYear()
      )
    })
    const revenue = completedToday.reduce((sum, o) => sum + o.total, 0)
    const newOrders = allOrders.filter((o) => o.status === 'NEW').length

    return {
      active: active.length,
      newOrders,
      completedToday: completedToday.length,
      revenue,
    }
  }, [allOrders])

  const hasActiveFilters = Boolean(statusFilter || typeFilter || debouncedSearch)

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersService.updateStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      const row = document.querySelector<HTMLElement>(
        `[data-order-id="${variables.id}"]`,
      )
      void import('@/utils/microFeedback').then(({ flashAccent }) =>
        flashAccent(row),
      )
    },
  })

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    setSearchParams(params)
  }

  const clearFilters = () => {
    setSearch('')
    setSearchParams(new URLSearchParams())
  }

  const handleStatusChange = (id: string, status: OrderStatus) => {
    statusMutation.mutate({ id, status })
  }

  const kanbanStatuses: OrderStatus[] = [
    'NEW',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'OUT_FOR_DELIVERY',
    'COMPLETED',
  ]

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Gerencie e acompanhe todos os pedidos"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-[var(--radius-md)] border border-border bg-surface p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => setView('table')}
                className={cn(
                  'rounded-[var(--radius-sm)] p-2 transition-colors',
                  view === 'table'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-muted hover:text-text',
                )}
                aria-label="Visualização em tabela"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('kanban')}
                className={cn(
                  'rounded-[var(--radius-sm)] p-2 transition-colors',
                  view === 'kanban'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-muted hover:text-text',
                )}
                aria-label="Visualização Kanban"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Em andamento"
          value={String(stats.active)}
          icon={Clock}
          tone="gold"
        />
        <StatCard
          label="Novos pedidos"
          value={String(stats.newOrders)}
          icon={Sparkles}
          tone="accent"
        />
        <StatCard
          label="Concluídos hoje"
          value={String(stats.completedToday)}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Receita de hoje"
          value={formatCurrency(stats.revenue)}
          icon={DollarSign}
          tone="blue"
        />
      </div>

      <div className="mb-4 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              placeholder="Buscar por código, cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-elevated pl-9 pr-3 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              aria-label="Buscar pedidos"
            />
          </div>
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="sm:w-44"
          />
          <Select
            options={TYPE_OPTIONS}
            value={typeFilter || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="sm:w-40"
          />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
              <X className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_STATUS_FILTERS.map(({ value, label }) => {
            const isActive = (statusFilter || '') === value
            const color = value ? orderStatusColors[value] : undefined
            return (
              <button
                key={value || 'all'}
                type="button"
                onClick={() => handleFilterChange('status', value)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  isActive
                    ? 'border-accent/50 bg-accent-muted text-accent'
                    : 'border-border bg-elevated text-muted hover:border-accent/30 hover:text-text',
                )}
                style={
                  isActive && color
                    ? {
                        borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
                        backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
                        color,
                      }
                    : undefined
                }
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {isLoading && <TableSkeleton rows={8} />}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-danger">
          Erro ao carregar pedidos
        </div>
      )}

      {!isLoading && !error && orders.length === 0 && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          <div className="h-1.5 bg-gradient-to-r from-accent via-gold to-success" />
          <EmptyState
            icon={hasActiveFilters ? Search : ShoppingBag}
            title={hasActiveFilters ? 'Nenhum pedido encontrado' : 'Aguardando os primeiros pedidos'}
            description={
              hasActiveFilters
                ? 'Nenhum resultado com os filtros atuais. Tente outro status ou limpe a busca.'
                : 'Quando clientes fizerem pedidos pelo cardápio, eles aparecerão aqui em tempo real.'
            }
            action={
              hasActiveFilters
                ? { label: 'Limpar filtros', onClick: clearFilters }
                : undefined
            }
          />
          {!hasActiveFilters && (
            <div className="-mt-4 pb-10 text-center">
              <Link
                to="/cozinha"
                className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
              >
                Abrir painel da cozinha <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {!isLoading && !error && orders.length > 0 && view === 'table' && (
        <>
          <div className="hidden overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-elevated/80 text-left text-muted">
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    data-order-id={order.id}
                    className="group relative border-b border-border/50 transition-colors hover:bg-elevated/40"
                  >
                    <td className="relative px-4 py-3">
                      <span
                        className="absolute inset-y-2 left-0 w-1 rounded-r-full opacity-80 transition-opacity group-hover:opacity-100"
                        style={{ backgroundColor: orderStatusColors[order.status] }}
                        aria-hidden="true"
                      />
                      <span className="font-display font-semibold text-text">#{order.code}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {order.customer?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <OrderTypeChip type={order.type} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right font-display font-semibold text-accent">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          Detalhes
                        </Button>
                        {order.status === 'NEW' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(order.id, 'CONFIRMED')}
                            isLoading={statusMutation.isPending}
                          >
                            Confirmar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {orders.map((order) => (
              <div
                key={order.id}
                data-order-id={order.id}
                className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface p-4 transition-colors hover:border-accent/30"
                onClick={() => setSelectedOrder(order)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedOrder(order)}
                role="button"
                tabIndex={0}
              >
                <span
                  className="absolute inset-y-0 left-0 w-1"
                  style={{ backgroundColor: orderStatusColors[order.status] }}
                  aria-hidden="true"
                />
                <div className="flex items-start justify-between pl-2">
                  <div>
                    <p className="font-display font-semibold text-text">#{order.code}</p>
                    <p className="text-sm text-muted">
                      {order.customer?.name || orderTypeLabels[order.type]}
                    </p>
                    <div className="mt-1">
                      <OrderTypeChip type={order.type} />
                    </div>
                  </div>
                  <StatusBadge status={order.status} size="sm" />
                </div>
                <div className="mt-3 flex items-center justify-between pl-2">
                  <span className="text-xs text-muted">
                    {formatDateTime(order.createdAt)}
                  </span>
                  <span className="font-display font-semibold text-accent">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!isLoading && !error && orders.length > 0 && view === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {kanbanStatuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              orders={orders.filter((o) => o.status === status)}
              onSelect={setSelectedOrder}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Pedido #${selectedOrder.code}` : ''}
        size="lg"
      >
        {selectedOrder && (
          <>
            <div className="no-print mb-4 flex flex-wrap gap-2">
              {ORDER_STATUS_FLOW.filter(
                (s) => s !== 'CANCELLED' && s !== selectedOrder.status,
              ).map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleStatusChange(selectedOrder.id, s)
                    setSelectedOrder({ ...selectedOrder, status: s })
                  }}
                >
                  {orderStatusLabels[s]}
                </Button>
              ))}
              {selectedOrder.status !== 'CANCELLED' &&
                selectedOrder.status !== 'COMPLETED' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      handleStatusChange(selectedOrder.id, 'CANCELLED')
                      setSelectedOrder({ ...selectedOrder, status: 'CANCELLED' })
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.print()}
                className="ml-auto"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            </div>
            <OrderDetailContent order={selectedOrder} />
          </>
        )}
      </Modal>
    </div>
  )
}
