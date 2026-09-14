export interface ObserverLocation {
  label: string
  latitude: number
  longitude: number
  elevation: number
  timezone?: string
  accuracy?: number
}

export interface LocationSearchResult extends Omit<ObserverLocation, 'elevation'> {
  id: string
  detail: string
  elevation?: number
}

export function formatObserverCoordinates(location: ObserverLocation): string {
  const lat = `${Math.abs(location.latitude).toFixed(4)}°${location.latitude >= 0 ? 'N' : 'S'}`
  const lon = `${Math.abs(location.longitude).toFixed(4)}°${location.longitude >= 0 ? 'E' : 'W'}`
  const accuracy = location.accuracy === undefined
    ? ''
    : location.accuracy < 1_000
      ? `, ±${Math.round(location.accuracy)} m`
      : `, ±${(location.accuracy / 1_000).toFixed(1)} km`
  return `${lat}, ${lon}${accuracy}`
}

const PHOTON_URL = 'https://photon.komoot.io/api'
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation'

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function uniqueContext(name: string, values: Array<string | undefined>): string[] {
  const seen = new Set([name.toLocaleLowerCase()])
  return values.filter((value): value is string => {
    if (!value) return false
    const normalized = value.toLocaleLowerCase()
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

function parseOpenMeteoResult(value: unknown): LocationSearchResult | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const id = finiteNumber(record.id)
  const name = optionalString(record.name)
  const latitude = finiteNumber(record.latitude)
  const longitude = finiteNumber(record.longitude)
  if (id === null || !name || latitude === null || longitude === null ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null

  const admin1 = optionalString(record.admin1)
  const country = optionalString(record.country)
  const admin2 = optionalString(record.admin2)
  const context = uniqueContext(name, [admin2, admin1, country])
  return {
    id: `geonames-${id}`,
    label: [name, ...context].join(', '),
    detail: context.join(', '),
    latitude,
    longitude,
    elevation: finiteNumber(record.elevation) ?? 0,
    timezone: optionalString(record.timezone)
  }
}

function parsePhotonFeature(value: unknown): LocationSearchResult | null {
  if (!value || typeof value !== 'object') return null
  const feature = value as Record<string, unknown>
  if (!feature.properties || typeof feature.properties !== 'object' || !feature.geometry || typeof feature.geometry !== 'object') return null
  const properties = feature.properties as Record<string, unknown>
  const geometry = feature.geometry as Record<string, unknown>
  const coordinates = Array.isArray(geometry.coordinates) ? geometry.coordinates : []
  const longitude = finiteNumber(coordinates[0])
  const latitude = finiteNumber(coordinates[1])
  const name = optionalString(properties.name)
  const osmType = optionalString(properties.osm_type)
  const osmId = finiteNumber(properties.osm_id)
  if (!name || !osmType || osmId === null || latitude === null || longitude === null ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null

  const context = uniqueContext(name, [
    optionalString(properties.district),
    optionalString(properties.city),
    optionalString(properties.county),
    optionalString(properties.state),
    optionalString(properties.country)
  ])
  return {
    id: `osm-${osmType}-${osmId}`,
    label: [name, ...context].join(', '),
    detail: context.join(', '),
    latitude,
    longitude
  }
}

async function searchPhoton(query: string, signal: AbortSignal): Promise<LocationSearchResult[]> {
  const url = new URL(PHOTON_URL)
  url.search = new URLSearchParams({ q: query, limit: '8', lang: 'en' }).toString()
  const response = await fetch(url, { signal, credentials: 'omit' })
  if (!response.ok) throw new Error('Photon place search is unavailable.')
  const body = await response.json() as { features?: unknown }
  return Array.isArray(body.features) ? body.features.map(parsePhotonFeature).filter((result): result is LocationSearchResult => result !== null) : []
}

async function searchOpenMeteo(query: string, signal: AbortSignal): Promise<LocationSearchResult[]> {
  const url = new URL(GEOCODING_URL)
  url.search = new URLSearchParams({ name: query, count: '8', language: 'en', format: 'json' }).toString()
  const response = await fetch(url, { signal, credentials: 'omit' })
  if (!response.ok) throw new Error('Place search is unavailable. Check your connection and try again.')
  const body = await response.json() as { results?: unknown }
  return Array.isArray(body.results) ? body.results.map(parseOpenMeteoResult).filter((result): result is LocationSearchResult => result !== null) : []
}

export async function searchLocations(query: string, signal: AbortSignal): Promise<LocationSearchResult[]> {
  const normalized = query.trim()
  if (normalized.length < 2) return []
  try {
    const results = await searchPhoton(normalized, signal)
    if (results.length) return results
  } catch (cause) {
    if (signal.aborted) throw cause
  }
  return searchOpenMeteo(normalized, signal)
}

export async function fetchTerrainElevation(latitude: number, longitude: number, signal: AbortSignal): Promise<number> {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('Elevation requires valid latitude and longitude.')
  }
  const url = new URL(ELEVATION_URL)
  url.search = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude) }).toString()
  const response = await fetch(url, { signal, credentials: 'omit' })
  if (!response.ok) throw new Error('Elevation could not be estimated. You can enter it manually.')
  const body = await response.json() as { elevation?: unknown }
  const elevation = Array.isArray(body.elevation) ? finiteNumber(body.elevation[0]) : null
  if (elevation === null) throw new Error('Elevation could not be estimated. You can enter it manually.')
  return elevation
}
