import { useMemo, useState } from 'react'
import { BookOpen, ChevronLeft, Search, Sparkles, Star, Waypoints } from 'lucide-react'
import { ALL_STORIES, searchStories, type SkyStory } from '../lib/stories'

interface StoriesTabProps {
  initialStoryId?: string | null
  onCenter: (story: SkyStory) => void
}

const VISIBILITY_LABELS: Record<SkyStory['visibility'], string> = {
  north: 'Best from the northern hemisphere',
  south: 'Best from the southern hemisphere',
  both: 'Visible from both hemispheres'
}

export function StoriesTab({ initialStoryId, onCenter }: StoriesTabProps) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(initialStoryId ?? null)
  const results = useMemo(() => searchStories(query), [query])
  const selected = useMemo(
    () => ALL_STORIES.find((story) => story.id === selectedId) ?? null,
    [selectedId]
  )

  if (selected) {
    return (
      <article className="story-detail" aria-label={`${selected.name} story`}>
        <button className="text-action story-back" type="button" onClick={() => setSelectedId(null)}>
          <ChevronLeft /> All stories
        </button>
        <header className="story-heading">
          <span className="story-kind">{selected.kind === 'asterism' ? 'Star pattern' : selected.kind === 'star' ? 'Star' : 'Constellation'}</span>
          <h3>{selected.name}</h3>
          <p>{selected.tagline}</p>
        </header>
        <dl className="story-meta">
          <div><dt>Best evenings</dt><dd>{selected.bestMonths}</dd></div>
          <div><dt>Visibility</dt><dd>{VISIBILITY_LABELS[selected.visibility]}</dd></div>
        </dl>
        <button className="primary-action" type="button" onClick={() => onCenter(selected)}>
          <Star /> Center in the sky
        </button>
        {selected.kind === 'asterism' && (
          <p className="story-hint"><Waypoints /> Its lines appear on the sky when you center it</p>
        )}
        <section className="story-sections" aria-label="Folklore">
          {selected.stories.map((section, index) => (
            <div className="story-section" key={`${selected.id}-${index}`}>
              <span className="story-culture">{section.culture}</span>
              {section.title && <h4>{section.title}</h4>}
              <p>{section.text}</p>
            </div>
          ))}
        </section>
        <section className="story-stars" aria-label="Notable stars">
          <h4>Notable stars</h4>
          <ul>
            {(selected.kind === 'constellation' ? selected.brightestStars : selected.stars).map((star) => (
              <li key={star.name}><strong>{star.name}</strong>{star.note && <span>{star.note}</span>}</li>
            ))}
          </ul>
        </section>
      </article>
    )
  }

  return (
    <div className="stories-browser">
      <div className="story-search">
        <Search aria-hidden="true" />
        <label className="sr-only" htmlFor="story-search">Search constellation stories</label>
        <input
          id="story-search"
          type="search"
          placeholder="Search myths, asterisms, cultures…"
          value={query}
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {query && results.length === 0 && <p className="story-empty">No story matches “{query}” yet.</p>}
      <ul className="story-list">
        {(query ? results : ALL_STORIES).map((story) => (
          <li key={story.id}>
            <button type="button" onClick={() => setSelectedId(story.id)}>
              <span className="story-symbol" aria-hidden="true">
                {story.kind === 'asterism' ? <Sparkles /> : story.kind === 'star' ? <Star /> : <BookOpen />}
              </span>
              <span><strong>{story.name}</strong><small>{story.tagline}</small></span>
              <span className="story-kind-badge">{story.kind === 'asterism' ? 'Pattern' : story.kind === 'star' ? 'Star' : 'Sky figure'}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
