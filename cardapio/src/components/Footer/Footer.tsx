import type { Store } from '@/types'

interface FooterProps {
  store: Store
}

export function Footer({ store }: FooterProps) {
  return (
    <footer className="border-t border-line bg-ink pb-dock lg:pb-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-14 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div>
          <p className="font-display text-3xl tracking-[0.18em] text-bone">{store.name}</p>
          <p className="mt-3 max-w-sm text-sm text-bone/50">{store.description}</p>
        </div>
        <div className="space-y-2 text-sm text-bone/55">
          <p>{store.address}</p>
          <p>
            <a href={`tel:${store.phone}`} className="transition-colors hover:text-brass">
              {store.phone}
            </a>
          </p>
          <p>
            <a
              href={`https://wa.me/${store.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-brass"
            >
              WhatsApp
            </a>
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl border-t border-line/50 px-4 py-5 sm:px-6 lg:px-8">
        <p className="text-[0.7rem] tracking-[0.16em] text-bone/30 uppercase">
          © {new Date().getFullYear()} {store.name} · comeon
        </p>
      </div>
    </footer>
  )
}
