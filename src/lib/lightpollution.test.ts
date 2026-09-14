import { describe, expect, it, vi, afterEach } from 'vitest'
import { lightMapFixture } from '../test/lightmapFixture'
import { NATURAL_SKY_BRIGHTNESS, decodeBrightness, decodeLightMap, deriveSkyDarkness, fetchLightMap, lookupBrightness } from './lightpollution'

afterEach(() => vi.unstubAllGlobals())

describe('light-pollution map', () => {
  it('validates and expands run-length encoded cells', () => {
    const map = decodeLightMap(lightMapFixture())
    expect(map.values).toEqual(new Uint8Array([1, 2, 3, 255, 0, 2, 2, 2]))
    expect(() => decodeLightMap(new ArrayBuffer(10))).toThrow('incomplete')
    const badMagic = lightMapFixture()
    new Uint8Array(badMagic)[0] = 0
    expect(() => decodeLightMap(badMagic)).toThrow('Unsupported')
    const oversizedGrid = lightMapFixture()
    const view = new DataView(oversizedGrid)
    view.setUint16(8, 4_000, true)
    view.setUint16(10, 2_000, true)
    view.setFloat32(20, 0.09, true)
    view.setUint32(32, 8_000_000, true)
    expect(() => decodeLightMap(oversizedGrid)).toThrow('metadata')
  })

  it('looks up cells while clamping poles and wrapping the antimeridian', () => {
    const map = decodeLightMap(lightMapFixture())
    expect(lookupBrightness(map, 89, -179)).toBeCloseTo(decodeBrightness(1, -3, 2)!)
    expect(lookupBrightness(map, 89, 181)).toBeCloseTo(decodeBrightness(1, -3, 2)!)
    expect(lookupBrightness(map, -90, -90)).toBeCloseTo(decodeBrightness(2, -3, 2)!)
    expect(lookupBrightness(map, 89, 90)).toBeNull()
    expect(lookupBrightness(map, Number.NaN, 0)).toBeNull()
  })

  it('loads same-origin binary data and explains a missing production asset', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'application/octet-stream' }), arrayBuffer: async () => lightMapFixture() })
    vi.stubGlobal('fetch', fetch)
    const signal = new AbortController().signal
    await expect(fetchLightMap('/spica/lightmap/spica-lightmap.bin', signal)).resolves.toMatchObject({ width: 4, height: 2 })
    expect(fetch).toHaveBeenCalledWith('/spica/lightmap/spica-lightmap.bin', { signal, credentials: 'same-origin' })
    fetch.mockResolvedValue({ ok: false, status: 404 })
    await expect(fetchLightMap('/missing', signal)).rejects.toThrow('not installed')
    fetch.mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'text/html' }), arrayBuffer: async () => new TextEncoder().encode('<!doctype html><title>Spica</title>').buffer })
    await expect(fetchLightMap('/spa-fallback', signal)).rejects.toThrow('not installed')
  })
})

describe('sky-darkness guidance', () => {
  it('converts a natural sky to the expected SQM scale', () => {
    const darkness = deriveSkyDarkness(0)!
    expect(darkness.totalBrightness).toBe(NATURAL_SKY_BRIGHTNESS)
    expect(darkness.sqm).toBeCloseTo(22, 6)
    expect(darkness.naturalRatio).toBe(1)
    expect(darkness.bortle).toBe(1)
  })

  it('classifies documented SQM boundaries consistently', () => {
    const artificialForSqm = (sqm: number) => 108_000_000 * 10 ** (-0.4 * sqm) - NATURAL_SKY_BRIGHTNESS
    for (const [sqm, bortle] of [[21.99, 1], [21.89, 2], [21.69, 3], [20.49, 4], [19.5, 5], [18.94, 6], [18.38, 7], [17.8, 8], [17, 9]]) {
      expect(deriveSkyDarkness(artificialForSqm(sqm))?.bortle).toBe(bortle)
    }
    expect(deriveSkyDarkness(-1)).toBeNull()
  })
})
