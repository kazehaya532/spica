import { Body, Elongation, Equator, Horizon, Illumination, Observer, SearchRiseSet, SiderealTime } from 'astronomy-engine'
import { skyCatalog } from '../data/skyCatalog'

export interface ObserverLocation {
  latitude: number
  longitude: number
  label: string
  source: 'global' | 'device' | 'manual'
}

export interface HorizontalPosition {
  azimuth: number
  altitude: number
}

export interface PlanetVisibility extends HorizontalPosition {
  id: string
  name: string
  magnitude: number
  elongation: number
  period: string
  status: string
  rise?: Date
  set?: Date
}

export const GLOBAL_OBSERVER: ObserverLocation = {
  latitude: 0,
  longitude: 0,
  label: 'Global sky',
  source: 'global',
}

export const planetBodies = [Body.Mercury, Body.Venus, Body.Mars, Body.Jupiter, Body.Saturn, Body.Uranus, Body.Neptune]

const makeObserver = (location: ObserverLocation) => new Observer(location.latitude, location.longitude, 0)

export function fixedHorizontal(ra: number, dec: number, date: Date, location: ObserverLocation): HorizontalPosition {
  const horizontal = Horizon(date, makeObserver(location), ra, dec, 'normal')
  return { azimuth: horizontal.azimuth, altitude: horizontal.altitude }
}

export function fixedHorizontalFast(ra: number, dec: number, date: Date, location: ObserverLocation): HorizontalPosition {
  const hourAngle = (SiderealTime(date) + location.longitude / 15 - ra) * Math.PI / 12
  const declination = dec * Math.PI / 180
  const latitude = location.latitude * Math.PI / 180
  const altitude = Math.asin(
    Math.sin(declination) * Math.sin(latitude)
    + Math.cos(declination) * Math.cos(latitude) * Math.cos(hourAngle),
  )
  const azimuth = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(latitude) - Math.tan(declination) * Math.cos(latitude),
  )
  return {
    azimuth: (azimuth * 180 / Math.PI + 180) % 360,
    altitude: altitude * 180 / Math.PI,
  }
}

export function bodyHorizontal(body: Body, date: Date, location: ObserverLocation): HorizontalPosition {
  const observer = makeObserver(location)
  const equatorial = Equator(body, date, observer, true, true)
  const horizontal = Horizon(date, observer, equatorial.ra, equatorial.dec, 'normal')
  return { azimuth: horizontal.azimuth, altitude: horizontal.altitude }
}

export function getPlanetVisibility(date: Date, location: ObserverLocation): PlanetVisibility[] {
  const observer = makeObserver(location)
  return planetBodies.map((body) => {
    const position = bodyHorizontal(body, date, location)
    const elongation = Elongation(body, date)
    const illumination = Illumination(body, date)
    const rise = location.source === 'global' ? null : SearchRiseSet(body, observer, 1, date, 1)
    const set = location.source === 'global' ? null : SearchRiseSet(body, observer, -1, date, 1)
    const isUp = position.altitude > 0
    const status = location.source === 'global'
      ? `${elongation.visibility === 'morning' ? 'Morning' : 'Evening'} sky · ${Math.round(elongation.elongation)}° from Sun`
      : isUp ? `Above horizon · ${Math.round(position.altitude)}° high` : `Below horizon · rises ${rise ? formatTime(rise.date) : 'later'}`
    return {
      id: body.toLowerCase(),
      name: body,
      magnitude: illumination.mag,
      elongation: elongation.elongation,
      period: elongation.visibility === 'morning' ? 'Morning' : 'Evening',
      status,
      azimuth: position.azimuth,
      altitude: position.altitude,
      rise: rise?.date,
      set: set?.date,
    }
  }).sort((a, b) => a.magnitude - b.magnitude)
}

export function getStargazingTargets(date: Date, location: ObserverLocation) {
  const samples = Array.from({ length: 12 }, (_, index) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 18 + index))
  return skyCatalog.map((target) => {
    const positions = samples.map((sample) => ({ date: sample, ...fixedHorizontal(target.ra, target.dec, sample, location) }))
    const best = positions.reduce((highest, current) => current.altitude > highest.altitude ? current : highest)
    return { ...target, bestAltitude: best.altitude, bestTime: best.date, direction: compassDirection(best.azimuth) }
  }).filter((target) => target.bestAltitude >= 20 && target.magnitude <= 8.5)
    .sort((a, b) => (a.magnitude - b.magnitude) || (b.bestAltitude - a.bestAltitude))
    .slice(0, 8)
}

export function sunAltitude(date: Date, location: ObserverLocation) {
  return bodyHorizontal(Body.Sun, date, location).altitude
}

export function compassDirection(azimuth: number) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return directions[Math.round(azimuth / 45) % 8]
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date)
}

export function toDateTimeLocal(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
