import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { clamp, prefersReducedMotion } from '@/utils'

interface UseCarouselOptions {
  length: number
  loop?: boolean
  autoplayMs?: number | null
  axis?: 'x' | 'y'
}

export function useCarousel({
  length,
  loop = true,
  autoplayMs = null,
}: UseCarouselOptions) {
  const [index, setIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const startOffset = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const reduced = prefersReducedMotion()

  const goTo = useCallback(
    (next: number) => {
      if (length <= 0) return
      if (loop) {
        setIndex(((next % length) + length) % length)
      } else {
        setIndex(clamp(next, 0, length - 1))
      }
    },
    [length, loop],
  )

  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])

  useEffect(() => {
    if (!autoplayMs || reduced || length <= 1 || isDragging) return
    const id = window.setInterval(() => {
      setIndex((i) => (loop ? (i + 1) % length : clamp(i + 1, 0, length - 1)))
    }, autoplayMs)
    return () => window.clearInterval(id)
  }, [autoplayMs, reduced, length, loop, isDragging])

  const onPointerDown = useCallback((e: PointerEvent) => {
    if (length <= 1) return
    const target = e.target as HTMLElement | null
    if (
      target?.closest(
        'button, a, input, textarea, select, label, [role="button"], [data-no-drag]',
      )
    ) {
      return
    }
    setIsDragging(true)
    startX.current = e.clientX
    startOffset.current = 0
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [length])

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return
      const dx = e.clientX - startX.current
      setDragOffset(dx)
    },
    [isDragging],
  )

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return
      setIsDragging(false)
      const dx = e.clientX - startX.current
      const width = containerRef.current?.offsetWidth ?? 320
      const threshold = Math.min(80, width * 0.18)
      if (dx < -threshold) next()
      else if (dx > threshold) prev()
      setDragOffset(0)
      try {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }
    },
    [isDragging, next, prev],
  )

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      } else if (e.key === 'Home') {
        e.preventDefault()
        goTo(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        goTo(length - 1)
      }
    },
    [next, prev, goTo, length],
  )

  return {
    index,
    setIndex: goTo,
    next,
    prev,
    dragOffset,
    isDragging,
    containerRef,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onKeyDown,
    },
  }
}
