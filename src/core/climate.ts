/**
 * NASA POWER client and climate statistics. Framework-free (no React).
 *
 * Source: NASA POWER monthly point API, community AG.
 * T2M (°C), PRECTOTCORR (mm/day), GWETROOT (0–1).
 */
import type { ClimatePoint, ClimateSeries, ClimateTrend, ClimateVariable, FieldLocation, Msg } from './types'

export const YEAR_START = 1986
export const YEAR_END = 2025

const API = 'https://power.larc.nasa.gov/api/temporal/monthly/point'
const PARAMS: Record<ClimateVariable, string> = {
  temperature: 'T2M',
  precipitation: 'PRECTOTCORR',
  soilWetness: 'GWETROOT',
}
const UNITS: Record<ClimateVariable, string> = {
  temperature: '°C',
  precipitation: 'mm',
  soilWetness: '0–1',
}
const FILL = -999

export interface PowerResponse {
  properties: { parameter: Record<string, Record<string, number>> }
}

export interface DemoPoint extends FieldLocation {
  id: string
  name: string
}

export interface ClimateData {
  series: Record<ClimateVariable, ClimateSeries>
  trends: Record<ClimateVariable, ClimateTrend>
  /** True when the live API failed and cached demo data is shown. */
  cached: boolean
  /** Which cached point was used, when cached. */
  cachedFrom?: string
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Monthly values → one value per year. Temperature and soil: day-weighted mean. Precipitation: yearly total in mm. */
export function toYearly(monthly: Record<string, number>, variable: ClimateVariable): ClimatePoint[] {
  const byYear = new Map<number, Array<{ month: number; value: number }>>()
  for (const [key, value] of Object.entries(monthly)) {
    const year = Number(key.slice(0, 4))
    const month = Number(key.slice(4))
    if (month < 1 || month > 12 || value === FILL || !Number.isFinite(value)) continue
    if (year < YEAR_START || year > YEAR_END) continue
    const list = byYear.get(year) ?? []
    list.push({ month, value })
    byYear.set(year, list)
  }
  const points: ClimatePoint[] = []
  for (const [year, months] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    if (months.length < 12) continue // skip incomplete years
    const value =
      variable === 'precipitation'
        ? months.reduce((sum, m) => sum + m.value * daysInMonth(year, m.month), 0)
        : // Day-weighted mean, the same way NASA POWER computes its annual value.
          months.reduce((sum, m) => sum + m.value * daysInMonth(year, m.month), 0) /
          months.reduce((sum, m) => sum + daysInMonth(year, m.month), 0)
    points.push({ year, value: Math.round(value * 1000) / 1000 })
  }
  return points
}

/** Ordinary least squares on (year, value). Significance: |t| > 2.02 (about p < 0.05 for 40 years). */
export function linearTrend(points: ClimatePoint[]): { slope: number; intercept: number; significant: boolean } {
  const n = points.length
  if (n < 3) return { slope: 0, intercept: points[0]?.value ?? 0, significant: false }
  const meanX = points.reduce((s, p) => s + p.year, 0) / n
  const meanY = points.reduce((s, p) => s + p.value, 0) / n
  let sxx = 0
  let sxy = 0
  for (const p of points) {
    sxx += (p.year - meanX) ** 2
    sxy += (p.year - meanX) * (p.value - meanY)
  }
  const slope = sxy / sxx
  const intercept = meanY - slope * meanX
  const residual = points.reduce((s, p) => s + (p.value - (intercept + slope * p.year)) ** 2, 0)
  const se = Math.sqrt(residual / (n - 2) / sxx)
  const t = se === 0 ? 0 : Math.abs(slope / se)
  return { slope, intercept, significant: t > 2.02 }
}

export function trendLine(points: ClimatePoint[]): number[] {
  const { slope, intercept } = linearTrend(points)
  return points.map((p) => intercept + slope * p.year)
}

export function parsePower(json: PowerResponse, cached: boolean, cachedFrom?: string): ClimateData {
  const variables: ClimateVariable[] = ['temperature', 'precipitation', 'soilWetness']
  const series = {} as Record<ClimateVariable, ClimateSeries>
  const trends = {} as Record<ClimateVariable, ClimateTrend>
  for (const variable of variables) {
    const monthly = json.properties.parameter[PARAMS[variable]] ?? {}
    const points = toYearly(monthly, variable)
    series[variable] = { variable, unit: UNITS[variable], points, source: 'nasa-power', cached }
    const { slope, significant } = linearTrend(points)
    trends[variable] = { variable, slopePerDecade: slope * 10, significant }
  }
  return { series, trends, cached, cachedFrom }
}

/** NASA POWER cells are 0.5° × 0.625°. A demo cache can stand in for points in the same cell. */
function nearestDemo(location: FieldLocation, demos: DemoPoint[]): DemoPoint | null {
  let best: DemoPoint | null = null
  let bestDist = Infinity
  for (const d of demos) {
    const dLat = Math.abs(d.lat - location.lat)
    const dLon = Math.abs(d.lon - location.lon)
    if (dLat > 0.25 || dLon > 0.3125) continue
    const dist = dLat ** 2 + dLon ** 2
    if (dist < bestDist) {
      best = d
      bestDist = dist
    }
  }
  return best
}

async function fetchJson(url: string, timeoutMs: number): Promise<PowerResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as PowerResponse
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Loads 1986–2025 climate for a point.
 * Tries the live NASA POWER API first; if it is slow or fails, uses the cached
 * JSON of a demo point in the same NASA grid cell. Throws if neither works.
 */
export async function loadClimate(
  location: FieldLocation,
  demos: DemoPoint[],
  options: { timeoutMs?: number; cacheBase?: string } = {},
): Promise<ClimateData> {
  const { timeoutMs = 12000, cacheBase = '/data' } = options
  const lat = location.lat.toFixed(4)
  const lon = location.lon.toFixed(4)
  const url =
    `${API}?parameters=T2M,PRECTOTCORR,GWETROOT&community=AG` +
    `&longitude=${lon}&latitude=${lat}&start=${YEAR_START}&end=${YEAR_END}&format=JSON`

  // Demo points load from the cache first: instant and reliable on stage.
  const demo = nearestDemo(location, demos)
  const exactDemo = demo && Math.abs(demo.lat - location.lat) < 1e-4 && Math.abs(demo.lon - location.lon) < 1e-4
  if (exactDemo) {
    try {
      return parsePower(await fetchJson(`${cacheBase}/${demo.id}.json`, 5000), false)
    } catch {
      // fall through to the live API
    }
  }

  try {
    return parsePower(await fetchJson(url, timeoutMs), false)
  } catch (liveError) {
    if (!demo) throw liveError
    const json = await fetchJson(`${cacheBase}/${demo.id}.json`, 5000)
    return parsePower(json, true, demo.name)
  }
}

/* ---------- Plain-language takeaways ---------- */

export interface Takeaway {
  variable: ClimateVariable | 'record'
  msg: Msg
  direction: 'up' | 'down' | 'flat'
}

/** Two ways to state the temperature change, so every number on screen can show its method. */
export function temperatureChange(data: ClimateData): { trend: number; decades: number; firstSpan: string; lastSpan: string } {
  const t = data.series.temperature.points
  const years = t.length > 0 ? t[t.length - 1].year - t[0].year : 0
  return {
    trend: data.trends.temperature.slopePerDecade * (years / 10),
    decades: last10(t) - first10(t),
    firstSpan: t.length ? `${t[0].year}–${t[Math.min(9, t.length - 1)].year}` : '',
    lastSpan: t.length ? `${t[Math.max(0, t.length - 10)].year}–${t[t.length - 1].year}` : '',
  }
}

/** Hottest and driest years in the record. */
export function records(data: ClimateData): { hottest: { year: number; value: number }; driest: { year: number; value: number } } | null {
  const t = data.series.temperature.points
  const p = data.series.precipitation.points
  if (!t.length || !p.length) return null
  const hottest = t.reduce((a, b) => (b.value > a.value ? b : a))
  const driest = p.reduce((a, b) => (b.value < a.value ? b : a))
  return { hottest, driest }
}

function first10(points: ClimatePoint[]): number {
  const slice = points.slice(0, 10)
  return slice.reduce((s, p) => s + p.value, 0) / slice.length
}
function last10(points: ClimatePoint[]): number {
  const slice = points.slice(-10)
  return slice.reduce((s, p) => s + p.value, 0) / slice.length
}

/** Short points for farmers: what changed in 40 years. Each is a translation key with numbers. */
export function takeaways(data: ClimateData): Takeaway[] {
  const out: Takeaway[] = []
  const t = data.series.temperature.points
  const p = data.series.precipitation.points
  const s = data.series.soilWetness.points
  if (!t.length || !p.length || !s.length) return out

  const change = temperatureChange(data)
  if (data.trends.temperature.significant && Math.abs(change.trend) >= 0.3) {
    const up = change.trend > 0
    out.push({
      variable: 'temperature',
      direction: up ? 'up' : 'down',
      msg: {
        key: up ? 'tk.temp.up' : 'tk.temp.down',
        params: {
          trend: { n: change.trend, d: 1, sign: true },
          decades: { n: change.decades, d: 2, sign: true },
          first: change.firstSpan,
          last: change.lastSpan,
        },
      },
    })
  } else {
    out.push({ variable: 'temperature', direction: 'flat', msg: { key: 'tk.temp.flat' } })
  }

  const pBefore = first10(p)
  const pAfter = last10(p)
  const pPct = ((pAfter - pBefore) / pBefore) * 100
  if (data.trends.precipitation.significant && Math.abs(pPct) >= 5) {
    out.push({
      variable: 'precipitation',
      direction: pPct > 0 ? 'up' : 'down',
      msg: { key: pPct > 0 ? 'tk.precip.up' : 'tk.precip.down', params: { pct: { n: Math.abs(pPct), d: 0 } } },
    })
  } else {
    out.push({
      variable: 'precipitation',
      direction: 'flat',
      msg: {
        key: 'tk.precip.flat',
        params: { min: { n: Math.min(...p.map((x) => x.value)), d: 0 }, max: { n: Math.max(...p.map((x) => x.value)), d: 0 } },
      },
    })
  }

  const sBefore = first10(s)
  const sAfter = last10(s)
  if (data.trends.soilWetness.significant && Math.abs(sAfter - sBefore) >= 0.01) {
    out.push({ variable: 'soilWetness', direction: sAfter > sBefore ? 'up' : 'down', msg: { key: sAfter > sBefore ? 'tk.soil.up' : 'tk.soil.down' } })
  } else {
    out.push({ variable: 'soilWetness', direction: 'flat', msg: { key: 'tk.soil.flat' } })
  }

  const rec = records(data)
  if (rec) {
    const years = { n: t.length }
    out.push({
      variable: 'record',
      direction: 'up',
      msg:
        rec.hottest.year === rec.driest.year
          ? { key: 'tk.record.same', params: { year: String(rec.hottest.year), t: { n: rec.hottest.value, d: 2 }, p: { n: rec.driest.value, d: 0 }, years } }
          : {
              key: 'tk.record.diff',
              params: {
                hotYear: String(rec.hottest.year),
                t: { n: rec.hottest.value, d: 2 },
                dryYear: String(rec.driest.year),
                p: { n: rec.driest.value, d: 0 },
                years,
              },
            },
    })
  }
  return out
}
