const MAGIC = 'SPICALP1'
const HEADER_SIZE = 36
const MAX_ENCODED_BYTES = 2.5 * 1024 * 1024
const MAX_CELLS = 7_000_000
export const NATURAL_SKY_BRIGHTNESS = 0.171168465

export interface LightMap {
  width: number
  height: number
  west: number
  north: number
  step: number
  minLog: number
  maxLog: number
  values: Uint8Array
}

export interface SkyDarkness {
  artificialBrightness: number
  totalBrightness: number
  naturalRatio: number
  sqm: number
  nelm: number
  bortle: number
  label: string
}

function readVarint(bytes: Uint8Array, offset: number): [number, number] {
  let value = 0
  let shift = 0
  while (offset < bytes.length && shift <= 28) {
    const byte = bytes[offset++]
    value |= (byte & 0x7f) << shift
    if ((byte & 0x80) === 0) return [value >>> 0, offset]
    shift += 7
  }
  throw new Error('Invalid light-pollution map encoding.')
}

export function decodeLightMap(buffer: ArrayBuffer): LightMap {
  if (buffer.byteLength < HEADER_SIZE) throw new Error('Light-pollution map is incomplete.')
  if (buffer.byteLength > MAX_ENCODED_BYTES) throw new Error('Light-pollution map exceeds the supported size.')
  const bytes = new Uint8Array(buffer)
  const magic = String.fromCharCode(...bytes.subarray(0, MAGIC.length))
  if (magic !== MAGIC) throw new Error('Unsupported light-pollution map.')
  const view = new DataView(buffer)
  const width = view.getUint16(8, true)
  const height = view.getUint16(10, true)
  const west = view.getFloat32(12, true)
  const north = view.getFloat32(16, true)
  const step = view.getFloat32(20, true)
  const minLog = view.getFloat32(24, true)
  const maxLog = view.getFloat32(28, true)
  const cellCount = view.getUint32(32, true)
  if (!width || !height || cellCount > MAX_CELLS || cellCount !== width * height || !Number.isFinite(west) || !Number.isFinite(north) ||
      !Number.isFinite(step) || step <= 0 || !Number.isFinite(minLog) || !Number.isFinite(maxLog) || minLog >= maxLog) {
    throw new Error('Invalid light-pollution map metadata.')
  }
  if (Math.abs(width * step - 360) > 0.01 || Math.abs(height * step - 180) > 0.01) {
    throw new Error('Light-pollution map is not a global grid.')
  }
  const values = new Uint8Array(cellCount)
  let input = HEADER_SIZE
  let output = 0
  while (input < bytes.length && output < cellCount) {
    let length
    ;[length, input] = readVarint(bytes, input)
    if (!length || input >= bytes.length || output + length > cellCount) throw new Error('Invalid light-pollution map run.')
    values.fill(bytes[input++], output, output + length)
    output += length
  }
  if (output !== cellCount || input !== bytes.length) throw new Error('Light-pollution map has unexpected data.')
  return { width, height, west, north, step, minLog, maxLog, values }
}

export async function fetchLightMap(url: string, signal: AbortSignal): Promise<LightMap> {
  const response = await fetch(url, { signal, credentials: 'same-origin' })
  if (!response.ok) throw new Error(response.status === 404 ? 'Sky-darkness data is not installed in this build.' : 'Sky-darkness data could not be loaded.')
  const buffer = await response.arrayBuffer()
  const contentType = response.headers?.get('content-type') ?? ''
  const prefix = new TextDecoder().decode(buffer.slice(0, 32)).trimStart().toLowerCase()
  if (contentType.includes('text/html') || prefix.startsWith('<!doctype') || prefix.startsWith('<html')) {
    throw new Error('Sky-darkness data is not installed in this build.')
  }
  return decodeLightMap(buffer)
}

export function decodeBrightness(code: number, minLog: number, maxLog: number): number | null {
  if (code === 255) return null
  if (code === 0) return 0
  return 10 ** (minLog + (code - 1) / 253 * (maxLog - minLog))
}

export function lookupBrightness(map: LightMap, latitude: number, longitude: number): number | null {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  const wrappedLongitude = ((longitude - map.west) % 360 + 360) % 360 + map.west
  const column = Math.min(map.width - 1, Math.max(0, Math.floor((wrappedLongitude - map.west) / map.step)))
  const row = Math.min(map.height - 1, Math.max(0, Math.floor((map.north - Math.max(-90, Math.min(90, latitude))) / map.step)))
  return decodeBrightness(map.values[row * map.width + column], map.minLog, map.maxLog)
}

const BORTLE_CLASSES = [
  { minimum: 21.99, bortle: 1, label: 'Excellent dark-sky site' },
  { minimum: 21.89, bortle: 2, label: 'Typical dark site' },
  { minimum: 21.69, bortle: 3, label: 'Rural sky' },
  { minimum: 20.49, bortle: 4, label: 'Rural–suburban transition' },
  { minimum: 19.5, bortle: 5, label: 'Suburban sky' },
  { minimum: 18.94, bortle: 6, label: 'Bright suburban sky' },
  { minimum: 18.38, bortle: 7, label: 'Suburban–urban transition' },
  { minimum: 17.8, bortle: 8, label: 'City sky' },
  { minimum: -Infinity, bortle: 9, label: 'Inner-city sky' }
] as const

export function deriveSkyDarkness(artificialBrightness: number): SkyDarkness | null {
  if (!Number.isFinite(artificialBrightness) || artificialBrightness < 0) return null
  const totalBrightness = artificialBrightness + NATURAL_SKY_BRIGHTNESS
  const sqm = Math.log10(totalBrightness / 108_000_000) / -0.4
  const nelm = 7.93 - 5 * Math.log10(10 ** (4.316 - sqm / 5) + 1)
  const rating = BORTLE_CLASSES.find((entry) => sqm + 1e-9 >= entry.minimum)!
  return {
    artificialBrightness,
    totalBrightness,
    naturalRatio: totalBrightness / NATURAL_SKY_BRIGHTNESS,
    sqm,
    nelm,
    bortle: rating.bortle,
    label: rating.label
  }
}
