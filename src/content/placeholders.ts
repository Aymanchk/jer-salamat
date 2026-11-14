/**
 * PLACEHOLDER CONTENT — not real data, not a recommendation.
 *
 * Everything here exists only to show the layout. It is always rendered
 * with a visible "Placeholder" badge and without numbers, so it cannot be
 * mistaken for NASA data, yields or prices. Replace with src/core output.
 */
import type { ClimateVariable, CropId, StrategyId } from '@/core'

export const YEAR_START = 1986
export const YEAR_END = 2025

export const YEARS: number[] = Array.from({ length: YEAR_END - YEAR_START + 1 }, (_, i) => YEAR_START + i)

/** Small deterministic generator so the sketch looks the same on every load. */
function seeded(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const SHAPE_SEED: Record<ClimateVariable, number> = {
  temperature: 11,
  precipitation: 23,
  soilWetness: 37,
}

/**
 * A unitless wiggle between 0 and 1 for sketching a chart.
 * It has no slope on purpose: a placeholder must not suggest a trend.
 */
export function placeholderShape(variable: ClimateVariable): number[] {
  const rand = seeded(SHAPE_SEED[variable])
  return YEARS.map((_, i) => {
    const wave = Math.sin(i / 3.1 + SHAPE_SEED[variable]) * 0.12
    const noise = (rand() - 0.5) * 0.3
    return Math.min(0.9, Math.max(0.1, 0.5 + wave + noise))
  })
}

export interface PlaceholderStrategy {
  id: StrategyId
  sequence: CropId[]
}

/** Example sequences that only demonstrate the timeline layout. */
export const PLACEHOLDER_STRATEGIES: PlaceholderStrategy[] = [
  { id: 'water-saving', sequence: ['wheat', 'beans', 'barley', 'alfalfa'] },
  { id: 'soil-health', sequence: ['alfalfa', 'alfalfa', 'wheat', 'beans'] },
  { id: 'economic', sequence: ['sugar-beet', 'wheat', 'maize', 'vegetables'] },
]

export const PLACEHOLDER_SECTIONS = {
  why: 'Reasons will be written here from your answers and the climate record of your area.',
  benefits: 'Expected benefits will be listed here, in short points.',
  limitations: 'Risks and weak points of this plan will be listed here.',
  missing: 'We will say here which facts we did not have, and how they could change the plan.',
} as const
