import { gunzipSync } from 'node:zlib'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const hygSource = process.argv[2]
const stellariumSource = process.argv[3]
if (!hygSource || !stellariumSource) {
  throw new Error('Usage: node scripts/generate-constellation-figures.mjs <hygdata.csv.gz> <western/index.json>')
}

function parseRow(line) {
  const values = []
  let value = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1 }
      else quoted = !quoted
    } else if (character === ',' && !quoted) {
      values.push(value); value = ''
    } else value += character
  }
  values.push(value)
  return values
}

const csv = gunzipSync(readFileSync(resolve(hygSource))).toString('utf8')
const rows = csv.split(/\r?\n/)
const header = parseRow(rows.shift())
const columns = Object.fromEntries(header.map((name, index) => [name, index]))
const stars = new Map()
for (const line of rows) {
  if (!line) continue
  const row = parseRow(line)
  const hip = Number(row[columns.hip])
  const ra = Number(row[columns.ra])
  const dec = Number(row[columns.dec])
  if (Number.isFinite(hip) && Number.isFinite(ra) && Number.isFinite(dec)) stars.set(hip, [ra, dec])
}

const western = JSON.parse(readFileSync(resolve(stellariumSource), 'utf8'))
const figures = []
for (const constellation of western.constellations) {
  const segments = []
  const anchors = []
  for (const chain of constellation.lines) {
    for (let index = 1; index < chain.length; index += 1) {
      const start = stars.get(chain[index - 1])
      const end = stars.get(chain[index])
      if (!start || !end) continue
      segments.push([...start, ...end])
      anchors.push(start, end)
    }
  }
  if (!segments.length) continue

  let x = 0; let y = 0; let z = 0
  for (const [ra, dec] of anchors) {
    const raRadians = ra / 24 * Math.PI * 2
    const decRadians = dec / 180 * Math.PI
    x += Math.cos(decRadians) * Math.cos(raRadians)
    y += Math.cos(decRadians) * Math.sin(raRadians)
    z += Math.sin(decRadians)
  }
  const anchorRa = (Math.atan2(y, x) / (Math.PI * 2) * 24 + 24) % 24
  const anchorDec = Math.atan2(z, Math.hypot(x, y)) / Math.PI * 180
  figures.push({
    id: constellation.iau.toLowerCase(),
    name: constellation.common_name?.native ?? constellation.iau,
    shortName: constellation.iau,
    anchor: [Number(anchorRa.toFixed(5)), Number(anchorDec.toFixed(5))],
    segments: segments.map((segment) => segment.map((value) => Number(value.toFixed(5)))),
  })
}

figures.sort((a, b) => a.shortName.localeCompare(b.shortName))
const output = `// Generated from factual constellation line references in Stellarium's western sky culture index.\n// Spica renders original artwork from these star connections; no Stellarium images or code are shipped.\nexport interface ConstellationFigure {\n  id: string\n  name: string\n  shortName: string\n  anchor: [number, number]\n  segments: [number, number, number, number][]\n}\n\nexport const constellationFigures: ConstellationFigure[] = ${JSON.stringify(figures)}\n`
writeFileSync(resolve('src/data/constellationFigures.ts'), output)
console.log(`Generated ${figures.length} constellation figures in src/data/constellationFigures.ts`)
