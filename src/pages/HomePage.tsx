import { ArrowRight, BookOpen, Compass, MousePointer2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import SkyMap from '../components/SkyMap'
import { lessons } from '../data/lessons'
import { solarBodies } from '../data/solar'

export default function HomePage() {
  const featuredLessons = lessons.slice(0, 3)

  return (
    <>
      <section className="home-hero">
        <SkyMap compact />
        <div className="hero-copy">
          <h1>The brightest guide to <em>the universe.</em></h1>
          <p>Move from a point of light to the story behind it. Spica joins a location-aware Star Map with short lessons that make every discovery understandable.</p>
          <div className="hero-actions">
            <Link className="primary-button" to="/explore">Open the Star Map <ArrowRight size={18} /></Link>
            <Link className="secondary-button" to="/learn">Browse lessons</Link>
          </div>
        </div>
        <div className="hero-instruction"><MousePointer2 size={16} /> Trace the connected learning layers</div>
        <div className="hero-coordinate">SPICA · LIVE SKY POSITIONS</div>
      </section>

      <section className="orientation-strip" aria-label="How Spica works">
        <div><Compass size={22} /><strong>Orient</strong><span>Read the chart’s visual layers.</span></div>
        <div><MousePointer2 size={22} /><strong>Explore</strong><span>Select a star, nebula, or galaxy.</span></div>
        <div><BookOpen size={22} /><strong>Understand</strong><span>Follow the object into a lesson.</span></div>
      </section>

      <section className="paper-section lesson-intro-section">
        <div className="section-heading split-heading">
          <div><h2>A route through the universe</h2><p>Start with what you can see, then travel outward in scale.</p></div>
          <Link className="text-link dark" to="/learn">View all lessons <ArrowRight size={16} /></Link>
        </div>
        <div className="featured-lessons">
          {featuredLessons.map((lesson, index) => (
            <Link to={`/learn/${lesson.id}`} className="featured-lesson" key={lesson.id}>
              <span className="lesson-index">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <span className="data-label dark-label">{lesson.category} · {lesson.duration} min</span>
                <h3>{lesson.title}</h3>
                <p>{lesson.summary}</p>
              </div>
              <ArrowRight size={20} />
            </Link>
          ))}
        </div>
      </section>

      <section className="solar-section">
        <div className="section-heading">
          <h2>Nine worlds, one neighborhood</h2>
          <p>The planets are shown by relative character, not true distance. Even this line would need to be kilometres wide to show both size and spacing accurately.</p>
        </div>
        <div className="solar-track">
          {solarBodies.map((body) => (
            <div className="solar-body" key={body.name}>
              <span className={body.name === 'Saturn' ? 'planet-dot saturn' : 'planet-dot'} style={{ '--body-color': body.color, '--body-size': `${body.scale}px` } as React.CSSProperties} />
              <strong>{body.name}</strong>
              <span>{body.kind}</span>
            </div>
          ))}
        </div>
        <Link className="primary-button coral" to="/learn/solar-system-scale">Understand the scale <ArrowRight size={18} /></Link>
      </section>

      <section className="closing-invitation">
        <div className="orbit-rings" aria-hidden="true"><span /><span /><span /></div>
        <div>
          <h2>The next clear night starts here.</h2>
          <p>Learn a pattern today. Find it above you tomorrow.</p>
          <Link className="primary-button light" to="/explore">Begin with Orion <ArrowRight size={18} /></Link>
        </div>
      </section>
    </>
  )
}
