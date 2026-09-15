import type { StellariumDrawObject, StellariumEngine, StellariumLayer } from './stellarium'

export interface AsterismLineSource {
  id: string
  name: string
  segments: number[][]
}

export const ASTERISM_LINE_COLOR = '#ffc36b'
const ASTERISM_LAYER_Z = 25 // Same band as the constellation line modules.

export interface AsterismFeatureCollection {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    properties: {
      stroke: string
      'stroke-width': number
      'stroke-opacity': number
    }
    geometry: {
      type: 'LineString'
      coordinates: Array<[number, number]>
    }
  }>
}

// Pure builder: one gold LineString per asterism segment whose stars all
// resolved. Asterisms with any missing star are skipped entirely so a failed
// catalog lookup can never draw a line to the wrong place.
export function buildAsterismFeatures(
  source: AsterismLineSource[],
  positions: Map<number, [number, number]>
): AsterismFeatureCollection {
  const features: AsterismFeatureCollection['features'] = []
  for (const asterism of source) {
    for (const segment of asterism.segments) {
      const coordinates: Array<[number, number]> = []
      for (const hip of segment) {
        const position = positions.get(hip)
        if (!position) break
        coordinates.push(position)
      }
      if (coordinates.length !== segment.length) continue
      features.push({
        type: 'Feature',
        properties: {
          stroke: ASTERISM_LINE_COLOR,
          'stroke-width': 2,
          'stroke-opacity': 0.85
        },
        geometry: { type: 'LineString', coordinates }
      })
    }
  }
  return { type: 'FeatureCollection', features }
}

// The engine's 'radec' info is an ICRF cartesian unit vector; the geojson
// layer expects [RA degrees, Dec degrees] in the same ICRF frame.
export function icrfToDegrees(position: unknown): [number, number] | null {
  if (!Array.isArray(position) || position.length < 3) return null
  const [x, y, z] = position as number[]
  if (![x, y, z].every(Number.isFinite)) return null
  const norm = Math.hypot(x, y, z)
  if (!(norm > 0)) return null
  const ra = (Math.atan2(y, x) * 180) / Math.PI
  const dec = (Math.asin(z / norm) * 180) / Math.PI
  return [((ra % 360) + 360) % 360, dec]
}

interface InstalledDrawing {
  layer: StellariumLayer
  drawing: StellariumDrawObject | null
}

const installedDrawings = new WeakMap<StellariumEngine, InstalledDrawing>()

// Draws exactly one asterism on the sky — the one the user asked to see via
// "Center in the sky". A later call replaces the previous pattern, so the sky
// never accumulates drawings the reader did not request.
export async function showAsterismDrawing(
  engine: StellariumEngine,
  asterism: AsterismLineSource,
  options: { timeoutMs?: number; retryIntervalMs?: number } = {}
): Promise<boolean> {
  const timeoutMs = options.timeoutMs ?? 8_000
  const retryIntervalMs = options.retryIntervalMs ?? 300
  const deadline = Date.now() + timeoutMs
  const wantedHips = new Set(asterism.segments.flat())
  const positions = new Map<number, [number, number]>()

  do {
    for (const hip of wantedHips) {
      if (positions.has(hip)) continue
      const star = engine.getObjByHip?.(hip)
      if (!star) continue
      const degrees = icrfToDegrees(safeRadec(star))
      if (degrees) positions.set(hip, degrees)
    }
    if (positions.size >= wantedHips.size) break
    await new Promise((resolve) => window.setTimeout(resolve, retryIntervalMs))
  } while (Date.now() < deadline)

  const data = buildAsterismFeatures([asterism], positions)
  if (data.features.length === 0) return false

  const installed = installedDrawings.get(engine) ?? {
    layer: engine.createLayer({ id: 'spica-asterism', z: ASTERISM_LAYER_Z, visible: true }),
    drawing: null as StellariumDrawObject | null
  }
  if (installed.drawing) installed.layer.remove(installed.drawing)
  installed.drawing = engine.createObj('geojson', { data })
  installed.layer.add(installed.drawing)
  installedDrawings.set(engine, installed)
  return true
}

// Clears the current pattern drawing (next center/search replaces the view).
export function clearAsterismDrawing(engine: StellariumEngine): void {
  const installed = installedDrawings.get(engine)
  if (!installed || !installed.drawing) return
  installed.layer.remove(installed.drawing)
  installed.drawing = null
}

function safeRadec(star: { getInfo(key: string): unknown }): unknown {
  try {
    return star.getInfo('radec')
  } catch {
    return null
  }
}
