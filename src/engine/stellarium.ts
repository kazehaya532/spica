import {
  dateToMjd,
  formatDegrees,
  formatRightAscension,
  type SkyTarget
} from '../lib/astronomy'

export type LayerId = 'constellations' | 'atmosphere' | 'landscape' | 'azimuthal' | 'equatorial' | 'deepSky' | 'milkyWay'

interface StelObject {
  designations(): string[]
  getInfo(key: string, observer?: StelObserver): unknown
  update?(): void
}

interface StelObserver {
  latitude: number
  longitude: number
  elevation: number
  utc: number
  yaw: number
  pitch: number
  clone(): StelObserver
  destroy(): void
}

interface ToggleModule {
  visible: boolean
  hints_visible?: boolean
  hints_mag_offset?: number
  addDataSource?: (source: { url: string; key?: string }) => void
}

interface StelCore {
  observer: StelObserver
  selection: StelObject | null
  lock: StelObject | null
  time_speed: number
  fov: number
  stars: ToggleModule
  dsos: ToggleModule
  landscapes: ToggleModule
  milkyway: ToggleModule
  planets: ToggleModule
  skycultures: ToggleModule & { current_id?: string }
  constellations: ToggleModule & {
    lines_visible: boolean
    labels_visible: boolean
    images_visible: boolean
    show_only_pointed: boolean
  }
  atmosphere: ToggleModule
  lines: {
    azimuthal: ToggleModule
    equatorial: ToggleModule
  }
}

export interface StellariumEngine {
  core: StelCore
  observer: StelObserver
  D2R: number
  getObj(id: string): StelObject | null
  getObjByHip?(hip: number): StelObject | null
  pointAndLock(object: StelObject, duration?: number, fov?: number): void
  setFont(kind: 'regular' | 'bold', url: string, scale: number): void
  convertFrame(observer: StelObserver, from: string, to: string, position: unknown): unknown
  c2s(position: unknown): [number, number]
  anpm(angle: number): number
}

export interface SelectionInfo {
  name: string
  designation: string
  magnitude: string
  rightAscension: string
  declination: string
  azimuth: string
  altitude: string
  visibility: string
}

type EngineFactory = (options: {
  wasmFile: string
  canvas: HTMLCanvasElement
  translateFn: (_domain: string, text: string) => string
  onReady: (engine: StellariumEngine) => void
  onAbort: (reason: unknown) => void
}) => Promise<StellariumEngine>

function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`
  return new URL(`${base}${path}`, window.location.origin).href
}

export async function createStellarium(canvas: HTMLCanvasElement): Promise<StellariumEngine> {
  const moduleUrl = assetUrl('engine/stellarium-web-engine.js')
  const imported = await import(/* @vite-ignore */ moduleUrl) as { default: EngineFactory }

  const engine = await new Promise<StellariumEngine>((resolve, reject) => {
    imported.default({
      wasmFile: assetUrl('engine/stellarium-web-engine.wasm'),
      canvas,
      translateFn: (_domain, text) => text,
      onReady: resolve,
      onAbort: reject
    }).catch(reject)
  })

  engine.setFont('regular', assetUrl('fonts/Roboto-Regular.ttf'), 1.28)
  engine.setFont('bold', assetUrl('fonts/Roboto-Bold.ttf'), 1.28)

  const data = assetUrl('skydata/')
  engine.core.stars.addDataSource?.({ url: `${data}stars` })
  engine.core.skycultures.addDataSource?.({ url: `${data}skycultures/western`, key: 'western' })
  engine.core.skycultures.current_id = 'western'
  engine.core.dsos.addDataSource?.({ url: `${data}dso` })
  engine.core.landscapes.addDataSource?.({ url: `${data}landscapes/guereins`, key: 'guereins' })
  engine.core.milkyway.addDataSource?.({ url: `${data}surveys/milkyway` })
  engine.core.planets.addDataSource?.({ url: `${data}surveys/sso/moon`, key: 'moon' })
  engine.core.planets.addDataSource?.({ url: `${data}surveys/sso/sun`, key: 'sun' })
  engine.core.planets.addDataSource?.({ url: `${data}surveys/sso/moon`, key: 'default' })

  engine.core.observer.utc = dateToMjd(new Date())
  engine.core.observer.yaw = 0
  engine.core.observer.pitch = 30 * engine.D2R
  engine.core.fov = 100 * engine.D2R
  engine.core.time_speed = 1
  engine.core.constellations.show_only_pointed = false
  engine.core.constellations.lines_visible = true
  engine.core.constellations.labels_visible = true
  engine.core.constellations.images_visible = false
  engine.core.atmosphere.visible = true
  engine.core.dsos.visible = true
  engine.core.dsos.hints_visible = true
  engine.core.dsos.hints_mag_offset = 1
  engine.core.landscapes.visible = true
  engine.core.milkyway.visible = true

  return engine
}

export function setLayer(engine: StellariumEngine, layer: LayerId, visible: boolean): void {
  switch (layer) {
    case 'constellations':
      engine.core.constellations.lines_visible = visible
      engine.core.constellations.labels_visible = visible
      break
    case 'atmosphere':
      engine.core.atmosphere.visible = visible
      break
    case 'landscape':
      engine.core.landscapes.visible = visible
      break
    case 'azimuthal':
      engine.core.lines.azimuthal.visible = visible
      break
    case 'equatorial':
      engine.core.lines.equatorial.visible = visible
      break
    case 'deepSky':
      engine.core.dsos.visible = visible
      break
    case 'milkyWay':
      engine.core.milkyway.visible = visible
      break
  }
}

export interface TargetSearchOptions {
  timeoutMs?: number
  retryIntervalMs?: number
}

export async function centerTarget(
  engine: StellariumEngine,
  target: SkyTarget,
  options: TargetSearchOptions = {}
): Promise<boolean> {
  const timeoutMs = options.timeoutMs ?? 8_000
  const retryIntervalMs = options.retryIntervalMs ?? 300
  const deadline = Date.now() + timeoutMs

  do {
    for (const alias of target.aliases) {
      const hip = alias.match(/^HIP\s+(\d+)$/i)
      const object = hip && engine.getObjByHip
        ? engine.getObjByHip(Number(hip[1]))
        : engine.getObj(alias)
      if (object) {
        object.update?.()
        engine.core.selection = object
        engine.core.lock = object
        engine.pointAndLock(object, 0.7, 25 * engine.D2R)
        return true
      }
    }
    if (Date.now() >= deadline) break
    await new Promise((resolve) => window.setTimeout(resolve, retryIntervalMs))
  } while (true)

  return false
}

export function findNextNightMjd(
  startMjd: number,
  getSunAltitude: (mjd: number) => number
): number {
  const stepsPerDay = 24 * 60 / 5
  const roundedStart = Math.floor(startMjd * stepsPerDay) / stepsPerDay
  const darknessAltitude = -13 * Math.PI / 180

  for (let step = 0; step <= stepsPerDay; step++) {
    const candidate = roundedStart + step / stepsPerDay
    if (getSunAltitude(candidate) < darknessAltitude) {
      return step === 0 ? startMjd : candidate
    }
  }

  return startMjd
}

export function showTonight(engine: StellariumEngine): number {
  const sun = engine.getObj('NAME Sun')
  if (!sun) return engine.core.observer.utc

  const observer = engine.core.observer.clone()
  const startMjd = engine.core.observer.utc

  try {
    const nightMjd = findNextNightMjd(startMjd, (candidate) => {
      observer.utc = candidate
      const position = sun.getInfo('radec', observer)
      const observed = engine.convertFrame(observer, 'ICRF', 'OBSERVED', position)
      return engine.anpm(engine.c2s(observed)[1])
    })

    engine.core.observer.utc = nightMjd
    engine.core.atmosphere.visible = true
    engine.core.dsos.visible = true
    engine.core.dsos.hints_visible = true
    engine.core.milkyway.visible = true
    return nightMjd
  } finally {
    observer.destroy()
  }
}

function safeInfo(object: StelObject, key: string, observer?: StelObserver): unknown {
  try {
    return object.getInfo(key, observer)
  } catch {
    return undefined
  }
}

export function getSelectionInfo(engine: StellariumEngine): SelectionInfo | null {
  const object = engine.core.selection
  if (!object) return null

  const designations = object.designations?.() ?? []
  const rawName = designations.find((value) => value.startsWith('NAME ')) ?? designations[0] ?? 'Selected object'
  const name = rawName.replace(/^NAME /, '')
  const radecPosition = safeInfo(object, 'radec', engine.core.observer)
  const magnitude = safeInfo(object, 'vmag', engine.core.observer)

  let ra = Number.NaN
  let dec = Number.NaN
  let azimuth = Number.NaN
  let altitude = Number.NaN

  if (radecPosition) {
    try {
      const cirs = engine.convertFrame(engine.core.observer, 'ICRF', 'CIRS', radecPosition)
      ;[ra, dec] = engine.c2s(cirs)
      const observed = engine.convertFrame(engine.core.observer, 'ICRF', 'OBSERVED', radecPosition)
      ;[azimuth, altitude] = engine.c2s(observed)
    } catch {
      // Some transient objects do not expose all coordinate frames.
    }
  }

  return {
    name,
    designation: designations.find((value) => !value.startsWith('NAME ')) ?? rawName,
    magnitude: typeof magnitude === 'number' && Number.isFinite(magnitude) ? magnitude.toFixed(2) : 'Unknown',
    rightAscension: Number.isFinite(ra) ? formatRightAscension(ra) : 'Unknown',
    declination: Number.isFinite(dec) ? formatDegrees(dec) : 'Unknown',
    azimuth: Number.isFinite(azimuth) ? formatDegrees((azimuth + Math.PI * 2) % (Math.PI * 2), false) : 'Unknown',
    altitude: Number.isFinite(altitude) ? formatDegrees(altitude) : 'Unknown',
    visibility: Number.isFinite(altitude) ? (altitude > 0 ? 'Above the horizon' : 'Below the horizon') : 'Calculating'
  }
}
