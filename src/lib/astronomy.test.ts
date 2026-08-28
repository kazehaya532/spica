import { describe, expect, it } from 'vitest'
import { compassDirection, fixedHorizontal, fixedHorizontalFast, getPlanetVisibility, getStargazingTargets, type ObserverLocation } from './astronomy'

const london: ObserverLocation = { latitude: 51.5, longitude: -0.12, label: 'London', source: 'manual' }
const date = new Date('2026-08-28T21:00:00Z')

describe('sky calculations', () => {
  it('returns bounded horizontal coordinates for a fixed star', () => {
    const position = fixedHorizontal(13.42, -11.16, date, london)
    expect(position.azimuth).toBeGreaterThanOrEqual(0)
    expect(position.azimuth).toBeLessThan(360)
    expect(position.altitude).toBeGreaterThanOrEqual(-90)
    expect(position.altitude).toBeLessThanOrEqual(90)
  })

  it('keeps the bulk star transform aligned with the refraction-aware calculation', () => {
    const precise = fixedHorizontal(2.53, 89.26, date, london)
    const fast = fixedHorizontalFast(2.53, 89.26, date, london)
    expect(fast.azimuth).toBeCloseTo(precise.azimuth, 1)
    expect(fast.altitude).toBeCloseTo(precise.altitude, 1)
  })

  it('calculates each observable planet once', () => {
    const planets = getPlanetVisibility(date, london)
    expect(planets).toHaveLength(7)
    expect(new Set(planets.map((planet) => planet.id)).size).toBe(7)
    planets.forEach((planet) => expect(Number.isFinite(planet.magnitude)).toBe(true))
  })

  it('only recommends targets that clear the observing threshold', () => {
    const targets = getStargazingTargets(date, london)
    expect(targets.length).toBeGreaterThan(0)
    targets.forEach((target) => expect(target.bestAltitude).toBeGreaterThanOrEqual(20))
  })

  it('maps azimuths to stable compass labels', () => {
    expect(compassDirection(0)).toBe('N')
    expect(compassDirection(90)).toBe('E')
    expect(compassDirection(225)).toBe('SW')
    expect(compassDirection(359)).toBe('N')
  })
})
