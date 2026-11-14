import { CloudRain, Droplets, ThermometerSun, type LucideIcon } from 'lucide-react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Container } from '@/components/layout/Page'
import { Badge } from '@/components/ui/Badge'
import { CountUp } from '@/components/ui/CountUp'
import { parsePower, type ClimateData, type PowerResponse } from '@/core'
import { useCanRender3D } from '@/hooks/useDeviceCapability'
import { cx } from '@/lib'

const ValleyTerrain = lazy(() => import('./ValleyTerrain'))

interface Stat {
  icon: LucideIcon
  label: string
  value: number
  decimals: number
  prefix?: string
  suffix: string
  note: string
  tone: string
}

function statsOf(data: ClimateData): Stat[] {
  const t = data.series.temperature.points
  const p = data.series.precipitation.points
  const s = data.series.soilWetness.points
  const span = (t[t.length - 1].year - t[0].year) / 10
  const tChange = data.trends.temperature.slopePerDecade * span
  const pMean = p.reduce((a, x) => a + x.value, 0) / p.length
  const pMin = Math.min(...p.map((x) => x.value))
  const sMean = s.reduce((a, x) => a + x.value, 0) / s.length
  return [
    {
      icon: ThermometerSun,
      label: 'Warmer than in 1986',
      value: tChange,
      decimals: 1,
      prefix: tChange > 0 ? '+' : '',
      suffix: ' °C',
      note: 'Change along the 40-year trend line of yearly mean air temperature.',
      tone: 'text-data-temp',
    },
    {
      icon: CloudRain,
      label: 'Rain and snow a year',
      value: pMean,
      decimals: 0,
      suffix: ' mm',
      note: `40-year average. The driest year had only ${Math.round(pMin)} mm.`,
      tone: 'text-data-precip',
    },
    {
      icon: Droplets,
      label: 'Root zone soil wetness',
      value: sMean,
      decimals: 2,
      suffix: '',
      note: '40-year average, on a scale from 0 (dry) to 1 (soaked).',
      tone: 'text-data-soil',
    },
  ]
}

/** Scene 3: the valley, with real NASA POWER numbers for the Sokuluk area. */
export function ValleyStats() {
  const [data, setData] = useState<ClimateData | null>(null)
  const [failed, setFailed] = useState(false)
  const [showTerrain, setShowTerrain] = useState(false)
  const can3D = useCanRender3D()
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    fetch('/data/sokuluk.json')
      .then((r) => (r.ok ? (r.json() as Promise<PowerResponse>) : Promise.reject(new Error(String(r.status)))))
      .then((json) => setData(parsePower(json, false)))
      .catch(() => setFailed(true))
  }, [])

  // Load the terrain only when the section comes near the screen.
  useEffect(() => {
    const el = ref.current
    if (!el || !can3D) return
    const observer = new IntersectionObserver(([e]) => e.isIntersecting && setShowTerrain(true), { rootMargin: '400px 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [can3D])

  const stats = data ? statsOf(data) : null

  return (
    <section ref={ref} aria-labelledby="valley-title" data-theme="dark" className="relative overflow-hidden bg-bg pb-section pt-section text-text">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[34rem] sm:h-[38rem]">
        {showTerrain && (
          <Suspense fallback={null}>
            <ValleyTerrain />
          </Suspense>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--color-bg)_0%,transparent_14%,transparent_70%,var(--color-bg)_100%)]" />
      </div>

      <Container className="relative">
        <p className="font-display text-sm font-medium uppercase tracking-[0.16em] text-accent-text">The valley · Sokuluk area</p>
        <h2 id="valley-title" className="mt-2 max-w-2xl text-3xl sm:text-5xl">
          40 years of climate, seen from orbit.
        </h2>
        {showTerrain && <p className="mt-2 text-sm text-text-muted">Terrain shown is illustrative, not a real elevation model.</p>}

        <ul className="mt-[16rem] grid gap-3 sm:mt-[19rem] md:grid-cols-3">
          {(stats ?? Array.from({ length: 3 }, () => null)).map((stat, i) => (
            <li
              key={stat?.label ?? i}
              className={cx('glass rounded-card border border-glass p-5 shadow-raised', !stat && 'min-h-40')}
            >
              {stat ? (
                <>
                  <div className="flex items-center gap-2 text-text-muted">
                    <stat.icon size={18} aria-hidden="true" className={stat.tone} />
                    <span className="font-bold">{stat.label}</span>
                  </div>
                  <p className={cx('mt-2 font-display text-5xl font-semibold tabular-nums', stat.tone)}>
                    <CountUp value={stat.value} decimals={stat.decimals} prefix={stat.prefix} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2 text-sm text-text-muted">{stat.note}</p>
                </>
              ) : (
                <p className="text-text-muted">{failed ? 'NASA data is not available right now.' : 'Loading NASA data…'}</p>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge type="historical" />
          <span className="text-sm text-text-muted">NASA POWER, monthly, 1986–2025, point 42.86° N 74.30° E (about 50 km grid).</span>
        </div>
      </Container>
    </section>
  )
}
