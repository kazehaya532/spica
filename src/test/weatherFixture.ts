// Synthetic provider data shared by unit and intercepted browser tests.
export function weatherFixture() {
  const start = Date.UTC(2026, 8, 11) / 1_000
  const length = 72
  return {
    timezone: 'Europe/London', utc_offset_seconds: 3600,
    hourly_units: {
      time: 'unixtime', cloud_cover: '%', precipitation_probability: '%', visibility: 'm',
      relative_humidity_2m: '%', wind_speed_10m: 'km/h', wind_direction_10m: '°', wind_gusts_10m: 'km/h'
    },
    hourly: {
      time: Array.from({ length }, (_, i) => start + i * 3600),
      cloud_cover: Array<number | null>(length).fill(10),
      precipitation_probability: Array<number | null>(length).fill(5),
      visibility: Array<number | null>(length).fill(20000),
      relative_humidity_2m: Array<number | null>(length).fill(60),
      wind_speed_10m: Array<number | null>(length).fill(9),
      wind_direction_10m: Array<number | null>(length).fill(45),
      wind_gusts_10m: Array<number | null>(length).fill(15)
    },
    daily_units: { time: 'unixtime', sunrise: 'unixtime', sunset: 'unixtime' },
    daily: {
      time: Array.from({ length: 3 }, (_, i) => start + i * 86400 - 3600),
      sunrise: Array<number | null>(3).fill(0).map((_, i) => start + i * 86400 + 5 * 3600 + 1800),
      sunset: Array<number | null>(3).fill(0).map((_, i) => start + i * 86400 + 18 * 3600 + 1800)
    }
  }
}
