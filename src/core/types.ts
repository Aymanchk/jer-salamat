/**
 * Core domain types for Jer Salamat.
 *
 * This folder holds framework-free logic: no React imports here.
 * For now it only declares the shapes. The NASA POWER client, the climate
 * statistics and the rotation engine will be implemented against these
 * interfaces later.
 */

/* ---------- Field ---------- */

export interface FieldLocation {
  /** Decimal degrees, WGS84. */
  lat: number
  lon: number
}

/* ---------- Farmer answers ---------- */

/** Every question accepts "I don't know". */
export type Unknown = 'unknown'

/** Common rotations on Chuy Valley farms. Each id maps to a crop sequence in src/data/rotations.json. */
export type CurrentRotationId =
  | 'wheat-every-year'
  | 'wheat-maize'
  | 'beet-wheat-maize'
  | 'alfalfa-wheat'
  | 'vegetables-wheat'

export type SoilType = 'light' | 'medium' | 'heavy' | 'stony'
export type IrrigationAccess = 'canal' | 'pump' | 'none'
export type WaterLimit = 'often' | 'sometimes' | 'rarely'
export type Priority = 'water' | 'soil' | 'income'

export interface FarmerAnswers {
  currentRotation?: CurrentRotationId | Unknown
  soilType?: SoilType | Unknown
  irrigation?: IrrigationAccess | Unknown
  waterLimited?: WaterLimit | Unknown
  priority?: Priority | Unknown
}

export type QuestionId = keyof FarmerAnswers

/* ---------- Climate (NASA POWER) ---------- */

export type ClimateVariable = 'temperature' | 'precipitation' | 'soilWetness'

export interface ClimatePoint {
  year: number
  value: number
}

export interface ClimateSeries {
  variable: ClimateVariable
  /** Display unit, for example "°C", "mm" or "0–1". */
  unit: string
  points: ClimatePoint[]
  source: 'nasa-power'
  /** True when served from the local cache instead of the live API. */
  cached: boolean
}

export interface ClimateTrend {
  variable: ClimateVariable
  /** Change per decade, in the series unit. */
  slopePerDecade: number
  /** Whether the trend is statistically meaningful. */
  significant: boolean
}

export interface ClimateSummary {
  variable: ClimateVariable
  /** One plain-language sentence for farmers. */
  text: string
}

export interface ClimateDataProvider {
  getSeries(location: FieldLocation, variable: ClimateVariable): Promise<ClimateSeries>
}

/* ---------- Rotation strategies ---------- */

export type CropId =
  | 'wheat'
  | 'barley'
  | 'maize'
  | 'sugar-beet'
  | 'alfalfa'
  | 'beans'
  | 'vegetables'
  | 'fallow'

export type StrategyId = 'water-saving' | 'soil-health' | 'economic'

export interface RotationSeason {
  /** 1-based season index in the plan. */
  season: number
  crop: CropId
}

/** Each score is 0–1. */
export interface StrategyScores {
  water: number
  soil: number
  economy: number
}

export interface RotationStrategy {
  id: StrategyId
  sequence: RotationSeason[]
  scores: StrategyScores
  why: string[]
  benefits: string[]
  limitations: string[]
  missingInfo: string[]
}

export interface RotationInput {
  location: FieldLocation
  answers: FarmerAnswers
  climate: ClimateSeries[]
}

export interface RotationEngine {
  recommend(input: RotationInput): RotationStrategy[]
}

/* ---------- Provenance ---------- */

/** Where a number or statement on screen comes from. */
export type DataProvenance =
  | 'historical' // measured or modelled by NASA POWER
  | 'answers' // typed in by the farmer
  | 'estimate' // computed by this app
  | 'hypothetical' // "what if" scenario, not a forecast
  | 'placeholder' // design placeholder, not real
