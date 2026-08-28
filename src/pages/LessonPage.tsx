import { ArrowLeft, ArrowRight, Check, CircleCheck, Clock3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { objectById } from '../data/celestial'
import { lessonById, lessons } from '../data/lessons'
import { solarBodies } from '../data/solar'
import { completeLesson, getProgress } from '../lib/progress'
import NotFoundPage from './NotFoundPage'

export default function LessonPage() {
  const { lessonId = '' } = useParams()
  const lesson = lessonById(lessonId)
  const [complete, setComplete] = useState(() => getProgress().completedLessons.includes(lessonId))

  useEffect(() => {
    if (lesson) document.title = `${lesson.title} | Spica`
    window.scrollTo(0, 0)
  }, [lesson])

  if (!lesson) return <NotFoundPage />
  const currentIndex = lessons.findIndex((item) => item.id === lesson.id)
  const nextLesson = lessons[(currentIndex + 1) % lessons.length]
  const related = lesson.relatedObjects.map(objectById).filter(Boolean)

  return (
    <article className="lesson-page paper-section">
      <header className="lesson-hero">
        <Link className="back-link" to="/learn"><ArrowLeft size={16} /> All lessons</Link>
        <div className="lesson-title-block">
          <span className="data-label dark-label">{lesson.category} · {lesson.level}</span>
          <h1>{lesson.title}</h1>
          <p>{lesson.intro}</p>
          <span className="lesson-duration"><Clock3 size={17} /> {lesson.duration} minute read</span>
        </div>
        <div className="lesson-plate" aria-hidden="true">
          <span className="plate-orbit orbit-one" /><span className="plate-orbit orbit-two" /><span className="plate-orbit orbit-three" />
          <span className="plate-body" />
          <strong>{String(currentIndex + 1).padStart(2, '0')}</strong>
        </div>
      </header>

      <div className="lesson-content">
        <aside className="lesson-margin">
          <span>In this lesson</span>
          {lesson.sections.map((section) => <a key={section.heading} href={`#${section.heading.toLowerCase().replaceAll(' ', '-')}`}>{section.heading}</a>)}
        </aside>
        <div className="lesson-article">
          {lesson.sections.map((section, index) => (
            <section key={section.heading} id={section.heading.toLowerCase().replaceAll(' ', '-')}>
              <span className="section-mark">{String(index + 1).padStart(2, '0')}</span>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
              {lesson.id === 'solar-system-scale' && index === 1 && (
                <div className="solar-table" aria-label="Solar system bodies">
                  {solarBodies.map((body) => <div key={body.name}><span className="table-planet" style={{ background: body.color }} /><strong>{body.name}</strong><span>{body.diameter}</span><small>{body.distance} from Sun</small></div>)}
                </div>
              )}
            </section>
          ))}

          {related.length > 0 && (
            <section className="related-objects">
              <h2>Find it in the atlas</h2>
              <p>These plotted objects connect directly to the ideas in this lesson.</p>
              <div>
                {related.map((object) => object && <Link to={`/objects/${object.id}`} key={object.id}><span className={`object-symbol ${object.type}`} /><strong>{object.name}</strong><small>{object.type} · {object.distance}</small><ArrowRight size={17} /></Link>)}
              </div>
            </section>
          )}

          <div className="lesson-completion">
            <div>{complete ? <CircleCheck size={28} /> : <Check size={28} />}<div><strong>{complete ? 'Lesson complete' : 'Ready to mark this lesson complete?'}</strong><p>Your progress is stored on this device.</p></div></div>
            <button className={complete ? 'secondary-button complete-button' : 'primary-button coral'} type="button" disabled={complete} onClick={() => { completeLesson(lesson.id); setComplete(true) }}>{complete ? 'Completed' : 'Mark complete'}</button>
          </div>
          <div className="lesson-next">
            {lesson.quizId && <Link className="secondary-button dark-button" to={`/quizzes?quiz=${lesson.quizId}`}>Take the knowledge check</Link>}
            <Link className="next-lesson" to={`/learn/${nextLesson.id}`}><span>Continue learning</span><strong>{nextLesson.title}</strong><ArrowRight size={19} /></Link>
          </div>
        </div>
      </div>
    </article>
  )
}
