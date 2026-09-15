import { useEffect, useRef } from 'react'
import { BookMarked, BookOpen, CloudMoon, Compass, NotebookPen, X } from 'lucide-react'
import type { MoonConditions, StellariumEngine } from '../engine/stellarium'
import type { ObserverLocation } from '../lib/location'
import type { SkyStory } from '../lib/stories'
import { CompassPanel } from './CompassPanel'
import { ConditionsPanel } from './ConditionsPanel'
import { JournalPanel } from './JournalPanel'
import { StoriesTab } from './StoriesTab'

export type GuideTab = 'stories' | 'journal' | 'conditions' | 'compass'

const GUIDE_TABS: Array<{ id: GuideTab; label: string; icon: typeof BookOpen }> = [
  { id: 'stories', label: 'Stories', icon: BookOpen },
  { id: 'journal', label: 'Journal', icon: NotebookPen },
  { id: 'conditions', label: 'Conditions', icon: CloudMoon },
  { id: 'compass', label: 'Compass', icon: Compass }
]

interface GuidePanelProps {
  open: boolean
  tab: GuideTab
  onTabChange: (tab: GuideTab) => void
  onClose: () => void
  location: ObserverLocation
  skyDate: Date
  moon: MoonConditions | null
  isOnline: boolean
  selectedObject: string | null
  getEngine: () => StellariumEngine | null
  compassActive: boolean
  onCompassActiveChange: (active: boolean) => void
  onStartPointing: () => void
  onChangeLocation: () => void
  onCenterStory: (story: SkyStory) => void
  focusStoryId: string | null
}

export function GuidePanel({
  open,
  tab,
  onTabChange,
  onClose,
  location,
  skyDate,
  moon,
  isOnline,
  selectedObject,
  getEngine,
  compassActive,
  onCompassActiveChange,
  onStartPointing,
  onChangeLocation,
  onCenterStory,
  focusStoryId
}: GuidePanelProps) {
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    window.requestAnimationFrame(() => panelRef.current?.focus())
  }, [open])

  // All four tab panes stay mounted so each section keeps its state while the
  // user switches tabs or closes the guide (matches the old panel behavior).
  return (
    <aside
      ref={panelRef}
      className="guide-panel"
      id="guide-panel"
      aria-label="Field guide"
      tabIndex={-1}
      hidden={!open}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <div className="guide-heading">
        <h2 id="guide-title"><BookMarked aria-hidden="true" /> Field guide</h2>
        <button className="icon-button" type="button" aria-label="Close guide" onClick={onClose}><X /></button>
      </div>

      <div className="guide-tabs" role="tablist" aria-label="Guide sections">
        {GUIDE_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`guide-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`guide-pane-${id}`}
            className={tab === id ? 'is-active' : ''}
            onClick={() => onTabChange(id)}
          >
            <Icon /><span>{label}</span>
          </button>
        ))}
      </div>

      <div className="guide-content">
        <div className="guide-pane" id="guide-pane-stories" role="tabpanel" aria-labelledby="guide-tab-stories" hidden={tab !== 'stories'}>
          <StoriesTab key={focusStoryId ?? 'browse'} initialStoryId={focusStoryId} onCenter={onCenterStory} />
        </div>
        <div className="guide-pane" id="guide-pane-journal" role="tabpanel" aria-labelledby="guide-tab-journal" hidden={tab !== 'journal'}>
          <JournalPanel
            open={tab === 'journal'}
            embedded
            selectedObject={selectedObject}
            onClose={onClose}
          />
        </div>
        <div className="guide-pane" id="guide-pane-conditions" role="tabpanel" aria-labelledby="guide-tab-conditions" hidden={tab !== 'conditions'}>
          <ConditionsPanel
            open={tab === 'conditions'}
            embedded
            location={location}
            skyDate={skyDate}
            moon={moon}
            isOnline={isOnline}
            onChangeLocation={onChangeLocation}
            onClose={onClose}
          />
        </div>
        <div className="guide-pane" id="guide-pane-compass" role="tabpanel" aria-labelledby="guide-tab-compass" hidden={tab !== 'compass'}>
          <CompassPanel
            open={tab === 'compass'}
            embedded
            active={compassActive}
            getEngine={getEngine}
            onActiveChange={onCompassActiveChange}
            onClose={onClose}
            onStartPointing={onStartPointing}
          />
        </div>
      </div>
    </aside>
  )
}
