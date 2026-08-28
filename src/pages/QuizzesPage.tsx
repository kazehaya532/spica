import { ArrowRight, Check, RotateCcw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { quizzes } from '../data/lessons'
import { getProgress, saveQuizScore } from '../lib/progress'

export default function QuizzesPage() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('quiz')
  const [activeId, setActiveId] = useState(requested && quizzes.some((quiz) => quiz.id === requested) ? requested : quizzes[0].id)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const activeQuiz = quizzes.find((quiz) => quiz.id === activeId)!
  const question = activeQuiz.questions[questionIndex]
  const progress = getProgress()

  useEffect(() => { document.title = 'Knowledge checks | Spica' }, [])

  const chooseQuiz = (id: string) => {
    setActiveId(id); setParams({ quiz: id }); setQuestionIndex(0); setSelected(null); setScore(0); setFinished(false)
  }

  const next = () => {
    const nextScore = score + (selected === question.answer ? 1 : 0)
    if (questionIndex === activeQuiz.questions.length - 1) {
      setScore(nextScore); saveQuizScore(activeQuiz.id, nextScore); setFinished(true)
    } else {
      setScore(nextScore); setQuestionIndex((current) => current + 1); setSelected(null)
    }
  }

  const restart = () => { setQuestionIndex(0); setSelected(null); setScore(0); setFinished(false) }

  return (
    <div className="quiz-page">
      <aside className="quiz-index">
        <h1>Knowledge checks</h1>
        <p>Small questions, useful explanations. A wrong answer is another way into the idea.</p>
        <div>
          {quizzes.map((quiz, index) => (
            <button type="button" className={activeId === quiz.id ? 'active' : ''} key={quiz.id} onClick={() => chooseQuiz(quiz.id)}>
              <span>{String(index + 1).padStart(2, '0')}</span><strong>{quiz.title}</strong>{progress.quizScores[quiz.id] !== undefined && <small>{progress.quizScores[quiz.id]}/{quiz.questions.length}</small>}
            </button>
          ))}
        </div>
      </aside>
      <section className="quiz-stage">
        {!finished ? (
          <div className="quiz-sheet">
            <div className="quiz-progress"><span>Question {questionIndex + 1} of {activeQuiz.questions.length}</span><span>{activeQuiz.title}</span></div>
            <h2>{question.prompt}</h2>
            <div className="answer-options">
              {question.options.map((option, index) => {
                const answered = selected !== null
                const correct = index === question.answer
                const chosen = index === selected
                return <button type="button" disabled={answered} onClick={() => setSelected(index)} key={option} className={answered && correct ? 'correct' : answered && chosen ? 'incorrect' : ''}><span>{String.fromCharCode(65 + index)}</span>{option}{answered && correct && <Check size={18} />}{answered && chosen && !correct && <X size={18} />}</button>
              })}
            </div>
            {selected !== null && <div className={selected === question.answer ? 'answer-explanation correct-note' : 'answer-explanation'} aria-live="polite"><strong>{selected === question.answer ? 'That’s right.' : 'Not quite yet.'}</strong><p>{question.explanation}</p></div>}
            <div className="quiz-actions"><Link className="text-link" to={`/learn/${activeQuiz.lessonId}`}>Review the lesson</Link><button className="primary-button coral" disabled={selected === null} onClick={next} type="button">{questionIndex === activeQuiz.questions.length - 1 ? 'See result' : 'Next question'} <ArrowRight size={17} /></button></div>
          </div>
        ) : (
          <div className="quiz-result">
            <div className="result-orbit"><span>{score}/{activeQuiz.questions.length}</span></div>
            <h2>{score === activeQuiz.questions.length ? 'A clear reading.' : 'Keep tracing the pattern.'}</h2>
            <p>{score === activeQuiz.questions.length ? 'You answered every question correctly. The next step is finding the idea in the atlas.' : 'Review the explanation, revisit the connected lesson, and try again when you are ready.'}</p>
            <div><button className="primary-button coral" type="button" onClick={restart}><RotateCcw size={17} /> Try again</button><Link className="secondary-button dark-button" to="/explore">Open the atlas</Link></div>
          </div>
        )}
      </section>
    </div>
  )
}
