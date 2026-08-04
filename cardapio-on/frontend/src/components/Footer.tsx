import { MapPin, Phone, Share2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '@/contexts/StoreContext'

export function Footer() {
  const { slug, menu } = useStore()
  if (!menu) return null
  const { establishment } = menu

  return (
    <footer className="border-t border-line bg-surface pb-24 md:pb-10">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-2">
        <div>
          <p className="font-display text-xl text-ink">{establishment.name}</p>
          {establishment.description ? (
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              {establishment.description}
            </p>
          ) : null}
        </div>
        <div className="space-y-2 text-sm text-ink-soft">
          {establishment.address ? (
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
              {establishment.address}
            </p>
          ) : null}
          {establishment.phone ? (
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" strokeWidth={1.75} />
              {establishment.phone}
            </p>
          ) : null}
          {establishment.whatsapp ? (
            <a
              href={`https://wa.me/${establishment.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-medium text-ink underline-offset-2 hover:underline"
            >
              WhatsApp
            </a>
          ) : null}
          <p className="flex items-center gap-2 text-muted">
            <Share2 className="h-4 w-4" strokeWidth={1.75} />
            Pedidos online
          </p>
          <Link
            to={`/${slug}/pedidos`}
            className="inline-flex items-center gap-2 font-medium text-ink underline-offset-2 hover:underline"
          >
            Meus pedidos
          </Link>
        </div>
      </div>
    </footer>
  )
}
