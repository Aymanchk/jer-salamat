export interface DataSource {
  name: string
  what: string
  use: string
  url: string
}

export interface DatasetInfo extends DataSource {
  variables: string[]
  period: string
  resolution: string
}

/** NASA-first: the only source of numbers in the app. */
export const DATA_SOURCES: DatasetInfo[] = [
  {
    name: 'NASA POWER',
    what: 'Prediction Of Worldwide Energy Resources. Monthly climate for any point on Earth, from satellite observations and the MERRA-2 model.',
    use: 'Climate charts, trends and the "what changed in 40 years" summary.',
    url: 'https://power.larc.nasa.gov/',
    variables: [
      'T2M — air temperature at 2 m, °C (yearly mean)',
      'PRECTOTCORR — precipitation, corrected, mm/day (summed to mm per year)',
      'GWETROOT — root zone soil wetness, 0 (dry) to 1 (saturated) (yearly mean)',
    ],
    period: '1986–2025, monthly, community AG (agroclimatology)',
    resolution: 'Grid of about 0.5° × 0.625° (roughly 50 km)',
  },
]

export const LIMITATIONS: string[] = [
  'NASA POWER shows regional climate on a wide grid. It is not a measurement of your exact field.',
  'All numbers come from NASA POWER. Crop traits (water need, effect on soil, income level) are general rotation guidance, marked preliminary, not measurements.',
  'We do not show yields, prices, profits or water-saving percentages, because we cannot support them with NASA data.',
  'We do not use soil lab tests or pest and disease records.',
  '"What if" scenarios are hypothetical. They are not weather forecasts.',
  'Always check a plan with a local agronomist before you change your rotation.',
]

/** Team names go here. Names only, no photos. */
export const TEAM: string[] = []
