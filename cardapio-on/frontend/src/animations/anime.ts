import { animate } from 'animejs'

export function bounceCartBadge(el: HTMLElement | null) {
  if (!el || prefersReducedMotion()) return
  animate(el, {
    scale: [1, 1.25, 1],
    duration: 320,
    ease: 'out(3)',
  })
}

export function pulseAddButton(el: HTMLElement | null) {
  if (!el || prefersReducedMotion()) return
  animate(el, {
    scale: [1, 0.96, 1],
    duration: 220,
    ease: 'out(2)',
  })
}

export function popPrice(el: HTMLElement | null) {
  if (!el || prefersReducedMotion()) return
  animate(el, {
    scale: [1, 1.08, 1],
    duration: 240,
    ease: 'out(3)',
  })
}

export function successCheck(el: HTMLElement | null) {
  if (!el || prefersReducedMotion()) return
  animate(el, {
    scale: [0.6, 1.1, 1],
    opacity: [0, 1],
    duration: 420,
    ease: 'out(3)',
  })
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
