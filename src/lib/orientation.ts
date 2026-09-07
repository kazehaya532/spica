export interface OrientationInput {
  alpha: number | null
  beta: number | null
  absolute?: boolean
  webkitCompassHeading?: number | null
}

export interface OrientationReading {
  heading: number
  altitude: number
  absolute: boolean
}

export interface CalibrationSample {
  heading: number
  timestamp: number
}

export interface CalibrationQuality {
  meanHeading: number
  spread: number
  sampleCount: number
  duration: number
  stable: boolean
}

export const CALIBRATION_WINDOW_MS = 2_000
export const MIN_CALIBRATION_DURATION_MS = 1_200
export const MIN_CALIBRATION_SAMPLES = 10
export const MAX_CALIBRATION_SPREAD = 4

export function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360
}

export function getOrientationReading(input: OrientationInput, screenAngle = 0): OrientationReading | null {
  if (input.alpha === null || input.beta === null) return null

  const sensorHeading = input.webkitCompassHeading
  const heading = sensorHeading !== undefined && sensorHeading !== null && Number.isFinite(sensorHeading)
    ? sensorHeading
    : 360 - input.alpha
  const foldedBeta = input.beta > 90
    ? 180 - input.beta
    : input.beta < -90
      ? -180 - input.beta
      : input.beta

  return {
    heading: normalizeDegrees(heading + screenAngle),
    altitude: Math.max(-90, Math.min(90, foldedBeta)),
    absolute: Boolean(input.absolute || (sensorHeading !== undefined && sensorHeading !== null && Number.isFinite(sensorHeading)))
  }
}

export function applyCompassOffset(heading: number, offset: number): number {
  return normalizeDegrees(heading + offset)
}

export function smoothHeading(previous: number, next: number, amount = 0.22): number {
  const shortestTurn = ((next - previous + 540) % 360) - 180
  return normalizeDegrees(previous + shortestTurn * amount)
}

export function analyzeCalibrationSamples(samples: CalibrationSample[]): CalibrationQuality | null {
  if (samples.length === 0) return null

  const vectors = samples.reduce((total, sample) => {
    const radians = normalizeDegrees(sample.heading) * Math.PI / 180
    total.x += Math.cos(radians)
    total.y += Math.sin(radians)
    return total
  }, { x: 0, y: 0 })
  const x = vectors.x / samples.length
  const y = vectors.y / samples.length
  const resultant = Math.min(1, Math.hypot(x, y))
  const spread = resultant < Number.EPSILON
    ? 180
    : Math.sqrt(Math.max(0, -2 * Math.log(resultant))) * 180 / Math.PI
  const duration = Math.max(0, samples.at(-1)!.timestamp - samples[0].timestamp)

  return {
    meanHeading: normalizeDegrees(Math.atan2(y, x) * 180 / Math.PI),
    spread,
    sampleCount: samples.length,
    duration,
    stable: samples.length >= MIN_CALIBRATION_SAMPLES
      && duration >= MIN_CALIBRATION_DURATION_MS
      && spread <= MAX_CALIBRATION_SPREAD
  }
}

export function getCardinalDirection(heading: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return directions[Math.round(normalizeDegrees(heading) / 45) % directions.length]
}
