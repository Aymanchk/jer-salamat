import SOURCES from '@/data/sources.json'

export interface SourceRecord {
  id: string
  kind: 'nasa' | 'reference' | 'future'
  name: string
  publisher: string
  url: string
  year: string
  unit: string
  note: string
}

/** All sources with url, year, unit and limits. Names and notes are translated (src.<id>.name / .note). */
export const SOURCE_LIST = SOURCES.sources as SourceRecord[]
export const NASA_SOURCE = SOURCE_LIST.find((s) => s.kind === 'nasa')!
export const REFERENCE_SOURCES = SOURCE_LIST.filter((s) => s.kind !== 'nasa')

/** Limitation keys (limit.1 … limit.6). */
export const LIMITATIONS = ['limit.1', 'limit.2', 'limit.3', 'limit.4', 'limit.5', 'limit.6']

/** Team names go here. Names only, no photos. */
export const TEAM: string[] = []
