import { useEffect, useMemo, useRef, useState } from 'react'
import { CloudMoon, Wind } from 'lucide-react'
import { fetchForecast, getNightForecast, quality, windDirection, type WeatherForecast } from '../lib/weather'

interface WeatherSummaryProps {
  latitude: number
  longitude: number
  skyDate: Date
  isOnline: boolean
}

const VERDICTS = {
  good: 'Good window', mixed: 'Mixed conditions', poor: 'Poor conditions', unknown: 'Incomplete forecast'
}
const HOURLY_LABELS = { good: 'Favorable', mixed: 'Mixed', poor: 'Poor', unknown: 'Incomplete' }
const value = (number: number | null, unit: string) => number === null ? 'Unavailable' : `${Math.round(number)}${unit}`

export function WeatherSummary({ latitude, longitude, skyDate, isOnline }: WeatherSummaryProps) {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const request = useRef<AbortController | null>(null)
  const timeout = useRef<number | undefined>(undefined)
  useEffect(() => () => {
    request.current?.abort()
    request.current = null
    window.clearTimeout(timeout.current)
  }, [])

  const check = async () => {
    request.current?.abort()
    window.clearTimeout(timeout.current)
    const controller = new AbortController()
    request.current = controller
    timeout.current = window.setTimeout(() => controller.abort(), 15_000)
    setLoading(true)
    setError('')
    try {
      const result = await fetchForecast(latitude, longitude, controller.signal)
      if (request.current === controller) setForecast(result)
    } catch (cause) {
      if (request.current !== controller) return
      setError(controller.signal.aborted ? 'The weather request timed out. Please try again.'
        : cause instanceof Error && cause.message.includes('request limit') ? cause.message
          : 'Could not load the forecast. Check your connection and try again.')
    } finally {
      if (request.current === controller) {
        window.clearTimeout(timeout.current)
        request.current = null
        setLoading(false)
      }
    }
  }

  const selectedTime = skyDate.getTime()
  const night = useMemo(() => forecast ? getNightForecast(forecast, selectedTime) : null, [forecast, selectedTime])
  const format = (time: number, date = false) => new Intl.DateTimeFormat(undefined, {
    timeZone: forecast?.timezone,
    ...(date ? { month: 'short', day: 'numeric' } as const : {}),
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).format(time)

  return (
    <section className="weather-summary" aria-labelledby="weather-title">
      <h3 id="weather-title"><CloudMoon aria-hidden="true" /> Night forecast</h3>
      <p>Plan the night for your selected sky date and saved observer location.</p>
      <button className="secondary-action weather-check" type="button" disabled={loading || !isOnline} onClick={check}>
        {loading ? 'Checking conditions…' : forecast ? 'Refresh forecast' : 'Check night forecast'}
      </button>
      <p className="weather-note">Checking sends your coordinates to <a href="https://open-meteo.com/en/terms" target="_blank" rel="noreferrer">Open-Meteo</a>.</p>
      <div role="status" aria-atomic="true">
        {loading && <p>Loading hourly weather…</p>}
        {!isOnline && <p>Offline. Connect to check or refresh the forecast.</p>}
        {error && <p className="form-error">{error}{forecast ? ' The previously loaded forecast is shown below.' : ''}</p>}
        {forecast && !loading && !error && <p className="sr-only">{night
          ? `Forecast loaded. ${VERDICTS[night.verdict]}.${night.best ? ` Best ${night.complete ? '' : 'available '}window: ${format(night.best.start)} to ${format(night.best.end)}, ${forecast.timezone}.` : ''}`
          : 'Forecast loaded. No sunset-to-sunrise forecast is available for the selected sky date.'}</p>}
      </div>
      {forecast && (
        <>
          <p className="weather-note">Retrieved {format(forecast.fetchedAt, true)} · {forecast.timezone}. Refresh before heading out.</p>
          {!night ? (
            <p>No complete sunset-to-sunrise period is available for this sky date. Choose a date within the next six days and check again. Polar day or night may have no sunrise or sunset.</p>
          ) : (
            <>
              <div className={`weather-outlook weather-${night.verdict}`}>
                <strong>{VERDICTS[night.verdict]}</strong>
                <span>{format(night.start, true)} – {format(night.end, true)}</span>
              </div>
              {!night.complete && <p>Some hours or measurements are missing. The outlook below uses only available data and may not represent the whole night.</p>}
              <p className="weather-window">{night.best
                ? <>Best {night.complete ? '' : 'available '}two-hour weather window: <strong>{format(night.best.start)}–{format(night.best.end)}</strong>.</>
                : night.verdict === 'unknown' ? 'Some forecast data is missing; a reliable two-hour window cannot be identified.'
                  : 'No two-hour window meets the favorable weather thresholds.'}</p>
              <div className="weather-hour-scroll" tabIndex={0} role="region" aria-label="Hourly night forecast. Scroll horizontally for more hours.">
                <table className="weather-hours">
                  <caption className="sr-only">Hourly forecast in {forecast.timezone}</caption>
                  <thead><tr><th scope="col">Conditions</th>{night.hours.map((hour) => (
                    <th scope="col" key={hour.time} className={night.best && hour.time >= night.best.start && hour.time < night.best.end ? 'weather-best' : ''}>
                      <time dateTime={new Date(hour.time).toISOString()}>{format(hour.time)}</time>
                      <span>{new Intl.DateTimeFormat(undefined, { timeZone: forecast.timezone, month: 'short', day: 'numeric' }).format(hour.time)}</span>
                    </th>
                  ))}</tr></thead>
                  <tbody>
                    <tr><th scope="row">Outlook</th>{night.hours.map((hour) => <td key={hour.time} className={`weather-${quality(hour)}`}>{HOURLY_LABELS[quality(hour)]}</td>)}</tr>
                    <tr><th scope="row">Cloud cover</th>{night.hours.map((hour) => <td key={hour.time}>{value(hour.cloud, '%')}</td>)}</tr>
                    <tr><th scope="row">Rain / snow chance</th>{night.hours.map((hour) => <td key={hour.time}>{value(hour.rain, '%')}</td>)}</tr>
                    <tr><th scope="row"><Wind aria-hidden="true" /> Wind from</th>{night.hours.map((hour) => (
                      <td key={hour.time}>{hour.wind === 0 ? 'Calm' : windDirection(hour.direction)}<span>{value(hour.wind, ' km/h')}</span></td>
                    ))}</tr>
                    <tr><th scope="row">Gusts</th>{night.hours.map((hour) => <td key={hour.time}>{value(hour.gusts, ' km/h')}</td>)}</tr>
                    <tr><th scope="row">Visibility</th>{night.hours.map((hour) => <td key={hour.time}>{hour.visibility === null ? 'Unavailable' : `${(hour.visibility / 1_000).toFixed(1)} km`}</td>)}</tr>
                    <tr><th scope="row">Humidity</th>{night.hours.map((hour) => <td key={hour.time}>{value(hour.humidity, '%')}</td>)}</tr>
                  </tbody>
                </table>
              </div>
              <p className="weather-note">Wind direction is where the wind comes from. Times are local to {forecast.timezone}; the sky controls use your device’s timezone.</p>
              <details className="weather-method">
                <summary>How to read this forecast</summary>
                <p>Favorable hours have cloud cover ≤20%, rain or snow chance ≤20%, visibility ≥10 km, wind ≤20 km/h and gusts ≤35 km/h. The best window is two consecutive favorable hours with the lowest combined cloud cover and precipitation chance.</p>
                <p>Poor hours have cloud cover ≥70%, precipitation chance ≥50%, visibility below 1 km, wind ≥35 km/h or gusts ≥50 km/h. Other complete hours are mixed. Missing measurements are never treated as clear skies.</p>
                <p>This covers sunset to sunrise, including twilight. Weather is a prediction, not a guarantee of clear skies or astronomical seeing. Moonlight and light pollution are not included. Cloud, visibility, humidity and wind are estimates at the timestamp; precipitation chance and gusts are aligned to the hour beginning at that time.</p>
              </details>
            </>
          )}
          <p className="weather-note">Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Outlook derived by Spica.</p>
        </>
      )}
    </section>
  )
}
