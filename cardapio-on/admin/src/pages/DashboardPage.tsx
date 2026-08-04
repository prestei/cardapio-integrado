import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  Clock,
  Users,
  ArrowRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { dashboardService } from '@/services/dashboard'
import type { DashboardPeriod } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  formatCurrency,
  formatComparison,
  formatHour,
  paymentMethodLabels,
} from '@/utils/format'
import { cn } from '@/utils/cn'

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'custom', label: 'Personalizado' },
]

const CHART_COLORS = ['#E8A54B', '#6B9BD1', '#5BA88A', '#7B8CDE', '#C4A35A']

function KpiCard({
  label,
  value,
  comparison,
  icon: Icon,
}: {
  label: string
  value: string
  comparison: number | null
  icon: typeof DollarSign
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      gsap.from(ref.current, {
        opacity: 0,
        y: 16,
        duration: 0.5,
        ease: 'power2.out',
      })
    }
  }, [])

  const isPositive = comparison !== null && comparison >= 0

  return (
    <div
      ref={ref}
      className="rounded-[var(--radius-lg)] border border-border bg-surface p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold text-text">{value}</p>
          {comparison !== null && (
            <div
              className={cn(
                'mt-2 flex items-center gap-1 text-xs font-medium',
                isPositive ? 'text-success' : 'text-danger',
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {formatComparison(comparison)} vs período anterior
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-muted">
          <Icon className="h-5 w-5 text-accent" />
        </div>
      </div>
    </div>
  )
}

const chartTooltipStyle = {
  contentStyle: {
    background: '#1C1C1C',
    border: '1px solid #2E2E2E',
    borderRadius: '6px',
    fontSize: '12px',
  },
  labelStyle: { color: '#F2F0EB' },
}

function defaultCustomRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 13)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

export function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('7d')
  const [customRange, setCustomRange] = useState(defaultCustomRange)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', period, customRange.from, customRange.to],
    queryFn: () =>
      dashboardService.getMetrics(
        period === 'custom'
          ? { period, from: customRange.from, to: customRange.to }
          : { period },
      ),
    enabled: period !== 'custom' || Boolean(customRange.from && customRange.to),
  })

  useEffect(() => {
    if (data && containerRef.current) {
      gsap.from(containerRef.current.querySelectorAll('.chart-card'), {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.2,
      })
    }
  }, [data])

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center">
        <p className="text-danger">Erro ao carregar métricas do dashboard</p>
      </div>
    )
  }

  const paymentData = data.paymentMethods.map((p) => ({
    name: paymentMethodLabels[p.method],
    value: p.amount,
    count: p.count,
  }))

  return (
    <div ref={containerRef}>
      <PageHeader
        title="Visão geral"
        description="Acompanhe o desempenho do seu estabelecimento"
        actions={
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div className="flex flex-wrap rounded-[var(--radius-md)] border border-border bg-surface p-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPeriod(p.value)}
                  className={cn(
                    'rounded-[var(--radius-sm)] px-3 py-1.5 text-sm transition-colors',
                    period === p.value
                      ? 'bg-accent-muted text-accent font-medium'
                      : 'text-muted hover:text-text',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {period === 'custom' && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <label className="text-muted" htmlFor="dash-from">
                  De
                </label>
                <input
                  id="dash-from"
                  type="date"
                  value={customRange.from}
                  onChange={(e) =>
                    setCustomRange((r) => ({ ...r, from: e.target.value }))
                  }
                  className="rounded-[var(--radius-sm)] border border-border bg-elevated px-2 py-1 text-text"
                />
                <label className="text-muted" htmlFor="dash-to">
                  Até
                </label>
                <input
                  id="dash-to"
                  type="date"
                  value={customRange.to}
                  onChange={(e) =>
                    setCustomRange((r) => ({ ...r, to: e.target.value }))
                  }
                  className="rounded-[var(--radius-sm)] border border-border bg-elevated px-2 py-1 text-text"
                />
              </div>
            )}
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Receita"
          value={formatCurrency(data.revenue)}
          comparison={data.comparison.revenue}
          icon={DollarSign}
        />
        <KpiCard
          label="Pedidos"
          value={String(data.orders)}
          comparison={data.comparison.orders}
          icon={ShoppingBag}
        />
        <KpiCard
          label="Ticket médio"
          value={formatCurrency(data.avgTicket)}
          comparison={data.comparison.avgTicket}
          icon={TrendingUp}
        />
        <KpiCard
          label="Em andamento"
          value={String(data.inProgress)}
          comparison={null}
          icon={Clock}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="chart-card rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-medium text-text">Vendas por dia</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.salesByDay}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8A54B" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#E8A54B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2E2E2E" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#A39E93', fontSize: 11 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fill: '#A39E93', fontSize: 11 }} />
              <Tooltip
                {...chartTooltipStyle}
                formatter={(value: number) => [formatCurrency(value), 'Receita']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#E8A54B"
                fill="url(#revenueGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-medium text-text">Pedidos por hora</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.ordersByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2E2E2E" />
              <XAxis
                dataKey="hour"
                tick={{ fill: '#A39E93', fontSize: 11 }}
                tickFormatter={formatHour}
              />
              <YAxis tick={{ fill: '#A39E93', fontSize: 11 }} />
              <Tooltip
                {...chartTooltipStyle}
                labelFormatter={formatHour}
              />
              <Bar dataKey="orders" fill="#6B9BD1" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-medium text-text">Receita semanal</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.weeklyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2E2E2E" />
              <XAxis
                dataKey="week"
                tick={{ fill: '#A39E93', fontSize: 11 }}
                tickFormatter={(w) => `Sem ${w}`}
              />
              <YAxis tick={{ fill: '#A39E93', fontSize: 11 }} />
              <Tooltip
                {...chartTooltipStyle}
                formatter={(value: number) => [formatCurrency(value), 'Receita']}
              />
              <Bar dataKey="revenue" fill="#5BA88A" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-medium text-text">Formas de pagamento</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={paymentData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {paymentData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                {...chartTooltipStyle}
                formatter={(value: number) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {paymentData.map((p, i) => (
              <div key={p.name} className="flex items-center gap-1.5 text-xs text-muted">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="chart-card rounded-[var(--radius-lg)] border border-border bg-surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-text">Pedidos recentes</h3>
            <Link
              to="/pedidos"
              className="flex items-center gap-1 text-xs text-accent hover:underline"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-2 font-medium">Código</th>
                  <th className="pb-2 font-medium">Cliente</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border/50">
                    <td className="py-3 font-medium text-text">#{order.code}</td>
                    <td className="py-3 text-muted">
                      {order.customer?.name || '—'}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="py-3 text-right text-text">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="chart-card rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-medium text-text">Top produtos</h3>
          </div>
          <ul className="space-y-3">
            {data.topProducts.slice(0, 5).map((product, i) => (
              <li key={product.productId || i} className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text">{product.name}</p>
                  <p className="text-xs text-muted">{product.quantity} vendidos</p>
                </div>
                <span className="ml-2 text-sm font-medium text-accent">
                  {formatCurrency(product.revenue)}
                </span>
              </li>
            ))}
            {data.topProducts.length === 0 && (
              <p className="text-sm text-muted">Nenhum produto vendido no período</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
