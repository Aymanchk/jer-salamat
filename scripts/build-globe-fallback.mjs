// Builds public/globe-fallback.svg: the static picture shown instead of the
// 3D Earth on weak devices, slow connections and for reduced-motion users.
// Drawn from open Natural Earth outlines (world-atlas). Not AI-generated.
// Run: npm run build:globe
import { readFileSync, writeFileSync } from 'node:fs'
import { geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'
import { mesh } from 'topojson-client'

const root = new URL('..', import.meta.url)
const world = JSON.parse(readFileSync(new URL('node_modules/world-atlas/countries-110m.json', root)))
const kgData = JSON.parse(readFileSync(new URL('src/data/kyrgyzstan.json', root)))
const tokens = readFileSync(new URL('src/styles/tokens.css', root), 'utf8')
const token = (name) => tokens.match(new RegExp(`${name}:\\s*([^;]+);`))[1].trim()

const SIZE = 480
const CHUY = [74.45, 42.87]
const projection = geoOrthographic()
  .rotate([-CHUY[0], -CHUY[1] + 8])
  .scale(SIZE / 2 - 4)
  .translate([SIZE / 2, SIZE / 2])
  .precision(1)
const path = geoPath(projection).digits(1)

const borders = mesh(world, world.objects.countries)
const kyrgyzstan = { type: 'Polygon', coordinates: [kgData.ring] }
const [mx, my] = projection(CHUY)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
<path d="${path({ type: 'Sphere' })}" fill="${token('--globe-ocean')}"/>
<path d="${path(geoGraticule10())}" fill="none" stroke="${token('--globe-grid')}" stroke-width="0.8"/>
<path d="${path(borders)}" fill="none" stroke="${token('--globe-line')}" stroke-width="0.9" stroke-linejoin="round"/>
<path d="${path(kyrgyzstan)}" fill="${token('--globe-highlight')}" fill-opacity="0.25" stroke="${token('--globe-highlight')}" stroke-width="2" stroke-linejoin="round"/>
<ellipse cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" rx="3.2" ry="1.4" fill="${token('--globe-highlight')}" opacity="0.95"/>
</svg>
`
writeFileSync(new URL('public/globe-fallback.svg', root), svg)
console.log(`globe-fallback.svg written (${(svg.length / 1024).toFixed(1)} kB)`)
