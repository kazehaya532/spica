import { gunzipSync } from 'node:zlib'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = process.argv[2]
if (!source) throw new Error('Usage: node scripts/generate-star-field.mjs <hygdata.csv.gz>')
const MAX_MAGNITUDE = 10.5

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

const csv = gunzipSync(readFileSync(resolve(source))).toString('utf8')
const lines = csv.split(/\r?\n/)
const header = parseRow(lines.shift())
const field = Object.fromEntries(header.map((name, index) => [name, index]))
const stars = []

for (const line of lines) {
  if (!line) continue
  const row = parseRow(line)
  const ra = Number(row[field.ra])
  const dec = Number(row[field.dec])
  const magnitude = Number(row[field.mag])
  const colorIndex = Number(row[field.ci])
  if (!Number.isFinite(ra) || !Number.isFinite(dec) || !Number.isFinite(magnitude) || magnitude < -2 || magnitude > MAX_MAGNITUDE) continue
  stars.push({ ra, dec, magnitude, colorIndex: Number.isFinite(colorIndex) ? colorIndex : 0.65 })
}

const bytes = Buffer.allocUnsafe(stars.length * 6)
stars.forEach((star, index) => {
  const offset = index * 6
  bytes.writeUInt16LE(Math.round(star.ra / 24 * 65535), offset)
  bytes.writeInt16LE(Math.round(star.dec / 90 * 32767), offset + 2)
  bytes.writeUInt8(Math.round((star.magnitude + 2) / (MAX_MAGNITUDE + 2) * 255), offset + 4)
  bytes.writeUInt8(Math.round((Math.max(-.5, Math.min(2.5, star.colorIndex)) + .5) / 3 * 255), offset + 5)
})
const output = `// Generated from HYG Database v4: https://github.com/astronexus/HYG-Database\n// Licensed CC BY-SA 4.0. Six quantized bytes per star preserve display-level precision.\nconst encoded = '${bytes.toString('base64')}'\nlet cache: Float32Array | undefined\n\nexport const starCount = ${stars.length}\n\nexport function loadStarField() {\n  if (cache) return cache\n  const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0))\n  const view = new DataView(bytes.buffer)\n  const field = new Float32Array(starCount * 4)\n  for (let index = 0; index < starCount; index += 1) {\n    const source = index * 6\n    const target = index * 4\n    field[target] = view.getUint16(source, true) / 65535 * 24\n    field[target + 1] = view.getInt16(source + 2, true) / 32767 * 90\n    field[target + 2] = view.getUint8(source + 4) / 255 * ${MAX_MAGNITUDE + 2} - 2\n    field[target + 3] = view.getUint8(source + 5) / 255 * 3 - .5\n  }\n  cache = field\n  return field\n}\n`

writeFileSync(resolve('src/data/starField.ts'), output)
console.log(`Generated ${stars.length} stars in src/data/starField.ts`)
