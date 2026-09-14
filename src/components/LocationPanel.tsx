import { useEffect, useRef, useState, type FormEvent } from 'react'
import { LocateFixed, MapPinned, Mountain, Search, X } from 'lucide-react'
import { fetchTerrainElevation, formatObserverCoordinates, searchLocations, type LocationSearchResult, type ObserverLocation } from '../lib/location'
import { LocationMap } from './LocationMap'

interface LocationPanelProps {
  open: boolean
  location: ObserverLocation
  isOnline: boolean
  locating: boolean
  externalError: string
  onUseCurrentLocation: () => void
  onSave: (location: ObserverLocation) => void
  onClose: () => void
}

function locationDraft(location: Omit<ObserverLocation, 'elevation'> & { elevation?: number }) {
  return {
    label: location.label,
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    elevation: location.elevation === undefined ? '' : String(location.elevation),
    timezone: location.timezone
  }
}

export function LocationPanel({ open, location, isOnline, locating, externalError, onUseCurrentLocation, onSave, onClose }: LocationPanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const searchRequestRef = useRef<AbortController | null>(null)
  const elevationRequestRef = useRef<AbortController | null>(null)
  const [draft, setDraft] = useState(() => locationDraft(location))
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LocationSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [elevationLoading, setElevationLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!open) {
      searchRequestRef.current?.abort()
      searchRequestRef.current = null
      elevationRequestRef.current?.abort()
      elevationRequestRef.current = null
      setSearching(false)
      setElevationLoading(false)
      return
    }
    setDraft(locationDraft(location))
    setQuery('')
    setResults([])
    setSearchError('')
    setFormError('')
    window.requestAnimationFrame(() => panelRef.current?.focus())
  }, [open, location])

  useEffect(() => () => {
    searchRequestRef.current?.abort()
    elevationRequestRef.current?.abort()
  }, [])

  const runSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isOnline) return
    if (query.trim().length < 2) {
      setSearchError('Enter at least two characters of a place name or postcode.')
      return
    }
    searchRequestRef.current?.abort()
    const controller = new AbortController()
    searchRequestRef.current = controller
    setSearching(true)
    setSearchError('')
    try {
      const matches = await searchLocations(query, controller.signal)
      if (searchRequestRef.current !== controller) return
      setResults(matches)
      if (!matches.length) setSearchError('No matching place was found. Try adding a country or region.')
    } catch (cause) {
      if (searchRequestRef.current !== controller) return
      setSearchError(cause instanceof Error ? cause.message : 'Place search could not be completed.')
    } finally {
      if (searchRequestRef.current === controller) {
        searchRequestRef.current = null
        setSearching(false)
      }
    }
  }

  const chooseResult = (result: LocationSearchResult) => {
    elevationRequestRef.current?.abort()
    elevationRequestRef.current = null
    setElevationLoading(false)
    setDraft(locationDraft(result))
    setQuery(result.label)
    setResults([])
    setSearchError('')
    setFormError('')
    if (result.elevation === undefined) void estimateElevation(result.latitude, result.longitude)
  }

  const estimateElevation = async (latitude: number, longitude: number) => {
    elevationRequestRef.current?.abort()
    const controller = new AbortController()
    elevationRequestRef.current = controller
    setElevationLoading(true)
    setFormError('')
    try {
      const elevation = await fetchTerrainElevation(latitude, longitude, controller.signal)
      if (elevationRequestRef.current === controller) {
        setDraft((current) => ({ ...current, elevation: String(Math.round(elevation)) }))
      }
    } catch (cause) {
      if (elevationRequestRef.current === controller) {
        setFormError(cause instanceof Error ? cause.message : 'Elevation could not be estimated. You can enter it manually.')
      }
    } finally {
      if (elevationRequestRef.current === controller) {
        elevationRequestRef.current = null
        setElevationLoading(false)
      }
    }
  }

  const pickMapLocation = (latitude: number, longitude: number) => {
    setDraft((current) => ({
      ...current,
      label: 'Map pin',
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
      timezone: undefined
    }))
    void estimateElevation(latitude, longitude)
  }

  const saveLocation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const latitude = Number(draft.latitude)
    const longitude = Number(draft.longitude)
    const elevation = Number(draft.elevation)
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setFormError('Latitude must be -90 to 90 and longitude must be -180 to 180.')
      return
    }
    if (!Number.isFinite(elevation)) {
      setFormError('Elevation must be a number in metres.')
      return
    }
    onSave({
      label: draft.label.trim() || 'Custom location',
      latitude,
      longitude,
      elevation,
      timezone: draft.timezone
    })
  }

  const latitude = Number(draft.latitude)
  const longitude = Number(draft.longitude)
  const mapLatitude = Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 ? latitude : location.latitude
  const mapLongitude = Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 ? longitude : location.longitude

  return (
    <aside
      ref={panelRef}
      className="location-panel"
      aria-labelledby="location-title"
      tabIndex={-1}
      hidden={!open}
      onKeyDown={(event) => { if (event.key === 'Escape') onClose() }}
    >
      <div className="panel-heading">
        <div><h2 id="location-title">Observer location</h2><p>{location.accuracy === undefined ? 'Search the world, choose a map point, or enter exact coordinates.' : `Last GPS fix: ${formatObserverCoordinates(location)}`}</p></div>
        <button className="icon-button" type="button" aria-label="Close location panel" onClick={onClose}><X /></button>
      </div>

      <div className="location-workspace">
        <div className="location-entry">
          <form className="place-search" role="search" onSubmit={runSearch}>
            <label htmlFor="place-search">Find a place or postcode</label>
            <div><Search aria-hidden="true" /><input id="place-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Jakarta, Indonesia" autoComplete="off" /><button type="submit" disabled={!isOnline || searching}>{searching ? 'Searching…' : 'Search'}</button></div>
          </form>
          {results.length > 0 && (
            <div className="place-results" role="listbox" aria-label="Place search results">
              {results.map((result) => (
                <button key={result.id} type="button" role="option" aria-selected="false" onClick={() => chooseResult(result)}>
                  <MapPinned aria-hidden="true" /><span><strong>{result.label}</strong><small>{result.latitude.toFixed(4)}°, {result.longitude.toFixed(4)}°{result.elevation === undefined ? ' · elevation after selection' : ` · ${Math.round(result.elevation)} m`}</small></span>
                </button>
              ))}
            </div>
          )}
          {searchError && <p className="form-error" role="alert">{searchError}</p>}
          {!isOnline && <p className="location-network-note">Place search and the map need a connection. Manual coordinates remain available.</p>}
          <p className="location-provider-note">Search by <a href="https://photon.komoot.io/" target="_blank" rel="noreferrer">Photon</a> using <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>, with Open-Meteo fallback. Searches send your query; selections send coordinates for elevation.</p>

          <button className="primary-action" type="button" disabled={locating} onClick={onUseCurrentLocation}>
            <LocateFixed /> {locating ? 'Finding your position…' : 'Use my current position'}
          </button>

          <div className="panel-divider"><span>review selected coordinates</span></div>
          <form className="coordinate-form" onSubmit={saveLocation}>
            <label>Place name<input name="label" value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} /></label>
            <div className="coordinate-row">
              <label>Latitude<input name="latitude" type="number" step="any" min="-90" max="90" value={draft.latitude} onChange={(event) => setDraft((current) => ({ ...current, latitude: event.target.value, timezone: undefined }))} required /></label>
              <label>Longitude<input name="longitude" type="number" step="any" min="-180" max="180" value={draft.longitude} onChange={(event) => setDraft((current) => ({ ...current, longitude: event.target.value, timezone: undefined }))} required /></label>
            </div>
            <label>Elevation in metres<span className="elevation-input"><Mountain aria-hidden="true" /><input name="elevation" type="number" step="any" value={draft.elevation} onChange={(event) => setDraft((current) => ({ ...current, elevation: event.target.value }))} required /></span></label>
            {elevationLoading && <p className="field-status" role="status">Estimating terrain elevation…</p>}
            {(externalError || formError) && <p className="form-error" role="alert">{externalError || formError}</p>}
            <button className="secondary-action" type="submit" disabled={elevationLoading}>Set observer location</button>
          </form>
        </div>

        <LocationMap open={open} isOnline={isOnline} latitude={mapLatitude} longitude={mapLongitude} onPick={pickMapLocation} />
      </div>
    </aside>
  )
}
