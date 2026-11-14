import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { CloudRain, DatabaseBackup, Droplets, Thermometer, type LucideIcon } from 'lucide-react'
import { useInView, useReducedMotion } from 'motion/react'
import { useMemo, useRef } from 'react'
import { Chart } from 'react-chartjs-2'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { Term } from '@/components/ui/Term'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorState } from '@/components/ui/States'
import { trendLine, type ClimatePoint, type ClimateTrend, type ClimateVariable } from '@/core'
import { useTokens } from '@/hooks/useTokens'
import { useT } from '@/i18n'

ChartJS.register(
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
)

export type ChartStatus = 'ready' | 'cached' | 'loading' | 'error'

interface VariableMeta {
  icon: LucideIcon
  form: 'line' | 'bar' | 'area'
  colorToken: '--data-temp' | '--data-precip' | '--data-soil'
  softToken: '--data-temp-soft' | '--data-precip-soft' | '--data-soil-soft'
  iconClass: string
}

/** Each variable has its own colour AND its own chart form. */
const VARIABLES: Record<ClimateVariable, VariableMeta> = {
  temperature: {
    icon: Thermometer,
    form: 'line',
    colorToken: '--data-temp',
    softToken: '--data-temp-soft',
    iconClass: 'bg-data-temp-soft text-data-temp',
  },
  precipitation: {
    icon: CloudRain,
    form: 'bar',
    colorToken: '--data-precip',
    softToken: '--data-precip-soft',
    iconClass: 'bg-data-precip-soft text-data-precip',
  },
  soilWetness: {
    icon: Droplets,
    form: 'area',
    colorToken: '--data-soil',
    softToken: '--data-soil-soft',
    iconClass: 'bg-data-soil-soft text-data-soil',
  },
}

const TOKEN_NAMES = [
  '--data-temp',
  '--data-temp-soft',
  '--data-precip',
  '--data-precip-soft',
  '--data-soil',
  '--data-soil-soft',
  '--data-trend',
  '--data-grid',
  '--data-scenario',
  '--color-text-muted',
  '--color-surface',
  '--color-text',
  '--font-family-sans',
] as const

interface ChartCardProps {
  variable: ClimateVariable
  status: ChartStatus
  points: ClimatePoint[]
  trend?: ClimateTrend
  /** One plain sentence that says what the chart shows. */
  summary: string
  /** Plain-language conclusion shown above the chart ("What this means for your crops"). */
  conclusion?: string
  /** Hypothetical overlay: added to the trend line (the "what if +2°C" toggle). */
  scenario?: { label: string; offset: number }
  onRetry?: () => void
}

function formatSlope(variable: ClimateVariable, trend: ClimateTrend, num: (n: number, d: number, sign: boolean) => string, perDecade: string): string {
  const v = trend.slopePerDecade
  if (variable === 'temperature') return `${num(v, 2, true)} °C ${perDecade}`
  if (variable === 'precipitation') return `${num(v, 0, true)} mm ${perDecade}`
  return `${num(v, 3, true)} ${perDecade}`
}

export function ChartCard({ variable, status, points, trend, summary, conclusion, scenario, onRetry }: ChartCardProps) {
  const meta = VARIABLES[variable]
  const { t, num } = useT()
  const title = t(`chart.${variable}`)
  const tokens = useTokens(TOKEN_NAMES)
  const reducedMotion = useReducedMotion()
  const Icon = meta.icon
  const chartRef = useRef<HTMLDivElement>(null)
  // Charts draw in when they scroll into view.
  const inView = useInView(chartRef, { once: true, margin: '0px 0px 160px 0px' })
  const years = points.map((p) => p.year)
  const values = points.map((p) => p.value)
  const scenarioLabel = scenario?.label

  // The record year: hottest for temperature, driest for rain and soil.
  const recordIndex = useMemo(() => {
    if (values.length === 0) return -1
    const target = variable === 'temperature' ? Math.max(...values) : Math.min(...values)
    return values.lastIndexOf(target)
  }, [values, variable])

  const data = useMemo<ChartData<'bar' | 'line', number[], number>>(() => {
    const color = tokens[meta.colorToken]
    const soft = tokens[meta.softToken]
    const trend = trendLine(points)
    const datasets: ChartData<'bar' | 'line', number[], number>['datasets'] = [
      {
        type: 'line',
        label: t('chart.trend'),
        data: trend,
        borderColor: tokens['--data-trend'],
        borderWidth: 2,
        borderDash: [6, 5],
        tension: 0,
        pointRadius: 0,
        pointHitRadius: 0,
        order: 0,
      },
    ]
    if (scenario) {
      datasets.push({
        type: 'line',
        label: scenario.label,
        data: trend.map((v) => v + scenario.offset),
        borderColor: tokens['--data-scenario'],
        borderWidth: 2,
        borderDash: [2, 4],
        pointRadius: 0,
        pointHitRadius: 0,
        order: 0,
      })
    }
    if (meta.form === 'bar') {
      datasets.push({
        type: 'bar',
        label: title,
        data: values,
        backgroundColor: values.map((_, i) => (i === recordIndex ? tokens['--data-scenario'] : color)),
        borderRadius: 2,
        categoryPercentage: 0.8,
        barPercentage: 0.85,
        order: 1,
      })
    } else {
      datasets.push({
        type: 'line',
        label: title,
        data: values,
        borderColor: color,
        backgroundColor: soft,
        fill: meta.form === 'area' ? 'start' : false,
        borderWidth: 2.5,
        tension: 0.25,
        pointRadius: values.map((_, i) => (i === recordIndex ? 5 : 0)),
        pointHoverRadius: 5,
        pointBackgroundColor: values.map((_, i) => (i === recordIndex ? tokens['--data-scenario'] : color)),
        pointBorderColor: tokens['--color-surface'],
        pointBorderWidth: 1.5,
        order: 1,
      })
    }
    return { labels: years, datasets }
  }, [tokens, meta, values, years, points, scenario, recordIndex, title, t])

  const options = useMemo<ChartOptions<'bar' | 'line'>>(() => {
    const tick = { color: tokens['--color-text-muted'], font: { family: tokens['--font-family-sans'], size: 13 } }
    // Tight value range so real change is visible; bars start at zero with headroom.
    const lo = values.length ? Math.min(...values) : 0
    const hi = values.length ? Math.max(...values) + (scenario?.offset ?? 0) : 1
    const yRange =
      variable === 'temperature'
        ? { min: Math.floor(lo - 1), max: Math.ceil(hi + 1) }
        : variable === 'soilWetness'
          ? { min: Math.max(0, Math.floor((lo - 0.03) * 100) / 100), max: Math.min(1, Math.ceil((hi + 0.03) * 100) / 100) }
          : { min: 0, max: Math.ceil((hi * 1.15) / 50) * 50 }
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: reducedMotion ? false : { duration: 900, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed.y
              if (v === null || v === undefined) return ''
              const shown = variable === 'temperature' ? `${num(v, 1)} °C` : variable === 'precipitation' ? `${num(v, 0)} mm` : num(v, 2)
              return `${ctx.dataset.label}: ${shown}`
            },
          },
          backgroundColor: tokens['--color-text'],
          titleColor: tokens['--color-surface'],
          bodyColor: tokens['--color-surface'],
          titleFont: { family: tokens['--font-family-sans'] },
          bodyFont: { family: tokens['--font-family-sans'] },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: tokens['--data-grid'] },
          // Every 10 years plus the last year, so 2025 is always labelled.
          ticks: {
            ...tick,
            maxRotation: 0,
            autoSkip: false,
            callback: (_value, index) => {
              const year = years[index]
              const last = index === years.length - 1
              return last || (year % 10 === 0 && years[years.length - 1] - year >= 4) ? String(year) : ''
            },
          },
        },
        y: {
          ...yRange,
          grid: { color: tokens['--data-grid'] },
          border: { display: false },
          ticks: { ...tick, maxTicksLimit: 5 },
        },
      },
    }
  }, [tokens, reducedMotion, variable, values, years, scenario, num])

  const yearSpan = years.length ? `${years[0]}–${years[years.length - 1]}` : '1986–2025'

  return (
    <Card as="article" className="flex h-full flex-col gap-4">
      <header className="flex items-start gap-3">
        <span aria-hidden="true" className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control ${meta.iconClass}`}>
          <Icon size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-snug">{title}</h3>
          <p className="text-sm text-text-muted">
            {t(`chart.${variable}.unit`)} · {yearSpan}
          </p>
        </div>
        <InfoTooltip label={t('chart.about', { name: title.toLowerCase() })}>{t(`chart.${variable}.info`)}</InfoTooltip>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Badge type="historical" />
        {trend && (status === 'ready' || status === 'cached') && (
          <span className="text-sm font-bold tabular-nums text-accent-text">
            {t('chart.trendValue', { value: formatSlope(variable, trend, num, t('chart.perDecade')) })}
            {!trend.significant && <span className="font-normal text-text-muted"> {t('chart.notClear')}</span>}
          </span>
        )}
      </div>

      {conclusion && (status === 'ready' || status === 'cached') && (
        <div className="rounded-control border-l-4 border-selected bg-bg-2 p-3">
          <p className="text-sm font-bold text-accent-text">{t('concl.label')}</p>
          <p className="mt-0.5 text-text">{conclusion}</p>
        </div>
      )}

      {status === 'loading' && <LoadingSkeleton variant="chart" label={t('chart.loading', { name: title.toLowerCase() })} />}

      {status === 'error' && (
        <ErrorState compact onRetry={onRetry}>
          {t('chart.error')}
        </ErrorState>
      )}

      {(status === 'ready' || status === 'cached') && (
        <>
          {status === 'cached' && (
            <p role="status" className="flex items-start gap-2 rounded-control bg-accent-soft p-3 text-sm text-text">
              <DatabaseBackup size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
              {t('climate.cachedNotice')}
            </p>
          )}

          <div ref={chartRef} className="relative h-44 sm:h-52">
            {inView && <Chart
              type="bar"
              data={data as ChartData<'bar', number[], number>}
              options={options as ChartOptions<'bar'>}
              role="img"
              aria-label={`${title}, ${yearSpan}. ${summary}`}
            />}
          </div>

          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted" aria-label={t('chart.legend')}>
            <li className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="h-0.5 w-5" style={{ background: tokens[meta.colorToken], height: meta.form === 'bar' ? 10 : 3 }} />
              {t('chart.eachYear')}
            </li>
            <li className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="w-5 border-t-2 border-dashed border-text" />
              <Term id="trend">{t('chart.trend')}</Term>
            </li>
            {scenarioLabel && (
              <li className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="w-5 border-t-2 border-dotted" style={{ borderColor: tokens['--data-scenario'] }} />
                {scenarioLabel}
              </li>
            )}
          </ul>

          <p className="border-t border-border pt-3 text-text">{summary}</p>
          {recordIndex >= 0 && (
            <p className="flex items-center gap-2 text-sm text-text-muted">
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-pill" style={{ background: tokens['--data-scenario'] }} />
              {variable === 'temperature' ? t('chart.hottest') : variable === 'precipitation' ? t('chart.driest') : t('chart.driestSoil')}: {years[recordIndex]} (
              {variable === 'temperature'
                ? `${num(values[recordIndex], 1)} °C`
                : variable === 'precipitation'
                  ? `${num(values[recordIndex], 0)} mm`
                  : num(values[recordIndex], 2)}
              )
            </p>
          )}
        </>
      )}

      <p className="mt-auto text-sm text-text-muted">{t('chart.source')}</p>
    </Card>
  )
}
