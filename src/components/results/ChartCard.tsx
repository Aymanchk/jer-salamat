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
  title: string
  unit: string
  icon: LucideIcon
  form: 'line' | 'bar' | 'area'
  colorToken: '--data-temp' | '--data-precip' | '--data-soil'
  softToken: '--data-temp-soft' | '--data-precip-soft' | '--data-soil-soft'
  iconClass: string
  info: string
}

/** Each variable has its own colour AND its own chart form. */
const VARIABLES: Record<ClimateVariable, VariableMeta> = {
  temperature: {
    title: 'Air temperature',
    unit: 'Yearly mean, °C',
    icon: Thermometer,
    form: 'line',
    colorToken: '--data-temp',
    softToken: '--data-temp-soft',
    iconClass: 'bg-data-temp-soft text-data-temp',
    info: 'Average air temperature 2 metres above the ground, for the area around your field.',
  },
  precipitation: {
    title: 'Rain and snow',
    unit: 'Yearly total, mm',
    icon: CloudRain,
    form: 'bar',
    colorToken: '--data-precip',
    softToken: '--data-precip-soft',
    iconClass: 'bg-data-precip-soft text-data-precip',
    info: 'All rain and snow that fell in a year, for the area around your field.',
  },
  soilWetness: {
    title: 'Root zone soil wetness',
    unit: 'Yearly mean, 0 (dry) to 1 (wet)',
    icon: Droplets,
    form: 'area',
    colorToken: '--data-soil',
    softToken: '--data-soil-soft',
    iconClass: 'bg-data-soil-soft text-data-soil',
    info: 'How wet the soil is where roots grow, from 0 (fully dry) to 1 (fully wet).',
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
  /** Hypothetical overlay: added to the trend line (the "what if +2°C" toggle). */
  scenario?: { label: string; offset: number }
  onRetry?: () => void
}

function formatSlope(variable: ClimateVariable, trend: ClimateTrend): string {
  const v = trend.slopePerDecade
  const sign = v > 0 ? '+' : v < 0 ? '−' : ''
  const abs = Math.abs(v)
  if (variable === 'temperature') return `${sign}${abs.toFixed(2)} °C per decade`
  if (variable === 'precipitation') return `${sign}${abs.toFixed(0)} mm per decade`
  return `${sign}${abs.toFixed(3)} per decade`
}

export function ChartCard({ variable, status, points, trend, summary, scenario, onRetry }: ChartCardProps) {
  const meta = VARIABLES[variable]
  const tokens = useTokens(TOKEN_NAMES)
  const reducedMotion = useReducedMotion()
  const Icon = meta.icon
  const chartRef = useRef<HTMLDivElement>(null)
  // Charts draw in when they scroll into view.
  const inView = useInView(chartRef, { once: true, margin: '0px 0px 160px 0px' })
  const years = points.map((p) => p.year)
  const values = points.map((p) => p.value)
  const scenarioLabel = scenario?.label

  const data = useMemo<ChartData<'bar' | 'line', number[], number>>(() => {
    const color = tokens[meta.colorToken]
    const soft = tokens[meta.softToken]
    const trend = trendLine(points)
    const datasets: ChartData<'bar' | 'line', number[], number>['datasets'] = [
      {
        type: 'line',
        label: 'Trend',
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
        label: meta.title,
        data: values,
        backgroundColor: color,
        borderRadius: 2,
        categoryPercentage: 0.8,
        barPercentage: 0.85,
        order: 1,
      })
    } else {
      datasets.push({
        type: 'line',
        label: meta.title,
        data: values,
        borderColor: color,
        backgroundColor: soft,
        fill: meta.form === 'area' ? 'start' : false,
        borderWidth: 2.5,
        tension: 0.25,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: color,
        order: 1,
      })
    }
    return { labels: years, datasets }
  }, [tokens, meta, values, years, points, scenario])

  const options = useMemo<ChartOptions<'bar' | 'line'>>(() => {
    const tick = { color: tokens['--color-text-muted'], font: { family: tokens['--font-family-sans'], size: 13 } }
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
              const shown = variable === 'temperature' ? `${v.toFixed(1)} °C` : variable === 'precipitation' ? `${v.toFixed(0)} mm` : v.toFixed(2)
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
          ticks: { ...tick, maxRotation: 0, autoSkip: true, maxTicksLimit: 5 },
        },
        y: {
          grid: { color: tokens['--data-grid'] },
          border: { display: false },
          ticks: { ...tick, maxTicksLimit: 5 },
        },
      },
    }
  }, [tokens, reducedMotion, variable])

  const yearSpan = years.length ? `${years[0]}–${years[years.length - 1]}` : '1986–2025'

  return (
    <Card as="article" className="flex h-full flex-col gap-4">
      <header className="flex items-start gap-3">
        <span aria-hidden="true" className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control ${meta.iconClass}`}>
          <Icon size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-snug">
            {variable === 'soilWetness' ? <Term id="rootZone" align="right" /> : meta.title}
          </h3>
          <p className="text-sm text-text-muted">
            {meta.unit} · {yearSpan}
          </p>
        </div>
        <InfoTooltip label={`About ${meta.title.toLowerCase()}`}>{meta.info}</InfoTooltip>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Badge type="historical" />
        {trend && (status === 'ready' || status === 'cached') && (
          <span className="text-sm font-bold tabular-nums text-accent-text">
            Trend: {formatSlope(variable, trend)}
            {!trend.significant && <span className="font-normal text-text-muted"> (not clear)</span>}
          </span>
        )}
      </div>

      {status === 'loading' && <LoadingSkeleton variant="chart" label={`Loading ${meta.title.toLowerCase()}`} />}

      {status === 'error' && (
        <ErrorState compact onRetry={onRetry}>
          We could not load this chart. Check your connection and try again.
        </ErrorState>
      )}

      {(status === 'ready' || status === 'cached') && (
        <>
          {status === 'cached' && (
            <p role="status" className="flex items-start gap-2 rounded-control bg-accent-soft p-3 text-sm text-text">
              <DatabaseBackup size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
              Live NASA data is not reachable right now. Showing saved NASA POWER data for this area.
            </p>
          )}

          <div ref={chartRef} className="relative h-44 sm:h-52">
            {inView && <Chart
              type="bar"
              data={data as ChartData<'bar', number[], number>}
              options={options as ChartOptions<'bar'>}
              role="img"
              aria-label={`${meta.title}, ${yearSpan}. ${summary}`}
            />}
          </div>

          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted" aria-label="Chart legend">
            <li className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="h-0.5 w-5" style={{ background: tokens[meta.colorToken], height: meta.form === 'bar' ? 10 : 3 }} />
              Each year
            </li>
            <li className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="w-5 border-t-2 border-dashed border-text" />
              <Term id="trend">Trend</Term>
            </li>
            {scenarioLabel && (
              <li className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="w-5 border-t-2 border-dotted" style={{ borderColor: tokens['--data-scenario'] }} />
                {scenarioLabel}
              </li>
            )}
          </ul>

          <p className="border-t border-border pt-3 text-text">{summary}</p>
        </>
      )}

      <p className="mt-auto text-sm text-text-muted">Data: NASA POWER</p>
    </Card>
  )
}
