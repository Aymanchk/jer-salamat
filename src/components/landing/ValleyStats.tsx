import { CloudRain, Droplets, ThermometerSun, type LucideIcon } from 'lucide-react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Container } from '@/components/layout/Page'
import { Badge } from '@/components/ui/Badge'
import { CountUp } from '@/components/ui/CountUp'
import { parsePower, temperatureChange, type ClimateData, type PowerResponse } from '@/core'
import { useCanRender3D } from '@/hooks/useDeviceCapability'
import { useT, type TFunc } from '@/i18n'
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

function statsOf(data: ClimateData, t: TFunc): Stat[] {
  const p = data.series.precipitation.points
  const s = data.series.soilWetness.points
  const change = temperatureChange(data)
  const tChange = change.trend
  const pMean = p.reduce((a, x) => a + x.value, 0) / p.length
  const pMin = Math.min(...p.map((x) => x.value))
  const sMean = s.reduce((a, x) => a + x.value, 0) / s.length
  return [
    {
      icon: ThermometerSun,
      label: t('valley.warmer'),
      value: tChange,
      decimals: 1,
      prefix: tChange > 0 ? '+' : '',
      suffix: ' °C',
      note: t('valley.warmerNote', { first: change.firstSpan, last: change.lastSpan, decades: { n: change.decades, d: 2, sign: true } }),
      tone: 'text-data-temp',
    },
    {
      icon: CloudRain,
      label: t('valley.rain'),
      value: pMean,
      decimals: 0,
      suffix: ' mm',
      note: t('valley.rainNote', { min: { n: pMin, d: 0 } }),
      tone: 'text-data-precip',
    },
    {
      icon: Droplets,
      label: t('valley.soil'),
      value: sMean,
      decimals: 2,
      suffix: '',
      note: t('valley.soilNote'),
      tone: 'text-data-soil',
    },
  ]
}

/** Scene 3: the valley, with real NASA POWER numbers for the Sokuluk area. */
export function ValleyStats() {
  const { t } = useT()
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

  const stats = data ? statsOf(data, t) : null

  return (
    <section ref={ref} aria-labelledby="valley-title" data-theme="dark" className="relative overflow-hidden bg-bg pb-8 pt-section text-text">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[34rem] [mask-image:linear-gradient(180deg,#000_55%,transparent_92%)] sm:h-[38rem]">
        {showTerrain && (
          <Suspense fallback={null}>
            <ValleyTerrain />
          </Suspense>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--color-bg)_0%,transparent_14%,transparent_70%,var(--color-bg)_100%)]" />
      </div>

      <Container className="relative">
        <p className="font-display text-sm font-medium uppercase tracking-[0.16em] text-accent-text">{t('valley.eyebrow')}</p>
        <h2 id="valley-title" className="mt-2 max-w-2xl text-3xl sm:text-5xl">
          {t('valley.title')}
        </h2>
        {showTerrain && <p className="mt-2 text-sm text-text-muted">{t('valley.illustrative')}</p>}

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
                <p className="text-text-muted">{failed ? t('valley.failed') : t('valley.loading')}</p>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge type="historical" />
          <span className="text-sm text-text-muted">{t('valley.source')}</span>
        </div>
      </Container>
    </section>
  )
}
