import { AnimatePresence, m, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CropId } from '@/core'
import { useT } from '@/i18n'
import { cx } from '@/lib'

/** How each crop looks from above in mid-season. */
const CROP_COLOR: Partial<Record<CropId, string>> = {
  wheat: '#c9a54a',
  barley: '#b3a45c',
  maize: '#4d7d2d',
  'sugar-beet': '#2f5e2b',
  potato: '#6e7d3a',
  alfalfa: '#7c9f4a',
  beans: '#93b04f',
  vegetables: '#5a8e3d',
}

/** Real sequences from the app (three plans and three common current rotations). */
const SEQUENCES: CropId[][] = [
  ['wheat', 'beans', 'barley', 'wheat'],
  ['alfalfa', 'alfalfa', 'wheat', 'beans'],
  ['sugar-beet', 'wheat', 'potato', 'beans'],
  ['wheat', 'maize'],
  ['potato', 'wheat'],
  ['vegetables', 'wheat'],
]

const LEGEND: CropId[] = ['wheat', 'barley', 'maize', 'sugar-beet', 'potato', 'alfalfa', 'beans', 'vegetables']

const W = 1200
const H = 420
const COLS = 10
const ROWS = 4
const ROAD_ROW = 2
const CANAL_COL = 4
const YEAR_MS = 2600

const rand = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

type Pt = [number, number]

interface Plot {
  id: number
  pts: Pt[]
  cx: number
  cy: number
  seq: CropId[]
  offset: number
  furrow: number
}

/** A jittered lattice, so the plots look like real land, not a spreadsheet. */
function buildLand() {
  const lattice: Pt[][] = []
  for (let i = 0; i <= COLS; i++) {
    lattice.push([])
    for (let j = 0; j <= ROWS; j++) {
      const edgeX = i === 0 || i === COLS
      const edgeY = j === 0 || j === ROWS
      const x = (i / COLS) * W + (edgeX ? 0 : (rand(i * 31 + j) - 0.5) * 50) + (j - ROWS / 2) * 18
      const y = (j / ROWS) * H + (edgeY ? 0 : (rand(i * 17 + j * 7) - 0.5) * 34)
      lattice[i].push([x - (i === 0 ? 60 : 0) + (i === COLS ? 60 : 0), y])
    }
  }
  const plots: Plot[] = []
  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      const corners = [lattice[i][j], lattice[i + 1][j], lattice[i + 1][j + 1], lattice[i][j + 1]]
      const cx = corners.reduce((a, p) => a + p[0], 0) / 4
      const cy = corners.reduce((a, p) => a + p[1], 0) / 4
      // Shrink toward the centre: the gaps become field margins.
      const pts = corners.map(([x, y]) => [cx + (x - cx) * 0.93, cy + (y - cy) * 0.9] as Pt)
      const id = i * ROWS + j
      plots.push({ id, pts, cx, cy, seq: SEQUENCES[Math.floor(rand(id + 5) * SEQUENCES.length)], offset: Math.floor(rand(id + 9) * 4), furrow: Math.floor(rand(id + 3) * 4) })
    }
  }
  const road = lattice.map((col) => col[ROAD_ROW])
  const canal = lattice[CANAL_COL]
  return { plots, road, canal }
}

const line = (pts: Pt[]) => pts.map((p, k) => `${k ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')

/**
 * The valley from above: a patchwork of fields that change crop every "year",
 * a wave sweeping across like a satellite pass, a tractor on the road, water in
 * the canal and cloud shadows drifting over. Tap or hover a field to name its crop.
 */
export function AerialFields({ className }: { className?: string }) {
  const { t } = useT()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.3 })
  const reduced = useReducedMotion()
  const [year, setYear] = useState(0)
  const [hover, setHover] = useState<number | null>(null)
  const land = useMemo(buildLand, [])

  useEffect(() => {
    if (!inView || reduced) return
    const id = setInterval(() => setYear((y) => y + 1), YEAR_MS)
    return () => clearInterval(id)
  }, [inView, reduced])

  const cropOf = (p: Plot) => p.seq[(p.offset + year) % p.seq.length]
  const hovered = hover !== null ? land.plots[hover] : null
  const roadPath = line(land.road)

  return (
    <figure ref={ref} className={cx('m-0', className)}>
      <div className="relative h-[20rem] overflow-hidden rounded-card border border-border bg-[#3d3427] sm:h-[26rem]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={t('aerial.aria')}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            {[0, 35, 90, 140].map((angle, k) => (
              <pattern key={k} id={`furrow-${k}`} width={8} height={8} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
                <line x1={0} y1={0} x2={0} y2={8} stroke="rgba(0,0,0,0.16)" strokeWidth={2} />
              </pattern>
            ))}
            <linearGradient id="pass" x1="0" x2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0.22" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="22" />
            </filter>
          </defs>

          {land.plots.map((p, i) => {
            const crop = cropOf(p)
            const d = `${line(p.pts)} Z`
            return (
              <g key={p.id} onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)} className="cursor-pointer">
                <path
                  d={d}
                  fill={CROP_COLOR[crop]}
                  style={{ transition: `fill 900ms ease ${(p.cx / W) * 900}ms` }}
                  stroke={hover === i ? '#fff' : 'rgba(0,0,0,0.25)'}
                  strokeWidth={hover === i ? 3 : 1}
                />
                <path d={d} fill={`url(#furrow-${p.furrow})`} pointerEvents="none" />
              </g>
            )
          })}

          {/* Canal with flowing water, then the road on top. */}
          <path d={line(land.canal)} stroke="#2f6d9a" strokeWidth={12} fill="none" strokeLinecap="round" />
          <path d={line(land.canal)} stroke="#8cc4ea" strokeWidth={3} fill="none" strokeDasharray="10 16" className="canal-flow" />
          <path d={roadPath} stroke="#4a4438" strokeWidth={16} fill="none" strokeLinejoin="round" />
          <path d={roadPath} stroke="#d9cfb4" strokeWidth={1.5} fill="none" strokeDasharray="14 12" opacity={0.7} />

          {!reduced && (
            <>
              {/* A tractor driving along the road. */}
              <g>
                <animateMotion dur="26s" repeatCount="indefinite" rotate="auto" path={roadPath} />
                <rect x={-12} y={-7} width={18} height={14} rx={3} fill="#c0392b" />
                <rect x={-2} y={-6} width={8} height={12} rx={2} fill="#e8e2d0" />
                <circle cx={-8} cy={-8} r={4} fill="#1d1d1b" />
                <circle cx={-8} cy={8} r={4} fill="#1d1d1b" />
                <circle cx={6} cy={-7} r={2.5} fill="#1d1d1b" />
                <circle cx={6} cy={7} r={2.5} fill="#1d1d1b" />
              </g>
              {/* Cloud shadows drifting east. */}
              {[0, 1, 2].map((k) => (
                <ellipse key={k} cx={-200} cy={80 + k * 120} rx={150 + k * 30} ry={70} fill="#000" opacity={0.2} filter="url(#soft)">
                  <animateTransform attributeName="transform" type="translate" from="0 0" to={`${W + 500} -40`} dur={`${46 + k * 11}s`} begin={`${-k * 17}s`} repeatCount="indefinite" />
                </ellipse>
              ))}
              {/* Each new year sweeps across like a satellite pass. */}
              <m.rect
                key={year}
                y={0}
                width={260}
                height={H}
                fill="url(#pass)"
                initial={{ x: -300 }}
                animate={{ x: W + 40 }}
                transition={{ duration: 1.6, ease: 'easeInOut' }}
                pointerEvents="none"
              />
            </>
          )}

          {hovered && (
            <g pointerEvents="none">
              <rect x={hovered.cx - 70} y={hovered.cy - 18} width={140} height={36} rx={18} fill="rgba(11,16,13,0.85)" />
              <text x={hovered.cx} y={hovered.cy + 6} textAnchor="middle" fontSize={17} fontWeight={700} fill="#fff">
                {t(`crop.short.${cropOf(hovered)}`)}
              </text>
            </g>
          )}
        </svg>

        {/* Year counter. */}
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-pill bg-[rgba(11,16,13,0.8)] px-3 py-1.5 text-sm font-bold text-white backdrop-blur">
          <span className="live-dot" aria-hidden="true" />
          <AnimatePresence mode="wait">
            <m.span key={year % 4} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.3 }}>
              {t('plan.year', { n: String((year % 4) + 1) })}
            </m.span>
          </AnimatePresence>
        </div>
      </div>

      <figcaption className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-md text-text-muted">{t('aerial.caption')}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label={t('aerial.legend')}>
          {LEGEND.map((crop) => (
            <li key={crop} className="inline-flex items-center gap-2 text-sm text-text">
              <span aria-hidden="true" className="h-3 w-3 rounded-[3px]" style={{ background: CROP_COLOR[crop] }} />
              {t(`crop.short.${crop}`)}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}
