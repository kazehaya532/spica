import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  Asterisk,
  BookOpen,
  CircleHelp,
  CloudMoon,
  CloudSun,
  Compass,
  Crosshair,
  Eye,
  Flashlight,
  Grid3X3,
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
import { CompassPanel } from './components/CompassPanel'
import { ConditionsPanel } from './components/ConditionsPanel'
import { JournalPanel } from './components/JournalPanel'
import { LocationPanel } from './components/LocationPanel'
import {
  centerTarget,
  clearEngineSelection,
  createStellarium,
  getSelectionInfo,
  getMoonConditions,
  setLayer,
  showTonight,
  type LayerId,
  type MoonConditions,
  type SelectionInfo,
  type StellariumEngine
} from './engine/stellarium'
import { dateToMjd, mjdToDate, SKY_TARGETS, toDateTimeInput, type SkyTarget } from './lib/astronomy'
import { fetchTerrainElevation, formatObserverCoordinates, type ObserverLocation } from './lib/location'

type EngineStatus = 'loading' | 'ready' | 'error'

const DEFAULT_LOCATION: ObserverLocation = {
  label: 'Greenwich, London',
  latitude: 51.4769,
  longitude: 0,
  elevation: 46,
  timezone: 'Europe/London'
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

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<StellariumEngine | null>(null)
  const compassButtonRef = useRef<HTMLButtonElement>(null)
  const conditionsButtonRef = useRef<HTMLButtonElement>(null)
  const journalButtonRef = useRef<HTMLButtonElement>(null)
  const locationButtonRef = useRef<HTMLButtonElement>(null)
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
  const [compassOpen, setCompassOpen] = useState(false)
  const [conditionsOpen, setConditionsOpen] = useState(false)
  const [moonConditions, setMoonConditions] = useState<MoonConditions | null>(null)
  const [compassActive, setCompassActive] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)

  const closeCompassPanel = () => {
    setCompassOpen(false)
    window.requestAnimationFrame(() => compassButtonRef.current?.focus())
  }

  const closeConditionsPanel = () => {
    setConditionsOpen(false)
    window.requestAnimationFrame(() => conditionsButtonRef.current?.focus())
  }

  const closeJournalPanel = () => {
    setJournalOpen(false)
    window.requestAnimationFrame(() => journalButtonRef.current?.focus())
  }

  const closeLocationPanel = () => {
    setLocationOpen(false)
    window.requestAnimationFrame(() => locationButtonRef.current?.focus())
  }

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

  const moonMinute = Math.floor(skyDate.getTime() / 60_000)
  useEffect(() => {
    if (!conditionsOpen || engineStatus !== 'ready' || !engineRef.current) return
    setMoonConditions(getMoonConditions(engineRef.current))
  }, [conditionsOpen, engineStatus, moonMinute, location.latitude, location.longitude, location.elevation])

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
    window.requestAnimationFrame(() => locationButtonRef.current?.focus())
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Location services are not available in this browser. Enter coordinates instead.')
      return
    }
    setLocating(true)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        let elevation = position.coords.altitude ?? 0
        if (position.coords.altitude === null && navigator.onLine) {
          try {
            elevation = await fetchTerrainElevation(position.coords.latitude, position.coords.longitude, new AbortController().signal)
          } catch {
            // A GPS fix remains useful when terrain elevation cannot be estimated.
          }
        }
        updateLocation({
          label: 'Current position',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          elevation,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          accuracy: position.coords.accuracy
        })
        setLocating(false)
      },
      (error) => {
        setLocating(false)
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location permission was denied. Allow precise location access or enter coordinates instead.')
        } else if (error.code === error.TIMEOUT) {
          setLocationError('A precise position could not be found in time. Move outdoors, try again, or enter coordinates.')
        } else {
          setLocationError('Your position is currently unavailable. Check location services or enter coordinates instead.')
        }
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 }
    )
  }

  const chooseTarget = async (target: SkyTarget) => {
    const engine = engineRef.current
    if (!engine) return
    setCompassActive(false)
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
      setSearchMessage(`Returned to the current sky at ${location.label}.`)
      return
    }

    const startMjd = engine.core.observer.utc
    const nightMjd = showTonight(engine)
    engine.core.time_speed = 1
    setSkyDate(mjdToDate(nightMjd))
    setSpeed(1)
    setNightSky(true)
    if (Math.abs(nightMjd - startMjd) < 1 / 86_400) {
      setSearchMessage(`It is already astronomical night at ${location.label} for the selected sky time. No time jump was needed.`)
    } else {
      const target = mjdToDate(nightMjd)
      let formattedTime: string
      try {
        formattedTime = new Intl.DateTimeFormat(undefined, {
          weekday: 'short', hour: 'numeric', minute: '2-digit',
          ...(location.timezone ? { timeZone: location.timezone } : {})
        }).format(target)
      } catch {
        formattedTime = target.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })
      }
      setSearchMessage(`Jumped to ${formattedTime}, the start of astronomical darkness at ${location.label}.`)
    }
    setLayers((current) => ({
      ...current,
      atmosphere: true,
      deepSky: true,
      milkyWay: true
    }))
  }

  const clearSelection = () => {
    const engine = engineRef.current
    if (engine) clearEngineSelection(engine)
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
        <a className="brand" href={import.meta.env.BASE_URL} aria-label="Spica home">
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
            ref={locationButtonRef}
            className="location-button"
            type="button"
            aria-label={`Observer location: ${location.label}`}
            aria-expanded={locationOpen}
            onClick={() => {
              setLocationOpen((open) => !open)
              setConditionsOpen(false)
              setCompassOpen(false)
              setJournalOpen(false)
              setHelpOpen(false)
            }}
          >
            <MapPin aria-hidden="true" />
            <span><strong>{location.label}</strong><small>{formatObserverCoordinates(location)}</small></span>
          </button>
          <button
            ref={conditionsButtonRef}
            className="icon-button"
            type="button"
            aria-label="Open observing conditions"
            aria-expanded={conditionsOpen}
            aria-controls="conditions-panel"
            title="Observing conditions"
            onClick={() => {
              setConditionsOpen((open) => !open)
              setLocationOpen(false)
              setCompassOpen(false)
              setJournalOpen(false)
              setHelpOpen(false)
            }}
          >
            <CloudMoon />
          </button>
          <button
            ref={compassButtonRef}
            className="icon-button"
            type="button"
            aria-label={compassActive ? 'Device pointing active' : 'Point with your phone'}
            aria-pressed={compassActive}
            aria-expanded={compassOpen}
            aria-controls="compass-panel"
            title="Device compass"
            disabled={engineStatus !== 'ready'}
            onClick={() => {
              setCompassOpen((open) => !open)
              setLocationOpen(false)
              setConditionsOpen(false)
              setJournalOpen(false)
              setHelpOpen(false)
            }}
          >
            <Compass />
          </button>
          <button
            ref={journalButtonRef}
            className="icon-button"
            type="button"
            aria-label="Open observation journal"
            aria-expanded={journalOpen}
            aria-controls="journal-panel"
            title="Observation journal"
            onClick={() => {
              setJournalOpen((open) => !open)
              setLocationOpen(false)
              setConditionsOpen(false)
              setCompassOpen(false)
              setHelpOpen(false)
            }}
          >
            <BookOpen />
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
          <button className="icon-button desktop-action" type="button" aria-label="Show controls help" aria-expanded={helpOpen} onClick={() => {
            setHelpOpen((open) => !open)
            setLocationOpen(false)
            setConditionsOpen(false)
            setCompassOpen(false)
            setJournalOpen(false)
          }}>
            <CircleHelp />
          </button>
        </nav>
      </header>

      {searchMessage && <p className="toast" role="status">{searchMessage}</p>}

      <LocationPanel
        open={locationOpen}
        location={location}
        isOnline={isOnline}
        locating={locating}
        externalError={locationError}
        onUseCurrentLocation={useCurrentLocation}
        onSave={updateLocation}
        onClose={closeLocationPanel}
      />

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

      <CompassPanel
        open={compassOpen}
        active={compassActive}
        getEngine={() => engineRef.current}
        onActiveChange={setCompassActive}
        onClose={closeCompassPanel}
        onStartPointing={clearSelection}
      />

      <ConditionsPanel
        open={conditionsOpen}
        location={location}
        skyDate={skyDate}
        moon={moonConditions}
        isOnline={isOnline}
        onClose={closeConditionsPanel}
         onChangeLocation={() => {
           setConditionsOpen(false)
           setLocationOpen(true)
         }}
      />

      <JournalPanel
        open={journalOpen}
        selectedObject={selection?.name ?? null}
        onClose={closeJournalPanel}
      />

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
