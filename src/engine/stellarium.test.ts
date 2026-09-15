import { describe, expect, it, vi } from 'vitest'
import { applyLayers, centerTarget, clearEngineSelection, findNextNightMjd, getMoonConditions, showTonight, type StellariumEngine } from './stellarium'
import type { SkyTarget } from '../lib/astronomy'

describe('Stellarium integration helpers', () => {
  it('finds the next five-minute interval of astronomical darkness', () => {
    const start = 60_000
    const night = findNextNightMjd(start, (candidate) => (
      candidate >= start + 30 / 1_440 ? -0.3 : 0
    ))

    expect(night).toBeCloseTo(start + 30 / 1_440, 8)
  })

  it('keeps the current instant when the sky is already dark', () => {
    const start = 60_000.12345
    expect(findNextNightMjd(start, () => -0.3)).toBe(start)
  })

  it('clears native lock and selection object pointers', () => {
    const object = { designations: vi.fn(), getInfo: vi.fn() }
    const core = { selection: object, lock: object }
    const engine = { core } as unknown as StellariumEngine

    clearEngineSelection(engine)

    expect(core.lock).toBe(0)
    expect(core.selection).toBe(0)
  })

  it('applies every layer flag to the engine, including deep-sky hints', () => {
    const core = {
      constellations: { lines_visible: true, labels_visible: true },
      atmosphere: { visible: true },
      landscapes: { visible: true },
      lines: { azimuthal: { visible: false }, equatorial: { visible: false } },
      dsos: { visible: true, hints_visible: true },
      milkyway: { visible: true }
    }
    const engine = { core } as unknown as StellariumEngine

    applyLayers(engine, {
      constellations: false,
      atmosphere: false,
      landscape: false,
      azimuthal: true,
      equatorial: true,
      deepSky: false,
      milkyWay: false
    })

    expect(core.constellations.lines_visible).toBe(false)
    expect(core.constellations.labels_visible).toBe(false)
    expect(core.atmosphere.visible).toBe(false)
    expect(core.landscapes.visible).toBe(false)
    expect(core.lines.azimuthal.visible).toBe(true)
    expect(core.lines.equatorial.visible).toBe(true)
    expect(core.dsos.visible).toBe(false)
    expect(core.dsos.hints_visible).toBe(false)
    expect(core.milkyway.visible).toBe(false)
  })

  it('showTonight moves time without resurrecting hidden layers', () => {
    const sun = {
      getInfo: vi.fn(() => [0, 0, 1])
    }
    const observer = {
      utc: 60_000,
      tt: 60_000.0008,
      clone: vi.fn(() => ({ utc: 60_000, tt: 60_000.0008, destroy: vi.fn() })),
      destroy: vi.fn()
    }
    const core = {
      observer,
      atmosphere: { visible: false },
      dsos: { visible: false, hints_visible: false },
      milkyway: { visible: false }
    }
    const engine = {
      D2R: Math.PI / 180,
      core,
      getObj: vi.fn(() => sun),
      convertFrame: vi.fn(() => [0, 0, -1]),
      c2s: vi.fn(() => [0, -0.4]),
      anpm: vi.fn((angle: number) => angle)
    } as unknown as StellariumEngine

    const night = showTonight(engine)

    expect(night).toBe(60_000)
    expect(core.observer.utc).toBe(60_000)
    expect(core.atmosphere.visible).toBe(false)
    expect(core.dsos.visible).toBe(false)
    expect(core.dsos.hints_visible).toBe(false)
    expect(core.milkyway.visible).toBe(false)
  })

  it('retries catalog lookup while asynchronous tiles load', async () => {
    const object = {
      designations: () => ['HIP 65474', 'NAME Spica'],
      getInfo: vi.fn(),
      update: vi.fn()
    }
    let attempts = 0
    const engine = {
      D2R: Math.PI / 180,
      core: { selection: null, lock: null },
      getObj: vi.fn(),
      getObjByHip: vi.fn(() => (++attempts >= 3 ? object : null)),
      pointAndLock: vi.fn()
    } as unknown as StellariumEngine
    const target: SkyTarget = {
      name: 'Spica',
      subtitle: 'Brightest star in Virgo',
      kind: 'Star',
      aliases: ['HIP 65474']
    }

    await expect(centerTarget(engine, target, { timeoutMs: 100, retryIntervalMs: 1 })).resolves.toBe(true)
    expect(engine.getObjByHip).toHaveBeenCalledWith(65474)
    expect(engine.core.selection).toBe(object)
    expect(engine.pointAndLock).toHaveBeenCalledWith(object, 0.7, 25 * engine.D2R)
  })

  it('derives local moonlight conditions from the selected Stellarium observer time', () => {
    const observer = { utc: 60_000, tt: 60_000.0008, destroy: vi.fn() }
    const futureObserver = { utc: 60_000, tt: 60_000.0008, destroy: vi.fn() }
    const coreObserver = {
      ...observer,
      clone: vi.fn()
        .mockReturnValueOnce(observer)
        .mockReturnValueOnce(futureObserver)
    }
    const moon = {
      getInfo: vi.fn((key: string, selectedObserver: typeof observer) => {
        if (key === 'radec') return [1, 2, 3]
        if (key === 'phase') return selectedObserver === futureObserver ? 0.76 : 0.72
        return null
      }),
      computeVisibility: vi.fn(() => [{ rise: observer.tt + 0.1, set: observer.tt + 0.5 }])
    }
    const engine = {
      D2R: Math.PI / 180,
      core: { observer: coreObserver },
      getObj: vi.fn(() => moon),
      convertFrame: vi.fn(() => [4, 5, 6]),
      c2s: vi.fn(() => [-Math.PI / 2, Math.PI / 6])
    } as unknown as StellariumEngine

    expect(getMoonConditions(engine)).toEqual({
      phaseName: 'Waxing Gibbous',
      illumination: 72,
      altitude: 29.999999999999996,
      azimuth: 270,
      aboveHorizon: true,
      nextRiseMjd: 60_000.1,
      nextSetMjd: 60_000.5
    })
    expect(moon.computeVisibility).toHaveBeenCalledWith({
      obs: observer,
      startTime: observer.tt,
      endTime: observer.tt + 1.1
    })
    expect(observer.destroy).toHaveBeenCalled()
    expect(futureObserver.destroy).toHaveBeenCalled()
  })
})
