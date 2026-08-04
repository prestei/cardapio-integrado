import { apiFetch } from './api'
import type {
  CartItem,
  CreateOrderPayload,
  OrderResponse,
  OrderType,
  PaymentIntent,
  PaymentMethod,
} from '@/types'
import { formatCurrency } from '@/utils/currency'

export function createOrder(slug: string, payload: CreateOrderPayload) {
  return apiFetch<OrderResponse>(`/public/${slug}/orders`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getOrder(slug: string, code: string) {
  return apiFetch<OrderResponse>(`/public/${slug}/orders/${code}`)
}

/**
 * Cria (ou renova, se ainda válido) a intenção de pagamento Pix/online do pedido.
 */
export function payOrder(slug: string, code: string) {
  return apiFetch<PaymentIntent>(`/public/${slug}/orders/${code}/pay`, {
    method: 'POST',
  })
}

export function calculateDelivery(
  slug: string,
  neighborhood: string,
  subtotal?: number,
) {
  return apiFetch<{ fee: number; estimatedMinutes?: number | null }>(
    `/public/${slug}/delivery/calculate`,
    {
      method: 'POST',
      body: JSON.stringify({ neighborhood, subtotal }),
    },
  )
}

export function validateCoupon(slug: string, code: string, subtotal?: number) {
  return apiFetch<{
    id: string
    code: string
    description: string | null
    type: string
    value: number
    discount: number
    freeDelivery?: boolean
  }>(`/public/${slug}/coupons/validate`, {
    method: 'POST',
    body: JSON.stringify({ code, subtotal }),
  })
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  PIX: 'PIX',
  CASH: 'Dinheiro',
  CARD: 'Cartão',
  ONLINE: 'Online',
}

const TYPE_LABELS: Record<OrderType, string> = {
  DELIVERY: 'Entrega',
  PICKUP: 'Retirada',
  DINE_IN: 'No local',
}

function lineTotal(item: CartItem) {
  const extras = item.additionals.reduce(
    (sum, a) => sum + a.price * a.quantity,
    0,
  )
  return (item.unitPrice + extras) * item.quantity
}

export interface WhatsAppOrderMessageInput {
  code: string
  storeName: string
  customerName: string
  type: OrderType
  paymentMethod: PaymentMethod
  items: CartItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  address?: {
    street: string
    number?: string
    complement?: string
    neighborhood: string
    city: string
    reference?: string
  }
  notes?: string
  changeFor?: number
}

export function buildWhatsAppOrderMessage(input: WhatsAppOrderMessageInput): string {
  const lines: string[] = [
    'Olá! Gostaria de realizar o pedido:',
    '',
    `Pedido ${input.code}`,
    '',
    'Cliente:',
    input.customerName,
    '',
    'Itens:',
    '',
  ]

  for (const item of input.items) {
    lines.push(`${item.quantity}x ${item.name}`)
    for (const add of item.additionals) {
      const qty = add.quantity > 1 ? `${add.quantity}x ` : ''
      lines.push(`  · ${qty}${add.name}`)
    }
    if (item.notes?.trim()) {
      lines.push(`  Obs: ${item.notes.trim()}`)
    }
    lines.push(formatCurrency(lineTotal(item)))
    lines.push('')
  }

  lines.push('Subtotal:')
  lines.push(formatCurrency(input.subtotal))
  lines.push('')

  if (input.type === 'DELIVERY') {
    lines.push('Taxa de entrega:')
    lines.push(formatCurrency(input.deliveryFee))
    lines.push('')
  }

  if (input.discount > 0) {
    lines.push('Desconto:')
    lines.push(`- ${formatCurrency(input.discount)}`)
    lines.push('')
  }

  lines.push('Total:')
  lines.push(formatCurrency(input.total))
  lines.push('')
  lines.push('Pagamento:')
  lines.push(PAYMENT_LABELS[input.paymentMethod] ?? input.paymentMethod)

  if (input.paymentMethod === 'CASH' && input.changeFor) {
    lines.push(`Troco para: ${formatCurrency(input.changeFor)}`)
  }

  lines.push('')
  lines.push(`Tipo: ${TYPE_LABELS[input.type]}`)

  if (input.type === 'DELIVERY' && input.address) {
    const { street, number, complement, neighborhood, city, reference } = input.address
    lines.push('')
    lines.push('Entrega:')
    lines.push(
      [street, number].filter(Boolean).join(', ') +
        (complement ? ` — ${complement}` : ''),
    )
    lines.push(`${neighborhood} — ${city}`)
    if (reference?.trim()) lines.push(`Ref: ${reference.trim()}`)
  }

  if (input.notes?.trim()) {
    lines.push('')
    lines.push('Observações:')
    lines.push(input.notes.trim())
  }

  return lines.join('\n')
}

export function buildWhatsAppOrderUrl(
  whatsapp: string | null | undefined,
  message: string,
): string | null {
  if (!whatsapp) return null
  const phone = whatsapp.replace(/\D/g, '')
  if (!phone) return null
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
