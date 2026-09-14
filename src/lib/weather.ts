export const HOUR_MS = 3_600_000

export interface WeatherHour {
  time: number
  cloud: number | null
  // Precipitation probability and gusts are aligned to the hour beginning at time.
  rain: number | null
  visibility: number | null
  humidity: number | null
  wind: number | null
  direction: number | null
  gusts: number | null
}

export interface WeatherForecast {
  timezone: string
  fetchedAt: number
  hours: WeatherHour[]
  days: Array<{ date: string; sunrise: number | null; sunset: number | null }>
}

export type WeatherQuality = 'good' | 'mixed' | 'poor' | 'unknown'

const VARIABLES = {
  cloud: ['cloud_cover', '%', 0, 100],
  rain: ['precipitation_probability', '%', 0, 100],
  visibility: ['visibility', 'm', 0, Infinity],
  humidity: ['relative_humidity_2m', '%', 0, 100],
  wind: ['wind_speed_10m', 'km/h', 0, Infinity],
  direction: ['wind_direction_10m', '°', 0, 360],
  gusts: ['wind_gusts_10m', 'km/h', 0, Infinity]
} as const

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid forecast response.')
  return value as Record<string, unknown>
}

function timestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 8.64e12
    ? value * 1_000 : null
}

export function localDate(time: number, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(time)
  const part = (type: string) => parts.find((entry) => entry.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function parseForecast(value: unknown, fetchedAt = Date.now()): WeatherForecast {
  const data = record(value)
  if (typeof data.timezone !== 'string') throw new Error('Missing forecast timezone.')
  // Validate the IANA zone before any data reaches the UI.
  localDate(fetchedAt, data.timezone)
  const hourly = record(data.hourly)
  const units = record(data.hourly_units)
  const daily = record(data.daily)
  const dailyUnits = record(data.daily_units)
  if (units.time !== 'unixtime' || dailyUnits.time !== 'unixtime' ||
      dailyUnits.sunrise !== 'unixtime' || dailyUnits.sunset !== 'unixtime' ||
      !Array.isArray(hourly.time) || !hourly.time.length || !Array.isArray(daily.time) || !daily.time.length) {
    throw new Error('Missing forecast times.')
  }
  const times = hourly.time.map(timestamp)
  if (times.some((time, index) => time === null || (index > 0 && time <= times[index - 1]!))) {
    throw new Error('Invalid forecast times.')
  }
  for (const [field, unit] of Object.values(VARIABLES)) {
    if (hourly[field] !== undefined && (!Array.isArray(hourly[field]) ||
        hourly[field].length !== times.length || units[field] !== unit)) {
      throw new Error('Invalid forecast measurements.')
    }
  }
  const hours = times.map((time, index) => {
    const hour: WeatherHour = { time: time!, cloud: null, rain: null, visibility: null, humidity: null, wind: null, direction: null, gusts: null }
    for (const key of Object.keys(VARIABLES) as Array<keyof typeof VARIABLES>) {
      const [field, , min, max] = VARIABLES[key]
      const values = hourly[field]
      const measurement: unknown = Array.isArray(values) ? values[index] : null
      hour[key] = typeof measurement === 'number' && Number.isFinite(measurement) && measurement >= min && measurement <= max
        ? measurement : null
    }
    return hour
  })
  const sunrises = daily.sunrise
  const sunsets = daily.sunset
  if (!Array.isArray(sunrises) || !Array.isArray(sunsets) ||
      sunrises.length !== daily.time.length || sunsets.length !== daily.time.length) {
    throw new Error('Missing sunrise and sunset data.')
  }
  const days = daily.time.map((value, index) => {
    const time = timestamp(value)
    if (time === null) throw new Error('Invalid forecast day.')
    // Open-Meteo daily UNIX date keys need utc_offset_seconds to recover the
    // calendar date. Sunrise/sunset and hourly timestamps are already instants.
    if (typeof data.utc_offset_seconds !== 'number' || !Number.isFinite(data.utc_offset_seconds) || Math.abs(data.utc_offset_seconds) > 86_400) {
      throw new Error('Invalid forecast offset.')
    }
    return {
      date: new Date(time + data.utc_offset_seconds * 1_000).toISOString().slice(0, 10),
      sunrise: timestamp(sunrises[index]), sunset: timestamp(sunsets[index])
    }
  })
  // The provider reports precipitation probability and gust maxima for the
  // preceding hour. Align them to the displayed forward-looking interval;
  // never bridge missing timestamps or invent the final interval's values.
  const alignedHours = hours.map((hour, index) => {
    const next = hours[index + 1]
    const consecutive = next?.time === hour.time + HOUR_MS
    return { ...hour, rain: consecutive ? next.rain : null, gusts: consecutive ? next.gusts : null }
  })
  return { timezone: data.timezone, fetchedAt, hours: alignedHours, days }
}

export async function fetchForecast(latitude: number, longitude: number, signal: AbortSignal): Promise<WeatherForecast> {
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180) {
    throw new Error('Set valid observer coordinates first.')
  }
  const params = new URLSearchParams({
    latitude: String(latitude), longitude: String(longitude),
    hourly: Object.values(VARIABLES).map(([field]) => field).join(','),
    daily: 'sunrise,sunset', timezone: 'auto', timeformat: 'unixtime',
    forecast_days: '7', past_days: '1', wind_speed_unit: 'kmh'
  })
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal, credentials: 'omit' })
  if (!response.ok) throw new Error(response.status === 429 ? 'Weather request limit reached. Please try again later.' : 'Weather service unavailable. Please try again.')
  return parseForecast(await response.json())
}

export function quality(hour: WeatherHour): WeatherQuality {
  const { cloud, rain, visibility, wind, gusts } = hour
  if ((cloud !== null && cloud >= 70) || (rain !== null && rain >= 50) ||
      (visibility !== null && visibility < 1_000) || (wind !== null && wind >= 35) || (gusts !== null && gusts >= 50)) return 'poor'
  if (cloud === null || rain === null || visibility === null || wind === null || gusts === null) return 'unknown'
  return cloud <= 20 && rain <= 20 && visibility >= 10_000 && wind <= 20 && gusts <= 35 ? 'good' : 'mixed'
}

export function windDirection(degrees: number | null): string {
  if (degrees === null || !Number.isFinite(degrees)) return 'Unknown direction'
  return ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][Math.round(((degrees % 360 + 360) % 360) / 22.5) % 16]
}

export interface NightForecast {
  start: number
  end: number
  hours: WeatherHour[]
  best: { start: number; end: number } | null
  verdict: WeatherQuality
  complete: boolean
}

export function getNightForecast(forecast: WeatherForecast, selectedTime: number): NightForecast | null {
  if (!Number.isFinite(selectedTime)) return null
  const date = localDate(selectedTime, forecast.timezone)
  let index = forecast.days.findIndex((day) => day.date === date)
  if (index < 0) return null
  const today = forecast.days[index]
  if (today.sunrise === null || today.sunset === null) return null
  if (selectedTime < today.sunrise) index -= 1
  const start = forecast.days[index]?.sunset
  const end = forecast.days[index + 1]?.sunrise
  if (!start || !end || end <= start || end - start > 26 * HOUR_MS) return null
  const hours = forecast.hours.filter((hour) => hour.time >= start && hour.time < end)
  if (!hours.length) return null
  let best: NightForecast['best'] = null
  let bestScore = Infinity
  for (let i = 0; i < hours.length - 1; i++) {
    const a = hours[i]
    const b = hours[i + 1]
    if (b.time - a.time !== HOUR_MS || a.time + 2 * HOUR_MS > end || quality(a) !== 'good' || quality(b) !== 'good') continue
    const score = a.cloud! + b.cloud! + a.rain! + b.rain!
    if (score < bestScore) {
      best = { start: a.time, end: a.time + 2 * HOUR_MS }
      bestScore = score
    }
  }
  const complete = hours[0].time - start < HOUR_MS && end - hours[hours.length - 1].time <= HOUR_MS &&
    hours.every((hour, i) => (i === 0 || hour.time - hours[i - 1].time === HOUR_MS) &&
      (Object.keys(VARIABLES) as Array<keyof typeof VARIABLES>).every((key) => hour[key] !== null))
  const verdict = !complete ? 'unknown' : best ? 'good'
    : hours.every((hour) => quality(hour) === 'poor') ? 'poor' : 'mixed'
  return { start, end, hours, best, verdict, complete }
}
