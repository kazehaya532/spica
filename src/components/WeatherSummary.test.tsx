import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WeatherSummary } from './WeatherSummary'
import { weatherFixture } from '../test/weatherFixture'

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers() })
const props = { latitude: 51.4769, longitude: 0, skyDate: new Date('2026-09-11T20:00Z'), isOnline: true }

describe('weather request lifecycle', () => {
  it('fetches only on request and reuses data when the selected time changes', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => weatherFixture() })
    vi.stubGlobal('fetch', fetch)
    const { rerender } = render(<WeatherSummary {...props} />)
    expect(fetch).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Check night forecast' }))
    expect(await screen.findByText('Good window')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Forecast loaded. Good window.')
    rerender(<WeatherSummary {...props} skyDate={new Date('2030-01-01T12:00Z')} />)
    expect(screen.getByText(/No complete sunset-to-sunrise/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('No sunset-to-sunrise forecast is available')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('aborts an old location request and rejects its late result after remount', async () => {
    let resolve!: (response: unknown) => void
    const fetch = vi.fn().mockImplementation(() => new Promise((done) => { resolve = done }))
    vi.stubGlobal('fetch', fetch)
    const { rerender } = render(<WeatherSummary key="first" {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Check night forecast' }))
    const signal = fetch.mock.calls[0][1].signal as AbortSignal
    rerender(<WeatherSummary key="second" {...props} latitude={-6.2} />)
    expect(signal.aborted).toBe(true)
    await act(async () => resolve({ ok: true, json: async () => weatherFixture() }))
    expect(screen.queryByText('Good window')).not.toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('explains offline and failed requests and allows a retry', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network'))
    vi.stubGlobal('fetch', fetch)
    const { rerender } = render(<WeatherSummary {...props} isOnline={false} />)
    expect(screen.getByRole('button', { name: 'Check night forecast' })).toBeDisabled()
    rerender(<WeatherSummary {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Check night forecast' }))
    await waitFor(() => expect(screen.getByText(/Could not load the forecast/)).toBeInTheDocument())
    fetch.mockResolvedValue({ ok: true, json: async () => weatherFixture() })
    fireEvent.click(screen.getByRole('button', { name: 'Check night forecast' }))
    expect(await screen.findByText('Good window')).toBeInTheDocument()
  })

  it('ends a hanging request with a retryable timeout', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })))
    render(<WeatherSummary {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Check night forecast' }))
    await act(async () => vi.advanceTimersByTimeAsync(15_000))
    expect(screen.getByText(/request timed out/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check night forecast' })).toBeEnabled()
  })
})
