import anime from 'animejs'

/** Pulse discreto para confirmação de ação (Anime.js). */
export function pulseSuccess(target: HTMLElement | null) {
  if (!target) return
  anime({
    targets: target,
    scale: [1, 1.04, 1],
    duration: 320,
    easing: 'easeOutQuad',
  })
}

export function flashAccent(target: HTMLElement | null) {
  if (!target) return
  anime({
    targets: target,
    backgroundColor: ['rgba(232,165,75,0.25)', 'rgba(232,165,75,0)'],
    duration: 500,
    easing: 'easeOutQuad',
  })
}
