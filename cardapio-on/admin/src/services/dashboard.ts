import { api } from './api'
import type { DashboardMetrics, DashboardPeriod } from '@/types'

export interface DashboardParams {
  period?: DashboardPeriod
  from?: string
  to?: string
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
}
