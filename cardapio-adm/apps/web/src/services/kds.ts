import { api } from './api'
import type { KdsOrder } from '@/types'

const API_URL = import.meta.env.VITE_API_URL as string

export const kdsService = {
  list: () => api.get<KdsOrder[]>('/kds/orders'),
}

/**
 * Escuta eventos SSE da cozinha (novos pedidos, mudanças de status).
 * Retorna uma função de limpeza. Se o SSE não estiver disponível, o
 * componente deve continuar com polling via TanStack Query.
 */
export function subscribeKdsEvents(onUpdate: () => void): () => void {
  if (typeof EventSource === 'undefined') {
    return () => undefined
  }

  const token = localStorage.getItem('token')
  let source: EventSource | null = null
  let closed = false
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let attempt = 0

  const connect = () => {
    if (closed) return
    const url = `${API_URL}/kds/events${token ? `?token=${encodeURIComponent(token)}` : ''}`
    source = new EventSource(url)

    const handle = () => onUpdate()

    source.addEventListener('order:created', handle)
    source.addEventListener('order:updated', handle)
    source.addEventListener('order:status-changed', handle)
    source.onmessage = handle

    source.onerror = () => {
      source?.close()
      source = null
      if (closed) return
      attempt += 1
      const delay = Math.min(30_000, 1_000 * 2 ** Math.min(attempt, 4))
      retryTimer = setTimeout(connect, delay)
    }
  }

  connect()

  return () => {
    closed = true
    if (retryTimer) clearTimeout(retryTimer)
    source?.close()
  }
}
