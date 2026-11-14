/**
 * Glossary entries. Text is in the dictionaries: gl.<id>.term and gl.<id>.meaning.
 * FAO-sourced wording from teammate Nurlan's research; each entry names its source.
 */
export const GLOSSARY = {
  rotation: { source: 'https://www.fao.org/conservation-agriculture/in-practice/species-diversification/en/' },
  soilMoisture: { source: 'https://www.fao.org/4/R4082E/r4082e03.htm' },
  rootZone: { source: 'https://power.larc.nasa.gov/' },
  evaporation: { source: 'https://www.fao.org/4/s2022e/s2022e02.htm' },
  nitrogenFixation: { source: 'https://www.fao.org/soils-portal/data-hub/soil-properties/biological-properties/en/' },
  legume: { source: 'https://www.fao.org/soils-portal/data-hub/soil-properties/biological-properties/en/' },
  waterNeed: { source: 'https://www.fao.org/4/s2022e/s2022e02.htm' },
  trend: { source: '' },
  precipitation: { source: '' },
  fallow: { source: '' },
} satisfies Record<string, { source: string }>

export type GlossaryId = keyof typeof GLOSSARY
