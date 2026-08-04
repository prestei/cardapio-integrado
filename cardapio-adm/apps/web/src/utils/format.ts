import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { OrderStatus, OrderType, PaymentMethod, UserRole } from '@/types'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: ptBR })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatRelativeTime(date: string): string {
  const d = parseISO(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min atrás`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h atrás`
  return formatDate(date)
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  NEW: 'Novo',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  READY: 'Pronto',
  OUT_FOR_DELIVERY: 'Em entrega',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

export const orderStatusColors: Record<OrderStatus, string> = {
  NEW: 'var(--color-status-new)',
  CONFIRMED: 'var(--color-status-confirmed)',
  PREPARING: 'var(--color-status-preparing)',
  READY: 'var(--color-status-ready)',
  OUT_FOR_DELIVERY: 'var(--color-status-out-for-delivery)',
  COMPLETED: 'var(--color-status-completed)',
  CANCELLED: 'var(--color-status-cancelled)',
}

export const orderTypeLabels: Record<OrderType, string> = {
  DELIVERY: 'Delivery',
  PICKUP: 'Retirada',
  DINE_IN: 'Salão',
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: 'Dinheiro',
  PIX: 'Pix',
  CARD: 'Cartão',
  ONLINE: 'Online',
}

export const userRoleLabels: Record<UserRole, string> = {
  OWNER: 'Proprietário',
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  ATTENDANT: 'Atendente',
  KITCHEN: 'Cozinha',
  DELIVERY: 'Entregador',
}

export function formatComparison(value: number | null): string {
  if (value === null) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'NEW',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'COMPLETED',
]
