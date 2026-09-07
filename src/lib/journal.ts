export const JOURNAL_STORAGE_KEY = 'spica-observation-journal'

export interface JournalEntry {
  checkedIn: boolean
  notes: string
  sightings: string[]
  updatedAt: string
}

export interface JournalStore {
  version: 1
  entries: Record<string, JournalEntry>
}

export interface MoonPhase {
  name: string
  illumination: number
}

export const EMPTY_JOURNAL: JournalStore = { version: 1, entries: {} }

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getMoonPhase(date: Date): MoonPhase {
  const synodicMonth = 29.53058867
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14)
  const daysSinceNewMoon = (date.getTime() - knownNewMoon) / 86_400_000
  const cycle = ((daysSinceNewMoon / synodicMonth) % 1 + 1) % 1
  const illumination = Math.round((1 - Math.cos(cycle * Math.PI * 2)) * 50)
  const names = [
    'New Moon',
    'Waxing Crescent',
    'First Quarter',
    'Waxing Gibbous',
    'Full Moon',
    'Waning Gibbous',
    'Last Quarter',
    'Waning Crescent'
  ]

  return { name: names[Math.round(cycle * 8) % 8], illumination }
}

function isDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function parseJournalBackup(raw: string): JournalStore {
  const parsed = JSON.parse(raw) as Partial<JournalStore>
  if (parsed.version !== 1 || !parsed.entries || typeof parsed.entries !== 'object' || Array.isArray(parsed.entries)) {
    throw new Error('This is not a Spica journal backup.')
  }

  const entries: Record<string, JournalEntry> = {}
  for (const [date, candidate] of Object.entries(parsed.entries)) {
    if (!isDateKey(date) || !candidate || typeof candidate !== 'object') {
      throw new Error('The journal backup contains an invalid entry.')
    }
    const entry = candidate as Partial<JournalEntry>
    if (typeof entry.checkedIn !== 'boolean' || typeof entry.notes !== 'string' || !Array.isArray(entry.sightings)) {
      throw new Error('The journal backup contains an invalid entry.')
    }
    entries[date] = {
      checkedIn: entry.checkedIn,
      notes: entry.notes,
      sightings: [...new Set(entry.sightings.filter((item): item is string => typeof item === 'string' && item.trim() !== '').map((item) => item.trim()))],
      updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : new Date().toISOString()
    }
  }

  return { version: 1, entries }
}

export function loadJournal(storage: Pick<Storage, 'getItem'>): JournalStore {
  try {
    const stored = storage.getItem(JOURNAL_STORAGE_KEY)
    return stored ? parseJournalBackup(stored) : EMPTY_JOURNAL
  } catch {
    return EMPTY_JOURNAL
  }
}

export function calculateStreak(entries: Record<string, JournalEntry>, today: Date): number {
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12)
  if (!entries[getLocalDateKey(cursor)]?.checkedIn) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while (entries[getLocalDateKey(cursor)]?.checkedIn) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
