import { api } from './api'
import type {
  ReportsCustomersData,
  ReportsOperationsData,
  ReportsPaymentsData,
  ReportsProductsData,
  ReportsSalesData,
} from '@/types'
import type { DashboardParams } from './dashboard'

function buildQuery(params: DashboardParams): string {
  const searchParams = new URLSearchParams()
  if (params.period) searchParams.set('period', params.period)
  if (params.from) searchParams.set('from', params.from)
  if (params.to) searchParams.set('to', params.to)
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

/**
 * Endpoints de relatórios avançados (opcionais). Caso a API ainda não
 * exponha `/reports/*`, as chamadas falham e a página mantém as métricas
 * já disponíveis via `/dashboard/metrics`.
 */
export const reportsService = {
  getSales: (params: DashboardParams = {}) =>
    api.get<ReportsSalesData>(`/reports/sales${buildQuery(params)}`),

  getProducts: (params: DashboardParams = {}) =>
    api.get<ReportsProductsData>(`/reports/products${buildQuery(params)}`),

  getCustomers: (params: DashboardParams = {}) =>
    api.get<ReportsCustomersData>(`/reports/customers${buildQuery(params)}`),

  getPayments: (params: DashboardParams = {}) =>
    api.get<ReportsPaymentsData>(`/reports/payments${buildQuery(params)}`),

  getOperations: (params: DashboardParams = {}) =>
    api.get<ReportsOperationsData>(`/reports/operations${buildQuery(params)}`),
}
