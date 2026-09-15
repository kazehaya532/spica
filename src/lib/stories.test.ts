import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ALL_STORIES,
  ASTERISM_STORIES,
  CONSTELLATION_STORIES,
  findConstellationStory,
  findStoryForSelection,
  searchStories
} from './stories'

interface SkycultureIndex {
  constellations: Array<{ iau: string; lines: number[][] }>
}

// The bundled western skyculture is the ground truth for star positions used
// by the asterism drawings.
function loadSkycultureHips(): Map<string, Set<number>> {
  const path = resolve(process.cwd(), 'public/skydata/skycultures/western/index.json')
  const index = JSON.parse(readFileSync(path, 'utf-8')) as SkycultureIndex
  const byIau = new Map<string, Set<number>>()
  for (const constellation of index.constellations) {
    const hips = new Set<number>()
    for (const line of constellation.lines) {
      for (const hip of line) hips.add(hip)
    }
    byIau.set(constellation.iau, hips)
  }
  return byIau
}

describe('constellation stories dataset', () => {
  it('keeps every story id and IAU code unique', () => {
    const ids = ALL_STORIES.map((story) => story.id)
    expect(new Set(ids).size).toBe(ids.length)

    const iauCodes = CONSTELLATION_STORIES.map((story) => story.iau)
    expect(new Set(iauCodes).size).toBe(iauCodes.length)
    for (const code of iauCodes) expect(code).toMatch(/^[A-Z][A-Za-z]{2}$/)
  })

  it('gives every story at least one folklore section and metadata', () => {
    for (const story of ALL_STORIES) {
      expect(story.stories.length, story.id).toBeGreaterThan(0)
      for (const section of story.stories) {
        expect(section.text.length, story.id).toBeGreaterThan(40)
        expect(section.culture.length, story.id).toBeGreaterThan(0)
      }
      expect(story.bestMonths.length, story.id).toBeGreaterThan(0)
      expect(story.tagline.length, story.id).toBeGreaterThan(0)
      expect(story.visibility, story.id).toMatch(/^(north|south|both)$/)
    }
  })

  it('keeps catalog references valid for sky centering', () => {
    for (const story of ALL_STORIES) {
      expect(story.centerAliases.length, story.id).toBeGreaterThan(0)
      const hips = story.kind === 'constellation'
        ? story.brightestStars.map((star) => star.hip)
        : story.stars.map((star) => star.hip)
      for (const hip of hips) {
        if (hip !== undefined) expect(hip, story.id).toBeGreaterThanOrEqual(1)
        if (hip !== undefined) expect(hip, story.id).toBeLessThanOrEqual(130_000)
      }
      for (const alias of story.centerAliases) {
        expect(alias, story.id).toMatch(/^(CON western [A-Za-z]{3}|HIP \d+)$/)
      }
    }
  })

  it('requires asterism stars to carry HIP numbers for centering', () => {
    for (const asterism of ASTERISM_STORIES) {
      expect(asterism.stars.length, asterism.id).toBeGreaterThan(2)
      const centered = asterism.stars.filter((star) => star.hip !== undefined)
      expect(centered.length, asterism.id).toBeGreaterThanOrEqual(1)
    }
  })

  it('draws asterism segments only between skyculture-verified stars', () => {
    const hipsByIau = loadSkycultureHips()
    for (const asterism of ASTERISM_STORIES) {
      expect(asterism.lineSegments.length, asterism.id).toBeGreaterThan(0)
      const verified = new Set<number>()
      for (const name of asterism.constellations) {
        const story = CONSTELLATION_STORIES.find((candidate) => candidate.name === name)
        expect(story, `${asterism.id} -> ${name}`).toBeTruthy()
        const hips = hipsByIau.get(story!.iau)
        expect(hips, `${story!.iau} present in skyculture`).toBeTruthy()
        for (const hip of hips!) verified.add(hip)
      }
      for (const segment of asterism.lineSegments) {
        expect(segment.length, asterism.id).toBeGreaterThanOrEqual(2)
        for (const hip of segment) {
          expect(verified.has(hip), `${asterism.id} segment star HIP ${hip}`).toBe(true)
        }
      }
    }
  })

  it('cross-references asterisms that exist and star lookups that resolve', () => {
    const asterismIds = new Set(ASTERISM_STORIES.map((story) => story.id))
    for (const story of CONSTELLATION_STORIES) {
      for (const asterismId of story.asterismIds ?? []) {
        expect(asterismIds.has(asterismId), `${story.id} -> ${asterismId}`).toBe(true)
      }
    }
    for (const asterism of ASTERISM_STORIES) {
      for (const name of asterism.constellations) {
        const found = CONSTELLATION_STORIES.some((story) => story.name === name)
        expect(found, `${asterism.id} -> ${name}`).toBe(true)
      }
    }
  })

  it('searches by name, culture, and folklore text', () => {
    expect(searchStories('orion').map((story) => story.id)).toContain('orion')
    expect(searchStories('qixi').map((story) => story.id)).toContain('summer-triangle')
    expect(searchStories('kartika').map((story) => story.id)).toContain('taurus')
    expect(searchStories('magpies bridge seventh')).toEqual([expect.objectContaining({ id: 'summer-triangle' })])
    expect(searchStories('albireo').map((story) => story.id)).toContain('albireo')
    expect(searchStories('winter albireo').map((story) => story.id)).toContain('winter-albireo')
    expect(searchStories('h3945').map((story) => story.id)).toContain('winter-albireo')
    expect(searchStories('zzz-no-match')).toEqual([])
  })

  it('resolves engine selections to constellation stories', () => {
    expect(findStoryForSelection('HIP 65474', 'Spica')?.id).toBe('virgo')
    expect(findStoryForSelection('HIP 91262', 'Vega')?.id).toBe('lyra')
    expect(findStoryForSelection('HIP 27989', 'Betelgeuse')?.id).toBe('orion')
    expect(findConstellationStory('Ori')?.name).toBe('Orion')
    expect(findStoryForSelection('M 42', 'Orion Nebula')).toBeUndefined()
  })

  it('gives dedicated star stories precedence for their own stars', () => {
    expect(findStoryForSelection('HIP 95947', 'Albireo')?.id).toBe('albireo')
    expect(findStoryForSelection('HIP 35210', 'Winter Albireo')?.id).toBe('winter-albireo')
    expect(findStoryForSelection(null, 'albireo')?.id).toBe('albireo')
    expect(findStoryForSelection('HIP 102098', 'Deneb')?.id).toBe('cygnus')
  })

  it('matches engine Bayer/Flamsteed names for stars without proper names', () => {
    expect(findStoryForSelection('* bet01 Cyg', 'bet01 Cyg')?.id).toBe('albireo')
    expect(findStoryForSelection('* 145 CMa', '145 CMa')?.id).toBe('winter-albireo')
    expect(findStoryForSelection('bet01 Cyg', 'bet01 Cyg')?.id).toBe('albireo')
  })
})
