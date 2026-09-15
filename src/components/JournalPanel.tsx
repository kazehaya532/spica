import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { BookOpen, CalendarCheck, Download, Moon, Plus, Trash2, Upload, X } from 'lucide-react'
import { SKY_TARGETS } from '../lib/astronomy'
import {
  JOURNAL_STORAGE_KEY,
  calculateStreak,
  getLocalDateKey,
  getMoonPhase,
  loadJournal,
  parseJournalBackup,
  type JournalEntry,
  type JournalStore
} from '../lib/journal'

interface JournalPanelProps {
  open: boolean
  embedded?: boolean
  selectedObject: string | null
  onClose: () => void
}

const EMPTY_ENTRY: JournalEntry = { checkedIn: false, notes: '', sightings: [], updatedAt: '' }

function dateFromKey(key: string): Date {
  return new Date(`${key}T12:00:00`)
}

export function JournalPanel({ open, embedded = false, selectedObject, onClose }: JournalPanelProps) {
  const [today, setToday] = useState(() => new Date())
  const todayKey = getLocalDateKey(today)
  const [journal, setJournal] = useState<JournalStore>(() => loadJournal(window.localStorage))
  const [entryDate, setEntryDate] = useState(todayKey)
  const [sighting, setSighting] = useState('')
  const [status, setStatus] = useState('')
  const importRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const entry = journal.entries[entryDate] ?? EMPTY_ENTRY
  const moon = getMoonPhase(dateFromKey(entryDate))
  const streak = calculateStreak(journal.entries, today)
  const history = Object.keys(journal.entries).sort().reverse().slice(0, 8)

  useEffect(() => {
    if (!open) return
    const refreshToday = () => {
      const nextToday = new Date()
      setToday(nextToday)
      setEntryDate(getLocalDateKey(nextToday))
    }
    refreshToday()
    if (!embedded) window.requestAnimationFrame(() => panelRef.current?.focus())
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshToday()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [open, embedded])

  const persistJournal = (next: JournalStore, successMessage: string): boolean => {
    try {
      window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(next))
      setJournal(next)
      setStatus(successMessage)
      return true
    } catch {
      setStatus('Changes could not be saved. Check browser storage settings, then export any notes you need to keep.')
      return false
    }
  }

  const updateEntry = (change: Partial<JournalEntry>) => {
    const next: JournalStore = {
      version: 1,
      entries: {
        ...journal.entries,
        [entryDate]: {
          ...(journal.entries[entryDate] ?? EMPTY_ENTRY),
          ...change,
          updatedAt: new Date().toISOString()
        }
      }
    }
    persistJournal(next, 'Saved on this device')
  }

  const addSighting = (name: string) => {
    const cleanName = name.trim()
    if (!cleanName || entry.sightings.includes(cleanName)) return
    updateEntry({ sightings: [...entry.sightings, cleanName] })
    setSighting('')
  }

  const submitSighting = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    addSighting(sighting)
  }

  const exportJournal = () => {
    const blob = new Blob([JSON.stringify(journal, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `spica-journal-${todayKey}.json`
    link.click()
    URL.revokeObjectURL(url)
    setStatus('Journal backup downloaded')
  }

  const importJournal = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const imported = parseJournalBackup(await file.text())
      if (Object.keys(journal.entries).length > 0 && !window.confirm('Importing replaces the journal currently stored on this device. Continue?')) {
        setStatus('Import cancelled')
        return
      }
      persistJournal(imported, `Imported ${Object.keys(imported.entries).length} journal entries`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The journal backup could not be read.')
    }
  }

  const deleteEntry = () => {
    if (!window.confirm(`Delete the journal entry for ${entryDate}? This cannot be undone.`)) return
    const entries = { ...journal.entries }
    delete entries[entryDate]
    persistJournal({ version: 1, entries }, 'Entry deleted')
  }

  return (
    <aside ref={panelRef} className="journal-panel" id="journal-panel" aria-labelledby="journal-title" tabIndex={-1} hidden={!open} onKeyDown={(event) => {
      if (event.key === 'Escape') onClose()
    }}>
      <div className="journal-heading">
        <div>
          <h2 id="journal-title">Observation journal</h2>
          <p>Private by design. Every note stays in this browser.</p>
        </div>
        {!embedded && <button className="icon-button" type="button" aria-label="Close journal" onClick={onClose}><X /></button>}
      </div>

      <div className="journal-date-row">
        <label htmlFor="journal-date">Observing date</label>
        <input id="journal-date" type="date" max={todayKey} value={entryDate} required onChange={(event) => {
          if (event.target.value) setEntryDate(event.target.value)
        }} />
      </div>

      <section className="journal-night" aria-label="Night summary">
        <div className="moon-summary">
          <Moon aria-hidden="true" />
          <div><strong>{moon.name}</strong><span>{moon.illumination}% illuminated</span></div>
        </div>
        <p className="streak-copy"><CalendarCheck /> {streak > 0 ? `${streak} night${streak === 1 ? '' : 's'} in your current streak` : 'Begin a streak with tonight’s check-in'}</p>
        <button className={`check-in-action ${entry.checkedIn ? 'is-checked' : ''}`} type="button" aria-pressed={entry.checkedIn} onClick={() => updateEntry({ checkedIn: !entry.checkedIn })}>
          <CalendarCheck /> {entry.checkedIn ? 'Observed this night' : 'Mark this night observed'}
        </button>
      </section>

      <section className="journal-section" aria-labelledby="sightings-title">
        <div className="journal-section-heading">
          <h3 id="sightings-title">Sightings</h3>
          {selectedObject && <button className="text-action" type="button" onClick={() => addSighting(selectedObject)}><Plus /> Add {selectedObject}</button>}
        </div>
        {entry.sightings.length > 0 ? (
          <ul className="sighting-list">
            {entry.sightings.map((name) => (
              <li key={name}><span>{name}</span><button type="button" aria-label={`Remove ${name}`} onClick={() => updateEntry({ sightings: entry.sightings.filter((item) => item !== name) })}><X /></button></li>
            ))}
          </ul>
        ) : <p className="journal-empty">No sightings logged for this night.</p>}
        <form className="sighting-form" onSubmit={submitSighting}>
          <label className="sr-only" htmlFor="sighting-name">Object name</label>
          <input id="sighting-name" list="sky-target-names" value={sighting} onChange={(event) => setSighting(event.target.value)} placeholder="Add an object" />
          <datalist id="sky-target-names">{SKY_TARGETS.map((target) => <option key={target.name} value={target.name} />)}</datalist>
          <button type="submit" aria-label="Add sighting" disabled={!sighting.trim()}><Plus /></button>
        </form>
      </section>

      <section className="journal-section" aria-labelledby="notes-title">
        <h3 id="notes-title">Field notes</h3>
        <textarea aria-labelledby="notes-title" value={entry.notes} onChange={(event) => updateEntry({ notes: event.target.value })} placeholder="Cloud cover, seeing conditions, equipment, or what surprised you…" />
      </section>

      {history.length > 0 && (
        <section className="journal-section" aria-labelledby="history-title">
          <h3 id="history-title">Recent nights</h3>
          <div className="journal-history">
            {history.map((date) => <button type="button" className={date === entryDate ? 'is-current' : ''} key={date} onClick={() => setEntryDate(date)}>{date}</button>)}
          </div>
        </section>
      )}

      <div className="journal-actions">
        <button className="secondary-action" type="button" onClick={exportJournal}><Download /> Export</button>
        <button className="secondary-action" type="button" onClick={() => importRef.current?.click()}><Upload /> Import</button>
        <input ref={importRef} className="sr-only" type="file" accept="application/json,.json" onChange={importJournal} />
        {journal.entries[entryDate] && <button className="delete-entry" type="button" aria-label="Delete this journal entry" onClick={deleteEntry}><Trash2 /></button>}
      </div>
      <p className="journal-status" role="status">{status || <><BookOpen /> Changes save automatically</>}</p>
    </aside>
  )
}
