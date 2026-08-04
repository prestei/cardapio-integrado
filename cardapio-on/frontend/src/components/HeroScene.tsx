import { lazy, Suspense, useEffect, useState } from 'react'

const Scene = lazy(() => import('./HeroSceneCanvas'))

function canUseThree() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (window.matchMedia('(max-width: 768px)').matches) return false
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }
  if (nav.deviceMemory && nav.deviceMemory < 4) return false
  if (nav.connection?.saveData) return false
  return true
}

export function HeroScene() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(canUseThree())
  }, [])

  if (!enabled) {
    return (
      <div
        className="pointer-events-none absolute inset-0 -z-10 wireframe-fallback"
        aria-hidden
      />
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 opacity-90" aria-hidden>
      <Suspense fallback={<div className="h-full w-full wireframe-fallback" />}>
        <Scene />
      </Suspense>
    </div>
  )
}
