import { ArrowLeft, ArrowRight, BookOpen, Telescope } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import SkyMap from '../components/SkyMap'
import { celestialObjects, objectById } from '../data/celestial'
import NotFoundPage from './NotFoundPage'

export default function ObjectPage() {
  const { objectId = '' } = useParams()
  const object = objectById(objectId)

  useEffect(() => {
    if (object) document.title = `${object.name} | Spica`
    window.scrollTo(0, 0)
  }, [object])

  if (!object) return <NotFoundPage />
  const related = celestialObjects.filter((item) => item.id !== object.id && (item.constellation === object.constellation || item.type === object.type)).slice(0, 3)

  return (
    <article className="object-page">
      <div className="object-map-header">
        <SkyMap selectedId={object.id} compact />
        <Link className="back-link light-link" to="/explore"><ArrowLeft size={16} /> Return to atlas</Link>
        <div className="object-title">
          <span className="data-label">{object.type} · {object.constellation ?? 'solar system'}</span>
          <h1>{object.name}</h1>
          <p>{object.summary}</p>
        </div>
        <div className="object-plot-data"><span>PLOT</span><strong>{Math.round(object.x)}.{Math.round(object.y)}</strong></div>
      </div>
      <div className="object-profile paper-section">
        <div className="object-fact-table">
          <div><span>Object class</span><strong>{object.type}</strong></div>
          <div><span>Distance from Earth</span><strong>{object.distance}</strong></div>
          <div><span>Apparent magnitude</span><strong>{object.magnitude}</strong></div>
          <div><span>Chart region</span><strong>{object.constellation ?? 'N/A'}</strong></div>
        </div>
        <div className="profile-story">
          <div className="profile-main">
            <h2>What you are looking at</h2>
            <p>{object.summary} {object.fact}</p>
            <p>Spica plots this object from catalog coordinates and updates its apparent position for the selected observer and time. Atmospheric conditions and local obstructions can still affect what you see.</p>
          </div>
          <aside className="observing-note"><Telescope size={24} /><h3>Observation note</h3><p>{object.magnitude <= 4 ? 'Under a reasonably dark sky, this target can be found without a large telescope. Let your eyes adapt and begin with the surrounding pattern.' : 'This is a telescopic target. First locate its constellation, then use a detailed current chart and low magnification to search the area.'}</p></aside>
        </div>
        {object.lessonId && <Link className="lesson-callout" to={`/learn/${object.lessonId}`}><BookOpen size={28} /><div><span>Continue the idea</span><strong>Open the connected lesson</strong></div><ArrowRight size={22} /></Link>}
        <section className="related-profile-list"><h2>Nearby in the atlas</h2><div>{related.map((item) => <Link key={item.id} to={`/objects/${item.id}`}><span className={`object-symbol ${item.type}`} /><strong>{item.name}</strong><small>{item.constellation} · {item.type}</small><ArrowRight size={17} /></Link>)}</div></section>
      </div>
    </article>
  )
}
