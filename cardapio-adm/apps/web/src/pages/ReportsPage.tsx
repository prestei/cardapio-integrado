import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Download,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Percent,
  LayoutDashboard,
  BarChart3,
  Package,
  Users,
  CreditCard,
  Activity,
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
import { dashboardService, type DashboardParams } from '@/services/dashboard'
import { reportsService } from '@/services/reports'
import type { DashboardMetrics, DashboardPeriod } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatComparison, formatCurrency, formatHour, paymentMethodLabels } from '@/utils/format'
import { cn } from '@/utils/cn'

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'custom', label: 'Personalizado' },
]

type ReportTab = 'visao' | 'vendas' | 'produtos' | 'clientes' | 'pagamentos' | 'operacao'

const REPORT_TABS: { id: ReportTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'visao', label: 'Visão', icon: LayoutDashboard },
  { id: 'vendas', label: 'Vendas', icon: BarChart3 },
  { id: 'produtos', label: 'Produtos', icon: Package },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
  { id: 'operacao', label: 'Operação', icon: Activity },
]

const CHART_COLORS = ['#E8A54B', '#6B9BD1', '#5BA88A', '#7B8CDE', '#C4A35A']

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
  from.setDate(from.getDate() - 29)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('visao')
  const [period, setPeriod] = useState<DashboardPeriod>('30d')
  const [customRange, setCustomRange] = useState(defaultCustomRange)

  const params =
    period === 'custom'
      ? { period, from: customRange.from, to: customRange.to }
      : { period }
  const enabled = period !== 'custom' || Boolean(customRange.from && customRange.to)

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-reports', period, customRange.from, customRange.to],
    queryFn: () => dashboardService.getMetrics(params),
    enabled,
  })

  const exportSalesCsv = () => {
    if (!data) return
    downloadCsv('vendas-por-dia.csv', [
      ['Data', 'Pedidos', 'Receita'],
      ...data.salesByDay.map((d) => [d.date, d.orders, d.revenue.toFixed(2)]),
    ])
  }

  const exportProductsCsv = () => {
    if (!data) return
    downloadCsv('produtos-mais-vendidos.csv', [
      ['Produto', 'Quantidade', 'Receita'],
      ...data.topProducts.map((p) => [p.name, p.quantity, p.revenue.toFixed(2)]),
    ])
  }

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Relatórios detalhados e exportações"
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
                <label className="text-muted" htmlFor="rep-from">De</label>
                <input
                  id="rep-from"
                  type="date"
                  value={customRange.from}
                  onChange={(e) => setCustomRange((r) => ({ ...r, from: e.target.value }))}
                  className="rounded-[var(--radius-sm)] border border-border bg-elevated px-2 py-1 text-text"
                />
                <label className="text-muted" htmlFor="rep-to">Até</label>
                <input
                  id="rep-to"
                  type="date"
                  value={customRange.to}
                  onChange={(e) => setCustomRange((r) => ({ ...r, to: e.target.value }))}
                  className="rounded-[var(--radius-sm)] border border-border bg-elevated px-2 py-1 text-text"
                />
              </div>
            )}
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-1 rounded-[var(--radius-md)] border border-border bg-surface p-1">
        {REPORT_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors',
              tab === id ? 'bg-accent-muted text-accent font-medium' : 'text-muted hover:text-text',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex min-h-[400px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center">
          <p className="text-danger">Erro ao carregar relatórios</p>
        </div>
      )}

      {!isLoading && data && (
        <>
          {tab === 'visao' && (
            <VisaoTab data={data} onExportSales={exportSalesCsv} onExportProducts={exportProductsCsv} />
          )}
          {tab === 'vendas' && <VendasTab params={params} fallback={data} />}
          {tab === 'produtos' && <ProdutosTab params={params} fallback={data} onExport={exportProductsCsv} />}
          {tab === 'clientes' && <ClientesTab params={params} fallback={data} />}
          {tab === 'pagamentos' && <PagamentosTab params={params} fallback={data} />}
          {tab === 'operacao' && <OperacaoTab params={params} fallback={data} />}
        </>
      )}
    </div>
  )
}

function ComparisonTag({ value }: { value: number | null | undefined }) {
  if (value == null) return null
  const isPositive = value >= 0
  return (
    <span className={cn('mt-2 flex items-center gap-1 text-xs font-medium', isPositive ? 'text-success' : 'text-danger')}>
      {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {formatComparison(value)} vs período anterior
    </span>
  )
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  comparison,
}: {
  label: string
  value: string
  icon: typeof DollarSign
  comparison?: number | null
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold text-text">{value}</p>
          <ComparisonTag value={comparison} />
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-muted">
          <Icon className="h-5 w-5 text-accent" />
        </div>
      </div>
    </div>
  )
}

function NotAvailableNote() {
  return (
    <p className="mb-4 text-xs text-muted">
      Exibindo dados derivados das métricas gerais — o endpoint de relatório dedicado ainda não está disponível.
    </p>
  )
}

type DashboardData = DashboardMetrics
type ReportParams = DashboardParams

function VisaoTab({
  data,
  onExportSales,
  onExportProducts,
}: {
  data: DashboardData
  onExportSales: () => void
  onExportProducts: () => void
}) {
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Receita no período" value={formatCurrency(data.revenue)} icon={DollarSign} comparison={data.comparison.revenue} />
        <SummaryCard label="Pedidos no período" value={String(data.orders)} icon={ShoppingBag} comparison={data.comparison.orders} />
        <SummaryCard label="Ticket médio" value={formatCurrency(data.avgTicket)} icon={TrendingUp} comparison={data.comparison.avgTicket} />
        <SummaryCard label="Novos clientes" value={String(data.newCustomers)} icon={Percent} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-text">Receita por dia</h3>
            <Button variant="ghost" size="sm" onClick={onExportSales}>
              <Download className="h-4 w-4" />
              CSV
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.salesByDay}>
              <defs>
                <linearGradient id="reportRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8A54B" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#E8A54B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2E2E2E" />
              <XAxis dataKey="date" tick={{ fill: '#A39E93', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: '#A39E93', fontSize: 11 }} />
              <Tooltip {...chartTooltipStyle} formatter={(value: number) => [formatCurrency(value), 'Receita']} />
              <Area type="monotone" dataKey="revenue" stroke="#E8A54B" fill="url(#reportRevenueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-medium text-text">Pedidos por hora</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.ordersByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2E2E2E" />
              <XAxis dataKey="hour" tick={{ fill: '#A39E93', fontSize: 11 }} tickFormatter={formatHour} />
              <YAxis tick={{ fill: '#A39E93', fontSize: 11 }} />
              <Tooltip {...chartTooltipStyle} labelFormatter={formatHour} />
              <Bar dataKey="orders" fill="#6B9BD1" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-text">Produtos mais vendidos</h3>
            <Button variant="ghost" size="sm" onClick={onExportProducts}>
              <Download className="h-4 w-4" />
              CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-2 font-medium">Produto</th>
                  <th className="pb-2 font-medium text-right">Qtd.</th>
                  <th className="pb-2 font-medium text-right">Receita</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((product, i) => (
                  <tr key={product.productId || i} className="border-b border-border/50">
                    <td className="py-2.5 text-text">{product.name}</td>
                    <td className="py-2.5 text-right text-muted">{product.quantity}</td>
                    <td className="py-2.5 text-right font-medium text-text">{formatCurrency(product.revenue)}</td>
                  </tr>
                ))}
                {data.topProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-muted">Nenhum produto vendido no período</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-medium text-text">Formas de pagamento</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.paymentMethods.map((p) => ({ name: paymentMethodLabels[p.method], value: p.amount }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
              >
                {data.paymentMethods.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...chartTooltipStyle} formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-2 space-y-1.5">
            {data.paymentMethods.map((p, i) => (
              <li key={p.method} className="flex items-center justify-between text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {paymentMethodLabels[p.method]}
                </span>
                <span>{formatCurrency(p.amount)} · {p.count}×</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

function VendasTab({ params, fallback }: { params: ReportParams; fallback: DashboardData }) {
  const { data, isError } = useQuery({
    queryKey: ['reports-sales', params],
    queryFn: () => reportsService.getSales(params),
    retry: 0,
  })

  const salesByDay = data?.salesByDay ?? fallback.salesByDay
  const comparison = data?.comparison ?? fallback.comparison

  return (
    <div>
      {isError && <NotAvailableNote />}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <SummaryCard label="Receita" value={formatCurrency(fallback.revenue)} icon={DollarSign} comparison={comparison.revenue} />
        <SummaryCard label="Pedidos" value={String(fallback.orders)} icon={ShoppingBag} comparison={comparison.orders} />
      </div>
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-text">Receita por dia</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={salesByDay}>
            <defs>
              <linearGradient id="vendasGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8A54B" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#E8A54B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2E2E2E" />
            <XAxis dataKey="date" tick={{ fill: '#A39E93', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: '#A39E93', fontSize: 11 }} />
            <Tooltip {...chartTooltipStyle} formatter={(value: number) => [formatCurrency(value), 'Receita']} />
            <Area type="monotone" dataKey="revenue" stroke="#E8A54B" fill="url(#vendasGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ProdutosTab({
  params,
  fallback,
  onExport,
}: {
  params: ReportParams
  fallback: DashboardData
  onExport: () => void
}) {
  const { data, isError } = useQuery({
    queryKey: ['reports-products', params],
    queryFn: () => reportsService.getProducts(params),
    retry: 0,
  })

  const topProducts = data?.topProducts ?? fallback.topProducts

  return (
    <div>
      {isError && <NotAvailableNote />}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-text">Produtos mais vendidos</h3>
          <Button variant="ghost" size="sm" onClick={onExport}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-2 font-medium">Produto</th>
                <th className="pb-2 font-medium text-right">Qtd.</th>
                <th className="pb-2 font-medium text-right">Receita</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, i) => (
                <tr key={product.productId || i} className="border-b border-border/50">
                  <td className="py-2.5 text-text">{product.name}</td>
                  <td className="py-2.5 text-right text-muted">{product.quantity}</td>
                  <td className="py-2.5 text-right font-medium text-text">{formatCurrency(product.revenue)}</td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-muted">Nenhum produto vendido no período</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ClientesTab({ params, fallback }: { params: ReportParams; fallback: DashboardData }) {
  const { data, isError } = useQuery({
    queryKey: ['reports-customers', params],
    queryFn: () => reportsService.getCustomers(params),
    retry: 0,
  })

  return (
    <div>
      {isError && <NotAvailableNote />}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Novos clientes" value={String(data?.newCustomers ?? fallback.newCustomers)} icon={Users} />
        <SummaryCard label="Clientes recorrentes" value={data ? String(data.returningCustomers) : '—'} icon={Users} />
        <SummaryCard label="Total de pedidos" value={String(fallback.orders)} icon={ShoppingBag} />
      </div>
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-text">Clientes que mais compraram</h3>
        {data?.topCustomers && data.topCustomers.length > 0 ? (
          <ul className="space-y-2">
            {data.topCustomers.map((c) => (
              <li key={c.customerId} className="flex items-center justify-between text-sm">
                <span className="text-text">{c.name}</span>
                <span className="text-muted">{c.orders} pedidos · {formatCurrency(c.totalSpent)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            Dados detalhados de clientes ainda não disponíveis. Consulte a página de Clientes para o histórico completo.
          </p>
        )}
      </div>
    </div>
  )
}

function PagamentosTab({ params, fallback }: { params: ReportParams; fallback: DashboardData }) {
  const { data, isError } = useQuery({
    queryKey: ['reports-payments', params],
    queryFn: () => reportsService.getPayments(params),
    retry: 0,
  })

  const paymentMethods = data?.paymentMethods ?? fallback.paymentMethods

  return (
    <div>
      {isError && <NotAvailableNote />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {paymentMethods.map((p) => (
          <SummaryCard key={p.method} label={paymentMethodLabels[p.method]} value={formatCurrency(p.amount)} icon={CreditCard} />
        ))}
      </div>
      <div className="mt-6 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-text">Distribuição por forma de pagamento</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={paymentMethods.map((p) => ({ name: paymentMethodLabels[p.method], value: p.amount }))}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
            >
              {paymentMethods.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...chartTooltipStyle} formatter={(value: number) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function OperacaoTab({ params, fallback }: { params: ReportParams; fallback: DashboardData }) {
  const { data, isError } = useQuery({
    queryKey: ['reports-operations', params],
    queryFn: () => reportsService.getOperations(params),
    retry: 0,
  })

  const ordersByHour = data?.ordersByHour ?? fallback.ordersByHour

  return (
    <div>
      {isError && <NotAvailableNote />}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Tempo médio de preparo"
          value={data?.avgPrepTimeMinutes != null ? `${data.avgPrepTimeMinutes} min` : '—'}
          icon={Activity}
        />
        <SummaryCard
          label="Tempo médio de entrega"
          value={data?.avgDeliveryTimeMinutes != null ? `${data.avgDeliveryTimeMinutes} min` : '—'}
          icon={Activity}
        />
        <SummaryCard
          label="Taxa de cancelamento"
          value={data?.cancellationRate != null ? `${(data.cancellationRate * 100).toFixed(1)}%` : '—'}
          icon={Activity}
        />
      </div>
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-text">Pedidos por hora</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={ordersByHour}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2E2E2E" />
            <XAxis dataKey="hour" tick={{ fill: '#A39E93', fontSize: 11 }} tickFormatter={formatHour} />
            <YAxis tick={{ fill: '#A39E93', fontSize: 11 }} />
            <Tooltip {...chartTooltipStyle} labelFormatter={formatHour} />
            <Bar dataKey="orders" fill="#6B9BD1" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
