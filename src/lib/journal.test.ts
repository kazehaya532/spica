import { describe, expect, it } from 'vitest'
import { calculateStreak, getLocalDateKey, getMoonPhase, loadJournal, parseJournalBackup } from './journal'

describe('observation journal helpers', () => {
  it('uses local calendar dates', () => {
    expect(getLocalDateKey(new Date(2026, 8, 6, 23, 30))).toBe('2026-09-06')
  })

  it('calculates a streak that can end yesterday', () => {
    const entry = { checkedIn: true, notes: '', sightings: [], updatedAt: '2026-09-05T00:00:00.000Z' }
    expect(calculateStreak({
      '2026-09-03': entry,
      '2026-09-04': entry,
      '2026-09-05': entry
    }, new Date(2026, 8, 6))).toBe(3)
  })

  it('describes known new and full moon dates', () => {
    expect(getMoonPhase(new Date('2000-01-06T18:14:00Z')).name).toBe('New Moon')
    const fullMoon = getMoonPhase(new Date('2000-01-21T12:00:00Z'))
    expect(fullMoon.name).toBe('Full Moon')
    expect(fullMoon.illumination).toBeGreaterThan(98)
  })

  it('validates and normalizes imported backups', () => {
    const store = parseJournalBackup(JSON.stringify({
      version: 1,
      entries: {
        '2026-09-06': {
          checkedIn: true,
          notes: 'Clear sky',
          sightings: ['Jupiter', 'Jupiter', '  Saturn  '],
          updatedAt: '2026-09-06T20:00:00.000Z'
        }
      }
    }))
    expect(store.entries['2026-09-06'].sightings).toEqual(['Jupiter', 'Saturn'])
    expect(() => parseJournalBackup('{"version":2,"entries":{}}')).toThrow('not a Spica journal')
    expect(() => parseJournalBackup('{"version":1,"entries":{"2026-02-31":{}}}')).toThrow('invalid entry')
  })

  it('falls back safely when stored data is damaged', () => {
    expect(loadJournal({ getItem: () => '{broken' }).entries).toEqual({})
  })
})
