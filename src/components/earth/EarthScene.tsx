import { AdaptiveDpr, Line, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BufferGeometry, Float32BufferAttribute, type Group } from 'three'
import { feature, mesh } from 'topojson-client'
import type { GeometryCollection } from 'topojson-specification'
import world from 'world-atlas/countries-110m.json'
import { useTokens } from '@/hooks/useTokens'

/** Chuy Valley, near Sokuluk. */
const TARGET = { lat: 42.86, lon: 74.3 }
const KYRGYZSTAN_ID = '417'
const INTRO_SECONDS = 3.4
const CAMERA_FAR = 5.4
const CAMERA_NEAR = 2.15
const DEG = Math.PI / 180

type Vec3 = [number, number, number]

function toVec3(lon: number, lat: number, radius: number): Vec3 {
  const phi = lat * DEG
  const lambda = lon * DEG
  return [radius * Math.cos(phi) * Math.sin(lambda), radius * Math.sin(phi), radius * Math.cos(phi) * Math.cos(lambda)]
}

/** Turns lon/lat lines into flat segment pairs on the sphere, splitting long edges so they follow the curve. */
function linesToSegments(lines: number[][][], radius: number): Float32Array {
  const out: number[] = []
  for (const line of lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const [lon0, lat0] = line[i]
      const [lon1, lat1] = line[i + 1]
      const dLon = lon1 - lon0
      if (Math.abs(dLon) > 180) continue // edge crosses the date line
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dLon), Math.abs(lat1 - lat0)) / 4))
      for (let s = 0; s < steps; s++) {
        const a = s / steps
        const b = (s + 1) / steps
        out.push(...toVec3(lon0 + dLon * a, lat0 + (lat1 - lat0) * a, radius))
        out.push(...toVec3(lon0 + dLon * b, lat0 + (lat1 - lat0) * b, radius))
      }
    }
  }
  return new Float32Array(out)
}

function graticule(step: number): number[][][] {
  const lines: number[][][] = []
  for (let lon = -180; lon < 180; lon += step) lines.push([[lon, -80], [lon, 80]])
  for (let lat = -60; lat <= 60; lat += step) {
    const ring: number[][] = []
    for (let lon = -180; lon <= 180; lon += 10) ring.push([lon, lat])
    lines.push(ring)
  }
  return lines
}

function segmentGeometry(positions: Float32Array): BufferGeometry {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return geometry
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

const GLOBE_TOKENS = ['--globe-ocean', '--globe-line', '--globe-grid', '--globe-highlight'] as const

function Globe({ onSettled }: { onSettled: () => void }) {
  const group = useRef<Group>(null)
  const settled = useRef(false)
  const startedAt = useRef<number | null>(null)
  const colors = useTokens(GLOBE_TOKENS)

  const { borders, grid, country, marker } = useMemo(() => {
    const countries = world.objects.countries as GeometryCollection
    const borderMesh = mesh(world, countries)
    const kg = countries.geometries.find((g) => g.id === KYRGYZSTAN_ID)
    const kgFeature = kg ? feature(world, kg) : null
    const ring =
      kgFeature?.type === 'Feature' && kgFeature.geometry.type === 'Polygon'
        ? (kgFeature.geometry.coordinates[0] as number[][])
        : []
    return {
      borders: segmentGeometry(linesToSegments(borderMesh.coordinates as number[][][], 1.002)),
      grid: segmentGeometry(linesToSegments(graticule(20), 1.001)),
      country: ring.map(([lon, lat]) => toVec3(lon, lat, 1.004)),
      marker: toVec3(TARGET.lon, TARGET.lat, 1.005),
    }
  }, [])

  useEffect(() => () => {
    borders.dispose()
    grid.dispose()
  }, [borders, grid])

  useFrame(({ clock, camera }) => {
    if (!group.current) return
    startedAt.current ??= clock.elapsedTime
    const t = clock.elapsedTime - startedAt.current
    const p = easeInOutCubic(Math.min(t / INTRO_SECONDS, 1))

    // Spin in from the west, tilt up to the valley's latitude, and move closer.
    const sway = p === 1 ? Math.sin((t - INTRO_SECONDS) * 0.35) * 0.02 : 0
    group.current.rotation.set(TARGET.lat * DEG * p, -TARGET.lon * DEG - (1 - p) * 2.4 + sway, 0, 'XYZ')
    camera.position.z = CAMERA_FAR + (CAMERA_NEAR - CAMERA_FAR) * p

    if (p === 1 && !settled.current) {
      settled.current = true
      onSettled()
    }
  })

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[1, 48, 32]} />
        <meshBasicMaterial color={colors['--globe-ocean']} />
      </mesh>
      <lineSegments geometry={grid}>
        <lineBasicMaterial color={colors['--globe-grid']} />
      </lineSegments>
      <lineSegments geometry={borders}>
        <lineBasicMaterial color={colors['--globe-line']} transparent opacity={0.85} />
      </lineSegments>
      {country.length > 1 && <Line points={country} color={colors['--globe-highlight']} lineWidth={2.5} />}
      <mesh position={marker}>
        <sphereGeometry args={[0.008, 12, 12]} />
        <meshBasicMaterial color={colors['--globe-highlight']} />
      </mesh>
    </group>
  )
}

interface EarthSceneProps {
  /** False pauses rendering (hero off screen). */
  active: boolean
  onReady: () => void
  onSettled: () => void
}

export default function EarthScene({ active, onReady, onSettled }: EarthSceneProps) {
  const [maxDpr, setMaxDpr] = useState(1.75)

  return (
    <Canvas
      dpr={[1, maxDpr]}
      camera={{ position: [0, 0, CAMERA_FAR], fov: 35, near: 0.1, far: 20 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      frameloop={active ? 'always' : 'never'}
      onCreated={onReady}
    >
      <PerformanceMonitor onDecline={() => setMaxDpr(1)}>
        <AdaptiveDpr />
        <Globe onSettled={onSettled} />
      </PerformanceMonitor>
    </Canvas>
  )
}
