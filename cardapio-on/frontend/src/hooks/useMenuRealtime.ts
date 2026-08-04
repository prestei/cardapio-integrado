import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeMenuEvents } from '@/services/menuEvents'

/**
 * Mantém o cardápio sincronizado com o painel administrativo.
 * Prioridade: SSE em tempo real; React Query cobre foco da aba + backup periódico.
 */
export function useMenuRealtime(slug: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!slug) return

    return subscribeMenuEvents(slug, () => {
      void queryClient.invalidateQueries({ queryKey: ['menu', slug] })
    })
  }, [slug, queryClient])
}
