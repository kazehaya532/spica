import { describe, expect, it, vi, afterEach } from 'vitest'
import { weatherFixture } from '../test/weatherFixture'
import { fetchForecast, getNightForecast, HOUR_MS, localDate, parseForecast, quality, windDirection } from './weather'

afterEach(() => vi.unstubAllGlobals())

describe('weather response boundary', () => {
  it('keeps absolute hourly instants and decodes provider calendar dates', () => {
    const forecast = parseForecast(weatherFixture())
    expect(forecast.days[0].date).toBe('2026-09-11')
    expect(forecast.hours[0].time).toBe(Date.UTC(2026, 8, 11))
    expect(localDate(Date.UTC(2026, 8, 11, 23), 'Asia/Tokyo')).toBe('2026-09-12')
    expect(localDate(Date.UTC(2026, 8, 11, 1), 'America/Los_Angeles')).toBe('2026-09-10')
  })

  it('rejects malformed structures, timezone, units and misaligned arrays', () => {
    expect(() => parseForecast({})).toThrow()
    const fixture = weatherFixture()
    fixture.timezone = 'not/a-zone'
    expect(() => parseForecast(fixture)).toThrow()
    fixture.timezone = 'UTC'
    fixture.hourly_units.wind_speed_10m = 'mph'
    expect(() => parseForecast(fixture)).toThrow()
    fixture.hourly_units.wind_speed_10m = 'km/h'
    fixture.hourly.cloud_cover.pop()
    expect(() => parseForecast(fixture)).toThrow()
  })

  it('does not turn missing, non-finite or out-of-range measurements into clear weather', () => {
    const fixture = weatherFixture()
    fixture.hourly.cloud_cover[0] = null
    fixture.hourly.visibility[1] = NaN
    fixture.hourly.precipitation_probability[3] = 101
    const forecast = parseForecast(fixture)
    expect(forecast.hours.slice(0, 3).map(quality)).toEqual(['unknown', 'unknown', 'unknown'])
  })

  it('requests keyless hourly data in absolute time and propagates cancellation', async () => {
    const mock = vi.fn().mockResolvedValue({ ok: true, json: async () => weatherFixture() })
    vi.stubGlobal('fetch', mock)
    const controller = new AbortController()
    await fetchForecast(-6.2, 106.8, controller.signal)
    const url = new URL(mock.mock.calls[0][0])
    expect(url.origin).toBe('https://api.open-meteo.com')
    expect(url.searchParams.get('latitude')).toBe('-6.2')
    expect(url.searchParams.get('longitude')).toBe('106.8')
    expect(url.searchParams.get('timeformat')).toBe('unixtime')
    expect(url.searchParams.get('timezone')).toBe('auto')
    expect(mock.mock.calls[0][1]).toEqual({ signal: controller.signal, credentials: 'omit' })
    await expect(fetchForecast(91, 0, controller.signal)).rejects.toThrow('coordinates')
    expect(mock).toHaveBeenCalledTimes(1)
    mock.mockResolvedValue({ ok: false, status: 429 })
    await expect(fetchForecast(0, 0, controller.signal)).rejects.toThrow('limit')
  })
})

describe('night selection and observing guidance', () => {
  it('uses the upcoming night by day and preceding sunset before sunrise', () => {
    const forecast = parseForecast(weatherFixture())
    const evening = getNightForecast(forecast, Date.UTC(2026, 8, 11, 12))!
    const overnight = getNightForecast(forecast, Date.UTC(2026, 8, 12, 1))!
    expect(overnight.start).toBe(evening.start)
    expect(evening.hours).toHaveLength(11)
    expect(evening.best).toEqual({ start: Date.UTC(2026, 8, 11, 19), end: Date.UTC(2026, 8, 11, 21) })
    expect(getNightForecast(forecast, Date.UTC(2026, 8, 12, 6))!.start).toBeGreaterThan(evening.start)
  })

  it('handles a DST transition using actual sunrise/sunset instants', () => {
    const forecast = parseForecast(weatherFixture())
    const start = Date.UTC(2026, 9, 24, 17)
    forecast.days = [
      { date: '2026-10-24', sunrise: Date.UTC(2026, 9, 24, 6), sunset: start },
      { date: '2026-10-25', sunrise: Date.UTC(2026, 9, 25, 7), sunset: Date.UTC(2026, 9, 25, 17) }
    ]
    forecast.hours = Array.from({ length: 14 }, (_, i) => ({ ...forecast.hours[0], time: start + i * HOUR_MS }))
    expect(getNightForecast(forecast, Date.UTC(2026, 9, 25, 2))?.hours).toHaveLength(14)
  })

  it('never substitutes a forecast for another date or missing polar sunset', () => {
    const forecast = parseForecast(weatherFixture())
    expect(getNightForecast(forecast, Date.UTC(2030, 1, 1))).toBeNull()
    expect(getNightForecast(forecast, Date.UTC(2026, 8, 13, 12))).toBeNull()
    forecast.days[0].sunset = null
    expect(getNightForecast(forecast, Date.UTC(2026, 8, 11, 12))).toBeNull()
  })

  it('requires consecutive full favorable hours for the best window', () => {
    const forecast = parseForecast(weatherFixture())
    forecast.hours = forecast.hours.map((hour) => ({ ...hour, cloud: 95 }))
    forecast.hours[19].cloud = 0
    forecast.hours[21].cloud = 0
    let night = getNightForecast(forecast, Date.UTC(2026, 8, 11, 12))!
    expect(night.best).toBeNull()
    expect(night.verdict).toBe('mixed')
    forecast.hours[20].cloud = 0
    night = getNightForecast(forecast, Date.UTC(2026, 8, 11, 12))!
    expect(night.best?.start).toBe(forecast.hours[19].time)
    forecast.hours = forecast.hours.filter((hour) => hour.time !== Date.UTC(2026, 8, 11, 20))
    expect(getNightForecast(forecast, Date.UTC(2026, 8, 11, 12))!.best).toBeNull()
  })

  it('checks precipitation and gusts through the endpoint of a recommended window', () => {
    for (const measurement of ['precipitation_probability', 'wind_gusts_10m'] as const) {
      for (const adverse of [90, null]) {
        const fixture = weatherFixture()
        fixture.hourly.cloud_cover.fill(95)
        fixture.hourly.cloud_cover[19] = 10
        fixture.hourly.cloud_cover[20] = 10
        // The measurement at 21:00 covers 20:00–21:00, the final hour
        // of the proposed 19:00–21:00 window.
        fixture.hourly[measurement][21] = adverse
        const forecast = parseForecast(fixture)
        expect(getNightForecast(forecast, Date.UTC(2026, 8, 11, 12))!.best).toBeNull()
      }
    }
  })

  it('qualifies a surviving good window when the rest of the night is missing', () => {
    const forecast = parseForecast(weatherFixture())
    forecast.hours = forecast.hours.slice(19, 21)
    const night = getNightForecast(forecast, Date.UTC(2026, 8, 11, 12))!
    expect(night.best).not.toBeNull()
    expect(night.complete).toBe(false)
    expect(night.verdict).toBe('unknown')
  })

  it('applies transparent boundaries and flags fog, strong wind and precipitation', () => {
    const hour = parseForecast(weatherFixture()).hours[0]
    expect(quality({ ...hour, cloud: 20, rain: 20, wind: 20, gusts: 35, visibility: 10000 })).toBe('good')
    expect(quality({ ...hour, cloud: 21 })).toBe('mixed')
    for (const change of [{ cloud: 70 }, { rain: 50 }, { visibility: 999 }, { wind: 35 }, { gusts: 50 }]) {
      expect(quality({ ...hour, ...change })).toBe('poor')
    }
    expect(quality({ ...hour, cloud: null })).toBe('unknown')
  })

  it('formats meteorological wind bearings including north wraparound', () => {
    expect([0, 45, 90, 180, 270, 359, 360].map(windDirection)).toEqual(['N', 'NE', 'E', 'S', 'W', 'N', 'N'])
    expect(windDirection(null)).toBe('Unknown direction')
  })
})
