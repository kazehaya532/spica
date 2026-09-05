import { describe, expect, it } from 'vitest'
import {
  dateToMjd,
  formatDegrees,
  formatRightAscension,
  mjdToDate,
  SKY_TARGETS,
  toDateTimeInput
} from './astronomy'

describe('astronomy formatting', () => {
  it('round-trips dates through modified Julian dates', () => {
    const date = new Date('2026-09-05T21:30:00.000Z')
    expect(mjdToDate(dateToMjd(date)).getTime()).toBeCloseTo(date.getTime(), -1)
  })

  it('formats right ascension in wrapped hours', () => {
    expect(formatRightAscension(0)).toBe('00h 00m')
    expect(formatRightAscension(Math.PI)).toBe('12h 00m')
    expect(formatRightAscension(-Math.PI / 2)).toBe('18h 00m')
  })

  it('formats signed and unsigned angles', () => {
    expect(formatDegrees(Math.PI / 6)).toBe('+30.0°')
    expect(formatDegrees(Math.PI / 6, false)).toBe('30.0°')
    expect(formatDegrees(-Math.PI / 6)).toBe('-30.0°')
  })

  it('produces a local datetime input value', () => {
    expect(toDateTimeInput(new Date(2026, 8, 5, 21, 30))).toMatch(/^2026-09-05T21:30$/)
  })

  it('keeps essential targets searchable through aliases', () => {
    expect(SKY_TARGETS.find((target) => target.name === 'Spica')?.aliases).toContain('HIP 65474')
    expect(SKY_TARGETS.find((target) => target.name === 'Jupiter')?.aliases).toContain('NAME Jupiter')
    expect(SKY_TARGETS.find((target) => target.name === 'Betelgeuse')?.searchTerms).toContain('bettelguese')
    expect(SKY_TARGETS.filter((target) => target.kind === 'Star')).toHaveLength(21)
  })
})
