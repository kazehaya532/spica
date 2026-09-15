import { useEffect, useMemo, useRef, useState } from 'react'
import { Gauge, MapPin, Moon, X } from 'lucide-react'
import type { MoonConditions } from '../engine/stellarium'
import { mjdToDate } from '../lib/astronomy'
import { deriveSkyDarkness, fetchLightMap, lookupBrightness, type LightMap } from '../lib/lightpollution'
import type { ObserverLocation } from '../lib/location'
import { WeatherSummary } from './WeatherSummary'

interface ConditionsPanelProps {
  open: boolean
  embedded?: boolean
  location: ObserverLocation
  skyDate: Date
  moon: MoonConditions | null
  isOnline: boolean
  onChangeLocation: () => void
  onClose: () => void
}

type LightMapState = { status: 'idle' | 'loading' | 'ready' | 'error'; map: LightMap | null; error: string }

function moonEventTime(mjd: number | null, timezone?: string): string {
  if (mjd === null) return 'No event in next 26h'
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', hour: 'numeric', minute: '2-digit' }
  try {
    return new Intl.DateTimeFormat(undefined, timezone ? { ...options, timeZone: timezone } : options).format(mjdToDate(mjd))
  } catch {
    return new Intl.DateTimeFormat(undefined, options).format(mjdToDate(mjd))
  }
}

function compassPoint(degrees: number): string {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return points[Math.round(degrees / 45) % points.length]
}

export function ConditionsPanel({ open, embedded = false, location, skyDate, moon, isOnline, onChangeLocation, onClose }: ConditionsPanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const requestRef = useRef<AbortController | null>(null)
  const [lightMap, setLightMap] = useState<LightMapState>({ status: 'idle', map: null, error: '' })
  const artificialBrightness = lightMap.map ? lookupBrightness(lightMap.map, location.latitude, location.longitude) : null
  const darkness = useMemo(() => artificialBrightness === null ? null : deriveSkyDarkness(artificialBrightness), [artificialBrightness])

  const loadLightMap = async () => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setLightMap((current) => ({ ...current, status: 'loading', error: '' }))
    try {
      const map = await fetchLightMap(`${import.meta.env.BASE_URL}lightmap/spica-lightmap.bin`, controller.signal)
      if (requestRef.current === controller) setLightMap({ status: 'ready', map, error: '' })
    } catch (cause) {
      if (requestRef.current !== controller) return
      setLightMap({
        status: 'error', map: null,
        error: cause instanceof Error ? cause.message : 'Sky-darkness data could not be loaded.'
      })
    } finally {
      if (requestRef.current === controller) requestRef.current = null
    }
  }

  useEffect(() => {
    if (!open || embedded) return
    window.requestAnimationFrame(() => panelRef.current?.focus())
  }, [open, embedded])

  useEffect(() => {
    if (!open) return
    if (lightMap.status === 'idle') void loadLightMap()
  }, [open, lightMap.status])

  useEffect(() => () => requestRef.current?.abort(), [])

  const darknessTone = darkness ? darkness.bortle <= 3 ? 'good' : darkness.bortle <= 6 ? 'mixed' : 'poor' : 'unknown'

  return (
    <aside
      ref={panelRef}
      className="conditions-panel"
      id="conditions-panel"
      aria-labelledby="conditions-title"
      tabIndex={-1}
      hidden={!open}
      onKeyDown={(event) => { if (event.key === 'Escape') onClose() }}
    >
      <div className="panel-heading">
        <div><h2 id="conditions-title">Observing conditions</h2><p>Weather, moonlight, and estimated sky darkness.</p></div>
        {!embedded && <button className="icon-button" type="button" aria-label="Close observing conditions" onClick={onClose}><X /></button>}
      </div>

      <div className="conditions-location">
        <MapPin aria-hidden="true" />
        <div><strong>{location.label}</strong><span>{Math.abs(location.latitude).toFixed(4)}°{location.latitude >= 0 ? 'N' : 'S'}, {Math.abs(location.longitude).toFixed(4)}°{location.longitude >= 0 ? 'E' : 'W'}</span></div>
        <button className="text-action" type="button" onClick={onChangeLocation}>Change location</button>
      </div>

      <section className="conditions-overview" aria-label="Sky darkness and moonlight">
        <div className="darkness-summary">
          <div className="conditions-section-heading"><Gauge aria-hidden="true" /><h3>Sky darkness <span>estimated</span></h3></div>
          <div role="status" aria-atomic="true">
            {lightMap.status === 'loading' && <p>Loading the offline sky-darkness map…</p>}
            {lightMap.status === 'error' && <><p className="form-error">{lightMap.error}</p><button className="text-action" type="button" onClick={loadLightMap}>Retry sky-darkness data</button></>}
            {lightMap.status === 'ready' && !darkness && <p>No modeled sky-brightness value is available at this location.</p>}
          </div>
          {darkness && (
            <>
              <div className={`darkness-rating weather-${darknessTone}`}>
                <strong>Bortle {darkness.bortle}</strong><span>{darkness.label}</span>
              </div>
              <dl className="darkness-data">
                <div><dt>Zenith brightness</dt><dd>{darkness.sqm.toFixed(2)} mag/arcsec²</dd></div>
                <div><dt>Naked-eye limit</dt><dd>Magnitude {darkness.nelm.toFixed(1)}</dd></div>
                <div><dt>Sky brightness</dt><dd>{darkness.naturalRatio.toFixed(1)}× natural</dd></div>
              </dl>
              <p className="weather-note">2015 modeled zenith estimate at approximately 11 km resolution. Nearby lights, terrain, LEDs, and current conditions can differ.</p>
              <p className="weather-note">Derived from <a href="https://doi.org/10.5880/GFZ.1.4.2016.001" target="_blank" rel="noreferrer">Falchi et al. (2016)</a>, licensed <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noreferrer">CC BY-NC 4.0</a>.</p>
            </>
          )}
        </div>

        <div className="conditions-moon">
          <div className="conditions-section-heading"><Moon aria-hidden="true" /><h3>Moonlight</h3></div>
          {moon ? (
            <>
              <strong>{moon.phaseName}</strong>
              <span>{moon.illumination}% illuminated at the selected sky time</span>
              <dl className="moon-data">
                <div><dt>Altitude</dt><dd>{moon.altitude.toFixed(1)}°</dd></div>
                <div><dt>Azimuth</dt><dd>{moon.azimuth.toFixed(1)}° {compassPoint(moon.azimuth)}</dd></div>
                <div><dt>Horizon</dt><dd className={moon.aboveHorizon ? 'weather-mixed' : 'weather-good'}>{moon.aboveHorizon ? 'Above' : 'Below'}</dd></div>
                <div><dt>Next rise</dt><dd>{moonEventTime(moon.nextRiseMjd, location.timezone)}</dd></div>
                <div><dt>Next set</dt><dd>{moonEventTime(moon.nextSetMjd, location.timezone)}</dd></div>
              </dl>
              <p>{moon.aboveHorizon ? 'The Moon is contributing natural sky glow at this time.' : 'The Moon is below your local astronomical horizon at this time.'}</p>
            </>
          ) : <p>Accurate lunar ephemeris is not available yet.</p>}
        </div>
      </section>

      <WeatherSummary
        key={`${location.latitude},${location.longitude}`}
        latitude={location.latitude}
        longitude={location.longitude}
        skyDate={skyDate}
        isOnline={isOnline}
      />
    </aside>
  )
}
