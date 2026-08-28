import { ArrowLeft, Orbit } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return <section className="not-found"><Orbit size={64} strokeWidth={1} /><span>404 · Off the chart</span><h1>There is nothing plotted here.</h1><p>The page may have moved, or this coordinate never existed.</p><Link className="primary-button coral" to="/"><ArrowLeft size={17} /> Return home</Link></section>
}
