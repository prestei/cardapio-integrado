import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Clock3 } from 'lucide-react'
import { useStore } from '@/contexts/StoreContext'
import { heroIntro } from '@/animations/gsap'
import { resolveBanner } from '@/utils/images'
import { dayLabel } from '@/utils/formatters'

export function Hero() {
  const { slug, menu } = useStore()
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => heroIntro(rootRef.current), [menu?.establishment.id])

  if (!menu) return null

  const { establishment, openStatus, settings } = menu
  const statusLabel = openStatus.isOpenNow ? 'Aberto agora' : 'Fechado no momento'
  const statusTone = openStatus.isOpenNow
    ? 'text-success'
    : 'text-muted'

  return (
    <section ref={rootRef} className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-10 pt-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-12 lg:pb-16 lg:pt-10">
        <div className="relative z-10">
          <div data-hero="logo" className="mb-5 flex items-center gap-3">
            {establishment.logoUrl ? (
              <img
                src={establishment.logoUrl}
                alt={`Logo ${establishment.name}`}
                className="h-14 w-14 rounded-[var(--radius-md)] object-cover shadow-[var(--shadow-soft)]"
              />
            ) : (
              <span
                className="grid h-14 w-14 place-items-center rounded-[var(--radius-md)] font-display text-xl font-bold"
                style={{
                  background: 'var(--store-primary)',
                  color: 'var(--store-button-text)',
                }}
              >
                {establishment.name.slice(0, 1)}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusTone}`}>
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  background: openStatus.isOpenNow ? 'var(--color-success)' : 'var(--color-muted)',
                }}
              />
              {statusLabel}
            </span>
          </div>

          <h1
            data-hero="title"
            className="font-display text-[2.35rem] leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]"
          >
            {establishment.name}
          </h1>

          <p
            data-hero="meta"
            className="mt-4 max-w-md text-base leading-relaxed text-ink-soft"
          >
            {establishment.description ||
              'Cardápio digital para pedir com praticidade.'}
          </p>

          <div
            data-hero="meta"
            className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted"
          >
            {settings.estimatedMinutes ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4" strokeWidth={1.75} />
                {settings.estimatedMinutes}–{settings.estimatedMinutes + 15} min
              </span>
            ) : null}
            {openStatus.todayHours && !openStatus.todayHours.isClosed ? (
              <span>
                Hoje {openStatus.todayHours.openTime}–{openStatus.todayHours.closeTime}
              </span>
            ) : openStatus.nextOpen ? (
              <span>
                Próxima abertura {dayLabel(openStatus.nextOpen.dayOfWeek)}{' '}
                {openStatus.nextOpen.openTime}
              </span>
            ) : null}
          </div>

          <div data-hero="cta" className="mt-8 flex flex-wrap gap-3">
            <Link
              to={`/${slug}/cardapio`}
              className="btn-primary inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] px-6 text-sm font-semibold transition"
            >
              Ver cardápio
            </Link>
            <Link
              to={`/${slug}/cardapio`}
              className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] border border-line bg-surface px-6 text-sm font-semibold text-ink transition hover:border-line-strong hover:bg-surface-2"
            >
              Fazer pedido
            </Link>
          </div>
        </div>

        <div data-hero="image" className="relative">
          <img
            src={resolveBanner(establishment.bannerUrl)}
            alt={`Destaque de ${establishment.name}`}
            className="aspect-[4/3] w-full object-cover sm:aspect-[16/11]"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  )
}
