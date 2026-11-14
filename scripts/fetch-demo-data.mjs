// Caches NASA POWER monthly data for the 3 demo points so the demo works offline.
// Run: node scripts/fetch-demo-data.mjs
import { writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';

const points = JSON.parse(readFileSync(new URL('../src/data/demoPoints.json', import.meta.url)));
const end = new Date().getFullYear() - 1;

for (const p of points) {
  const url = `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M,PRECTOTCORR,GWETROOT&community=AG&longitude=${p.lon}&latitude=${p.lat}&start=1981&end=${end}&format=JSON`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${p.id}: HTTP ${res.status}`);
  const json = await res.json();
  await writeFile(new URL(`../public/data/${p.id}.json`, import.meta.url), JSON.stringify(json));
  console.log('saved', p.id);
}
