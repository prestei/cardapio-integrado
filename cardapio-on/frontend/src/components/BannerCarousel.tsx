import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBanners, registerBannerClick, registerBannerView } from '@/services/banners'
import { cn } from '@/utils/cn'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  )

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const onChange = () => setIsDesktop(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}

export function BannerCarousel({ slug }: { slug: string }) {
  const { data } = useQuery({
    queryKey: ['banners', slug],
    queryFn: () => getBanners(slug),
    enabled: Boolean(slug),
    staleTime: 60_000,
  })
  const isDesktop = useIsDesktop()
  const [index, setIndex] = useState(0)
  const [viewed, setViewed] = useState<Set<string>>(new Set())

  const banners = useMemo(
    () => (data ?? []).filter((b) => (isDesktop ? b.showDesktop : b.showMobile)),
    [data, isDesktop],
  )

  useEffect(() => {
    setIndex((i) => (banners.length && i >= banners.length ? 0 : i))
  }, [banners.length])

  useEffect(() => {
    const current = banners[index]
    if (!current || viewed.has(current.id)) return
    setViewed((prev) => new Set(prev).add(current.id))
    void registerBannerView(slug, current.id)
  }, [index, banners, slug, viewed])

  useEffect(() => {
    if (banners.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6000)
    return () => clearInterval(id)
  }, [banners.length])

  if (banners.length === 0) return null

  const banner = banners[index]!

  const handleClick = () => {
    void registerBannerClick(slug, banner.id)
  }

  const media = (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-lg)] bg-surface-2 sm:aspect-[21/8]">
      <img src={banner.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
        <h3 className="font-display text-lg text-white sm:text-2xl">{banner.title}</h3>
        {banner.subtitle ? (
          <p className="mt-1 max-w-md text-xs text-white/85 sm:text-sm">{banner.subtitle}</p>
        ) : null}
        {banner.buttonLabel ? (
          <span className="mt-3 inline-block rounded-[var(--radius-md)] bg-white px-4 py-2 text-xs font-semibold text-ink sm:text-sm">
            {banner.buttonLabel}
          </span>
        ) : null}
      </div>
    </div>
  )

  return (
    <section
      className="mx-auto max-w-6xl px-4 pt-6 sm:px-6"
      aria-roledescription="carousel"
      aria-label="Destaques da loja"
    >
      {banner.linkUrl ? (
        <a
          href={banner.linkUrl}
          onClick={handleClick}
          target={banner.linkUrl.startsWith('http') ? '_blank' : undefined}
          rel="noreferrer"
          className="block"
        >
          {media}
        </a>
      ) : (
        <button type="button" onClick={handleClick} className="block w-full text-left">
          {media}
        </button>
      )}
      {banners.length > 1 ? (
        <div className="mt-3 flex justify-center gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver destaque ${i + 1} de ${banners.length}`}
              aria-current={i === index}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-6 bg-[var(--store-primary)]' : 'w-1.5 bg-line',
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
