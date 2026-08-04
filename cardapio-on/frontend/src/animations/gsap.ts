import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let registered = false

export function ensureGsap() {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger)
    registered = true
  }
  return gsap
}

export function heroIntro(root: HTMLElement | null) {
  if (!root || prefersReducedMotion()) return () => undefined

  const g = ensureGsap()
  const ctx = g.context(() => {
    const tl = g.timeline({ defaults: { ease: 'power2.out' } })
    tl.from('[data-hero="logo"]', { opacity: 0, y: 14, duration: 0.45 })
      .from('[data-hero="title"]', { opacity: 0, y: 18, duration: 0.45 }, '-=0.22')
      .from('[data-hero="meta"]', { opacity: 0, y: 12, duration: 0.35 }, '-=0.2')
      .from('[data-hero="cta"]', { opacity: 0, y: 10, duration: 0.35 }, '-=0.18')
      .from(
        '[data-hero="image"]',
        { opacity: 0, y: 20, scale: 1.03, duration: 0.55 },
        '-=0.45',
      )
  }, root)

  return () => ctx.revert()
}

export function revealOnScroll(selector: string, root?: HTMLElement | null) {
  if (prefersReducedMotion()) return () => undefined
  const g = ensureGsap()
  const ctx = g.context(() => {
    g.utils.toArray<HTMLElement>(selector).forEach((el) => {
      g.from(el, {
        opacity: 0,
        y: 18,
        duration: 0.45,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      })
    })
  }, root ?? undefined)

  return () => ctx.revert()
}

export function loginCardIntro(root: HTMLElement | null) {
  if (!root || prefersReducedMotion()) return () => undefined
  const g = ensureGsap()
  const ctx = g.context(() => {
    g.from(root, {
      opacity: 0,
      y: 18,
      scale: 0.98,
      duration: 0.5,
      ease: 'power2.out',
    })
  }, root)
  return () => ctx.revert()
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
