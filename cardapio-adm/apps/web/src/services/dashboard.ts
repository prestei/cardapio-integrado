import { api } from './api'
import type { DashboardAlert, DashboardMetrics, DashboardPeriod } from '@/types'

export interface DashboardParams {
  period?: DashboardPeriod
  from?: string
  to?: string
}

interface AlertsApiResponse {
  alerts: Array<{
    type: string
    severity: 'info' | 'warning' | 'error'
    message: string
    entityId?: string
    createdAt?: string
  }>
  counts?: Record<string, number>
}

const ALERT_TITLES: Record<string, string> = {
  product_unavailable: 'Produto indisponível',
  product_no_image: 'Produto sem imagem',
  product_no_price: 'Produto sem preço',
  promotion_expired: 'Promoção vencida',
  order_waiting: 'Pedido aguardando',
  order_delayed: 'Pedido atrasado',
  payment_failed: 'Falha de pagamento',
}

function mapSeverity(severity: 'info' | 'warning' | 'error'): DashboardAlert['severity'] {
  if (severity === 'error') return 'critical'
  return severity
}

export const dashboardService = {
  getMetrics: (params: DashboardParams = {}) => {
    const searchParams = new URLSearchParams()
    if (params.period) searchParams.set('period', params.period)
    if (params.from) searchParams.set('from', params.from)
    if (params.to) searchParams.set('to', params.to)
    const query = searchParams.toString()
    return api.get<DashboardMetrics>(`/dashboard/metrics${query ? `?${query}` : ''}`)
  },

  getAlerts: async (): Promise<DashboardAlert[]> => {
    const data = await api.get<AlertsApiResponse | DashboardAlert[]>('/dashboard/alerts')
    if (Array.isArray(data)) return data

    return (data.alerts ?? []).map((alert, index) => ({
      id: `${alert.type}-${alert.entityId ?? index}`,
      severity: mapSeverity(alert.severity),
      title: ALERT_TITLES[alert.type] ?? 'Alerta',
      message: alert.message,
      createdAt: alert.createdAt ?? new Date().toISOString(),
      link:
        alert.type.startsWith('product_')
          ? '/produtos'
          : alert.type === 'promotion_expired'
            ? '/marketing'
            : alert.type.startsWith('order_') || alert.type === 'payment_failed'
              ? '/pedidos'
              : null,
    }))
  },
}
