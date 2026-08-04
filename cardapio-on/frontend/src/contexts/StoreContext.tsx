import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMenu } from '@/services/menu'
import { useMenuRealtime } from '@/hooks/useMenuRealtime'
import type { MenuResponse } from '@/types'

interface StoreContextValue {
  slug: string
  menu?: MenuResponse
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

function applyStoreTheme(menu?: MenuResponse) {
  const root = document.documentElement
  const primary = menu?.establishment.primaryColor || '#F2A94A'
  const secondary = menu?.establishment.secondaryColor || '#1C1C1C'
  root.style.setProperty('--store-primary', primary)
  root.style.setProperty('--store-secondary', secondary)
  root.style.setProperty('--store-button', primary)
  root.style.setProperty('--store-button-text', '#0A0A0A')
  root.style.setProperty('--store-accent', primary)
  root.style.setProperty('--store-bg', '#121212')
  document.title = menu
    ? `${menu.establishment.name} · Cardápio`
    : 'Cardápio Online'
}

export function StoreProvider({
  slug,
  children,
}: {
  slug: string
  children: ReactNode
}) {
  const query = useQuery({
    queryKey: ['menu', slug],
    queryFn: () => getMenu(slug),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Backup suave caso SSE esteja indisponível (não agressivo)
    refetchInterval: 60_000,
    enabled: Boolean(slug),
    placeholderData: (previous) => previous,
  })

  useMenuRealtime(slug)

  useEffect(() => {
    applyStoreTheme(query.data)
  }, [query.data])

  const value = useMemo<StoreContextValue>(
    () => ({
      slug,
      menu: query.data,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isError: query.isError,
      error: (query.error as Error) ?? null,
      refetch: () => {
        void query.refetch()
      },
    }),
    [
      slug,
      query.data,
      query.isLoading,
      query.isFetching,
      query.isError,
      query.error,
      query.refetch,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
