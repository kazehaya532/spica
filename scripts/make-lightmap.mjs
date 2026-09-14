import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fromFile } from 'geotiff'

const DOI = '10.5880/GFZ.1.4.2016.001'
const MAGIC = 'SPICALP1'
const HEADER_SIZE = 36
const MIN_LOG = -3
const MAX_LOG = 2.4
const MAX_SIZE = 2.5 * 1024 * 1024
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const input = args.find((arg) => !arg.startsWith('--'))
const output = resolve(root, args.find((arg) => arg.startsWith('--output='))?.slice(9) ?? 'public/lightmap/spica-lightmap.bin')
const step = Number(args.find((arg) => arg.startsWith('--step='))?.slice(7) ?? 0.1)

if (!input || !args.includes(`--source-doi=${DOI}`)) {
  throw new Error(`Usage: npm run build:lightmap -- <authorized-atlas.tif> --source-doi=${DOI} [--step=0.1]`)
}
if (!Number.isFinite(step) || step <= 0 || 360 / step > 65_535 || 180 / step > 65_535 ||
    !Number.isInteger(360 / step) || !Number.isInteger(180 / step)) {
  throw new Error('Step must divide both 360 and 180 into a global uint16 grid.')
}

function quantize(value, noData) {
  if (!Number.isFinite(value) || (noData !== null && value === noData) || value < 0) return 255
  if (value === 0) return 0
  const normalized = (Math.log10(value) - MIN_LOG) / (MAX_LOG - MIN_LOG)
  return Math.max(1, Math.min(254, Math.round(1 + normalized * 253)))
}

function writeVarint(value, bytes) {
  while (value >= 0x80) {
    bytes.push((value & 0x7f) | 0x80)
    value >>>= 7
  }
  bytes.push(value)
}

function encode(values, metadata) {
  const runs = []
  for (let index = 0; index < values.length;) {
    let end = index + 1
    while (end < values.length && values[end] === values[index]) end += 1
    writeVarint(end - index, runs)
    runs.push(values[index])
    index = end
  }
  const buffer = Buffer.allocUnsafe(HEADER_SIZE + runs.length)
  buffer.write(MAGIC, 0, 'ascii')
  buffer.writeUInt16LE(metadata.width, 8)
  buffer.writeUInt16LE(metadata.height, 10)
  buffer.writeFloatLE(-180, 12)
  buffer.writeFloatLE(90, 16)
  buffer.writeFloatLE(step, 20)
  buffer.writeFloatLE(MIN_LOG, 24)
  buffer.writeFloatLE(MAX_LOG, 28)
  buffer.writeUInt32LE(values.length, 32)
  Buffer.from(runs).copy(buffer, HEADER_SIZE)
  return buffer
}

const sourcePath = resolve(process.cwd(), input)
const tiff = await fromFile(sourcePath)
const image = await tiff.getImage()
const geoKeys = image.getGeoKeys()
if (geoKeys?.GTModelTypeGeoKey !== 2 || geoKeys?.GeogAngularUnitsGeoKey !== 9102 || image.getSamplesPerPixel() !== 1) {
  throw new Error('The source must be a single-band geographic GeoTIFF in longitude/latitude degrees.')
}
const [sourceWest, sourceSouth, sourceEast, sourceNorth] = image.getBoundingBox()
if (![sourceWest, sourceSouth, sourceEast, sourceNorth].every(Number.isFinite) || sourceEast <= sourceWest || sourceNorth <= sourceSouth) {
  throw new Error('The source GeoTIFF does not expose a valid geographic bounding box.')
}
if (sourceWest < -180.01 || sourceEast > 180.01 || sourceSouth < -90.01 || sourceNorth > 90.01 ||
    sourceEast - sourceWest < 350 || sourceNorth - sourceSouth < 130) {
  throw new Error('The source GeoTIFF does not have the expected near-global longitude/latitude coverage.')
}
const sourceWidth = Math.max(1, Math.round((sourceEast - sourceWest) / step))
const sourceHeight = Math.max(1, Math.round((sourceNorth - sourceSouth) / step))
const raster = await image.readRasters({ width: sourceWidth, height: sourceHeight, interleave: true, resampleMethod: 'bilinear' })
const width = Math.round(360 / step)
const height = Math.round(180 / step)
const values = new Uint8Array(width * height).fill(255)
const noData = image.getGDALNoData()

for (let row = 0; row < sourceHeight; row += 1) {
  const latitude = sourceNorth - (row + 0.5) * (sourceNorth - sourceSouth) / sourceHeight
  const targetRow = Math.min(height - 1, Math.max(0, Math.floor((90 - latitude) / step)))
  for (let column = 0; column < sourceWidth; column += 1) {
    const longitude = sourceWest + (column + 0.5) * (sourceEast - sourceWest) / sourceWidth
    const targetColumn = Math.min(width - 1, Math.max(0, Math.floor((longitude + 180) / step)))
    values[targetRow * width + targetColumn] = quantize(raster[row * sourceWidth + column], noData)
  }
}

const encoded = encode(values, { width, height })
if (encoded.byteLength > MAX_SIZE) {
  throw new Error(`Encoded map is ${(encoded.byteLength / 1024 / 1024).toFixed(2)} MiB. Re-run with --step=0.15 or a larger value.`)
}
mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, encoded)
console.log(`Created ${output} (${width}×${height}, ${(encoded.byteLength / 1024 / 1024).toFixed(2)} MiB) from ${DOI}.`)
