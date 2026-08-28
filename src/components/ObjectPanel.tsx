import { ArrowRight, BookOpen, Crosshair } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CelestialObject } from '../types'

export default function ObjectPanel({ object }: { object: CelestialObject }) {
  return (
    <article className="object-panel">
      <div className="object-panel-heading">
        <span className={`object-symbol ${object.type}`} aria-hidden="true" />
        <div>
          <span className="data-label">{object.type}{object.constellation ? ` · ${object.constellation}` : ''}</span>
          <h2>{object.name}</h2>
        </div>
      </div>
      <p className="object-summary">{object.summary}</p>
      <dl className="object-data">
        <div><dt>Distance</dt><dd>{object.distance}</dd></div>
        <div><dt>Magnitude</dt><dd>{object.magnitude}</dd></div>
      </dl>
      <p className="atlas-note"><span>Atlas note</span>{object.fact}</p>
      <div className="panel-actions">
        <Link className="text-link" to={`/objects/${object.id}`}>Open profile <ArrowRight size={16} /></Link>
        {object.lessonId && <Link className="text-link muted" to={`/learn/${object.lessonId}`}><BookOpen size={15} /> Related lesson</Link>}
      </div>
      <div className="coordinate-mark"><Crosshair size={14} /> Plot {Math.round(object.x)}.{Math.round(object.y)}</div>
    </article>
  )
}
