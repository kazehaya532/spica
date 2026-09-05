import { describe, expect, it, vi } from 'vitest'
import { centerTarget, findNextNightMjd, type StellariumEngine } from './stellarium'
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
})
