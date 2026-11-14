/**
 * Rules-based rotation engine. Framework-free (no React).
 *
 * Scores come from qualitative crop levels in src/data/rotations.json
 * (PRELIMINARY until sourced). The UI shows words (better / same / worse,
 * low / medium / high), never these internal numbers.
 */
import type { ClimateData } from './climate'
import type { CropId, FarmerAnswers, StrategyId, StrategyScores } from './types'

export type Level = 'low' | 'medium' | 'high'
export type SoilLevel = 'depletes' | 'neutral' | 'builds'

export interface Sourced<T> {
  value: T
  source: string
  preliminary: boolean
}

export interface CropData {
  label: string
  waterNeed: Sourced<Level>
  soilEffect: Sourced<SoilLevel>
  income: Sourced<Level>
  perennial?: boolean
}

export interface StrategyData {
  id: StrategyId
  sequence: CropId[]
  steps: { thisSeason: string; nextSeason: string; later: string }
}

export interface RotationData {
  crops: Record<CropId, CropData>
  strategies: StrategyData[]
  currentRotations: Record<string, { label: string; sequence: CropId[] }>
  assumedCurrent: string
}

export type PlanId = StrategyId | 'current'
export type Comparison = 'better' | 'same' | 'worse'
export type Confidence = 'High' | 'Medium' | 'Low'

export interface PlanResult {
  id: PlanId
  sequence: CropId[]
  scores: StrategyScores
  /** Word labels for the scores. */
  levels: { water: Level; soil: Level; economy: Level }
  /** Versus the farmer's current rotation. Undefined for the current plan itself. */
  vsCurrent?: { water: Comparison; soil: Comparison; economy: Comparison }
  why: string[]
  benefits: string[]
  limitations: string[]
  missingInfo: string[]
  preliminary: boolean
}

export interface Recommendation {
  best: PlanResult
  /** One sentence that names the plan and the reason. */
  headline: string
  steps: { label: string; text: string }[]
  confidence: Confidence
  confidenceReason: string
  plans: PlanResult[]
  current: PlanResult
  /** True when the farmer chose "I don't know" for the current rotation. */
  currentAssumed: boolean
}

const LEVEL_VALUE: Record<Level, number> = { low: 0, medium: 0.5, high: 1 }
const SOIL_VALUE: Record<SoilLevel, number> = { depletes: 0, neutral: 0.5, builds: 1 }
const REPEAT_PENALTY = 0.15
const SAME_BAND = 0.15

const TITLES: Record<PlanId, string> = {
  'water-saving': 'Water saving',
  'soil-health': 'Soil health',
  economic: 'Higher income',
  current: 'Your current rotation',
}

export function planTitle(id: PlanId): string {
  return TITLES[id]
}

function toLevel(score: number): Level {
  return score < 0.34 ? 'low' : score < 0.67 ? 'medium' : 'high'
}

function compare(a: number, b: number): Comparison {
  return a - b > SAME_BAND ? 'better' : b - a > SAME_BAND ? 'worse' : 'same'
}

const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length

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

function scoreSequence(sequence: CropId[], data: RotationData, ctx: Context): StrategyScores {
  const crops = sequence.map((c) => data.crops[c])
  // Water score: higher = saves more water. Thirsty crops count double on rain-only or sandy fields.
  const thirst = crops.map((c) => {
    const v = LEVEL_VALUE[c.waterNeed.value]
    return ctx.rainOnly || ctx.sandy ? Math.min(1, v * 1.25) : v
  })
  const water = 1 - avg(thirst)
  let soil = avg(crops.map((c) => SOIL_VALUE[c.soilEffect.value]))
  for (let i = 1; i < sequence.length; i++) {
    if (sequence[i] === sequence[i - 1] && !data.crops[sequence[i]].perennial) soil -= REPEAT_PENALTY
  }
  soil = Math.max(0, soil)
  // On rain-only fields, thirsty crops are likely to fail, so expected income drops.
  const economy = avg(
    crops.map((c) => {
      const v = LEVEL_VALUE[c.income.value]
      return ctx.rainOnly && c.waterNeed.value === 'high' ? v * 0.4 : v
    }),
  )
  return { water, soil, economy }
}

function hasRepeat(sequence: CropId[], data: RotationData): boolean {
  return sequence.some((c, i) => i > 0 && c === sequence[i - 1] && !data.crops[c].perennial)
}

function explain(id: PlanId, sequence: CropId[], data: RotationData, ctx: Context, answers: FarmerAnswers) {
  const names = sequence.map((c) => data.crops[c].label.toLowerCase())
  const legumes = sequence.filter((c) => data.crops[c].soilEffect.value === 'builds').map((c) => data.crops[c].label.toLowerCase())
  const thirsty = [...new Set(sequence.filter((c) => data.crops[c].waterNeed.value === 'high').map((c) => data.crops[c].label.toLowerCase()))]
  const why: string[] = []
  const benefits: string[] = []
  const limitations: string[] = []
  const missingInfo: string[] = []

  if (id === 'water-saving') {
    why.push('Most crops in this plan grow in the cool part of the year or need little summer water.')
    if (ctx.waterShort) why.push('You said water is often short in summer, so we put low-water crops first.')
    if (ctx.warming) why.push('NASA data shows warmer years around your field, so summer water losses are larger than before.')
    benefits.push('Less canal or pump water in July and August.', 'Lower risk in a dry year.')
    limitations.push('Grain prices are low, so income is usually lower than with sugar beet or vegetables.')
  } else if (id === 'soil-health') {
    why.push(`It includes ${[...new Set(legumes)].join(' and ')}, which add nitrogen to the soil.`)
    why.push('Alfalfa roots go deep and loosen hard soil.')
    benefits.push('Next crops need less fertilizer.', 'Breaks pest and weed cycles of grain-only fields.')
    limitations.push('Alfalfa needs regular watering in its first year.', 'Income comes later; alfalfa pays mostly as feed or hay.')
  } else if (id === 'economic') {
    why.push('Sugar beet and vegetables usually earn the most per hectare in the Chuy Valley.')
    why.push('Wheat and beans between them give the soil a lighter year.')
    benefits.push('Highest income potential of the plans.')
    limitations.push('Needs a reliable irrigation turn and a buyer or contract.', 'Prices change every year; we do not use live market prices.')
    if (ctx.rainOnly) limitations.push('You said the field is rain-only: sugar beet and vegetables are risky without irrigation.')
  } else {
    why.push(`What you grow now: ${names.join(' → ')}.`)
    if (hasRepeat(sequence, data)) limitations.push('The same crop on the same field year after year wears out the soil and builds up pests.')
    if (thirsty.length > 0 && ctx.waterShort) limitations.push(`${thirsty.join(' and ')} need a lot of summer water, which you said is often short.`)
    benefits.push('You already know these crops, the work and the buyers.')
  }

  if (id !== 'current' && thirsty.length > 0 && ctx.rainOnly) {
    limitations.push(`${thirsty.join(' and ')} need irrigation; on a rain-only field the harvest is at risk.`)
  }
  if (ctx.drying && id !== 'current') why.push('The soil around your field has become drier over 40 years.')

  if (answers.soilType === undefined || answers.soilType === 'unknown') missingInfo.push('Your soil type. A soil test would make this plan more reliable.')
  if (answers.irrigation === undefined || answers.irrigation === 'unknown') missingInfo.push('Whether you can irrigate. This changes which crops are safe.')
  missingInfo.push('Local prices and your costs. We use rough levels, not real prices.')
  return { why, benefits, limitations, missingInfo }
}

function weightsFor(answers: FarmerAnswers, ctx: Context): StrategyScores {
  const w = { water: 1, soil: 1, economy: 1 }
  if (ctx.waterShort) w.water += 1
  if (ctx.warming || ctx.drying) w.water += 0.5
  if (answers.priority === 'water') w.water += 3
  if (answers.priority === 'soil') w.soil += 3
  if (answers.priority === 'income') w.economy += 3
  return w
}

function unknownCount(answers: FarmerAnswers): number {
  const ids: (keyof FarmerAnswers)[] = ['currentRotation', 'soilType', 'irrigation', 'waterLimited', 'priority']
  return ids.filter((id) => answers[id] === undefined || answers[id] === 'unknown').length
}

export function recommend(answers: FarmerAnswers, climate: ClimateData | null, data: RotationData): Recommendation {
  const ctx = contextOf(answers, climate)
  const currentKey =
    answers.currentRotation && answers.currentRotation !== 'unknown' ? answers.currentRotation : data.assumedCurrent
  const currentAssumed = currentKey !== answers.currentRotation
  const currentSeq = data.currentRotations[currentKey].sequence
  const preliminary = Object.values(data.crops).some((c) => c.waterNeed.preliminary || c.soilEffect.preliminary || c.income.preliminary)

  const build = (id: PlanId, sequence: CropId[]): PlanResult => {
    const scores = scoreSequence(sequence, data, ctx)
    return {
      id,
      sequence,
      scores,
      levels: { water: toLevel(scores.water), soil: toLevel(scores.soil), economy: toLevel(scores.economy) },
      ...explain(id, sequence, data, ctx, answers),
      preliminary,
    }
  }

  const current = build('current', currentSeq)
  const plans = data.strategies.map((s) => {
    const plan = build(s.id, s.sequence)
    plan.vsCurrent = {
      water: compare(plan.scores.water, current.scores.water),
      soil: compare(plan.scores.soil, current.scores.soil),
      economy: compare(plan.scores.economy, current.scores.economy),
    }
    return plan
  })

  const w = weightsFor(answers, ctx)
  const fit = (p: PlanResult) => p.scores.water * w.water + p.scores.soil * w.soil + p.scores.economy * w.economy
  const best = [...plans].sort((a, b) => fit(b) - fit(a))[0]
  plans.sort((a, b) => fit(b) - fit(a))

  const strategy = data.strategies.find((s) => s.id === best.id)!
  const crops = best.sequence.map((c) => data.crops[c].label.toLowerCase())
  const goal =
    answers.priority === 'water'
      ? 'saving water'
      : answers.priority === 'soil'
        ? 'keeping your soil healthy'
        : answers.priority === 'income'
          ? 'earning more'
          : 'a balance of water, soil and income'
  const headline = `For ${goal}, the "${planTitle(best.id)}" plan fits your field best: ${crops.join(' → ')}.`

  const unknown = unknownCount(answers)
  const confidence: Confidence = unknown === 0 ? 'High' : unknown <= 2 ? 'Medium' : 'Low'
  const confidenceReason =
    unknown === 0
      ? 'You answered all 5 questions, and we have 40 years of NASA climate data for your area.'
      : `${unknown} of 5 answers were "I don't know", so the plan relies more on general rules.`

  return {
    best,
    headline,
    steps: [
      { label: 'This season', text: strategy.steps.thisSeason },
      { label: 'Next season', text: strategy.steps.nextSeason },
      { label: 'In 2–3 years', text: strategy.steps.later },
    ],
    confidence,
    confidenceReason,
    plans,
    current,
    currentAssumed,
  }
}
