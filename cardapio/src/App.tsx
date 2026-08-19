import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import type { MenuData, SectionId } from '@/types'
import { fetchMenu } from '@/services/menu.service'
import { CartProvider } from '@/context/CartContext'
import { UIProvider, useUI } from '@/context/UIContext'
import { MenuProvider } from '@/context/MenuContext'
import { useMediaQuery, useSectionObserver } from '@/hooks/useSectionObserver'
import { revealOnScroll } from '@/animations/gsap'
import { Header } from '@/components/Header/Header'
import { SectionNav } from '@/components/SectionNav/SectionNav'
import { HeroStore } from '@/components/HeroStore/HeroStore'
import { Favorites } from '@/components/Favorites/Favorites'
import { MenuSection } from '@/components/Menu/MenuSection'
import { Promotions } from '@/components/Promotions/Promotions'
import { ProductModal } from '@/components/ProductModal/ProductModal'
import { Cart } from '@/components/Cart/Cart'
import { SearchOverlay } from '@/components/Search/SearchOverlay'
import { Footer } from '@/components/Footer/Footer'
import { MobileStorefront } from '@/components/MobileMenu/MobileStorefront'

const DEFAULT_SLUG = import.meta.env.VITE_DEFAULT_SLUG || 'burger-house'

function MenuExperience({ data }: { data: MenuData }) {
  const { activeSection, setActiveSection } = useUI()
  const [compactHeader, setCompactHeader] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const onSection = useCallback(
    (id: SectionId) => setActiveSection(id),
    [setActiveSection],
  )

  useSectionObserver(onSection)

  useEffect(() => {
    const onScroll = () => setCompactHeader(window.scrollY > window.innerHeight * 0.65)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => revealOnScroll('[data-reveal]'), 400)
    return () => window.clearTimeout(t)
  }, [data.store.slug])

  useEffect(() => {
    document.title = `${data.store.name} — comeon`
  }, [data.store])

  useEffect(() => {
    if (!data.store.secondaryColor) return
    const root = document.documentElement
    root.style.setProperty('--color-brass', data.store.secondaryColor)
    return () => {
      root.style.removeProperty('--color-brass')
    }
  }, [data.store.secondaryColor])

  const allProducts = data.categories.flatMap((c) => c.products)

  if (!isDesktop) {
    return (
      <>
        <MobileStorefront data={data} />
        <SectionNav active={activeSection} labels={data.sections.nav} hideMobileTabs />
        <Cart />
        <ProductModal />
      </>
    )
  }

  return (
    <>
      <a
        href="#cardapio"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-cta focus:px-4 focus:py-2 focus:text-white"
      >
        Ir para o cardápio
      </a>

      <Header store={data.store} compact={compactHeader} />
      <SectionNav active={activeSection} labels={data.sections.nav} />

      <main>
        <HeroStore store={data.store} />
        {data.featuredProducts.length > 0 && (
          <Favorites products={data.featuredProducts} copy={data.sections.favorites} />
        )}
        <MenuSection categories={data.categories} sectionCopy={data.sections.menu} />
        {data.promotions.length > 0 && (
          <Promotions
            promotions={data.promotions}
            products={allProducts}
            copy={data.sections.promotions}
          />
        )}
      </main>

      <Footer store={data.store} />

      <Cart />
      <ProductModal />
      <SearchOverlay data={data} />
    </>
  )
}

function MenuPage() {
  const { slug: paramSlug } = useParams()
  const slug = paramSlug || DEFAULT_SLUG
  const [data, setData] = useState<MenuData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    setData(null)

    fetchMenu(slug)
      .then((menu) => {
        if (alive) setData(menu)
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'Não foi possível carregar o cardápio.')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [slug])

  if (loading) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-ink">
        <span className="grid h-8 w-8 place-items-center rounded-[6px] bg-gold">
          <span className="h-2 w-2 rounded-full bg-ink" />
        </span>
        <p className="mt-4 font-display text-2xl tracking-tight text-bone">comeon</p>
        <span className="mt-6 h-px w-16 origin-left animate-pulse bg-cta/60" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-ink px-6 text-center text-bone">
        <p className="font-display text-xl">{error ?? 'Cardápio indisponível.'}</p>
        <p className="text-sm text-bone/50">
          Verifique se a API do painel está em{' '}
          <code className="text-brass">localhost:3333</code> e se o slug{' '}
          <code className="text-brass">{slug}</code> existe.
        </p>
      </div>
    )
  }

  return (
    <MenuProvider slug={slug} data={data}>
      <MenuExperience data={data} />
    </MenuProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <UIProvider>
          <Routes>
            <Route path="/" element={<Navigate to={`/${DEFAULT_SLUG}`} replace />} />
            <Route path="/:slug" element={<MenuPage />} />
          </Routes>
        </UIProvider>
      </CartProvider>
    </BrowserRouter>
  )
}
