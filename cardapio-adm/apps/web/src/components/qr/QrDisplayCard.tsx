import { cn } from '@/utils/cn'
import type { QrCodeEntry } from '@/types'

interface QrDisplayCardProps {
  qr: Pick<QrCodeEntry, 'name' | 'kind' | 'tableLabel' | 'isActive'>
  imageUrl: string
  venueName: string
  className?: string
}

export function qrCardFooter(qr: Pick<QrCodeEntry, 'kind' | 'tableLabel'>) {
  if (qr.kind === 'TABLE') {
    return `Mesa ${qr.tableLabel?.trim() || '____'}`
  }
  if (qr.kind === 'COUNTER') return 'Balcão'
  if (qr.tableLabel?.trim()) return `Mesa ${qr.tableLabel.trim()}`
  return 'Mesa ____'
}

function footerLabel(qr: Pick<QrCodeEntry, 'kind' | 'tableLabel'>) {
  return qrCardFooter(qr)
}

export function QrDisplayCard({ qr, imageUrl, venueName, className }: QrDisplayCardProps) {
  const title = venueName.trim() || qr.name

  return (
    <article
      className={cn(
        'flex aspect-[3/4] w-full flex-col items-center justify-between px-7 py-8 text-center',
        className,
      )}
      style={{
        background: '#F9F6F0',
        color: '#1A1A1A',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <p
        className="text-[11px] font-medium uppercase"
        style={{ color: '#C59D5F', letterSpacing: '0.28em' }}
      >
        come on
      </p>

      <h3 className="mt-4 max-w-full truncate text-[2rem] font-extrabold leading-none tracking-tight">
        {title}
      </h3>

      <div className="my-6 flex flex-1 items-center justify-center">
        <div className="bg-white p-4 shadow-sm">
          <img
            src={imageUrl}
            alt={qr.name}
            width={200}
            height={200}
            className="h-[168px] w-[168px] sm:h-[180px] sm:w-[180px]"
          />
        </div>
      </div>

      <p className="text-[13px] font-semibold uppercase tracking-[0.12em]">
        Escaneie e peça na mesa
      </p>

      <div className="mt-5 w-full border-t" style={{ borderColor: '#E0E0E0' }} />

      <p className="mt-4 text-sm font-medium tracking-wide">{footerLabel(qr)}</p>
    </article>
  )
}

export function buildQrPrintDocument(opts: {
  title: string
  imageUrl: string
  footer: string
}) {
  const esc = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${esc(opts.title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
    <style>
      @page { size: A6 portrait; margin: 0; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #e8e4dc;
        font-family: Inter, system-ui, sans-serif;
      }
      .card {
        width: 420px;
        min-height: 560px;
        background: #F9F6F0;
        color: #1A1A1A;
        text-align: center;
        padding: 48px 40px 40px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .brand {
        margin: 0;
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: #C59D5F;
      }
      h1 {
        margin: 20px 0 0;
        font-size: 42px;
        font-weight: 800;
        letter-spacing: -0.03em;
        line-height: 1;
      }
      .qr-wrap {
        margin: 36px 0;
        background: #fff;
        padding: 18px;
      }
      img { width: 240px; height: 240px; display: block; }
      .hint {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      hr {
        width: 100%;
        border: 0;
        border-top: 1px solid #E0E0E0;
        margin: 28px 0 18px;
      }
      .mesa {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <p class="brand">come on</p>
      <h1>${esc(opts.title)}</h1>
      <div class="qr-wrap"><img src="${esc(opts.imageUrl)}" alt="QR Code" /></div>
      <p class="hint">Escaneie e peça na mesa</p>
      <hr />
      <p class="mesa">${esc(opts.footer)}</p>
    </div>
    <script>window.onload = () => window.print()</script>
  </body>
</html>`
}
