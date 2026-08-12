import { animate } from 'animejs'
import { prefersReducedMotion } from '@/utils'

export function pulseIndicator(el: HTMLElement | null) {
  if (!el || prefersReducedMotion()) return
  animate(el, {
    scale: [1, 1.35, 1],
    opacity: [0.6, 1, 1],
    duration: 520,
    ease: 'out(3)',
  })
}

export function countUpPrice(
  el: HTMLElement | null,
  from: number,
  to: number,
  formatter: (n: number) => string,
) {
  if (!el) return
  if (prefersReducedMotion()) {
    el.textContent = formatter(to)
    return
  }
  const state = { value: from }
  animate(state, {
    value: to,
    duration: 480,
    ease: 'out(3)',
    onUpdate: () => {
      el.textContent = formatter(state.value)
    },
  })
}
