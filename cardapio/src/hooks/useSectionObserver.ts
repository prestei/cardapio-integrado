import { useEffect, useState } from 'react'
import type { SectionId } from '@/types'

const SECTIONS: SectionId[] = ['loja', 'favoritos', 'cardapio', 'promocoes']

export function useSectionObserver(onChange: (id: SectionId) => void) {
  useEffect(() => {
    const elements = SECTIONS.map((id) => document.getElementById(id)).filter(
      Boolean,
    ) as HTMLElement[]

    if (!elements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const top = visible[0]
        if (top?.target.id) onChange(top.target.id as SectionId)
      },
      {
        rootMargin: '-20% 0px -45% 0px',
        threshold: [0.15, 0.35, 0.55],
      },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [onChange])
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = () => setMatches(mql.matches)
    handler()
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

export function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
