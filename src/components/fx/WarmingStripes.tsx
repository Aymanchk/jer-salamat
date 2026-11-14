import { m } from 'motion/react'
import { useState } from 'react'
import type { ClimatePoint } from '@/core'
import { useT } from '@/i18n'

/** Classic "warming stripes" ramp: deep blue (cooler years) to deep red (warmer years). */
const RAMP = ['#08306b', '#2171b5', '#6baed6', '#c6dbef', '#fee0d2', '#fc9272', '#de2d26', '#67000d']

function hexToRgb(h: string) {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rampColor(t: number) {
  const x = Math.min(0.9999, Math.max(0, t)) * (RAMP.length - 1)
  const i = Math.floor(x)
  const f = x - i
  const a = hexToRgb(RAMP[i])
  const b = hexToRgb(RAMP[i + 1])
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(',')})`
}

/** One stripe per year of NASA POWER yearly mean temperature. Hover or tap a stripe to read it. */
export function WarmingStripes({ points }: { points: ClimatePoint[] }) {
  const { t, num } = useT()
  const [hover, setHover] = useState<number | null>(null)
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  // Centre the ramp on the 40-year mean: blue = cooler than usual, red = warmer.
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const span = Math.max(max - mean, mean - min) || 1
  const shown = hover !== null ? points[hover] : null

  return (
    <figure className="m-0">
      <div className="relative">
        <div
          role="img"
          aria-label={t('valley.stripesAria', { min: { n: min, d: 1 }, max: { n: max, d: 1 } })}
          className="flex h-28 overflow-hidden rounded-card sm:h-40"
          onPointerLeave={() => setHover(null)}
        >
          {points.map((p, i) => (
            <m.div
              key={p.year}
              aria-hidden="true"
              className="h-full flex-1 origin-bottom transition-[filter] duration-200 hover:brightness-125"
              style={{ background: rampColor(0.5 + (p.value - mean) / (2 * span)) }}
              initial={{ scaleY: 0.05 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.045, ease: [0.16, 1, 0.3, 1] }}
              onPointerEnter={() => setHover(i)}
              onPointerDown={() => setHover(i)}
            />
          ))}
        </div>
        {shown && hover !== null && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-11 z-10 -translate-x-1/2 whitespace-nowrap rounded-pill bg-text px-3 py-1.5 text-sm font-bold text-bg shadow-raised"
            style={{ left: `${Math.min(92, Math.max(8, ((hover + 0.5) / points.length) * 100))}%` }}
          >
            {shown.year} · {num(shown.value, 1)} °C
          </div>
        )}
      </div>
      <figcaption className="mt-3 flex items-center justify-between gap-4 text-sm text-text-muted">
        <span className="tabular-nums">{points[0]?.year}</span>
        <span className="text-center">{t('valley.stripes')}</span>
        <span className="tabular-nums">{points.at(-1)?.year}</span>
      </figcaption>
    </figure>
  )
}
