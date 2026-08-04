import { useEffect } from 'react'

const ADMIN_URL = (
  (import.meta.env.VITE_ADMIN_URL as string | undefined) ??
  'http://localhost:5173'
).replace(/\/$/, '')

/** Redirects to the admin panel login — auth lives in `@cardapio/admin`. */
export function LoginPage() {
  useEffect(() => {
    window.location.replace(`${ADMIN_URL}/login`)
  }, [])

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4 text-center">
      <div>
        <p className="font-display text-2xl text-ink">Redirecionando…</p>
        <p className="mt-2 text-sm text-muted">
          Abrindo o painel do estabelecimento.
        </p>
        <a
          href={`${ADMIN_URL}/login`}
          className="mt-5 inline-block text-sm font-semibold underline-offset-2 hover:underline"
          style={{ color: 'var(--store-primary)' }}
        >
          Ir para o login
        </a>
      </div>
    </div>
  )
}
