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
  /** Explicit NASA POWER indicators that shaped this recommendation. */
  nasaFactors: Msg[]
  /** Explicit agronomic assumptions and reference rules combined with NASA data. */
  assumptions: Msg[]
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
/** Midpoints of the FAO ranges used here run from 425 mm (peas) to 1200 mm (alfalfa). */
const WATER_LOW = 525
const WATER_HIGH = 700
const LEVEL_RANK: Record<Level, number> = { low: 0, medium: 1, high: 2 }

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
  tempChangeC: number
  tempSlopePerDecade: number
  precipMeanMm: number | null
  precipMinMm: number | null
  soilWetnessMean: number | null
  soilWetnessMin: number | null
}

function contextOf(answers: FarmerAnswers, climate: ClimateData | null): Context {
  const t = climate?.trends.temperature
  const s = climate?.trends.soilWetness
  const p = climate?.trends.precipitation
  const tPts = climate?.series.temperature.points ?? []
  const pPts = climate?.series.precipitation.points ?? []
  const sPts = climate?.series.soilWetness.points ?? []
  const years = tPts.length > 0 ? tPts[tPts.length - 1].year - tPts[0].year : 0
  return {
    rainOnly: answers.irrigation === 'none',
    waterShort: answers.waterLimited === 'often' || answers.irrigation === 'none',
    sandy: answers.soilType === 'light' || answers.soilType === 'stony',
    warming: Boolean(t && t.significant && t.slopePerDecade > 0),
    drying: Boolean((s && s.significant && s.slopePerDecade < 0) || (p && p.significant && p.slopePerDecade < 0)),
    tempChangeC: t ? t.slopePerDecade * (years / 10) : 0,
    tempSlopePerDecade: t?.slopePerDecade ?? 0,
    precipMeanMm: pPts.length ? avg(pPts.map((x) => x.value)) : null,
    precipMinMm: pPts.length ? Math.min(...pPts.map((x) => x.value)) : null,
    soilWetnessMean: sPts.length ? avg(sPts.map((x) => x.value)) : null,
    soilWetnessMin: sPts.length ? Math.min(...sPts.map((x) => x.value)) : null,
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

/**
 * Compares water demand ratings consistently with the displayed waterLevel (Lower / Medium / Higher need).
 * Lower water need (low) is better than higher water need (high).
 */
function compareWater(a: WaterRange | null, b: WaterRange | null): Comparison {
  const la = levelOfWater(a)
  const lb = levelOfWater(b)
  if (!la || !lb) return 'unknown'
  return LEVEL_RANK[la] < LEVEL_RANK[lb] ? 'better' : LEVEL_RANK[la] > LEVEL_RANK[lb] ? 'worse' : 'same'
}

/**
 * Compares soil ratings consistently with the displayed soilLevel (Wears it out / Neutral / Builds it up).
 * Building soil (high) is better than wearing it out (low).
 */
function compareSoil(a: number, b: number): Comparison {
  const la = levelOfSoil(a)
  const lb = levelOfSoil(b)
  return LEVEL_RANK[la] > LEVEL_RANK[lb] ? 'better' : LEVEL_RANK[la] < LEVEL_RANK[lb] ? 'worse' : 'same'
}

function explain(id: PlanId, sequence: CropId[], data: RotationData, ctx: Context, answers: FarmerAnswers, water: WaterRange | null) {
  const legumes = unique(sequence.filter((c) => data.crops[c].legume))
  const thirsty = unique(sequence.filter((c) => (data.crops[c].waterMm?.[1] ?? 0) >= 750))
  const depleting = unique(sequence.filter((c) => data.crops[c].soilEffect.value === 'depletes'))
  const repeated = unique(sequence.filter((c, i) => i > 0 && c === sequence[i - 1] && !data.crops[c].perennial))
  const seq = crops(sequence, 'arrow')
  const why: Msg[] = []
  const benefits: Msg[] = []
  const limitations: Msg[] = []
  const missingInfo: Msg[] = []

  if (id === 'water-saving') {
    if (answers.priority === 'water') why.push({ key: 'why.ws.priority' })
    why.push({ key: 'why.ws.lowWater', params: { seq } })
    if (ctx.waterShort) why.push({ key: ctx.rainOnly ? 'why.ws.rainOnly' : 'why.ws.waterShort' })
    else if (answers.waterLimited === 'sometimes') why.push({ key: 'why.ws.waterSometimes' })
    else if (answers.waterLimited === 'rarely') why.push({ key: 'why.ws.waterRarely' })
    if (ctx.warming) why.push({ key: 'why.ws.warming', params: { trend: { n: ctx.tempChangeC, d: 1, sign: true } } })
    if (ctx.precipMeanMm !== null && water) {
      why.push({
        key: 'why.nasa.precipGap',
        params: { rain: { n: ctx.precipMeanMm, d: 0 }, min: String(water.min), max: String(water.max) },
      })
    }
    benefits.push({ key: 'benefit.ws.lessWater' }, { key: 'benefit.ws.dryYear' })
    limitations.push({ key: 'limit.ws.fewLegumes', params: { seq } })
  } else if (id === 'soil-health') {
    if (answers.priority === 'soil') why.push({ key: 'why.sh.priority' })
    why.push({ key: 'why.sh.legumes', params: { seq, crops: crops(legumes) } }, { key: 'why.sh.roots' })
    if (answers.waterLimited === 'rarely') why.push({ key: 'why.sh.waterRarely' })
    benefits.push({ key: 'benefit.sh.fertilizer' }, { key: 'benefit.sh.pests' })
    limitations.push({ key: 'limit.sh.water' }, { key: 'limit.sh.later', params: { seq } })
    if (ctx.precipMeanMm !== null && water && ctx.precipMeanMm < water.min) {
      limitations.push({
        key: 'limit.nasa.precipShort',
        params: { rain: { n: ctx.precipMeanMm, d: 0 }, min: String(water.min), max: String(water.max) },
      })
    }
  } else if (id === 'economic') {
    if (answers.priority === 'income') why.push({ key: 'why.mc.priority' })
    why.push({ key: 'why.mc.sale', params: { seq } }, { key: 'why.mc.break', params: { seq } })
    limitations.push({ key: 'limit.mc.irrigation' })
    if (ctx.rainOnly) limitations.push({ key: 'limit.mc.rainOnly' })
    if (ctx.precipMeanMm !== null && water && ctx.precipMeanMm < water.min) {
      limitations.push({
        key: 'limit.nasa.precipShort',
        params: { rain: { n: ctx.precipMeanMm, d: 0 }, min: String(water.min), max: String(water.max) },
      })
    }
  } else if (id === 'reference') {
    why.push({ key: 'why.ref.what', params: { seq } }, { key: 'why.ref.notYours' })
    benefits.push({ key: 'benefit.ref.grasses' })
  } else {
    why.push({ key: 'why.cur.what', params: { seq } })
    if (legumes.length > 0) benefits.push({ key: 'benefit.cur.legumes', params: { crops: crops(legumes) } })
    benefits.push({ key: 'benefit.cur.known' })
    if (repeated.length > 0) limitations.push({ key: 'limit.cur.repeat', params: { crops: crops(repeated), seq } })
    if (depleting.length > 0) limitations.push({ key: 'limit.cur.depleting', params: { crops: crops(depleting), seq } })
    if (legumes.length === 0) limitations.push({ key: 'limit.cur.noLegumes', params: { seq } })
    if (thirsty.length > 0 && ctx.waterShort) limitations.push({ key: 'limit.cur.thirsty', params: { crops: crops(thirsty) } })
  }

  // Soil texture specific effects across all plans
  if (id !== 'current' && id !== 'reference') {
    if (ctx.sandy) {
      if (id === 'water-saving') why.push({ key: 'why.soil.sandyFit' })
      if (thirsty.length > 0) limitations.push({ key: 'limit.sandy', params: { crops: crops(thirsty) } })
    } else if (answers.soilType === 'heavy') {
      if (id === 'soil-health') why.push({ key: 'why.soil.heavyFit' })
      else if (id === 'economic') limitations.push({ key: 'limit.soil.heavyRow' })
    } else if (answers.soilType === 'medium') {
      if (id === 'soil-health' || id === 'economic') why.push({ key: 'why.soil.mediumFit' })
    }

    // Irrigation source specific effects
    if (ctx.rainOnly && thirsty.length > 0) {
      limitations.push({ key: 'limit.rainOnlyThirsty', params: { crops: crops(thirsty) } })
    } else if (answers.irrigation === 'pump') {
      if (id === 'water-saving') why.push({ key: 'why.irr.pumpSave' })
      else if (thirsty.length > 0) limitations.push({ key: 'limit.irr.pumpCost', params: { crops: crops(thirsty) } })
    } else if (answers.irrigation === 'canal') {
      if (thirsty.length > 0) limitations.push({ key: 'limit.irr.canalTurn', params: { crops: crops(thirsty) } })
    }

    // Summer water shortage specific effects on non-water-saving plans
    if ((answers.waterLimited === 'often' || answers.waterLimited === 'sometimes') && id === 'soil-health') {
      limitations.unshift({ key: 'limit.sh.alfalfaWaterSupply' })
    } else if (answers.waterLimited === 'often' && id !== 'water-saving') {
      limitations.push({ key: 'limit.wl.often' })
    }
  } else if (id === 'current' && ctx.sandy && thirsty.length > 0) {
    limitations.push({ key: 'limit.sandy', params: { crops: crops(thirsty) } })
  }

  if (ctx.drying && id !== 'current' && id !== 'reference') why.push({ key: 'why.drying' })

  if (answers.soilType === undefined || answers.soilType === 'unknown') missingInfo.push({ key: 'missing.soil' })
  if (answers.irrigation === undefined || answers.irrigation === 'unknown') missingInfo.push({ key: 'missing.irrigation' })
  missingInfo.push({ key: 'missing.income' })
  return { why, benefits, limitations, missingInfo }
}

function weightsFor(answers: FarmerAnswers, ctx: Context, current: PlanResult) {
  const w = { water: 1, soil: 1 }
  // 1. NASA POWER climate indicators
  if (ctx.warming) w.water += Math.max(0.3, ctx.tempChangeC * 0.4)
  if (ctx.drying) w.water += 0.6
  if (ctx.soilWetnessMean !== null) w.water += Math.max(0, 1 - ctx.soilWetnessMean) * 0.4

  // 2. Farmer's current rotation baseline
  if (!answers.currentRotation || answers.currentRotation === 'unknown') {
    // Unknown baseline: slight water caution
    w.water += 0.15
  } else {
    if (current.soilLevel === 'low') w.soil += 0.9
    if (current.waterLevel === 'high') w.water += 0.7
  }

  // 3. Soil texture
  if (ctx.sandy) w.water += 0.8
  else if (answers.soilType === 'heavy') w.soil += 0.7
  else if (answers.soilType === 'medium') w.soil += 0.3

  // 4. Irrigation source
  if (ctx.rainOnly) w.water += 2.5
  else if (answers.irrigation === 'pump') w.water += 0.6
  else if (answers.irrigation === 'canal') w.soil += 0.3

  // 5. Summer water shortage frequency
  if (answers.waterLimited === 'often') w.water += 1.8
  else if (answers.waterLimited === 'sometimes') w.water += 0.5
  else if (answers.waterLimited === 'rarely') w.soil += 0.9

  // 6. Farmer priority
  if (answers.priority === 'water') w.water += 7
  if (answers.priority === 'soil') w.soil += 7
  return w
}

/**
 * Evaluates a rotation's water demand using both its FAO range midpoint (425–1200 mm)
 * and the fraction of that FAO water demand covered by local NASA POWER annual precipitation (PRECTOTCORR).
 */
function waterFitScore(w: WaterRange | null, ctx: Context): number {
  if (!w) return 0.5
  const rangeScore = 1 - Math.min(1, Math.max(0, (w.mid - 425) / (1200 - 425)))
  if (ctx.precipMeanMm === null) return rangeScore
  const precipCoverage = Math.min(1, ctx.precipMeanMm / w.mid)
  return rangeScore * 0.7 + precipCoverage * 0.3
}

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
    return { id, sequence, water, waterLevel: levelOfWater(water), soil, soilLevel: levelOfSoil(soil), ...explain(id, sequence, data, ctx, answers, water) }
  }

  const current = known ? build('current', known) : build('reference', data.reference.sequence)
  const plans = data.strategies.map((s) => {
    const plan = build(s.id, s.sequence)
    plan.vsCurrent = { water: compareWater(plan.water, current.water), soil: compareSoil(plan.soil, current.soil) }
    const cmpParams = {
      plan: { plan: current.id },
      curSeq: crops(current.sequence, 'arrow'),
      seq: crops(plan.sequence, 'arrow'),
      min: String(plan.water?.min ?? 0),
      max: String(plan.water?.max ?? 0),
      curMin: String(current.water?.min ?? 0),
      curMax: String(current.water?.max ?? 0),
    }
    if (plan.vsCurrent.water === 'better') {
      plan.why.push({ key: 'why.cmp.waterBetter', params: cmpParams })
    } else if (plan.vsCurrent.water === 'worse') {
      // Never show "worse on water" without saying why.
      const key = hasRepeat(current.sequence, data)
        ? 'why.worseWater.repeat'
        : plan.vsCurrent.soil === 'better'
          ? 'why.worseWater.soil'
          : 'why.worseWater.other'
      const msg: Msg = { key, params: cmpParams }
      if (plan.id === 'water-saving') plan.why.unshift(msg)
      else plan.limitations.unshift(msg)
    }
    if (plan.vsCurrent.soil === 'better') {
      const planLegumes = unique(plan.sequence.filter((c) => data.crops[c].legume))
      plan.why.push({ key: 'why.cmp.soilBetter', params: { ...cmpParams, legumes: crops(planLegumes) } })
    } else if (plan.vsCurrent.soil === 'worse') {
      const planDepleting = unique(plan.sequence.filter((c) => data.crops[c].soilEffect.value === 'depletes'))
      plan.limitations.push({ key: 'limit.cmp.soilWorse', params: { ...cmpParams, crops: crops(planDepleting) } })
    }
    return plan
  })

  const w = weightsFor(answers, ctx, current)
  const fit = (p: PlanResult) => waterFitScore(p.water, ctx) * w.water + p.soil * w.soil
  plans.sort((a, b) => fit(b) - fit(a))
  // Income cannot be estimated, so "Grow crops to sell" points to the income-focused plan unless the field is rain-only.
  if (answers.priority === 'income' && !ctx.rainOnly) {
    const i = plans.findIndex((p) => p.id === 'economic')
    plans.unshift(...plans.splice(i, 1))
  }
  // On a rain-only field where NASA annual precipitation is below the FAO minimum of high-water rotations, keep water-saving first.
  if (ctx.rainOnly && (ctx.precipMeanMm === null || ctx.precipMeanMm < (plans[0].water?.min ?? 0))) {
    const i = plans.findIndex((p) => p.id === 'water-saving')
    if (i > 0) plans.unshift(...plans.splice(i, 1))
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
        : answers.priority === 'soil' && ctx.rainOnly && best.id === 'water-saving'
          ? { key: 'headline.soilRainOnly', params }
          : answers.priority === 'water' || answers.priority === 'soil'
            ? { key: `headline.${answers.priority}`, params }
            : { key: 'headline.balance', params }

  const id = best.id
  const later = id === 'water-saving' && ctx.waterShort ? `steps.${id}.laterShort` : `steps.${id}.later`
  const basis: Basis[] = ['answers', 'guidance']
  const steps = [
    { label: { key: 'step.thisSeason' }, text: { key: `steps.${id}.thisSeason` }, basis },
    { label: { key: 'step.nextSeason' }, text: { key: `steps.${id}.nextSeason` }, basis },
    { label: { key: 'step.later' }, text: { key: later }, basis: climate ? [...basis, 'nasa' as const] : basis },
  ]

  // Preliminary guidance: cap confidence at 'medium' (no laboratory soil test of the field).
  const confidence: Confidence = unknown <= 2 ? 'medium' : 'low'
  const confidenceReason: Msg =
    unknown === 0 ? { key: 'conf.all' } : { key: unknown === 1 ? 'conf.unknownOne' : 'conf.unknownMany', params: { n: { n: unknown } } }

  const nasaFactors: Msg[] = []
  if (climate && ctx.precipMeanMm !== null && ctx.precipMinMm !== null && ctx.soilWetnessMean !== null) {
    nasaFactors.push(
      {
        key: ctx.warming ? 'nasa.factor.t2mWarming' : 'nasa.factor.t2mFlat',
        params: {
          trend: { n: ctx.tempChangeC, d: 1, sign: true },
          decade: { n: ctx.tempSlopePerDecade, d: 2, sign: true },
        },
      },
      {
        key: 'nasa.factor.prec',
        params: {
          mean: { n: ctx.precipMeanMm, d: 0 },
          min: { n: ctx.precipMinMm, d: 0 },
          planMin: String(best.water?.min ?? 425),
          planMax: String(best.water?.max ?? 613),
        },
      },
      {
        key: ctx.drying ? 'nasa.factor.gwetDrying' : 'nasa.factor.gwetStable',
        params: {
          mean: { n: ctx.soilWetnessMean, d: 2 },
          min: { n: ctx.soilWetnessMin ?? ctx.soilWetnessMean, d: 2 },
        },
      },
    )
  } else {
    nasaFactors.push({ key: 'nasa.factor.unavailable' })
  }

  const assumptions: Msg[] = [
    { key: 'assump.preliminary' },
    { key: 'assump.faoWater' },
    { key: 'assump.faoSoil' },
    { key: currentIsReference ? 'assump.currentRef' : 'assump.currentPattern' },
  ]

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

  return { best, headline, steps, confidence, confidenceReason, nasaFactors, assumptions, plans, current, currentIsReference, drivers }
}
