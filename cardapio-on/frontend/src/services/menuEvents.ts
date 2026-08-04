/**
 * Resolve a base URL for EventSource.
 * Vite proxy only applies to fetch from the same origin, so SSE can use
 * relative `/api/...` when VITE_API_URL is relative, or the absolute API host.
 */
function resolveEventsUrl(slug: string): string {
  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'
  const path = `/public/${slug}/events`

  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    return `${apiUrl.replace(/\/$/, '')}${path}`
  }

  // Relative — same origin (Vite proxy → API)
  const base = apiUrl.startsWith('/') ? apiUrl : `/${apiUrl}`
  return `${base.replace(/\/$/, '')}${path}`
}

/**
 * Escuta eventos SSE do cardápio e chama onUpdate quando o menu muda.
 * Fallback: se SSE falhar, o React Query continua com refetch periódico.
 */
export function subscribeMenuEvents(
  slug: string,
  onUpdate: () => void,
): () => void {
  if (typeof EventSource === 'undefined' || !slug) {
    return () => undefined
  }

  let source: EventSource | null = null
  let closed = false
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let attempt = 0

  const connect = () => {
    if (closed) return

    source = new EventSource(resolveEventsUrl(slug))

    const handleRefresh = () => {
      onUpdate()
    }

    source.addEventListener('connected', () => {
      attempt = 0
    })

    const eventTypes = [
      'menu:updated',
      'product:created',
      'product:updated',
      'product:deleted',
      'product:availability-changed',
      'category:created',
      'category:updated',
      'category:deleted',
    ] as const

    for (const type of eventTypes) {
      source.addEventListener(type, handleRefresh)
    }

    // Alguns browsers disparam `message` para eventos sem nome
    source.onmessage = handleRefresh

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
