/**
 * "From orbit to furrow": the landing's 3D story.
 * A dot-matrix Earth with a fresnel atmosphere and warm city lights on the
 * night side. Scroll progress (0–1) dives the camera to Kyrgyzstan, draws the
 * border in neon and lights up the Chuy Valley.
 */
import { AdaptiveDpr, Line, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { geoEquirectangular, geoPath } from 'd3-geo'
import type { MotionValue } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  ShaderMaterial,
  Vector3,
  type Group,
} from 'three'
import type { Line2 } from 'three-stdlib'
import { feature } from 'topojson-client'
import type { GeometryCollection } from 'topojson-specification'
import land110 from 'world-atlas/land-110m.json'
import KG from '@/data/kyrgyzstan.json'
import { useTokens } from '@/hooks/useTokens'

interface Bounds {
  lon0: number
  lon1: number
  lat0: number
  lat1: number
}

const DEG = Math.PI / 180
/** Where the camera ends up: the middle of Kyrgyzstan, so the whole country fits and the Chuy Valley sits north. */
const VIEW = { lat: 41.6, lon: 74.8 }
/** Chuy Valley, drawn as an ellipse (illustrative). */
const VALLEY = { lat: 42.85, lon: 74.7, aLon: 1.45, bLat: 0.24 }
/** Dense dot patch over Central Asia, revealed during the descent: a soft-edged disc around the target. */
const PATCH: Bounds = { lon0: 63, lon1: 86, lat0: 34, lat1: 52 }
const PATCH_RADIUS = 8.5 * (Math.PI / 180)

type Vec3 = [number, number, number]

function toVec3(lon: number, lat: number, r = 1): Vec3 {
  const phi = lat * DEG
  const lambda = lon * DEG
  return [r * Math.cos(phi) * Math.sin(lambda), r * Math.sin(phi), r * Math.cos(phi) * Math.cos(lambda)]
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

const WORLD: Bounds = { lon0: -180, lon1: 180, lat0: -90, lat1: 90 }

/** Rasterises a shape once inside a lon/lat box, then answers "is this point inside?" by pixel lookup. */
function makeMask(geo: Parameters<ReturnType<typeof geoPath>>[0], width: number, b: Bounds = WORLD) {
  // Height follows the box's aspect, so x and y use the same degrees-per-pixel as the projection.
  const height = Math.round((width * (b.lat1 - b.lat0)) / (b.lon1 - b.lon0))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const scale = width / ((b.lon1 - b.lon0) * DEG)
  const projection = geoEquirectangular()
    .scale(scale)
    .translate([-scale * b.lon0 * DEG, scale * b.lat1 * DEG])
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  geoPath(projection, ctx)(geo)
  ctx.fill()
  const data = ctx.getImageData(0, 0, width, height).data
  return (lon: number, lat: number) => {
    const x = Math.min(width - 1, Math.max(0, Math.floor(((lon - b.lon0) / (b.lon1 - b.lon0)) * width)))
    const y = Math.min(height - 1, Math.max(0, Math.floor(((b.lat1 - lat) / (b.lat1 - b.lat0)) * height)))
    return data[(y * width + x) * 4] > 127
  }
}

/** Great-circle angle (radians) between two unit vectors. */
function angleTo(a: Vec3, b: Vec3): number {
  return Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])))
}

interface DotData {
  /** 0 at the patch centre, 1 at its edge (globe dots: 0). */
  edges: Float32Array
  positions: Float32Array
  /** 0 = land, 1 = city light, 2 = Kyrgyzstan, 3 = Chuy Valley. */
  kinds: Float32Array
  rands: Float32Array
}

function buildDots(dense: boolean): { globe: DotData; patch: DotData } {
  const landGeo = feature(land110 as never, (land110 as unknown as { objects: { land: GeometryCollection } }).objects.land)
  const isLand = makeMask(landGeo as never, 1440)
  const kgGeo = { type: 'Polygon', coordinates: [KG.ring] } as const
  // Kyrgyzstan mask covers the patch box only, so it can be fine-grained.
  const isKG = makeMask(kgGeo as never, 1600, PATCH)

  const center = toVec3(VIEW.lon, VIEW.lat)
  const g: number[] = []
  const gk: number[] = []
  const gr: number[] = []
  const N = dense ? 26000 : 14000
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < N; i++) {
    const y = 1 - ((i + 0.5) / N) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = i * golden
    const x = Math.cos(theta) * r
    const z = Math.sin(theta) * r
    const lat = Math.asin(y) / DEG
    const lon = Math.atan2(x, z) / DEG
    if (!isLand(lon, lat)) continue
    if (angleTo([x, y, z], center) < PATCH_RADIUS * 0.82) continue
    g.push(x, y, z)
    gk.push(Math.random() < 0.08 ? 1 : 0)
    gr.push(Math.random())
  }

  const p: number[] = []
  const pk: number[] = []
  const pr: number[] = []
  const pe: number[] = []
  const step = dense ? 0.085 : 0.13
  for (let lat = PATCH.lat0; lat < PATCH.lat1; lat += step) {
    // Keep dots evenly spaced on the sphere.
    const lonStep = step / Math.cos(lat * DEG)
    for (let lon = PATCH.lon0; lon < PATCH.lon1; lon += lonStep) {
      const jLat = lat + (Math.random() - 0.5) * step * 0.3
      const jLon = lon + (Math.random() - 0.5) * lonStep * 0.3
      if (!isLand(jLon, jLat)) continue
      const v = toVec3(jLon, jLat, 1.0005)
      const edge = angleTo(toVec3(jLon, jLat), center) / PATCH_RADIUS
      if (edge > 1) continue
      const inKG = isKG(jLon, jLat)
      const dx = (jLon - VALLEY.lon) / VALLEY.aLon
      const dy = (jLat - VALLEY.lat) / VALLEY.bLat
      const inValley = inKG && dx * dx + dy * dy < 1
      p.push(...v)
      pk.push(inValley ? 3 : inKG ? 2 : 0)
      pr.push(Math.random())
      pe.push(edge)
    }
  }
  return {
    globe: { positions: new Float32Array(g), kinds: new Float32Array(gk), rands: new Float32Array(gr), edges: new Float32Array(gk.length) },
    patch: { positions: new Float32Array(p), kinds: new Float32Array(pk), rands: new Float32Array(pr), edges: new Float32Array(pe) },
  }
}

const DOT_VERTEX = /* glsl */ `
  attribute float aKind;
  attribute float aRand;
  attribute float aEdge;
  varying float vEdge;
  uniform float uSize;
  uniform float uViewport;
  uniform float uValley;
  uniform vec3 uSun;
  varying float vLight;
  varying float vKind;
  varying float vRand;
  varying float vFacing;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec3 n = normalize(mat3(modelMatrix) * position);
    vLight = dot(n, uSun);
    vKind = aKind;
    vRand = aRand;
    vEdge = aEdge;
    vFacing = dot(n, normalize(cameraPosition - world.xyz));
    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    float grow = aKind > 2.5 ? 1.0 + uValley * 0.9 : 1.0;
    gl_PointSize = uSize * grow * projectionMatrix[1][1] * uViewport * 0.5 / -mv.z;
  }
`

const DOT_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uKG;
  uniform float uValley;
  uniform vec3 uDay;
  uniform vec3 uNight;
  uniform vec3 uCity;
  uniform vec3 uAccent;
  varying float vLight;
  varying float vKind;
  varying float vRand;
  varying float vFacing;
  varying float vEdge;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float disc = smoothstep(0.5, 0.18, d);
    float day = smoothstep(-0.15, 0.35, vLight);
    vec3 color = mix(uNight, uDay, day);
    float alpha = mix(0.35, 0.95, day);
    // City lights glow only on the night side.
    if (vKind > 0.5 && vKind < 1.5) {
      float night = 1.0 - smoothstep(-0.25, 0.1, vLight);
      float twinkle = 0.75 + 0.25 * sin(uTime * 2.0 + vRand * 40.0);
      color = mix(color, uCity * 1.4, night * twinkle);
      alpha = max(alpha, night * 0.95);
    }
    if (vKind > 1.5) {
      float kg = uKG;
      color = mix(color, uAccent * 0.75, kg * 0.85);
      alpha = mix(alpha, 1.0, kg);
    }
    if (vKind > 2.5) {
      float pulse = 0.8 + 0.2 * sin(uTime * 2.2 + vRand * 6.0);
      color = mix(color, uAccent * 1.5 * pulse, uValley);
      alpha = mix(alpha, 1.0, uValley);
    }
    float limb = smoothstep(-0.05, 0.25, vFacing);
    float edge = 1.0 - smoothstep(0.55, 1.0, vEdge);
    gl_FragColor = vec4(color, alpha * disc * limb * edge * uFade);
  }
`

const ATMOS_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`
const ATMOS_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uFade;
  uniform float uPower;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = pow(clamp(1.0 - abs(dot(vNormal, vView)), 0.0, 1.0), uPower);
    gl_FragColor = vec4(uColor, rim * uFade);
  }
`

function dotMaterial(colors: Record<string, string>, size: number) {
  return new ShaderMaterial({
    vertexShader: DOT_VERTEX,
    fragmentShader: DOT_FRAGMENT,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uSize: { value: size },
      uViewport: { value: 800 },
      uSun: { value: new Vector3(-0.75, 0.35, 0.55).normalize() },
      uTime: { value: 0 },
      uFade: { value: 0 },
      uKG: { value: 0 },
      uValley: { value: 0 },
      uDay: { value: new Color(colors.day) },
      uNight: { value: new Color(colors.night) },
      uCity: { value: new Color('#ffb86b') },
      uAccent: { value: new Color(colors.accent) },
    },
  })
}

function geometryOf(d: DotData) {
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(d.positions, 3))
  geo.setAttribute('aKind', new Float32BufferAttribute(d.kinds, 1))
  geo.setAttribute('aRand', new Float32BufferAttribute(d.rands, 1))
  geo.setAttribute('aEdge', new Float32BufferAttribute(d.edges, 1))
  return geo
}

const TOKENS = ['--globe-ocean', '--globe-line', '--globe-highlight', '--globe-atmosphere', '--color-bg'] as const

interface EarthProps {
  progress: MotionValue<number>
  dense: boolean
  /** Shift the globe right so text has room on wide screens. */
  wide: boolean
}

function Earth({ progress, dense, wide }: EarthProps) {
  const group = useRef<Group>(null)
  const border = useRef<Line2>(null)
  const valleyRing = useRef<Line2>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const startedAt = useRef<number | null>(null)
  const tokens = useTokens(TOKENS)
  const { size, gl } = useThree()

  const dots = useMemo(() => buildDots(dense), [dense])
  const colors = useMemo(
    () => ({ day: tokens['--globe-line'], night: '#1e5145', accent: tokens['--globe-highlight'] }),
    [tokens],
  )
  const globeGeo = useMemo(() => geometryOf(dots.globe), [dots])
  const patchGeo = useMemo(() => geometryOf(dots.patch), [dots])
  const globeMat = useMemo(() => dotMaterial(colors, 0.0125), [colors])
  const patchMat = useMemo(() => dotMaterial(colors, dense ? 0.0014 : 0.0021), [colors, dense])
  const atmosMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: ATMOS_VERTEX,
        fragmentShader: ATMOS_FRAGMENT,
        side: BackSide,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
        uniforms: { uColor: { value: new Color('#2ee6b8') }, uFade: { value: 0 }, uPower: { value: 2.6 } },
      }),
    [],
  )
  const rimMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: ATMOS_VERTEX,
        fragmentShader: ATMOS_FRAGMENT,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
        uniforms: { uColor: { value: new Color('#c6ff3d') }, uFade: { value: 0 }, uPower: { value: 4.5 } },
      }),
    [],
  )

  useEffect(
    () => () => {
      globeGeo.dispose()
      patchGeo.dispose()
      globeMat.dispose()
      patchMat.dispose()
      atmosMat.dispose()
      rimMat.dispose()
    },
    [globeGeo, patchGeo, globeMat, patchMat, atmosMat, rimMat],
  )

  const kgLine = useMemo(() => KG.ring.map(([lon, lat]) => toVec3(lon, lat, 1.0015)), [])
  const kgLength = useMemo(() => {
    let l = 0
    for (let i = 1; i < kgLine.length; i++) {
      const [a, b] = [kgLine[i - 1], kgLine[i]]
      l += Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
    }
    return l
  }, [kgLine])
  const valleyLine = useMemo(() => {
    const pts: Vec3[] = []
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2
      pts.push(toVec3(VALLEY.lon + Math.cos(a) * VALLEY.aLon, VALLEY.lat + Math.sin(a) * VALLEY.bLat, 1.002))
    }
    return pts
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      pointer.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const look = useMemo(() => new Vector3(), [])

  useFrame(({ clock, camera }, delta) => {
    const g = group.current
    if (!g) return
    startedAt.current ??= clock.elapsedTime
    const t = clock.elapsedTime - startedAt.current
    const intro = easeOutCubic(clamp01(t / 1.4))
    const p = progress.get()

    // 0–0.15 orbit, 0.12–0.72 descent, 0.45–0.78 border draws, 0.7–1 valley.
    const dive = smooth(0.1, 0.78, p)
    const kg = smooth(0.42, 0.66, p)
    const valley = smooth(0.66, 0.86, p)

    // Slow idle spin while in orbit, blending into the target orientation.
    const idle = -VIEW.lon * DEG + 0.55 - t * 0.04
    const yaw = lerp(idle, -VIEW.lon * DEG, smooth(0.04, 0.6, p))
    const pitch = lerp(0.25, VIEW.lat * DEG, smooth(0.04, 0.6, p))
    g.rotation.set(pitch + pointer.current.y * 0.03 * (1 - dive), yaw + pointer.current.x * 0.05 * (1 - dive), 0, 'XYZ')

    // Wide screens: globe on the right of the text.
    // Phones and tablets: a smaller globe framed in the free space above the headline.
    const W = size.width
    const H = size.height
    const tanHalf = Math.tan((35 / 2) * DEG)
    let far = 5.0
    let startY = 0
    if (!wide) {
      const header = 56
      const avail = Math.max(120, H * 0.36 - header)
      const radiusPx = Math.min(W * 0.42, avail / 2)
      const centerPx = header + avail / 2 + 4
      far = H / 2 / (radiusPx * tanHalf)
      startY = ((H / 2 - centerPx) / (H / 2)) * far * tanHalf
    }
    const offsetX = wide ? lerp(1.3, 0, smooth(0.05, 0.55, p)) : 0
    const offsetY = lerp(startY, 0, smooth(0.05, 0.55, p))
    g.position.set(offsetX, offsetY, 0)

    // End distance: close enough to feel the descent, far enough that all of Kyrgyzstan fits the width.
    const aspect = Math.min(1.2, W / H)
    const near = 1 + Math.max(0.24, 0.095 / (tanHalf * aspect))
    const dist = lerp(far + (1 - intro) * 1.2, near, easeOutCubic(dive))
    const tilt = smooth(0.62, 1, p)
    camera.position.set(0, lerp(0, -1.5 * (near - 1), tilt), dist)
    look.set(0, 0, lerp(0, 1, tilt))
    camera.lookAt(look)

    const vh = size.height * gl.getPixelRatio()
    for (const mat of [globeMat, patchMat]) {
      mat.uniforms.uTime.value += delta
      mat.uniforms.uViewport.value = vh
      mat.uniforms.uFade.value = intro
      mat.uniforms.uKG.value = kg
      mat.uniforms.uValley.value = valley
    }
    globeMat.uniforms.uSize.value = 0.0125 * lerp(1, 0.07, smooth(0.1, 0.6, p))
    patchMat.uniforms.uFade.value = intro * smooth(0.2, 0.55, p)
    atmosMat.uniforms.uFade.value = intro * lerp(0.95, 0.35, dive)
    rimMat.uniforms.uFade.value = intro * lerp(0.55, 0.1, dive)

    if (border.current) {
      const m = border.current.material
      m.dashSize = Math.max(0.0001, kgLength * kg)
      m.gapSize = kgLength * 2
      m.opacity = kg
    }
    if (valleyRing.current) valleyRing.current.material.opacity = valley
  })

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.995, 64, 48]} />
        <meshBasicMaterial color={tokens['--globe-ocean']} />
      </mesh>
      <mesh material={rimMat}>
        <sphereGeometry args={[1.0, 64, 48]} />
      </mesh>
      <mesh material={atmosMat} scale={1.16}>
        <sphereGeometry args={[1, 64, 48]} />
      </mesh>
      <points geometry={globeGeo} material={globeMat} />
      <points geometry={patchGeo} material={patchMat} />
      <Line ref={border} points={kgLine} color={tokens['--globe-highlight']} lineWidth={2.2} dashed transparent opacity={0} />
      <Line ref={valleyRing} points={valleyLine} color={tokens['--globe-highlight']} lineWidth={1.6} transparent opacity={0} />
    </group>
  )
}

function Stars({ count }: { count: number }) {
  const geo = useMemo(() => {
    const pos: number[] = []
    for (let i = 0; i < count; i++) {
      const v = new Vector3().randomDirection().multiplyScalar(14 + Math.random() * 6)
      pos.push(v.x, v.y, v.z)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    return g
  }, [count])
  return (
    <points geometry={geo}>
      <pointsMaterial color="#a3c2b6" size={0.035} sizeAttenuation transparent opacity={0.55} depthWrite={false} />
    </points>
  )
}

interface OrbitSceneProps {
  progress: MotionValue<number>
  active: boolean
  wide: boolean
  onReady: () => void
}

export default function OrbitScene({ progress, active, wide, onReady }: OrbitSceneProps) {
  const [maxDpr, setMaxDpr] = useState(1.6)
  const [dense, setDense] = useState(() => window.innerWidth >= 900)

  return (
    <Canvas
      dpr={[1, maxDpr]}
      camera={{ position: [0, 0, 4.7], fov: 35, near: 0.01, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      frameloop={active ? 'always' : 'never'}
      onCreated={onReady}
    >
      <PerformanceMonitor
        onDecline={() => {
          setMaxDpr(1)
          setDense(false)
        }}
      >
        <AdaptiveDpr />
        <Stars count={dense ? 700 : 350} />
        <Earth progress={progress} dense={dense} wide={wide} />
      </PerformanceMonitor>
    </Canvas>
  )
}
