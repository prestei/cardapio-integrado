import { lazy, Suspense, useEffect, useState } from 'react'

const Canvas = lazy(() => import('./HeroSceneCanvas'))

function canUseThree() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const nav = navigator as Navigator & { deviceMemory?: number }
  if (nav.deviceMemory && nav.deviceMemory < 4) return false
  return true
}

export function LoginWireframe() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(canUseThree())
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {enabled ? (
        <Suspense fallback={<div className="h-full w-full wireframe-fallback" />}>
          <div className="absolute inset-0 opacity-80">
            <Canvas />
          </div>
        </Suspense>
      ) : (
        <div className="h-full w-full wireframe-fallback" />
      )}
    </div>
  )
}
