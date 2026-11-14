/** Plain-English meanings of the technical words used in the app. */
export interface GlossaryEntry {
  term: string
  meaning: string
}

export const GLOSSARY = {
  rotation: {
    term: 'Crop rotation',
    meaning:
      'Growing different crops on the same field in a planned order, season after season, instead of the same crop every year.',
  },
  rootZone: {
    term: 'Root zone soil wetness',
    meaning:
      'How wet the soil is in the layer where plant roots live (about the top 1 metre). 0 means completely dry, 1 means fully soaked.',
  },
  legume: {
    term: 'Legume',
    meaning:
      'A plant like alfalfa, beans or peas. Its roots take nitrogen from the air and leave it in the soil, so the next crop needs less fertilizer.',
  },
  evapotranspiration: {
    term: 'Evapotranspiration',
    meaning:
      'Water that leaves the field into the air: part dries from the soil, part goes out through the plant leaves. Hotter weather means more water lost.',
  },
  trend: {
    term: 'Trend line',
    meaning:
      'A straight line through 40 years of values. It shows the general direction (going up or down) and hides the ups and downs of single years.',
  },
  precipitation: {
    term: 'Precipitation',
    meaning: 'All water that falls from the sky: rain and snow, counted together.',
  },
  fallow: {
    term: 'Fallow',
    meaning: 'Leaving a field without a crop for a season so the soil can rest and keep water.',
  },
} satisfies Record<string, GlossaryEntry>

export type GlossaryId = keyof typeof GLOSSARY
