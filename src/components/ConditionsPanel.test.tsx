import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { lightMapFixture } from '../test/lightmapFixture'
import { ConditionsPanel } from './ConditionsPanel'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

const props = {
  open: true,
  location: { label: 'Greenwich, London', latitude: 51.4769, longitude: 0, elevation: 46 },
  skyDate: new Date('2026-09-11T20:00Z'),
  moon: {
    phaseName: 'Waxing Gibbous', illumination: 72, altitude: 30, azimuth: 270,
    aboveHorizon: true, nextRiseMjd: 61_194.85, nextSetMjd: 61_195.25
  },
  isOnline: true,
  onChangeLocation: vi.fn(),
  onClose: vi.fn()
}

describe('observing conditions panel', () => {
  it('loads the same-origin lightmap automatically without requesting weather', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => lightMapFixture() })
    vi.stubGlobal('fetch', fetch)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1 })
    const { rerender } = render(<ConditionsPanel {...props} />)

    expect(await screen.findByText('Bortle 1')).toBeInTheDocument()
    expect(screen.getByText(/illuminated at the selected sky time/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check night forecast' })).toBeEnabled()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toBe('/spica/lightmap/spica-lightmap.bin')

    rerender(<ConditionsPanel {...props} open={false} />)
    rerender(<ConditionsPanel {...props} />)
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
  })

  it('offers a retry when the lightmap is not installed', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    vi.stubGlobal('fetch', fetch)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1 })
    render(<ConditionsPanel {...props} />)

    expect(await screen.findByText(/not installed in this build/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry sky-darkness data' }))
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
  })
})
