import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import { payOrder } from '@/services/orders'
import { ApiError } from '@/services/api'
import { formatCurrency } from '@/utils/currency'

function useCountdownLabel(expiresAt: string | null) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!expiresAt) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - now
  if (diff <= 0) return 'Expirado'
  const totalSeconds = Math.floor(diff / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function PixPayment({ slug, code }: { slug: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const query = useQuery({
    queryKey: ['payment-intent', slug, code],
    queryFn: () => payOrder(slug, code),
    retry: false,
  })
  const intent = query.data
  const countdown = useCountdownLabel(intent?.expiresAt ?? null)
  const expired = countdown === 'Expirado'
  const isCardCheckout = Boolean(intent?.checkoutUrl) && !intent?.copyPaste && !intent?.qrCodeBase64

  const copy = async () => {
    if (!intent?.copyPaste) return
    try {
      await navigator.clipboard.writeText(intent.copyPaste)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard indisponível
    }
  }

  const qrSrc = intent?.qrCodeBase64
    ? `data:image/png;base64,${intent.qrCodeBase64}`
    : intent?.copyPaste
      ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(intent.copyPaste)}`
      : null

  return (
    <section
      className="mt-6 rounded-[var(--radius-lg)] border border-line bg-surface p-4 sm:p-5"
      aria-live="polite"
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">
        {isCardCheckout ? 'Pagamento online' : 'Pagamento via Pix'}
      </h2>

      {query.isLoading ? (
        <div className="mt-4 flex justify-center" role="status">
          <div className="h-48 w-48 animate-pulse rounded-[var(--radius-md)] bg-surface-2" />
          <span className="sr-only">Carregando pagamento</span>
        </div>
      ) : query.isError ? (
        <div className="mt-4" role="alert">
          <p className="text-sm text-danger">
            {query.error instanceof ApiError
              ? query.error.message
              : 'Não foi possível iniciar o pagamento.'}
          </p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-line px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <RefreshCw className="h-4 w-4" aria-hidden /> Tentar novamente
          </button>
        </div>
      ) : intent ? (
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {qrSrc ? (
            <img
              src={qrSrc}
              alt="QR Code para pagamento via Pix"
              className="h-48 w-48 shrink-0 rounded-[var(--radius-md)] bg-white p-2"
            />
          ) : null}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-lg font-semibold text-ink">{formatCurrency(intent.amount)}</p>
            {expired ? (
              <p className="mt-1 text-sm text-danger">Pagamento expirado. Gere novamente para continuar.</p>
            ) : countdown ? (
              <p className="mt-1 text-sm text-muted">Expira em {countdown}</p>
            ) : null}

            {intent.checkoutUrl ? (
              <a
                href={intent.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-4 inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-semibold"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                Pagar com cartão
              </a>
            ) : null}

            {intent.copyPaste ? (
              <div className="mt-3">
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  Pix Copia e Cola
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={intent.copyPaste}
                    onFocus={(e) => e.currentTarget.select()}
                    className="h-10 min-w-0 flex-1 truncate rounded-[var(--radius-md)] border border-line bg-canvas px-3 text-xs"
                    aria-label="Código Pix copia e cola"
                  />
                  <button
                    type="button"
                    onClick={() => void copy()}
                    className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] border border-line px-3 text-sm font-semibold"
                  >
                    {copied ? <Check className="h-4 w-4 text-success" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            ) : null}

            {expired ? (
              <button
                type="button"
                onClick={() => void query.refetch()}
                className="btn-primary mt-4 inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-semibold"
              >
                <RefreshCw className="h-4 w-4" aria-hidden /> Gerar novamente
              </button>
            ) : (
              <p className="mt-3 text-xs text-muted">
                Assim que o pagamento for confirmado pelo gateway, o status do pedido é atualizado
                automaticamente aqui. Não confirme pagamento nesta tela.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}
