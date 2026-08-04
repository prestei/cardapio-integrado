import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/** Decorative amber wireframe polyhedron — matches the login visual language. */
export default function HeroSceneCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = mount.clientWidth
    const height = mount.clientHeight
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
    camera.position.set(0, 0.15, 5.2)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(width, height)
    mount.appendChild(renderer.domElement)

    const geometry = new THREE.IcosahedronGeometry(1.85, 1)
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#F2A94A'),
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(1.4, 0.1, 0)
    scene.add(mesh)

    let frame = 0
    let raf = 0
    const tick = () => {
      frame += 0.004
      mesh.rotation.x = frame * 0.35
      mesh.rotation.y = frame * 0.55
      mesh.position.y = Math.sin(frame * 0.8) * 0.08
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick()

    const onResize = () => {
      if (!mount) return
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={mountRef} className="h-full w-full" />
}
