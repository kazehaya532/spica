import { Clock3, Crosshair, Eye, Globe2, Layers3, LocateFixed, MapPin, MoonStar, Search, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import StarMap3D, { type StarMapLayers } from '../components/StarMap3D'
import { celestialObjects } from '../data/celestial'
import { skyEntryById } from '../data/skyCatalog'
import { useObserverLocation } from '../hooks/useObserverLocation'
import { formatTime, getPlanetVisibility, getStargazingTargets, toDateTimeLocal } from '../lib/astronomy'

const initialLayers: StarMapLayers = {
  constellations: true,
  constellationArt: true,
  zodiacFocus: false,
  atmosphere: true,
  azimuthalGrid: false,
  equatorialGrid: false,
  deepSky: true,
  nightMode: false,
}

const layerOptions: Array<{ key: keyof StarMapLayers; label: string }> = [
  { key: 'constellations', label: 'Constellation lines' },
  { key: 'constellationArt', label: 'Constellation art' },
  { key: 'deepSky', label: 'Deep-sky objects' },
  { key: 'atmosphere', label: 'Earth atmosphere' },
  { key: 'azimuthalGrid', label: 'Azimuthal grid' },
  { key: 'equatorialGrid', label: 'Equatorial grid' },
  { key: 'nightMode', label: 'Red night mode' },
]

export default function ExplorePage() {
  const { location, status, requestDeviceLocation, saveLocation, useGlobalLocation } = useObserverLocation()
  const [date, setDate] = useState(() => new Date())
  const [live, setLive] = useState(true)
  const [layers, setLayers] = useState<StarMapLayers>(initialLayers)
  const [selectedId, setSelectedId] = useState('spica')
  const [search, setSearch] = useState('')
  const [showLayers, setShowLayers] = useState(false)
  const [showLocation, setShowLocation] = useState(false)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')

  useEffect(() => {
    if (!live) return
    const timer = window.setInterval(() => setDate(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [live])

  const planets = getPlanetVisibility(date, location)
  const tonightTargets = getStargazingTargets(date, location)
  const selectedObject = celestialObjects.find((object) => object.id === selectedId)
  const selectedPlanet = planets.find((planet) => planet.id === selectedId)
  const selectedCatalog = skyEntryById(selectedId)
  const searchTargets = [
    ...celestialObjects.map((object) => ({ id: object.id, name: object.name, detail: object.type })),
    ...planets.map((planet) => ({ id: planet.id, name: planet.name, detail: 'Planet' })),
  ].filter((target, index, list) => list.findIndex((item) => item.id === target.id) === index)
  const matches = search.trim().length > 1
    ? searchTargets.filter((target) => target.name.toLowerCase().includes(search.toLowerCase())).slice(0, 7)
    : []

  const toggleLayer = (key: keyof StarMapLayers) => setLayers((current) => ({ ...current, [key]: !current[key] }))
  const submitManualLocation = (event: React.FormEvent) => {
    event.preventDefault()
    const lat = Number(latitude); const lon = Number(longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return
    saveLocation({ latitude: lat, longitude: lon, label: `${Math.abs(lat).toFixed(1)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(1)}° ${lon >= 0 ? 'E' : 'W'}`, source: 'manual' })
    setShowLocation(false)
  }

  return (
    <main className="explore-page spica-explore">
      <section className="explore-hero">
        <div>
          <p className="eyebrow"><Sparkles size={14} /> Live observing desk</p>
          <h1>Meet the sky above you.</h1>
          <p>Look in any direction, move through time, and turn a field of lights into places you know.</p>
        </div>
        <div className="explore-hero-note">
          <span className="signal-dot" />
          <div><strong>{live ? 'Following the sky now' : 'Exploring another time'}</strong><small>Positions calculated for {location.label.toLowerCase()}</small></div>
        </div>
      </section>

      <section className="star-map-workspace" aria-label="Interactive star map">
        <div className="star-map-toolbar">
          <div className="sky-search">
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a star, planet, or deep-sky object" aria-label="Search the sky" />
            {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}
            {matches.length > 0 && (
              <div className="sky-search-results">
                {matches.map((target) => <button type="button" key={target.id} onClick={() => { setSelectedId(target.id); setSearch('') }}><span>{target.name}</span><small>{target.detail}</small></button>)}
              </div>
            )}
          </div>
          <div className="toolbar-actions">
            <button type="button" className={showLocation ? 'active' : ''} onClick={() => setShowLocation((value) => !value)}><MapPin size={16} /> {location.source === 'global' ? 'Set location' : location.label}</button>
            <button type="button" className={showLayers ? 'active' : ''} onClick={() => setShowLayers((value) => !value)}><Layers3 size={16} /> Layers</button>
          </div>
        </div>

        {(showLocation || showLayers) && (
          <div className="map-tool-drawer">
            {showLocation && (
              <div className="location-tool">
                <div><p className="tool-label">Observer location</p><p>Your coordinates never leave this browser. Spica stores only a low-precision copy on this device.</p></div>
                <div className="location-actions">
                  <button type="button" className="button-secondary" onClick={requestDeviceLocation} disabled={status === 'requesting'}><LocateFixed size={16} /> {status === 'requesting' ? 'Locating…' : 'Use my location'}</button>
                  <button type="button" className="button-quiet" onClick={useGlobalLocation}><Globe2 size={16} /> Global view</button>
                </div>
                <form className="coordinate-form" onSubmit={submitManualLocation}>
                  <label>Latitude<input inputMode="decimal" placeholder="51.50" value={latitude} onChange={(event) => setLatitude(event.target.value)} /></label>
                  <label>Longitude<input inputMode="decimal" placeholder="-0.12" value={longitude} onChange={(event) => setLongitude(event.target.value)} /></label>
                  <button className="button-quiet" type="submit">Use coordinates</button>
                </form>
                {(status === 'denied' || status === 'unavailable') && <p className="location-error">Location access was unavailable. Enter coordinates instead, or keep the global view.</p>}
              </div>
            )}
            {showLayers && (
              <div className="layer-tool">
                <p className="tool-label">Sky layers</p>
                <div className="layer-toggle-grid">
                  {layerOptions.map((option) => <label key={option.key} className={layers[option.key] ? 'is-on' : ''}><input type="checkbox" checked={layers[option.key]} onChange={() => toggleLayer(option.key)} /><span>{option.key === 'atmosphere' && !layers.atmosphere ? 'Airless space' : option.label}</span></label>)}
                </div>
                <div className="layer-toggle-section">
                  <p className="tool-label">Zodiac focus</p>
                  <label className={layers.zodiacFocus ? 'is-on' : ''}>
                    <input type="checkbox" checked={layers.zodiacFocus} onChange={() => toggleLayer('zodiacFocus')} />
                    <span>Highlight zodiac stars and ecliptic</span>
                  </label>
                  <small>Traditional 12 constellations along the zodiac belt. Ophiuchus is not included.</small>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="star-map-timebar">
          <label><Clock3 size={15} /><span className="sr-only">Map date and time</span><input type="datetime-local" value={toDateTimeLocal(date)} onChange={(event) => { setDate(new Date(event.target.value)); setLive(false) }} /></label>
          <div className="time-stepper">
            <button type="button" onClick={() => { setDate(new Date(date.getTime() - 3_600_000)); setLive(false) }}>−1 hour</button>
            <button type="button" className={live ? 'active' : ''} onClick={() => { setDate(new Date()); setLive(true) }}>Now</button>
            <button type="button" onClick={() => { setDate(new Date(date.getTime() + 3_600_000)); setLive(false) }}>+1 hour</button>
          </div>
        </div>

        <StarMap3D date={date} location={location} layers={layers} selectedId={selectedId} onSelect={setSelectedId} />

        {(selectedObject || selectedPlanet || selectedCatalog) && (
          <div className="map-selection-card">
            <span className="object-symbol">{selectedPlanet ? '●' : selectedCatalog?.kind === 'star' ? '✦' : '◌'}</span>
            <div>
              <p className="tool-label">Selected in sky</p>
              <h2>{selectedObject?.name ?? selectedPlanet?.name ?? selectedCatalog?.name}</h2>
              <p>{selectedPlanet?.status ?? selectedObject?.summary ?? `${selectedCatalog?.kind ?? 'Celestial object'} plotted from catalog coordinates.`}</p>
            </div>
            {selectedObject && <a href={`/objects/${selectedObject.id}`} className="button-quiet">Open field guide</a>}
          </div>
        )}
      </section>

      <section className="tonight-grid">
        <article className="observing-panel planets-panel">
          <div className="panel-heading"><div><p className="eyebrow"><MoonStar size={14} /> Planets tonight</p><h2>What’s moving through the sky</h2></div><span>{location.source === 'global' ? 'Global orientation' : 'Local horizon'}</span></div>
          <div className="planet-list">
            {planets.map((planet) => (
              <button type="button" key={planet.id} className={selectedId === planet.id ? 'selected' : ''} onClick={() => setSelectedId(planet.id)}>
                <span className={`planet-dot planet-${planet.id}`} />
                <span><strong>{planet.name}</strong><small>{planet.status}</small></span>
                <span className="planet-meta">{planet.magnitude.toFixed(1)} mag{planet.rise && <small>Rise {formatTime(planet.rise)}</small>}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="observing-panel targets-panel">
          <div className="panel-heading"><div><p className="eyebrow"><Eye size={14} /> Stargazing tonight</p><h2>Start with these</h2></div><span>Best 6 PM–5 AM</span></div>
          {location.source === 'global' && <p className="panel-advice"><Crosshair size={16} /> Set your location for an exact local shortlist. These picks use an equatorial reference view.</p>}
          <div className="target-list">
            {tonightTargets.map((target, index) => (
              <button type="button" key={target.id} onClick={() => setSelectedId(target.id)}>
                <span className="target-rank">{String(index + 1).padStart(2, '0')}</span>
                <span><strong>{target.name}</strong><small>{target.kind} · {target.direction} · peaks {Math.round(target.bestAltitude)}° high</small></span>
                <span>{formatTime(target.bestTime)}</span>
              </button>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}
