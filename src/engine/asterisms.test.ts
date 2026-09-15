import { describe, expect, it, vi } from 'vitest'
import {
  buildAsterismFeatures,
  clearAsterismDrawing,
  icrfToDegrees,
  showAsterismDrawing,
  type AsterismLineSource
} from './asterisms'
import type { StellariumEngine } from './stellarium'

const SOURCE: AsterismLineSource[] = [
  { id: 'triangle', name: 'Triangle', segments: [[1, 2, 3, 1]] },
  { id: 'cross', name: 'Cross', segments: [[4, 5], [6, 7]] }
]

describe('asterism drawing layer', () => {
  it('converts ICRF cartesian vectors to RA/Dec degrees with wrap', () => {
    expect(icrfToDegrees([1, 0, 0])).toEqual([0, 0])
    expect(icrfToDegrees([0, 1, 0])).toEqual([90, 0])
    expect(icrfToDegrees([0, 0, 1])).toEqual([0, 90])
    expect(icrfToDegrees([1, -1, 0])).toEqual([315, 0])
    expect(icrfToDegrees([0, 0, 0])).toBeNull()
    expect(icrfToDegrees([Number.NaN, 0, 1])).toBeNull()
    expect(icrfToDegrees('nope')).toBeNull()
  })

  it('builds one styled line feature per fully resolved segment', () => {
    const positions = new Map<number, [number, number]>([
      [1, [100, 30]],
      [2, [110, 35]],
      [3, [120, 40]],
      [4, [200, -10]],
      [5, [205, -12]],
      [6, [210, -14]],
      [7, [215, -16]]
    ])

    const data = buildAsterismFeatures(SOURCE, positions)

    expect(data.type).toBe('FeatureCollection')
    expect(data.features).toHaveLength(3)
    expect(data.features[0].geometry.coordinates).toEqual([
      [100, 30], [110, 35], [120, 40], [100, 30]
    ])
    expect(data.features[0].properties['stroke-width']).toBe(2)
    expect(data.features[0].properties['stroke-opacity']).toBeLessThan(1)
    for (const feature of data.features) {
      expect(feature.geometry.type).toBe('LineString')
      expect(feature.properties.stroke).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('drops asterisms whose segment stars did not all resolve', () => {
    const positions = new Map<number, [number, number]>([
      [1, [100, 30]],
      [2, [110, 35]],
      [3, [120, 40]]
    ])

    const data = buildAsterismFeatures(SOURCE, positions)

    expect(data.features).toHaveLength(1)
    expect(data.features[0].geometry.coordinates[0]).toEqual([100, 30])
  })

  it('returns an empty collection when nothing resolved', () => {
    expect(buildAsterismFeatures(SOURCE, new Map()).features).toEqual([])
  })

  it('shows one requested pattern and replaces the previous drawing', async () => {
    const { engine, layer, created } = createMockEngine({
      1: [1, 0, 0], 2: [0, 1, 0], 3: [0, 0, 1],
      4: [1, 0.5, 0], 5: [0.5, 1, 0], 6: [1, 1, 0], 7: [1, -1, 0]
    })

    await expect(showAsterismDrawing(engine, SOURCE[0], { retryIntervalMs: 1 })).resolves.toBe(true)
    expect(engine.createLayer).toHaveBeenCalledTimes(1)
    expect(layer.visible).toBe(true)
    expect(layer.added).toHaveLength(1)
    expect((created[0].data as { features: unknown[] }).features).toHaveLength(1)

    await expect(showAsterismDrawing(engine, SOURCE[1], { retryIntervalMs: 1 })).resolves.toBe(true)
    expect(engine.createLayer).toHaveBeenCalledTimes(1)
    expect(layer.removed).toEqual([created[0]])
    expect(layer.added).toEqual([created[0], created[1]])
    expect((created[1].data as { features: unknown[] }).features).toHaveLength(2)
  })

  it('clears the drawing and tolerates repeated clears', async () => {
    const { engine, layer, created } = createMockEngine({ 1: [1, 0, 0], 2: [0, 1, 0], 3: [0, 0, 1] })

    await showAsterismDrawing(engine, SOURCE[0], { retryIntervalMs: 1 })
    clearAsterismDrawing(engine)
    expect(layer.removed).toEqual([created[0]])
    clearAsterismDrawing(engine)
    expect(layer.removed).toEqual([created[0]])
    expect(layer.added).toEqual([created[0]])
  })

  it('draws nothing when the catalog never resolves', async () => {
    const { engine, layer } = createMockEngine({})

    await expect(showAsterismDrawing(engine, SOURCE[0], { timeoutMs: 10, retryIntervalMs: 1 })).resolves.toBe(false)
    expect(engine.createLayer).not.toHaveBeenCalled()
    expect(layer.added).toEqual([])
  })
})

interface MockGeojson {
  data: unknown
}

function createMockEngine(positionsByHip: Record<number, number[]>) {
  const layer = {
    visible: false,
    added: [] as MockGeojson[],
    removed: [] as MockGeojson[],
    add(child: MockGeojson) { this.added.push(child) },
    remove(child: MockGeojson) { this.removed.push(child) }
  }
  const created: MockGeojson[] = []
  const createObj = vi.fn((_type: 'geojson', options: { data: unknown }) => {
    const object = { data: options.data }
    created.push(object)
    return object
  })
  const createLayer = vi.fn((options: { visible: boolean }) => {
    layer.visible = options.visible
    return layer
  })
  const engine = {
    getObjByHip: vi.fn((hip: number) =>
      positionsByHip[hip] ? { getInfo: () => positionsByHip[hip] } : null),
    createLayer,
    createObj
  } as unknown as StellariumEngine & {
    createLayer: ReturnType<typeof vi.fn>
  }
  return { engine, layer, created }
}
