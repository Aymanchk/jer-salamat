export interface DataSource {
  name: string
  what: string
  use: string
  url: string
}

export const DATA_SOURCES: DataSource[] = [
  {
    name: 'NASA POWER',
    what: 'Monthly climate record, 1986–2025: air temperature, rainfall and root zone soil wetness.',
    use: 'Climate charts and trends.',
    url: 'https://power.larc.nasa.gov/',
  },
  {
    name: 'FAO',
    what: 'Crop water needs and crop rotation guidance.',
    use: 'Rules behind the rotation plans.',
    url: 'https://www.fao.org/',
  },
  {
    name: 'Kyrgyz agricultural statistics',
    what: 'Crops grown in the Chuy region, from the National Statistical Committee.',
    use: 'Choosing crops that are realistic for local farms.',
    url: 'https://stat.gov.kg/en/',
  },
]

export const LIMITATIONS: string[] = [
  'NASA POWER shows regional climate on a wide grid. It is not a measurement of your exact field.',
  'The plans are estimates built from simple rules. They are not a guarantee of yield or income.',
  'We do not use live market prices, soil lab tests or pest and disease records.',
  '"What if" scenarios are hypothetical. They are not weather forecasts.',
  'Always check a plan with a local agronomist before you change your rotation.',
]

/** Team names go here. Names only, no photos. */
export const TEAM: string[] = []
