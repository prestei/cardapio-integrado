import { Navigate, Outlet, useParams } from 'react-router-dom'
import { StoreProvider, useStore } from '@/contexts/StoreContext'
import { CartProvider } from '@/contexts/CartContext'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { Cart } from '@/components/Cart'

function StoreShell() {
  const { isLoading, isError, refetch, menu } = useStore()

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas px-4">
        <div className="w-full max-w-sm space-y-3">
          <div className="h-10 w-40 animate-pulse rounded bg-surface-2" />
          <div className="h-40 animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-surface-2" />
          <p className="pt-2 text-center text-sm text-muted">Carregando cardápio…</p>
        </div>
      </div>
    )
  }

  if (isError || !menu) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas px-4 text-center">
        <div>
          <h1 className="font-display text-2xl text-ink">Cardápio indisponível</h1>
          <p className="mt-2 text-sm text-muted">
            Não foi possível carregar este estabelecimento.
          </p>
          <button
            type="button"
            onClick={refetch}
            className="btn-primary mt-5 h-11 rounded-[var(--radius-md)] px-5 text-sm font-semibold"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo principal
      </a>
      <Outlet />
      <Cart />
    </>
  )
}

export function StoreLayout() {
  const { slug } = useParams()
  const fallback = import.meta.env.VITE_DEFAULT_SLUG as string | undefined

  if (!slug) {
    return <Navigate to={`/${fallback ?? 'burger-house'}`} replace />
  }

  return (
    <StoreProvider slug={slug}>
      <CartProvider slug={slug}>
        <FavoritesProvider slug={slug}>
          <StoreShell />
        </FavoritesProvider>
      </CartProvider>
    </StoreProvider>
  )
}
