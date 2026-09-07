import { describe, expect, it } from 'vitest'
import {
  analyzeCalibrationSamples,
  applyCompassOffset,
  getCardinalDirection,
  getOrientationReading,
  normalizeDegrees,
  smoothHeading
} from './orientation'

describe('device orientation helpers', () => {
  it('normalizes headings around north', () => {
    expect(normalizeDegrees(-15)).toBe(345)
    expect(normalizeDegrees(375)).toBe(15)
  })

  it('prefers the iOS compass heading and folds device pitch', () => {
    expect(getOrientationReading({ alpha: 120, beta: 135, webkitCompassHeading: 42 })).toEqual({
      heading: 42,
      altitude: 45,
      absolute: true
    })
  })

  it('derives and calibrates an alpha-based heading', () => {
    const reading = getOrientationReading({ alpha: 30, beta: 25 }, 0)
    expect(reading).toEqual({ heading: 330, altitude: 25, absolute: false })
    expect(applyCompassOffset(reading!.heading, 30)).toBe(0)
    expect(getCardinalDirection(359)).toBe('N')
  })

  it('ignores incomplete sensor samples', () => {
    expect(getOrientationReading({ alpha: null, beta: 10 })).toBeNull()
  })

  it('smooths across north using the shortest turn', () => {
    expect(smoothHeading(359, 1, 0.5)).toBe(0)
    expect(smoothHeading(1, 359, 0.5)).toBe(0)
  })

  it('averages stable calibration samples across north', () => {
    const samples = [358, 359, 0, 1, 2, 359, 0, 1, 0, 0].map((heading, index) => ({
      heading,
      timestamp: index * 140
    }))
    const quality = analyzeCalibrationSamples(samples)

    expect(quality?.meanHeading).toBeCloseTo(0, 1)
    expect(quality?.spread).toBeLessThan(2)
    expect(quality?.stable).toBe(true)
  })

  it('rejects short or noisy calibration windows', () => {
    const short = Array.from({ length: 10 }, (_, index) => ({ heading: 20, timestamp: index * 50 }))
    const noisy = [0, 30, 330, 45, 315, 60, 300, 90, 270, 180].map((heading, index) => ({
      heading,
      timestamp: index * 140
    }))

    expect(analyzeCalibrationSamples(short)?.stable).toBe(false)
    expect(analyzeCalibrationSamples(noisy)?.stable).toBe(false)
  })
})
