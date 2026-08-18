import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/utils'

let registered = false

export function ensureGsap() {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger)
    registered = true
  }
  return gsap
}

export function createHeroTimeline(
  root: HTMLElement,
  opts?: { onComplete?: () => void },
) {
  const g = ensureGsap()
  const reduced = prefersReducedMotion()

  const image = root.querySelector('[data-hero-image]')
  const logo = root.querySelector('[data-hero-logo]')
  const name = root.querySelector('[data-hero-name]')
  const tagline = root.querySelector('[data-hero-tagline]')
  const cta = root.querySelector('[data-hero-cta]')
  const chrome = root.querySelectorAll('[data-hero-chrome]')

  if (reduced) {
    g.set([image, logo, name, tagline, cta, chrome], { clearProps: 'all', opacity: 1 })
    opts?.onComplete?.()
    return g.timeline()
  }

  const targets = [image, logo, name, tagline, cta, ...chrome].filter(Boolean)

  const tl = g.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: opts?.onComplete,
  })

  g.set(image, { scale: 1.18, opacity: 0, filter: 'blur(12px)' })
  g.set([logo, name, tagline, cta], { opacity: 0, y: 28 })
  g.set(chrome, { opacity: 0 })

  tl.to(image, {
    scale: 1.06,
    opacity: 1,
    filter: 'blur(0px)',
    duration: 1.6,
    ease: 'power2.out',
  })
    .to(logo, { opacity: 1, y: 0, duration: 0.7 }, '-=0.85')
    .to(name, { opacity: 1, y: 0, duration: 0.75 }, '-=0.45')
    .to(tagline, { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
    .to(cta, { opacity: 1, y: 0, duration: 0.65 }, '-=0.35')
    .to(chrome, { opacity: 1, duration: 0.6 }, '-=0.4')

  // HMR / remount: kill() can leave opacity:0 — always restore on cleanup.
  const cleanup = () => {
    g.killTweensOf(targets)
    g.set(targets, { clearProps: 'all', opacity: 1, y: 0, scale: 1, filter: 'none' })
  }
  Object.assign(tl, { __cleanup: cleanup })

  return tl
}

export function revealOnScroll(selector: string, container?: HTMLElement | Document) {
  const g = ensureGsap()
  if (prefersReducedMotion()) return

  const root = container ?? document
  const nodes = root.querySelectorAll(selector)

  nodes.forEach((node) => {
    g.fromTo(
      node,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: node,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      },
    )
  })
}
