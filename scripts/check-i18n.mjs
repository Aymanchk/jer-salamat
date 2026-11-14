// Checks that en.ts and ru.ts have the same keys, and that every literal t('key') in src exists.
// Run: npm run i18n:check
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const keysOf = (file) => new Set([...readFileSync(file, 'utf8').matchAll(/^\s*'([^']+)':/gm)].map((m) => m[1]))
const en = keysOf('src/i18n/en.ts')
const ru = keysOf('src/i18n/ru.ts')
const missingRu = [...en].filter((k) => !ru.has(k))
const extraRu = [...ru].filter((k) => !en.has(k))

const files = []
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(tsx?|json)$/.test(f) && !p.includes('i18n')) files.push(p)
  }
}
walk('src')
const used = new Set()
for (const f of files) {
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(/\bt\('([a-z][\w.-]+)'/g)) used.add(m[1])
  for (const m of src.matchAll(/\bkey: '([a-z][\w.-]+)'/g)) used.add(m[1])
}
const missingEn = [...used].filter((k) => !en.has(k))

console.log(`en ${en.size} keys, ru ${ru.size} keys, ${used.size} literal keys used in code`)
if (missingRu.length) console.log('Missing in ru:', missingRu)
if (extraRu.length) console.log('Only in ru:', extraRu)
if (missingEn.length) console.log('Used in code but missing in en:', missingEn)
process.exit(missingRu.length || extraRu.length || missingEn.length ? 1 : 0)
