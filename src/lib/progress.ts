const STORAGE_KEY = 'spica-learning-progress'
const LEGACY_STORAGE_KEY = 'orbis-learning-progress'

export interface LearningProgress {
  completedLessons: string[]
  quizScores: Record<string, number>
}

const emptyProgress: LearningProgress = { completedLessons: [], quizScores: {} }

export function getProgress(): LearningProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    return stored ? { ...emptyProgress, ...JSON.parse(stored) } : emptyProgress
  } catch {
    return emptyProgress
  }
}

export function completeLesson(id: string): LearningProgress {
  const progress = getProgress()
  if (!progress.completedLessons.includes(id)) progress.completedLessons.push(id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  return progress
}

export function saveQuizScore(id: string, score: number): LearningProgress {
  const progress = getProgress()
  progress.quizScores[id] = Math.max(progress.quizScores[id] ?? 0, score)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  return progress
}
