// Generates the Spica deep-sky EPH survey from the OpenNGC database.
//
// Source: vendor/openngc/NGC.csv (OpenNGC, CC BY-SA 4.0), pinned in
// vendor/openngc/README.md. Output overwrites
// vendor/stellarium-web-engine/apps/test-skydata/dso/ with 12 order-0 HEALPix
// tiles in the Stellarium Web Engine EPH format (see src/eph-file.c).
//
// Usage: node scripts/make-dso.mjs [--check]

import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const csvPaths = [
  resolve(root, 'vendor/openngc/NGC.csv'),
  resolve(root, 'vendor/openngc/addendum.csv')
]
const outDir = resolve(root, 'vendor/stellarium-web-engine/apps/test-skydata/dso')

const OPENNGC_COMMIT = 'da90466031b0372c896588b85be6016c617e205b'
const ORDER = 0
const NSIDE = 1 << ORDER
const ROW_SIZE = 384
const MAG_LIMIT = 13

// OpenNGC type -> SIMBAD otype understood by the engine (src/otypes.c).
const OTYPE_MAP = {
  OCl: 'OpC',
  GCl: 'GlC',
  'Cl+N': 'OpC',
  G: 'G',
  GPair: 'GiG',
  GTrpl: 'GiG',
  GGroup: 'GrG',
  PN: 'PN',
  HII: 'HII',
  DrkN: 'DNe',
  EmN: 'GNe',
  Neb: 'GNe',
  RfN: 'RNe',
  SNR: 'SNR',
  '*Ass': 'As*'
}
const EXCLUDED_TYPES = new Set(['*', '**', 'Nova', 'Other', 'NonEx', 'Dup'])

const COLUMNS = [
  { name: 'type', kind: 's', unit: 0, size: 4 },
  { name: 'vmag', kind: 'f', unit: 3 << 16, size: 4 },
  { name: 'bmag', kind: 'f', unit: 3 << 16, size: 4 },
  { name: 'ra', kind: 'f', unit: 1 << 16, size: 4 },
  { name: 'de', kind: 'f', unit: 1 << 16, size: 4 },
  { name: 'smax', kind: 'f', unit: 1 << 16, size: 4 },
  { name: 'smin', kind: 'f', unit: 1 << 16, size: 4 },
  { name: 'angl', kind: 'f', unit: 1 << 16, size: 4 },
  { name: 'morp', kind: 's', unit: 0, size: 32 },
  { name: 'snam', kind: 's', unit: 0, size: 64 },
  { name: 'ids', kind: 's', unit: 0, size: 256 }
]

const D2R = Math.PI / 180

function hmsToDegrees(text) {
  const parts = text.trim().split(':').map(Number)
  return (parts[0] + parts[1] / 60 + (parts[2] ?? 0) / 3600) * 15
}

function dmsToDegrees(text) {
  const sign = text.trim().startsWith('-') ? -1 : 1
  const parts = text.trim().replace(/^[+-]/, '').split(':').map(Number)
  return sign * (parts[0] + parts[1] / 60 + (parts[2] ?? 0) / 3600)
}

function flo(v) {
  return Number.isFinite(v) ? v : NaN
}

// HEALPix ang2pix in NESTED scheme, ported from the reference algorithm in
// astropy-healpix (cextern/astrometry.net/healpix.c, BSD-3-Clause) so pixel
// assignments match the tiles produced by the upstream engine tooling.
export function ang2pixNest(nside, raRad, deRad) {
  const vx = Math.cos(deRad) * Math.cos(raRad)
  const vy = Math.cos(deRad) * Math.sin(raRad)
  const vz = Math.sin(deRad)
  const pix = xyzToHealpixNest(vx, vy, vz, nside)
  if (pix < 0) throw new Error('ang2pixNest failed for ' + raRad + ',' + deRad)
  return pix
}

const TWO_THIRDS = 2.0 / 3.0
const HALF_PI = Math.PI / 2

function xyzToHealpixNest(vx, vy, vz, nside) {
  let phi = Math.atan2(vy, vx)
  if (phi < 0) phi += 2 * Math.PI
  const phiT = phi % HALF_PI
  let basehp, x, y

  if (vz >= TWO_THIRDS || vz <= -TWO_THIRDS) {
    const north = vz >= TWO_THIRDS
    const z = north ? vz : -vz
    const coz = Math.hypot(vx, vy)
    const root3 = Math.sqrt(3)
    const kx = (coz / Math.sqrt(1 + z)) * root3 * Math.abs((nside * (2 * phiT - Math.PI)) / Math.PI)
    const ky = (coz / Math.sqrt(1 + z)) * root3 * ((nside * 2 * phiT) / Math.PI)
    let xx, yy
    if (north) {
      xx = nside - kx
      yy = nside - ky
    } else {
      xx = ky
      yy = kx
    }
    x = Math.min(nside - 1, Math.floor(xx))
    y = Math.min(nside - 1, Math.floor(yy))
    if (x < 0 || y < 0) return -1
    const offset = ((Math.round((phi - phiT) / HALF_PI) % 4) + 4) % 4
    basehp = north ? offset : 8 + offset
  } else {
    const zunits = (vz + TWO_THIRDS) / (4.0 / 3.0)
    const phiunits = phiT / HALF_PI
    let xx = (zunits + phiunits) * nside
    let yy = (zunits - phiunits + 1.0) * nside
    const offset = ((Math.round((phi - phiT) / HALF_PI) % 4) + 4) % 4
    if (xx >= nside) {
      xx -= nside
      if (yy >= nside) {
        yy -= nside
        basehp = offset
      } else {
        basehp = ((offset + 1) % 4) + 4
      }
    } else {
      if (yy >= nside) {
        yy -= nside
        basehp = offset + 4
      } else {
        basehp = 8 + offset
      }
    }
    x = Math.max(0, Math.min(nside - 1, Math.floor(xx)))
    y = Math.max(0, Math.min(nside - 1, Math.floor(yy)))
  }
  return basehp * nside * nside + interleave(x, y)
}

function interleave(x, y) {
  return spreadBits(x) | (spreadBits(y) << 1)
}

function spreadBits(v) {
  let r = v & 0xffff
  r = (r | (r << 8)) & 0x00ff00ff
  r = (r | (r << 4)) & 0x0f0f0f0f
  r = (r | (r << 2)) & 0x33333333
  r = (r | (r << 1)) & 0x55555555
  return r
}

// 'NGC0224' -> 'NGC 224', 'C014' -> 'C 14', 'Mel022' -> 'Mel 22',
// 'ESO056-115' -> 'ESO 56-115'. Unknown formats pass through unchanged.
function designationFromName(name) {
  const spaced = /^([A-Za-z]+)0*(\d.*)$/.exec(name)
  if (!spaced) return name
  return `${spaced[1]} ${spaced[2]}`
}

function buildIds(row) {
  const names = []
  const seen = new Set()
  const push = (id) => {
    if (id && !seen.has(id)) {
      seen.add(id)
      names.push(id)
    }
  }
  for (const common of row.commonNames) push(`NAME ${common}`)
  if (row.messier) push(`M ${row.messier}`)
  if (row.caldwell) push(`C ${row.caldwell}`)
  push(row.designation)
  for (const ref of row.crossRefs) push(ref)
  const extras = row.identifiers.map((id) => id.trim()).filter(Boolean)
  let ids = names.join('|')
  for (const extra of extras) {
    const candidate = `${ids}|${extra}`
    if (Buffer.byteLength(candidate, 'latin1') > 255) break
    ids = candidate
  }
  return ids
}

function splitCsvLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ';') {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

function parseCsv(text) {
  const lines = text.split('\n')
  const rows = []
  for (const line of lines.slice(1)) {
    const trimmed = line.replace(/\r$/, '')
    if (!trimmed) continue
    const c = splitCsvLine(trimmed)
    if (c.length !== 32) throw new Error(`Unexpected field count ${c.length} for ${c[0]}`)
    rows.push(c)
  }
  return rows
}

function parseRows(lines) {
  const objects = []
  for (const c of lines) {
    const [name, type, raText, deText] = c
    if (EXCLUDED_TYPES.has(type)) continue
    const otype = OTYPE_MAP[type]
    if (!otype) continue
    if (!raText || !deText) continue
    const raDeg = hmsToDegrees(raText)
    const deDeg = dmsToDegrees(deText)
    if (!Number.isFinite(raDeg) || !Number.isFinite(deDeg)) continue
    const bmag = flo(Number.parseFloat(c[8]))
    const vmag = flo(Number.parseFloat(c[9]))
    const majAx = flo(Number.parseFloat(c[5]))
    const minAx = flo(Number.parseFloat(c[6]))
    const posAng = flo(Number.parseFloat(c[7]))
    const messier = c[23] ? Number.parseInt(c[23].replace(/^0+/, ''), 10) : NaN
    // Cross-references: an NGC-numbered object may also be IC xxx and
    // vice versa (c[24]/c[25] hold the *other* catalogue's number when set).
    const altNgc = c[24] ? Number.parseInt(c[24].replace(/^0+/, ''), 10) : NaN
    const altIc = c[25] ? Number.parseInt(c[25].replace(/^0+/, ''), 10) : NaN
    const caldwell = /^C\d+$/i.test(name) ? Number.parseInt(name.slice(1), 10) : NaN
    const commonNames = (c[28] || '').split(',').map((n) => n.trim()).filter(Boolean)
    const identifiers = (c[27] || '').split(',').map((n) => n.trim()).filter(Boolean)
    const notable = Number.isFinite(messier) || Number.isFinite(caldwell) || commonNames.length > 0
    const bestMag = Math.min(
      Number.isFinite(vmag) ? vmag : Infinity,
      Number.isFinite(bmag) ? bmag : Infinity
    )
    if (!notable && bestMag > MAG_LIMIT) continue

    const designation = designationFromName(name)
    const shortName = Number.isFinite(messier)
      ? `M ${messier}`
      : commonNames.length
        ? commonNames.reduce((a, b) => (b.length < a.length ? b : a))
        : designation
    const pix = ang2pixNest(NSIDE, raDeg * D2R, deDeg * D2R)
    const smax = Number.isFinite(majAx) && majAx > 0 ? majAx * (Math.PI / 180 / 60) : NaN
    const smin = Number.isFinite(minAx) && minAx > 0 ? minAx * (Math.PI / 180 / 60) : NaN
    const crossRefs = []
    if (Number.isFinite(altNgc) && !/^NGC/i.test(name)) crossRefs.push(`NGC ${altNgc}`)
    if (Number.isFinite(altIc) && !/^IC/i.test(name)) crossRefs.push(`IC ${altIc}`)
    objects.push({
      designation,
      otype,
      vmag,
      bmag,
      ra: raDeg * D2R,
      de: deDeg * D2R,
      smax,
      smin,
      angl: Number.isFinite(posAng) ? posAng * D2R : NaN,
      morpho: (c[14] || '').trim(),
      commonNames,
      identifiers,
      shortName,
      pix,
      ids: buildIds({
        commonNames,
        messier: Number.isFinite(messier) ? messier : null,
        caldwell: Number.isFinite(caldwell) ? caldwell : null,
        designation,
        crossRefs,
        identifiers
      })
    })
  }
  return objects
}

function writeRow(obj) {
  const row = Buffer.alloc(ROW_SIZE)
  row.write(obj.otype.slice(0, 4), 0, 'latin1')
  row.writeFloatLE(Number.isFinite(obj.vmag) ? obj.vmag : NaN, 4)
  row.writeFloatLE(Number.isFinite(obj.bmag) ? obj.bmag : NaN, 8)
  row.writeFloatLE(obj.ra, 12)
  row.writeFloatLE(obj.de, 16)
  row.writeFloatLE(Number.isFinite(obj.smax) ? obj.smax : NaN, 20)
  row.writeFloatLE(Number.isFinite(obj.smin) ? obj.smin : NaN, 24)
  row.writeFloatLE(Number.isFinite(obj.angl) ? obj.angl : NaN, 28)
  row.write(obj.morpho.slice(0, 31), 32, 'latin1')
  row.write(obj.shortName.slice(0, 63), 64, 'latin1')
  row.write(obj.ids.slice(0, 255), 128, 'latin1')
  return row
}

function writeChunk(file, type, payload) {
  const chunk = Buffer.alloc(8 + payload.length + 4)
  chunk.write(type, 0, 4, 'latin1')
  chunk.writeInt32LE(payload.length, 4)
  payload.copy(chunk, 8)
  chunk.writeInt32LE(0, 8 + payload.length)
  file.push(chunk)
}

function buildTile(pix, objects) {
  const rows = objects
    .map(writeRow)
    .sort((a, b) => a.readFloatLE(4) - b.readFloatLE(4))
  const nRow = rows.length
  const raw = Buffer.concat(rows)
  const shuffled = Buffer.alloc(raw.length)
  for (let r = 0; r < nRow; r++) {
    for (let i = 0; i < ROW_SIZE; i++) {
      shuffled[i * nRow + r] = raw[r * ROW_SIZE + i]
    }
  }
  const compressed = deflateSync(shuffled)

  const header = Buffer.alloc(12 + 16 + COLUMNS.length * 20 + 8)
  let ofs = 0
  header.writeInt32LE(3, ofs); ofs += 4
  header.writeBigUInt64LE(BigInt(pix + 4 * (1 << (2 * ORDER))), ofs); ofs += 8
  header.writeInt32LE(1, ofs); ofs += 4
  header.writeInt32LE(ROW_SIZE, ofs); ofs += 4
  header.writeInt32LE(COLUMNS.length, ofs); ofs += 4
  header.writeInt32LE(nRow, ofs); ofs += 4
  let start = 0
  for (const col of COLUMNS) {
    header.write(col.name.padEnd(4, '\0').slice(0, 4), ofs, 'latin1'); ofs += 4
    header.write((col.kind + '\0\0\0').slice(0, 4), ofs, 'latin1'); ofs += 4
    header.writeInt32LE(col.unit, ofs); ofs += 4
    header.writeInt32LE(start, ofs); ofs += 4
    header.writeInt32LE(col.size, ofs); ofs += 4
    start += col.size
  }
  header.writeInt32LE(raw.length, ofs); ofs += 4
  header.writeInt32LE(compressed.length, ofs); ofs += 4

  const payload = Buffer.concat([header, compressed])
  const file = []
  file.push(Buffer.from('EPHE', 'latin1'))
  const version = Buffer.alloc(4)
  version.writeInt32LE(2, 0)
  file.push(version)
  writeChunk(file, 'DSO ', payload)
  return Buffer.concat(file)
}

function main() {
  const check = process.argv.includes('--check')
  const csvs = csvPaths.map((p) => readFileSync(p, 'latin1'))
  const hashHex = createHash('sha256')
  for (const csv of csvs) hashHex.update(csv)
  const hash = hashHex.digest('hex')
  const objects = parseRows(csvs.flatMap((csv) => parseCsv(csv)))
  const seen = new Set()
  const unique = objects.filter((obj) => {
    const key = obj.designation
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const tiles = new Map()
  for (const obj of unique) {
    if (!tiles.has(obj.pix)) tiles.set(obj.pix, [])
    tiles.get(obj.pix).push(obj)
  }
  let bytes = 0
  for (const [pix, list] of tiles) {
    const buf = buildTile(pix, list)
    bytes += buf.length
    if (!check) {
      const dir = join(outDir, 'Norder0/Dir0')
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, `Npix${pix}.eph`), buf)
    }
  }
  const tileSummary = [...tiles.keys()].sort((a, b) => a - b)
    .map((pix) => `${pix}:${tiles.get(pix).length}`).join(' ')
  console.log(`objects=${unique.length} tiles=${tiles.size} bytes=${bytes}`)
  console.log(tileSummary)

  if (!check) {
    writeFileSync(join(outDir, 'properties'), [
      'obs_description          = OpenNGC deep-sky survey for Spica',
      'hips_release_date        = 2026-07-26T00:00Z',
      'hips_order_min           = 0',
      'type                     = dso',
      'hips_tile_format         = eph',
      `skysource_sha256         = ${hash}`,
      `source                   = OpenNGC NGC.csv @ commit ${OPENNGC_COMMIT}`,
      'source_url               = https://github.com/mattiaverga/OpenNGC',
      'source_license           = CC BY-SA 4.0',
      'generator                = scripts/make-dso.mjs',
      ''
    ].join('\n'))
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main()
}
