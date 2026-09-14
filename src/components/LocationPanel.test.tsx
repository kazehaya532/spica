import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocationPanel } from './LocationPanel'

vi.mock('./LocationMap', () => ({
  LocationMap: ({ onPick }: { onPick: (latitude: number, longitude: number) => void }) => (
    <button type="button" onClick={() => onPick(-6.2, 106.8)}>Pick Jakarta on map</button>
  )
}))

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

const location = { label: 'Greenwich, London', latitude: 51.4769, longitude: 0, elevation: 46, timezone: 'Europe/London' }

function renderPanel(onSave = vi.fn(), isOnline = true) {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1 })
  render(
    <LocationPanel
      open
      location={location}
      isOnline={isOnline}
      locating={false}
      externalError=""
      onUseCurrentLocation={vi.fn()}
      onSave={onSave}
      onClose={vi.fn()}
    />
  )
  return onSave
}

describe('observer location panel', () => {
  it('searches OSM detail and estimates elevation before saving', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ features: [{ properties: { osm_type: 'R', osm_id: 16192960, name: 'Legok', county: 'Tangerang Regency', state: 'Banten', country: 'Indonesia' }, geometry: { coordinates: [106.5746584, -6.3024829] } }] })
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ elevation: [43] }) })
    vi.stubGlobal('fetch', fetch)
    const onSave = renderPanel()

    fireEvent.change(screen.getByLabelText('Find a place or postcode'), { target: { value: 'Legok, Tangerang' } })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    fireEvent.click(await screen.findByRole('option', { name: /Legok, Tangerang Regency/ }))

    expect(screen.getByLabelText('Latitude')).toHaveValue(-6.3024829)
    await waitFor(() => expect(screen.getByLabelText('Elevation in metres')).toHaveValue(43))
    fireEvent.click(screen.getByRole('button', { name: 'Set observer location' }))
    expect(onSave).toHaveBeenCalledWith({
      label: 'Legok, Tangerang Regency, Banten, Indonesia', latitude: -6.3024829, longitude: 106.5746584,
      elevation: 43, timezone: undefined
    })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('estimates terrain elevation after a map selection', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ elevation: [9] }) })
    vi.stubGlobal('fetch', fetch)
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Pick Jakarta on map' }))
    expect(screen.getByLabelText('Latitude')).toHaveValue(-6.2)
    await waitFor(() => expect(screen.getByLabelText('Elevation in metres')).toHaveValue(9))
    const url = fetch.mock.calls[0][0] as URL
    expect(url.pathname).toBe('/v1/elevation')
    expect(url.searchParams.get('latitude')).toBe('-6.2')
    expect(url.searchParams.get('longitude')).toBe('106.8')
  })

  it('keeps manual coordinates available offline', () => {
    renderPanel(vi.fn(), false)
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled()
    expect(screen.getByLabelText('Latitude')).toBeEnabled()
    expect(screen.getByText(/Manual coordinates remain available/)).toBeInTheDocument()
  })
})
