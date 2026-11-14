// Caches NASA POWER monthly data for the demo points, so the demo works when the API is slow.
// Run: node scripts/fetch-demo-data.mjs
import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'

const points = JSON.parse(readFileSync(new URL('../src/data/demoPoints.json', import.meta.url)))
const START = 1986
const END = 2025

for (const p of points) {
  const url =
    'https://power.larc.nasa.gov/api/temporal/monthly/point' +
    `?parameters=T2M,PRECTOTCORR,GWETROOT&community=AG&longitude=${p.lon}&latitude=${p.lat}` +
    `&start=${START}&end=${END}&format=JSON`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${p.id}: HTTP ${res.status}`)
  const json = await res.json()
  // Keep only what the app reads, to keep the files small.
  const slim = { geometry: json.geometry, parameters: json.parameters, properties: json.properties }
  await writeFile(new URL(`../public/data/${p.id}.json`, import.meta.url), JSON.stringify(slim))
  console.log('saved', p.id)
}
