import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import CreditsPage from './pages/CreditsPage'
import HomePage from './pages/HomePage'
import LearnPage from './pages/LearnPage'
import LessonPage from './pages/LessonPage'
import NotFoundPage from './pages/NotFoundPage'
import ObjectPage from './pages/ObjectPage'
import QuizzesPage from './pages/QuizzesPage'

const ExplorePage = lazy(() => import('./pages/ExplorePage'))

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<Suspense fallback={<div className="route-loading">Plotting the sky…</div>}><ExplorePage /></Suspense>} />
        <Route path="learn" element={<LearnPage />} />
        <Route path="learn/:lessonId" element={<LessonPage />} />
        <Route path="objects/:objectId" element={<ObjectPage />} />
        <Route path="quizzes" element={<QuizzesPage />} />
        <Route path="credits" element={<CreditsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
