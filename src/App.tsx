import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  Asterisk,
  CircleHelp,
  CloudSun,
  Crosshair,
  Eye,
  Flashlight,
  Grid3X3,
  LocateFixed,
  MapPin,
  Maximize2,
  Minus,
  Mountain,
  MoonStar,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Sunset,
  Telescope,
  Waves,
  X
} from 'lucide-react'
import {
  centerTarget,
  createStellarium,
  getSelectionInfo,
  setLayer,
  showTonight,
  type LayerId,
  type SelectionInfo,
  type StellariumEngine
} from './engine/stellarium'
import { dateToMjd, mjdToDate, SKY_TARGETS, toDateTimeInput, type SkyTarget } from './lib/astronomy'

type EngineStatus = 'loading' | 'ready' | 'error'

interface ObserverLocation {
  label: string
  latitude: number
  longitude: number
  elevation: number
}

const DEFAULT_LOCATION: ObserverLocation = {
  label: 'Greenwich, London',
  latitude: 51.4769,
  longitude: 0,
  elevation: 46
}

const INITIAL_LAYERS: Record<LayerId, boolean> = {
  constellations: true,
  atmosphere: true,
  landscape: true,
  azimuthal: false,
  equatorial: false,
  deepSky: true,
  milkyWay: true
}

const LAYER_CONTROLS: Array<{
  id: LayerId
  label: string
  icon: typeof Sparkles
}> = [
  { id: 'constellations', label: 'Constellations', icon: Sparkles },
  { id: 'atmosphere', label: 'Atmosphere', icon: CloudSun },
  { id: 'landscape', label: 'Landscape', icon: Mountain },
  { id: 'azimuthal', label: 'Horizon grid', icon: Grid3X3 },
  { id: 'equatorial', label: 'Equatorial grid', icon: Crosshair },
  { id: 'deepSky', label: 'Deep sky', icon: Telescope },
  { id: 'milkyWay', label: 'Milky Way', icon: Waves }
]

function getStoredLocation(): ObserverLocation {
  try {
    const value = window.localStorage.getItem('spica-location')
    return value ? { ...DEFAULT_LOCATION, ...JSON.parse(value) as ObserverLocation } : DEFAULT_LOCATION
  } catch {
    return DEFAULT_LOCATION
  }
}

function formatLocation(location: ObserverLocation): string {
  const lat = `${Math.abs(location.latitude).toFixed(2)}°${location.latitude >= 0 ? 'N' : 'S'}`
  const lon = `${Math.abs(location.longitude).toFixed(2)}°${location.longitude >= 0 ? 'E' : 'W'}`
  return `${lat}, ${lon}`
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<StellariumEngine | null>(null)
  const locationRef = useRef<ObserverLocation>(getStoredLocation())
  const [engineStatus, setEngineStatus] = useState<EngineStatus>('loading')
  const [engineError, setEngineError] = useState('')
  const [selection, setSelection] = useState<SelectionInfo | null>(null)
  const [location, setLocation] = useState<ObserverLocation>(locationRef.current)
  const [locationOpen, setLocationOpen] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [layers, setLayers] = useState(INITIAL_LAYERS)
  const [skyDate, setSkyDate] = useState(new Date())
  const [speed, setSpeed] = useState(1)
  const lastSpeedRef = useRef(1)
  const searchRequestRef = useRef(0)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')
  const [searching, setSearching] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [redMode, setRedMode] = useState(() => window.localStorage.getItem('spica-red-mode') === 'true')
  const [nightSky, setNightSky] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let active = true
    let interval = 0

    createStellarium(canvas).then((engine) => {
      if (!active) return
      engineRef.current = engine
      const currentLocation = locationRef.current
      engine.core.observer.latitude = currentLocation.latitude * engine.D2R
      engine.core.observer.longitude = currentLocation.longitude * engine.D2R
      engine.core.observer.elevation = currentLocation.elevation
      const nightMjd = showTonight(engine)
      setSkyDate(mjdToDate(nightMjd))
      setNightSky(true)
      setEngineStatus('ready')

      interval = window.setInterval(() => {
        setSkyDate(mjdToDate(engine.core.observer.utc))
        setSelection(getSelectionInfo(engine))
      }, 800)
    }).catch((error: unknown) => {
      if (!active) return
      setEngineStatus('error')
      setEngineError(error instanceof Error ? error.message : 'The sky renderer could not start.')
    })

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('spica-red-mode', String(redMode))
  }, [redMode])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const suggestions = SKY_TARGETS.filter((target) => {
    if (!normalizedQuery) return ['Moon', 'Jupiter', 'Saturn', 'Spica'].includes(target.name)
    return `${target.name} ${target.subtitle} ${target.kind} ${target.aliases.join(' ')} ${target.searchTerms?.join(' ') ?? ''}`.toLowerCase().includes(normalizedQuery)
  }).slice(0, 6)

  const updateLocation = (nextLocation: ObserverLocation) => {
    locationRef.current = nextLocation
    setLocation(nextLocation)
    window.localStorage.setItem('spica-location', JSON.stringify(nextLocation))
    const engine = engineRef.current
    if (engine) {
      engine.core.observer.latitude = nextLocation.latitude * engine.D2R
      engine.core.observer.longitude = nextLocation.longitude * engine.D2R
      engine.core.observer.elevation = nextLocation.elevation
      if (nightSky) {
        const nightMjd = showTonight(engine)
        setSkyDate(mjdToDate(nightMjd))
      }
    }
    setLocationOpen(false)
    setLocationError('')
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Location services are not available in this browser. Enter coordinates instead.')
      return
    }
    setLocating(true)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation({
          label: 'Current position',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          elevation: position.coords.altitude ?? 0
        })
        setLocating(false)
      },
      () => {
        setLocating(false)
        setLocationError('Location permission was denied. Enter coordinates or keep the current place.')
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 }
    )
  }

  const saveCoordinates = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const latitude = Number(form.get('latitude'))
    const longitude = Number(form.get('longitude'))
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setLocationError('Latitude must be -90 to 90 and longitude must be -180 to 180.')
      return
    }
    updateLocation({
      label: String(form.get('label') || 'Custom location'),
      latitude,
      longitude,
      elevation: Number(form.get('elevation')) || 0
    })
  }

  const chooseTarget = async (target: SkyTarget) => {
    const engine = engineRef.current
    if (!engine) return
    const requestId = ++searchRequestRef.current
    setQuery(target.name)
    setSearchOpen(false)
    setSearching(true)
    setSearchMessage(`Loading ${target.name} from the offline catalog…`)
    const found = await centerTarget(engine, target)
    if (requestId !== searchRequestRef.current) return
    setSearching(false)
    if (!found) {
      setSearchMessage(`${target.name} could not be found in the offline bright-object catalog.`)
      return
    }
    setSearchMessage('')
    window.setTimeout(() => setSelection(getSelectionInfo(engine)), 750)
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const target = suggestions[0]
    if (target) chooseTarget(target)
    else setSearchMessage(`No essential-catalog result for “${query}”.`)
  }

  const toggleLayer = (layer: LayerId) => {
    const engine = engineRef.current
    if (!engine) return
    const visible = !layers[layer]
    setLayer(engine, layer, visible)
    setLayers((current) => ({ ...current, [layer]: visible }))
  }

  const setDate = (date: Date) => {
    const engine = engineRef.current
    if (!engine || Number.isNaN(date.getTime())) return
    engine.core.observer.utc = dateToMjd(date)
    setSkyDate(date)
    setNightSky(false)
  }

  const stepTime = (hours: number) => {
    setDate(new Date(skyDate.getTime() + hours * 3_600_000))
  }

  const toggleTime = () => {
    const engine = engineRef.current
    if (!engine) return
    const nextSpeed = speed === 0 ? lastSpeedRef.current : 0
    engine.core.time_speed = nextSpeed
    setSpeed(nextSpeed)
  }

  const cycleSpeed = () => {
    const engine = engineRef.current
    if (!engine) return
    const speeds = [1, 60, 3600]
    const currentIndex = speeds.indexOf(speed)
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length]
    lastSpeedRef.current = nextSpeed
    engine.core.time_speed = nextSpeed
    setSpeed(nextSpeed)
  }

  const toggleNightSky = () => {
    const engine = engineRef.current
    if (!engine) return

    if (nightSky) {
      engine.core.observer.utc = dateToMjd(new Date())
      engine.core.time_speed = 1
      setSkyDate(new Date())
      setSpeed(1)
      setNightSky(false)
      return
    }

    const nightMjd = showTonight(engine)
    engine.core.time_speed = 1
    setSkyDate(mjdToDate(nightMjd))
    setSpeed(1)
    setNightSky(true)
    setLayers((current) => ({
      ...current,
      atmosphere: true,
      deepSky: true,
      milkyWay: true
    }))
  }

  const clearSelection = () => {
    const engine = engineRef.current
    if (engine) {
      engine.core.selection = null
      engine.core.lock = null
    }
    setSelection(null)
  }

  return (
    <main className="planetarium-shell">
      <canvas
        ref={canvasRef}
        className="sky-canvas"
        aria-label="Interactive night sky. Drag to look around and scroll or pinch to zoom."
        tabIndex={0}
      />
      <div className={`red-light-overlay ${redMode ? 'is-active' : ''}`} aria-hidden="true" />

      <header className="top-bar">
        <a className="brand" href="/" aria-label="Spica home">
          <span className="brand-mark" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}icons/spica-mark.svg`} alt="" />
          </span>
          <span>Spica</span>
        </a>

        <form className="search-box" role="search" onSubmit={submitSearch}>
          <Search aria-hidden="true" />
          <label className="sr-only" htmlFor="sky-search">Find a sky object</label>
          <input
            id="sky-search"
            type="search"
            placeholder="Find a planet, star, or nebula"
            value={query}
            autoComplete="off"
            aria-expanded={searchOpen}
            aria-controls="search-results"
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => {
              searchRequestRef.current += 1
              setQuery(event.target.value)
              setSearchOpen(true)
              setSearchMessage('')
              setSearching(false)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setSearchOpen(false)
            }}
          />
          {query && (
            <button className="icon-button search-clear" type="button" aria-label="Clear search" onClick={() => setQuery('')}>
              <X />
            </button>
          )}
          {searchOpen && (
            <div className="search-results" id="search-results">
              {suggestions.length > 0 ? suggestions.map((target) => (
                <button type="button" className="search-result" key={target.name} disabled={searching} onClick={() => chooseTarget(target)}>
                  <span className="result-symbol" aria-hidden="true"><Asterisk /></span>
                  <span><strong>{target.name}</strong><small>{target.subtitle}</small></span>
                  <span className="result-kind">{target.kind}</span>
                </button>
              )) : <p className="empty-result">No match in the essential catalog.</p>}
            </div>
          )}
        </form>

        <nav className="top-actions" aria-label="View actions">
          {!isOnline && <span className="offline-status">Offline</span>}
          <button
            className="location-button"
            type="button"
            aria-label={`Observer location: ${location.label}`}
            aria-expanded={locationOpen}
            onClick={() => setLocationOpen((open) => !open)}
          >
            <MapPin aria-hidden="true" />
            <span><strong>{location.label}</strong><small>{formatLocation(location)}</small></span>
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label={nightSky ? 'Return to the current sky' : 'Show tonight’s sky'}
            aria-pressed={nightSky}
            title={nightSky ? 'Return to now' : 'Show tonight’s sky'}
            disabled={engineStatus !== 'ready'}
            onClick={toggleNightSky}
          >
            <Sunset />
          </button>
          <button className="icon-button" type="button" aria-label="Toggle red-light mode" aria-pressed={redMode} title="Red-light mode" onClick={() => setRedMode((active) => !active)}>
            <Flashlight />
          </button>
          <button className="icon-button desktop-action" type="button" aria-label="Enter fullscreen" onClick={() => document.documentElement.requestFullscreen?.()}>
            <Maximize2 />
          </button>
          <button className="icon-button desktop-action" type="button" aria-label="Show controls help" aria-expanded={helpOpen} onClick={() => setHelpOpen((open) => !open)}>
            <CircleHelp />
          </button>
        </nav>
      </header>

      {searchMessage && <p className="toast" role="status">{searchMessage}</p>}

      {locationOpen && (
        <aside className="location-panel" aria-labelledby="location-title">
          <div className="panel-heading">
            <div><h2 id="location-title">Observer location</h2><p>The sky updates to this viewpoint.</p></div>
            <button className="icon-button" type="button" aria-label="Close location panel" onClick={() => setLocationOpen(false)}><X /></button>
          </div>
          <button className="primary-action" type="button" disabled={locating} onClick={useCurrentLocation}>
            <LocateFixed /> {locating ? 'Finding your position…' : 'Use my current position'}
          </button>
          <div className="panel-divider"><span>or enter coordinates</span></div>
          <form className="coordinate-form" onSubmit={saveCoordinates}>
            <label>Place name<input name="label" defaultValue={location.label} /></label>
            <div className="coordinate-row">
              <label>Latitude<input name="latitude" type="number" step="any" min="-90" max="90" defaultValue={location.latitude} required /></label>
              <label>Longitude<input name="longitude" type="number" step="any" min="-180" max="180" defaultValue={location.longitude} required /></label>
            </div>
            <label>Elevation in metres<input name="elevation" type="number" step="any" defaultValue={location.elevation} /></label>
            {locationError && <p className="form-error" role="alert">{locationError}</p>}
            <button className="secondary-action" type="submit">Set observer location</button>
          </form>
        </aside>
      )}

      {helpOpen && (
        <aside className="help-panel" aria-labelledby="help-title">
          <button className="icon-button panel-close" type="button" aria-label="Close help" onClick={() => setHelpOpen(false)}><X /></button>
          <h2 id="help-title">Move through the sky</h2>
          <dl>
            <div><dt>Look</dt><dd>Drag across the sky</dd></div>
            <div><dt>Zoom</dt><dd>Scroll or pinch</dd></div>
            <div><dt>Identify</dt><dd>Select an object or search by name</dd></div>
            <div><dt>Travel in time</dt><dd>Use the controls along the bottom</dd></div>
            <div><dt>Tonight</dt><dd>Jump to astronomical darkness at your location</dd></div>
            <div><dt>Red light</dt><dd>Protect dark adaptation without changing the sky</dd></div>
          </dl>
        </aside>
      )}

      <aside className={`object-panel ${selection ? 'has-selection' : ''}`} aria-live="polite">
        {selection ? (
          <>
            <div className="panel-heading">
              <div><span className="object-type">Selected object</span><h1>{selection.name}</h1><p>{selection.designation}</p></div>
              <button className="icon-button" type="button" aria-label="Close object details" onClick={clearSelection}><X /></button>
            </div>
            <p className={`visibility ${selection.visibility.startsWith('Above') ? 'visible-now' : ''}`}><Eye /> {selection.visibility}</p>
            <dl className="object-data">
              <div><dt>Magnitude</dt><dd>{selection.magnitude}</dd></div>
              <div><dt>Right ascension</dt><dd>{selection.rightAscension}</dd></div>
              <div><dt>Declination</dt><dd>{selection.declination}</dd></div>
              <div><dt>Azimuth</dt><dd>{selection.azimuth}</dd></div>
              <div><dt>Altitude</dt><dd>{selection.altitude}</dd></div>
            </dl>
          </>
        ) : (
          <div className="welcome-copy">
            <Asterisk className="welcome-star" aria-hidden="true" />
            <h1>Explore tonight’s sky</h1>
            <p>Drag to look around, then select any bright point to identify it. Search when you know where you want to go.</p>
            <button className="text-action" type="button" onClick={() => document.getElementById('sky-search')?.focus()}>
              Find your first object <Search />
            </button>
          </div>
        )}
      </aside>

      <section className="layer-controls" aria-label="Sky layers">
        {LAYER_CONTROLS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={layers[id] ? 'is-active' : ''}
            aria-label={`${layers[id] ? 'Hide' : 'Show'} ${label}`}
            aria-pressed={layers[id]}
            disabled={engineStatus !== 'ready'}
            onClick={() => toggleLayer(id)}
          >
            <Icon /><span>{label}</span>
          </button>
        ))}
      </section>

      <section className="time-controls" aria-label="Time controls">
        <button className="time-step" type="button" aria-label="Go back one hour" disabled={engineStatus !== 'ready'} onClick={() => stepTime(-1)}><Minus /><span>1h</span></button>
        <button className="play-button" type="button" aria-label={speed === 0 ? 'Resume time' : 'Pause time'} disabled={engineStatus !== 'ready'} onClick={toggleTime}>
          {speed === 0 ? <Play /> : <Pause />}
        </button>
        <label className="date-control">
          <span>{skyDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          <input
            type="datetime-local"
            aria-label="Sky date and time"
            value={toDateTimeInput(skyDate)}
            disabled={engineStatus !== 'ready'}
            onChange={(event) => setDate(new Date(event.target.value))}
          />
        </label>
        <button className="speed-button" type="button" disabled={engineStatus !== 'ready' || speed === 0} onClick={cycleSpeed} aria-label="Change time speed">
          {speed === 3600 ? '3600×' : speed === 60 ? '60×' : '1×'}
        </button>
        <button className="time-step" type="button" aria-label="Go forward one hour" disabled={engineStatus !== 'ready'} onClick={() => stepTime(1)}><Plus /><span>1h</span></button>
        <button className="now-button" type="button" disabled={engineStatus !== 'ready'} onClick={() => {
          setDate(new Date())
          const engine = engineRef.current
          if (engine) engine.core.time_speed = 1
          setSpeed(1)
          setNightSky(false)
        }}><RotateCcw /> Now</button>
      </section>

      {engineStatus !== 'ready' && (
        <section className={`engine-state ${engineStatus}`} role={engineStatus === 'error' ? 'alert' : 'status'}>
          {engineStatus === 'loading' ? (
            <><span className="orbit-loader" aria-hidden="true"><Asterisk /></span><h2>Charting your sky</h2><p>Starting the renderer and essential catalog…</p></>
          ) : (
            <><h2>The 3D sky could not start</h2><p>{engineError || 'WebGL or WebAssembly may be unavailable.'}</p><button type="button" className="secondary-action" onClick={() => window.location.reload()}>Try again</button></>
          )}
        </section>
      )}

      <footer className="source-note">
        <span><MoonStar /> {isOnline ? 'Essential sky data cached as you explore' : 'Using available offline sky data'}</span>
        <a href="https://github.com/kazehaya532/spica" target="_blank" rel="noreferrer">Spica source</a>
      </footer>
    </main>
  )
}

export default App
