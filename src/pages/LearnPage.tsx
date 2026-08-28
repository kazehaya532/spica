import { ArrowRight, Check, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { lessons } from '../data/lessons'
import { getProgress } from '../lib/progress'
import type { Lesson } from '../types'

const categories: Array<'All' | Lesson['category']> = ['All', 'Foundations', 'Solar system', 'Stars', 'Deep sky']

export default function LearnPage() {
  const [category, setCategory] = useState<(typeof categories)[number]>('All')
  const [search, setSearch] = useState('')
  const progress = getProgress()
  const filtered = lessons.filter((lesson) => (category === 'All' || lesson.category === category) && `${lesson.title} ${lesson.summary}`.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => { document.title = 'Astronomy lessons | Spica' }, [])

  return (
    <div className="learn-page paper-section">
      <header className="page-intro">
        <div><h1>Build your picture of the universe.</h1><p>Eight short lessons, ordered from reading the sky to understanding the deep universe. Choose a route or follow your curiosity.</p></div>
        <div className="progress-stamp"><strong>{progress.completedLessons.length}</strong><span>of {lessons.length}<br />lessons marked complete</span></div>
      </header>
      <div className="lesson-tools">
        <div className="category-tabs" role="group" aria-label="Filter lessons by category">
          {categories.map((item) => <button type="button" key={item} onClick={() => setCategory(item)} className={category === item ? 'active' : ''}>{item}</button>)}
        </div>
        <label className="search-field paper-search"><Search size={18} /><span className="sr-only">Search lessons</span><input placeholder="Search lessons" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      </div>
      <div className="lesson-ledger">
        {filtered.map((lesson, index) => {
          const complete = progress.completedLessons.includes(lesson.id)
          return (
            <Link to={`/learn/${lesson.id}`} className="lesson-row" key={lesson.id}>
              <span className="lesson-number">{String(index + 1).padStart(2, '0')}</span>
              <div className="lesson-row-main">
                <span className="data-label dark-label">{lesson.category} · {lesson.level}</span>
                <h2>{lesson.title}</h2>
                <p>{lesson.summary}</p>
              </div>
              <div className="lesson-meta"><span>{lesson.duration} min</span>{complete ? <span className="complete-mark"><Check size={15} /> Complete</span> : <ArrowRight size={20} />}</div>
            </Link>
          )
        })}
        {!filtered.length && <p className="empty-state paper-empty">No lessons match those filters. Clear the search or choose another topic.</p>}
      </div>
    </div>
  )
}
