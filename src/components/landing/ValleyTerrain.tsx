/**
 * Illustrative low-poly Chuy Valley: flat farmland in front, the Kyrgyz
 * Ala-Too ridge behind, a field grid with one highlighted field.
 * Stylised displacement, NOT a real elevation model (labelled in the UI).
 */
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BufferGeometry, Color, Float32BufferAttribute, PlaneGeometry, type Mesh } from 'three'
import { useTokens } from '@/hooks/useTokens'

/** Small deterministic value noise, so the ridge looks the same on every load. */
function makeNoise(seed: number) {
  const hash = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453
    return s - Math.floor(s)
  }
  const smooth = (t: number) => t * t * (3 - 2 * t)
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = smooth(x - xi)
    const yf = smooth(y - yi)
    const a = hash(xi, yi)
    const b = hash(xi + 1, yi)
    const c = hash(xi, yi + 1)
    const d = hash(xi + 1, yi + 1)
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf
  }
  return (x: number, y: number) => noise(x, y) * 0.55 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.15
}

const W = 40
const D = 26

function buildTerrain(): PlaneGeometry {
  const geo = new PlaneGeometry(W, D, 96, 60)
  geo.rotateX(-Math.PI / 2)
  const noise = makeNoise(3)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    // z < 0 is far (south). Mountains rise steeply behind the valley floor.
    const south = Math.min(1, Math.max(0, (-z - 2) / 9))
    const ridge = south ** 1.6 * (5.5 + noise(x * 0.18, z * 0.18) * 6)
    const floor = noise(x * 0.4, z * 0.4) * 0.12
    pos.setY(i, ridge + floor)
  }
  const flat = geo.toNonIndexed()
  flat.computeVertexNormals()
  geo.dispose()
  return flat as PlaneGeometry
}

function buildFieldGrid(): BufferGeometry {
  const pts: number[] = []
  const x0 = -12
  const x1 = 12
  const z0 = -1
  const z1 = 11
  for (let x = x0; x <= x1; x += 1.5) pts.push(x, 0.14, z0, x, 0.14, z1)
  for (let z = z0; z <= z1; z += 1.2) pts.push(x0, 0.14, z, x1, 0.14, z)
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(pts, 3))
  return geo
}

const TOKENS = ['--color-accent', '--color-bg'] as const

function Scene() {
  const tokens = useTokens(TOKENS)
  const terrain = useMemo(buildTerrain, [])
  const grid = useMemo(buildFieldGrid, [])
  const field = useRef<Mesh>(null)

  useEffect(
    () => () => {
      terrain.dispose()
      grid.dispose()
    },
    [terrain, grid],
  )

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime
    camera.position.x = Math.sin(t * 0.08) * 2.2
    camera.position.y = 3.2 + Math.sin(t * 0.11) * 0.2
    camera.lookAt(0, 2.2, -6)
    if (field.current) {
      const mat = field.current.material as { opacity: number }
      mat.opacity = 0.45 + Math.sin(t * 2.2) * 0.2
    }
  })

  return (
    <>
      <fog attach="fog" args={[tokens['--color-bg'], 14, 42]} />
      <hemisphereLight args={[new Color('#2ee6b8'), new Color('#070b0a'), 0.55]} />
      <directionalLight position={[-10, 5, 2]} intensity={2.2} color="#c6ff3d" />
      <directionalLight position={[10, 3, -6]} intensity={0.6} color="#3dd8ff" />
      <mesh geometry={terrain}>
        <meshStandardMaterial color="#1e5145" flatShading roughness={0.9} metalness={0} />
      </mesh>
      {/* Faint wire overlay gives the low-poly, "mapped from orbit" look. */}
      <mesh geometry={terrain} position={[0, 0.01, 0]}>
        <meshBasicMaterial color="#2ee6b8" wireframe transparent opacity={0.09} />
      </mesh>
      <lineSegments geometry={grid}>
        <lineBasicMaterial color={tokens['--color-accent']} transparent opacity={0.22} />
      </lineSegments>
      {/* "Your field" */}
      <mesh ref={field} position={[0.75, 0.16, 6.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.5, 1.2]} />
        <meshBasicMaterial color={tokens['--color-accent']} transparent opacity={0.5} />
      </mesh>
    </>
  )
}

export default function ValleyTerrain() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([e]) => setActive(e.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="h-full w-full">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 4.2, 13], fov: 42, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        frameloop={active ? 'always' : 'never'}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
