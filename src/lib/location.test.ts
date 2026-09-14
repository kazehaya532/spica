import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchTerrainElevation, searchLocations } from './location'

afterEach(() => vi.unstubAllGlobals())

describe('location providers', () => {
  it('returns detailed, validated Photon results from OpenStreetMap data', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: { osm_type: 'R', osm_id: 16192960, name: 'Legok', county: 'Tangerang Regency', state: 'Banten', country: 'Indonesia' },
            geometry: { coordinates: [106.5746584, -6.3024829] }
          },
          { properties: { osm_type: 'R', osm_id: 2, name: 'Broken' }, geometry: { coordinates: [0, 120] } },
          null
        ]
      })
    })
    vi.stubGlobal('fetch', fetch)
    const signal = new AbortController().signal

    await expect(searchLocations(' Legok, Tangerang ', signal)).resolves.toEqual([{
      id: 'osm-R-16192960',
      label: 'Legok, Tangerang Regency, Banten, Indonesia',
      detail: 'Tangerang Regency, Banten, Indonesia',
      latitude: -6.3024829,
      longitude: 106.5746584
    }])
    const url = fetch.mock.calls[0][0] as URL
    expect(url.origin + url.pathname).toBe('https://photon.komoot.io/api')
    expect(url.searchParams.get('q')).toBe('Legok, Tangerang')
    expect(fetch).toHaveBeenCalledWith(url, { signal, credentials: 'omit' })
  })

  it('falls back to validated Open-Meteo results when Photon has no match', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ features: [] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 1, name: 'London', admin2: 'Greater London', admin1: 'England', country: 'United Kingdom', latitude: 51.5085, longitude: -0.1257, elevation: 25, timezone: 'Europe/London' }] })
      })
    vi.stubGlobal('fetch', fetch)

    await expect(searchLocations('London', new AbortController().signal)).resolves.toEqual([{
      id: 'geonames-1',
      label: 'London, Greater London, England, United Kingdom',
      detail: 'Greater London, England, United Kingdom',
      latitude: 51.5085,
      longitude: -0.1257,
      elevation: 25,
      timezone: 'Europe/London'
    }])
    expect((fetch.mock.calls[1][0] as URL).hostname).toBe('geocoding-api.open-meteo.com')
  })

  it('returns no results without issuing a request for a short query', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    await expect(searchLocations('A', new AbortController().signal)).resolves.toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('validates terrain elevation responses and coordinates', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ elevation: [74] }) })
    vi.stubGlobal('fetch', fetch)
    const signal = new AbortController().signal
    await expect(fetchTerrainElevation(52.52, 13.41, signal)).resolves.toBe(74)
    await expect(fetchTerrainElevation(100, 13.41, signal)).rejects.toThrow('valid')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('uses actionable provider errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    await expect(searchLocations('Berlin', new AbortController().signal)).rejects.toThrow('Place search is unavailable')
    await expect(fetchTerrainElevation(52.52, 13.41, new AbortController().signal)).rejects.toThrow('enter it manually')
  })

  it('does not issue a fallback request after cancellation', async () => {
    const controller = new AbortController()
    controller.abort()
    const fetch = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'))
    vi.stubGlobal('fetch', fetch)
    await expect(searchLocations('Legok', controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
