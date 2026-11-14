import { CloudRain, Droplets, ThermometerSun, type LucideIcon } from 'lucide-react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Container } from '@/components/layout/Page'
import { Badge } from '@/components/ui/Badge'
import { SectionTitle } from '@/components/fx/SectionTitle'
import { WarmingStripes } from '@/components/fx/WarmingStripes'
import { CountUp } from '@/components/ui/CountUp'
import { Reveal } from '@/components/ui/Reveal'
import { temperatureChange, type ClimateData } from '@/core'
import { useSokuluk } from '@/hooks/useSokuluk'
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
  const tChange = temperatureChange(data).trend
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
      note: t('valley.warmerNote'),
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
  const { data, failed } = useSokuluk()
  const [showTerrain, setShowTerrain] = useState(false)
  const can3D = useCanRender3D()
  const ref = useRef<HTMLElement>(null)


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
        <SectionTitle id="valley-title" eyebrow={t('valley.eyebrow')} line1={t('valley.title1')} line2={t('valley.title2')} />
        {showTerrain && <p className="mt-2 text-sm text-text-muted">{t('valley.illustrative')}</p>}

        <Reveal className="mt-24 rounded-card border border-glass bg-surface/80 p-4 pt-14 shadow-raised backdrop-blur sm:mt-40 sm:p-6 sm:pt-16">
          <p className="mb-4 font-display text-xl font-semibold text-heading">{t('valley.stripesTitle')}</p>
          {data ? <WarmingStripes points={data.series.temperature.points} /> : <div className="skeleton h-28 sm:h-40" />}
        </Reveal>

        <ul className="mt-3 grid gap-3 md:grid-cols-3">
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
                  <p className={cx('mt-2 font-display text-5xl font-semibold tabular-nums sm:text-6xl', stat.tone)}>
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
