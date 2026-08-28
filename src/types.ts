export type ObjectType = 'star' | 'planet' | 'nebula' | 'galaxy' | 'cluster' | 'moon'

export interface CelestialObject {
  id: string
  name: string
  type: ObjectType
  x: number
  y: number
  magnitude: number
  distance: string
  constellation?: string
  color: string
  summary: string
  fact: string
  lessonId?: string
}

export interface Constellation {
  id: string
  name: string
  shortName: string
  lines: [string, string][]
  anchor: [number, number]
  note: string
}

export interface LessonSection {
  heading: string
  body: string
}

export interface Lesson {
  id: string
  title: string
  category: 'Foundations' | 'Solar system' | 'Stars' | 'Deep sky'
  duration: number
  level: 'Start here' | 'Beginner' | 'Next step'
  summary: string
  intro: string
  sections: LessonSection[]
  relatedObjects: string[]
  quizId?: string
}

export interface QuizQuestion {
  prompt: string
  options: string[]
  answer: number
  explanation: string
}

export interface Quiz {
  id: string
  title: string
  lessonId: string
  questions: QuizQuestion[]
}
