/**
 * Rules-based rotation engine. Framework-free (no React).
 *
 * Inputs and their sources:
 * - the farmer's answers,
 * - NASA POWER climate trends (src/core/climate.ts),
 * - crop reference data in src/data/rotations.json: FAO general water-need
 *   ranges and FAO rotation guidance. These are reference values, never
 *   computed from NASA data, and never turned into field irrigation numbers.
 * Income is never estimated: there is no verified local yield, price or cost data.
 *
 * Every output sentence is a Msg (a translation key with parameters).
 */
import type { ClimateData } from './climate'
import type { CropId, FarmerAnswers, Msg, QuestionId, StrategyId } from './types'

export type Level = 'low' | 'medium' | 'high'
export type SoilLevel = 'depletes' | 'neutral' | 'builds'

export interface CropData {
  /** FAO general reference range, mm per growing period. null = no FAO range. */
  waterMm: [number, number] | null
  waterSource: string
  waterNote?: string
  soilEffect: { value: SoilLevel; source: string }
  legume?: boolean
  perennial?: boolean
}

export interface RotationData {
  crops: Record<CropId, CropData>
  strategies: Array<{ id: StrategyId; sequence: CropId[] }>
  currentRotations: Record<string, CropId[]>
  reference: { id: string; source: string; sequence: CropId[] }
}

export type PlanId = StrategyId | 'current' | 'reference'
export type Comparison = 'better' | 'same' | 'worse' | 'unknown'
export type Confidence = 'high' | 'medium' | 'low'
/** Where a statement comes from. */
export type Basis = 'answers' | 'nasa' | 'guidance'

export interface WaterRange {
  /** Average of the FAO minimums and maximums over the crops that have a range. */
  min: number
  max: number
  mid: number
  /** Crops in the sequence without an FAO range (not counted). */
  missing: CropId[]
}

export interface PlanResult {
  id: PlanId
  sequence: CropId[]
  water: WaterRange | null
  waterLevel: Level | null
  soil: number
  soilLevel: Level
  vsCurrent?: { water: Comparison; soil: Comparison }
  why: Msg[]
  benefits: Msg[]
  limitations: Msg[]
  missingInfo: Msg[]
}

export interface Driver {
  id: QuestionId
  /** "plan": choosing differently changes the recommended plan. "matched": the top plan already matched this priority. "details": it changes the reasons or comparison. */
  effect: 'plan' | 'matched' | 'details' | 'none' | 'unanswered'
}

export interface Recommendation {
  best: PlanResult
  headline: Msg
  steps: { label: Msg; text: Msg; basis: Basis[] }[]
  confidence: Confidence
  confidenceReason: Msg
  /** The three alternatives, best fit first. */
  plans: PlanResult[]
  /** The farmer's rotation, or the regional reference when they did not say. */
  current: PlanResult
  currentIsReference: boolean
  /** Which answers shaped this plan. */
  drivers: Driver[]
}

const SOIL_VALUE: Record<SoilLevel, number> = { depletes: 0, neutral: 0.5, builds: 1 }
const REPEAT_PENALTY = 0.15
const SOIL_BAND = 0.15
/** Water ranges closer than 5% count as "same". */
const WATER_BAND = 0.05
/** Midpoints of the FAO ranges used here run from 425 mm (peas) to 1200 mm (alfalfa). */
const WATER_LOW = 525
const WATER_HIGH = 700

const QUESTION_IDS: QuestionId[] = ['currentRotation', 'soilType', 'irrigation', 'waterLimited', 'priority']

const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
const crops = (ids: CropId[], sep: 'arrow' | 'and' = 'and') => ({ crops: ids, sep })
const unique = <T,>(xs: T[]) => [...new Set(xs)]

interface Context {
  rainOnly: boolean
  waterShort: boolean
  sandy: boolean
  warming: boolean
  drying: boolean
}

function contextOf(answers: FarmerAnswers, climate: ClimateData | null): Context {
  const t = climate?.trends.temperature
  const s = climate?.trends.soilWetness
  const p = climate?.trends.precipitation
  return {
    rainOnly: answers.irrigation === 'none',
    waterShort: answers.waterLimited === 'often' || answers.irrigation === 'none',
    sandy: answers.soilType === 'light' || answers.soilType === 'stony',
    warming: Boolean(t && t.significant && t.slopePerDecade > 0.1),
    drying: Boolean((s && s.significant && s.slopePerDecade < 0) || (p && p.significant && p.slopePerDecade < 0)),
  }
}

function waterOf(sequence: CropId[], data: RotationData): WaterRange | null {
  const known = sequence.filter((c) => data.crops[c].waterMm)
  const missing = unique(sequence.filter((c) => !data.crops[c].waterMm))
  if (known.length === 0) return null
  const min = avg(known.map((c) => data.crops[c].waterMm![0]))
  const max = avg(known.map((c) => data.crops[c].waterMm![1]))
  return { min: Math.round(min), max: Math.round(max), mid: (min + max) / 2, missing }
}

function hasRepeat(sequence: CropId[], data: RotationData): boolean {
  return sequence.some((c, i) => i > 0 && c === sequence[i - 1] && !data.crops[c].perennial)
}

function soilOf(sequence: CropId[], data: RotationData): number {
  let soil = avg(sequence.map((c) => SOIL_VALUE[data.crops[c].soilEffect.value]))
  for (let i = 1; i < sequence.length; i++) {
    if (sequence[i] === sequence[i - 1] && !data.crops[sequence[i]].perennial) soil -= REPEAT_PENALTY
  }
  return Math.max(0, Math.min(1, soil))
}

const levelOfSoil = (s: number): Level => (s < 0.34 ? 'low' : s < 0.67 ? 'medium' : 'high')
const levelOfWater = (w: WaterRange | null): Level | null => (!w ? null : w.mid < WATER_LOW ? 'low' : w.mid <= WATER_HIGH ? 'medium' : 'high')

function compareWater(a: WaterRange | null, b: WaterRange | null): Comparison {
  if (!a || !b) return 'unknown'
  const diff = (a.mid - b.mid) / b.mid
  return diff < -WATER_BAND ? 'better' : diff > WATER_BAND ? 'worse' : 'same'
}
function compareSoil(a: number, b: number): Comparison {
  return a - b > SOIL_BAND ? 'better' : b - a > SOIL_BAND ? 'worse' : 'same'
}

function explain(id: PlanId, sequence: CropId[], data: RotationData, ctx: Context, answers: FarmerAnswers) {
  const legumes = unique(sequence.filter((c) => data.crops[c].legume))
  const thirsty = unique(sequence.filter((c) => (data.crops[c].waterMm?.[1] ?? 0) >= 750))
  const why: Msg[] = []
  const benefits: Msg[] = []
  const limitations: Msg[] = []
  const missingInfo: Msg[] = []

  if (id === 'water-saving') {
    if (answers.priority === 'water') why.push({ key: 'why.ws.priority' })
    why.push({ key: 'why.ws.lowWater' })
    if (ctx.waterShort) why.push({ key: ctx.rainOnly ? 'why.ws.rainOnly' : 'why.ws.waterShort' })
    if (ctx.warming) why.push({ key: 'why.ws.warming' })
    benefits.push({ key: 'benefit.ws.lessWater' }, { key: 'benefit.ws.dryYear' })
    limitations.push({ key: 'limit.ws.fewLegumes' })
  } else if (id === 'soil-health') {
    if (answers.priority === 'soil') why.push({ key: 'why.sh.priority' })
    why.push({ key: 'why.sh.legumes', params: { crops: crops(legumes) } }, { key: 'why.sh.roots' })
    benefits.push({ key: 'benefit.sh.fertilizer' }, { key: 'benefit.sh.pests' })
    limitations.push({ key: 'limit.sh.water' }, { key: 'limit.sh.later' })
  } else if (id === 'economic') {
    if (answers.priority === 'income') why.push({ key: 'why.mc.priority' })
    why.push({ key: 'why.mc.sale' }, { key: 'why.mc.break' })
    limitations.push({ key: 'limit.mc.irrigation' })
    if (ctx.rainOnly) limitations.push({ key: 'limit.mc.rainOnly' })
  } else if (id === 'reference') {
    why.push({ key: 'why.ref.what' }, { key: 'why.ref.notYours' })
    benefits.push({ key: 'benefit.ref.grasses' })
  } else {
    why.push({ key: 'why.cur.what', params: { seq: crops(sequence, 'arrow') } })
    if (hasRepeat(sequence, data)) limitations.push({ key: 'limit.cur.repeat' })
    if (thirsty.length > 0 && ctx.waterShort) limitations.push({ key: 'limit.cur.thirsty', params: { crops: crops(thirsty) } })
    benefits.push({ key: 'benefit.cur.known' })
  }

  if (id !== 'current' && id !== 'reference' && thirsty.length > 0 && ctx.rainOnly) {
    limitations.push({ key: 'limit.rainOnlyThirsty', params: { crops: crops(thirsty) } })
  }
  if (ctx.sandy && thirsty.length > 0 && id !== 'reference') limitations.push({ key: 'limit.sandy', params: { crops: crops(thirsty) } })
  if (ctx.drying && id !== 'current' && id !== 'reference') why.push({ key: 'why.drying' })

  if (answers.soilType === undefined || answers.soilType === 'unknown') missingInfo.push({ key: 'missing.soil' })
  if (answers.irrigation === undefined || answers.irrigation === 'unknown') missingInfo.push({ key: 'missing.irrigation' })
  missingInfo.push({ key: 'missing.income' })
  return { why, benefits, limitations, missingInfo }
}

function weightsFor(answers: FarmerAnswers, ctx: Context) {
  const w = { water: 1, soil: 1 }
  if (ctx.waterShort) w.water += 1.5
  if (ctx.sandy) w.water += 0.5
  if (ctx.warming || ctx.drying) w.water += 0.5
  if (answers.priority === 'water') w.water += 5
  if (answers.priority === 'soil') w.soil += 5
  return w
}

/** Higher = needs less water. Midpoints run from about 425 to 1200 mm. */
const waterScore = (w: WaterRange | null) => (w ? 1 - Math.min(1, Math.max(0, (w.mid - 425) / (1200 - 425))) : 0.5)

function unknownCount(answers: FarmerAnswers): number {
  return QUESTION_IDS.filter((id) => answers[id] === undefined || answers[id] === 'unknown').length
}

function core(answers: FarmerAnswers, climate: ClimateData | null, data: RotationData) {
  const ctx = contextOf(answers, climate)
  const known = answers.currentRotation && answers.currentRotation !== 'unknown' ? data.currentRotations[answers.currentRotation] : undefined
  const currentIsReference = !known

  const build = (id: PlanId, sequence: CropId[]): PlanResult => {
    const water = waterOf(sequence, data)
    const soil = soilOf(sequence, data)
    return { id, sequence, water, waterLevel: levelOfWater(water), soil, soilLevel: levelOfSoil(soil), ...explain(id, sequence, data, ctx, answers) }
  }

  const current = known ? build('current', known) : build('reference', data.reference.sequence)
  const plans = data.strategies.map((s) => {
    const plan = build(s.id, s.sequence)
    plan.vsCurrent = { water: compareWater(plan.water, current.water), soil: compareSoil(plan.soil, current.soil) }
    // Never show "worse on water" without saying why.
    if (plan.vsCurrent.water === 'worse') {
      const key = hasRepeat(current.sequence, data)
        ? 'why.worseWater.repeat'
        : plan.vsCurrent.soil === 'better'
          ? 'why.worseWater.soil'
          : 'why.worseWater.other'
      const msg: Msg = { key, params: { plan: { plan: current.id } } }
      if (plan.id === 'water-saving') plan.why.unshift(msg)
      else plan.limitations.unshift(msg)
    }
    return plan
  })

  const w = weightsFor(answers, ctx)
  const fit = (p: PlanResult) => waterScore(p.water) * w.water + p.soil * w.soil
  plans.sort((a, b) => fit(b) - fit(a))
  // Income cannot be estimated, so "Earn more" points to the market-crops plan with a clear note.
  if (answers.priority === 'income' && !ctx.rainOnly) {
    const i = plans.findIndex((p) => p.id === 'economic')
    plans.unshift(...plans.splice(i, 1))
  }
  const best = plans[0]
  return { ctx, best, plans, current, currentIsReference }
}

export function recommend(answers: FarmerAnswers, climate: ClimateData | null, data: RotationData): Recommendation {
  const result = core(answers, climate, data)
  const { ctx, best, plans, current, currentIsReference } = result
  const unknown = unknownCount(answers)
  const params = { plan: { plan: best.id }, seq: crops(best.sequence, 'arrow') }
  const headline: Msg =
    unknown >= 3
      ? { key: 'headline.needMore', params }
      : answers.priority === 'income'
        ? { key: ctx.rainOnly ? 'headline.incomeRainOnly' : 'headline.income', params }
        : answers.priority === 'water' || answers.priority === 'soil'
          ? { key: `headline.${answers.priority}`, params }
          : { key: 'headline.balance', params }

  const id = best.id
  const later = id === 'water-saving' && ctx.waterShort ? `steps.${id}.laterShort` : `steps.${id}.later`
  const basis: Basis[] = ['answers', 'guidance']
  const steps = [
    { label: { key: 'step.thisSeason' }, text: { key: `steps.${id}.thisSeason` }, basis },
    { label: { key: 'step.nextSeason' }, text: { key: `steps.${id}.nextSeason` }, basis },
    { label: { key: 'step.later' }, text: { key: later }, basis: ctx.warming || ctx.drying ? [...basis, 'nasa' as const] : basis },
  ]

  const confidence: Confidence = unknown === 0 ? 'high' : unknown <= 2 ? 'medium' : 'low'
  const confidenceReason: Msg =
    unknown === 0 ? { key: 'conf.all' } : { key: unknown === 1 ? 'conf.unknownOne' : 'conf.unknownMany', params: { n: { n: unknown } } }

  // Which answers shaped the plan: re-run without each answer and compare.
  const fingerprint = (r: ReturnType<typeof core>) =>
    JSON.stringify([r.plans.map((p) => [p.id, p.vsCurrent, p.why, p.limitations]), r.current.id, r.current.sequence])
  const base = fingerprint(result)
  const drivers: Driver[] = QUESTION_IDS.map((q) => {
    if (answers[q] === undefined || answers[q] === 'unknown') return { id: q, effect: 'unanswered' }
    const alt = core({ ...answers, [q]: 'unknown' }, climate, data)
    if (alt.best.id !== best.id) return { id: q, effect: 'plan' }
    if (q === 'priority') {
      const matchesPriority =
        (answers.priority === 'water' && best.id === 'water-saving') ||
        (answers.priority === 'soil' && best.id === 'soil-health') ||
        (answers.priority === 'income' && best.id === 'economic')
      if (matchesPriority) return { id: q, effect: 'matched' }
    }
    return { id: q, effect: fingerprint(alt) !== base ? 'details' : 'none' }
  })

  return { best, headline, steps, confidence, confidenceReason, plans, current, currentIsReference, drivers }
}
