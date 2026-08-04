import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function LoginBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    )
    camera.position.z = 8

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const geometries = [
      new THREE.IcosahedronGeometry(2.5, 0),
      new THREE.OctahedronGeometry(1.8, 0),
      new THREE.TetrahedronGeometry(1.2, 0),
    ]

    const material = new THREE.MeshBasicMaterial({
      color: 0xe8a54b,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    })

    const meshes = geometries.map((geo, i) => {
      const mesh = new THREE.Mesh(geo, material.clone())
      mesh.position.set(i * 2.5 - 2.5, i * 0.5 - 0.5, -i * 0.5)
      scene.add(mesh)
      return mesh
    })

    const gridHelper = new THREE.GridHelper(20, 20, 0xe8a54b, 0x2e2e2e)
    gridHelper.material.transparent = true
    gridHelper.material.opacity = 0.04
    scene.add(gridHelper)

    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      meshes.forEach((mesh, i) => {
        mesh.rotation.x += 0.001 * (i + 1)
        mesh.rotation.y += 0.0015 * (i + 1)
      })
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      geometries.forEach((g) => g.dispose())
      material.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    />
  )
}
