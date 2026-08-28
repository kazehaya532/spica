import { describe, expect, it } from 'vitest'
import { celestialObjects, constellations, objectById } from './celestial'
import { constellationFigures } from './constellationFigures'
import { lessonById, lessons, quizzes } from './lessons'
import { solarBodies } from './solar'

describe('educational content links', () => {
  it('keeps constellation line references valid', () => {
    constellations.forEach((constellation) => {
      constellation.lines.flat().forEach((id) => expect(objectById(id), `${constellation.name}: ${id}`).toBeDefined())
    })
  })

  it('keeps lesson, object, and quiz references connected', () => {
    lessons.forEach((lesson) => {
      lesson.relatedObjects.forEach((id) => expect(objectById(id), `${lesson.title}: ${id}`).toBeDefined())
      if (lesson.quizId) expect(quizzes.some((quiz) => quiz.id === lesson.quizId)).toBe(true)
    })
    celestialObjects.forEach((object) => {
      if (object.lessonId) expect(lessonById(object.lessonId), `${object.name}: ${object.lessonId}`).toBeDefined()
    })
  })

  it('includes a complete introductory solar system set', () => {
    expect(solarBodies.map((body) => body.name)).toEqual(['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'])
  })

  it('includes original figures for all 88 IAU constellations', () => {
    expect(constellationFigures).toHaveLength(88)
    expect(new Set(constellationFigures.map((figure) => figure.shortName)).size).toBe(88)
    constellationFigures.forEach((figure) => expect(figure.segments.length, figure.shortName).toBeGreaterThan(0))
  })
})
