import { useEffect, useRef, useState } from 'react'
import { Check, Compass, Minus, Navigation, Plus, RotateCcw, X } from 'lucide-react'
import type { StellariumEngine } from '../engine/stellarium'
import {
  CALIBRATION_WINDOW_MS,
  MAX_CALIBRATION_SPREAD,
  MIN_CALIBRATION_DURATION_MS,
  MIN_CALIBRATION_SAMPLES,
  analyzeCalibrationSamples,
  applyCompassOffset,
  getCardinalDirection,
  getOrientationReading,
  normalizeDegrees,
  smoothHeading,
  type CalibrationQuality,
  type CalibrationSample,
  type OrientationReading
} from '../lib/orientation'

const COMPASS_OFFSET_KEY = 'spica-compass-offset'
const COMPASS_FINE_OFFSET_KEY = 'spica-compass-fine-offset'
const MAX_FINE_OFFSET = 15

interface DeviceOrientationWithCompass extends DeviceOrientationEvent {
  webkitCompassHeading?: number
}

interface CompassPanelProps {
  open: boolean
  active: boolean
  getEngine: () => StellariumEngine | null
  onActiveChange: (active: boolean) => void
  onClose: () => void
  onStartPointing: () => void
}

function getStoredNumber(key: string): number | null {
  try {
    const value = window.localStorage.getItem(key)
    if (value === null) return null
    const stored = Number(value)
    return Number.isFinite(stored) ? stored : null
  } catch {
    return null
  }
}

export function CompassPanel({ open, active, getEngine, onActiveChange, onClose, onStartPointing }: CompassPanelProps) {
  const [permissionReady, setPermissionReady] = useState(false)
  const [reading, setReading] = useState<OrientationReading | null>(null)
  const [offset, setOffset] = useState<number | null>(() => getStoredNumber(COMPASS_OFFSET_KEY))
  const [fineOffset, setFineOffset] = useState(() => Math.max(-MAX_FINE_OFFSET, Math.min(MAX_FINE_OFFSET, getStoredNumber(COMPASS_FINE_OFFSET_KEY) ?? 0)))
  const [calibrationQuality, setCalibrationQuality] = useState<CalibrationQuality | null>(null)
  const [error, setError] = useState('')
  const panelRef = useRef<HTMLElement>(null)
  const readingRef = useRef<OrientationReading | null>(null)
  const hasAbsoluteReadingRef = useRef(false)
  const calibrationSamplesRef = useRef<CalibrationSample[]>([])
  const getEngineRef = useRef(getEngine)

  useEffect(() => {
    getEngineRef.current = getEngine
  }, [getEngine])

  useEffect(() => {
    if (!open) return
    window.requestAnimationFrame(() => panelRef.current?.focus())
  }, [open])

  useEffect(() => {
    if (!permissionReady || (!open && !active)) return

    const updateOrientation = (event: DeviceOrientationEvent) => {
      const sensorEvent = event as DeviceOrientationWithCompass
      const nextReading = getOrientationReading({
        alpha: sensorEvent.alpha,
        beta: sensorEvent.beta,
        absolute: sensorEvent.absolute,
        webkitCompassHeading: sensorEvent.webkitCompassHeading
      }, window.screen.orientation?.angle ?? 0)
      if (!nextReading) return
      if (!nextReading.absolute && hasAbsoluteReadingRef.current) return
      if (nextReading.absolute) hasAbsoluteReadingRef.current = true

      if (open && offset === null && nextReading.absolute) {
        const timestamp = window.performance.now()
        const cutoff = timestamp - CALIBRATION_WINDOW_MS
        const samples = calibrationSamplesRef.current.filter((sample) => sample.timestamp >= cutoff)
        samples.push({ heading: nextReading.heading, timestamp })
        calibrationSamplesRef.current = samples
        setCalibrationQuality(analyzeCalibrationSamples(samples))
      }

      const previous = readingRef.current
      const smoothedReading = previous ? {
        ...nextReading,
        heading: smoothHeading(previous.heading, nextReading.heading),
        altitude: previous.altitude * 0.78 + nextReading.altitude * 0.22
      } : nextReading

      readingRef.current = smoothedReading
      setReading(smoothedReading)
      setError(smoothedReading.absolute ? '' : 'This browser is only reporting relative motion. Absolute compass data is required to save a north calibration.')
      if (!active || offset === null) return

      const engine = getEngineRef.current()
      if (!engine) return
      engine.core.observer.yaw = applyCompassOffset(smoothedReading.heading, offset + fineOffset) * engine.D2R
      engine.core.observer.pitch = smoothedReading.altitude * engine.D2R
    }

    window.addEventListener('deviceorientation', updateOrientation)
    window.addEventListener('deviceorientationabsolute', updateOrientation as EventListener)
    return () => {
      window.removeEventListener('deviceorientation', updateOrientation)
      window.removeEventListener('deviceorientationabsolute', updateOrientation as EventListener)
    }
  }, [active, fineOffset, offset, open, permissionReady])

  useEffect(() => {
    if (!permissionReady || reading || (!open && !active)) return
    const timeout = window.setTimeout(() => {
      setError('No orientation reading arrived. Check motion access and try again in a supported mobile browser.')
    }, 4_000)
    return () => window.clearTimeout(timeout)
  }, [active, open, permissionReady, reading])

  const requestMotionAccess = async () => {
    setError('')
    if (!window.isSecureContext) {
      setError('Motion sensors require HTTPS. Open Spica through its secure published URL or an HTTPS development tunnel.')
      return
    }

    try {
      type PermissionApi = {
        requestPermission?: () => Promise<'granted' | 'denied'>
      }
      const orientationApi = window.DeviceOrientationEvent as (typeof DeviceOrientationEvent & PermissionApi) | undefined
      const motionApi = window.DeviceMotionEvent as (typeof DeviceMotionEvent & PermissionApi) | undefined
      const permissionRequest = orientationApi?.requestPermission ?? motionApi?.requestPermission
      const permission = permissionRequest
        ? await permissionRequest.call(orientationApi?.requestPermission ? orientationApi : motionApi)
        : 'granted'
      if (permission !== 'granted') {
        setError('Motion access was denied. Allow it in browser settings, then try again.')
        return
      }
      calibrationSamplesRef.current = []
      setCalibrationQuality(null)
      setPermissionReady(true)
    } catch {
      setError('Motion access could not be started. Reload the page and try again from this button.')
    }
  }

  const calibrateNorth = () => {
    if (!reading?.absolute || !calibrationQuality?.stable || Math.abs(reading.altitude) > 20) return
    const nextOffset = normalizeDegrees(-calibrationQuality.meanHeading)
    try {
      window.localStorage.setItem(COMPASS_OFFSET_KEY, String(nextOffset))
      window.localStorage.removeItem(COMPASS_FINE_OFFSET_KEY)
      const calibratedReading = { ...reading, heading: calibrationQuality.meanHeading }
      readingRef.current = calibratedReading
      setReading(calibratedReading)
      setOffset(nextOffset)
      setFineOffset(0)
      setError('')
    } catch {
      setError('Calibration could not be saved on this device. Check browser storage settings and try again.')
    }
  }

  const recalibrate = () => {
    onActiveChange(false)
    try {
      window.localStorage.removeItem(COMPASS_OFFSET_KEY)
      window.localStorage.removeItem(COMPASS_FINE_OFFSET_KEY)
      setOffset(null)
      setFineOffset(0)
      calibrationSamplesRef.current = []
      setCalibrationQuality(null)
    } catch {
      setError('The saved calibration could not be removed. Check browser storage settings and try again.')
    }
  }

  const startPointing = () => {
    if (!reading?.absolute || offset === null) return
    onStartPointing()
    onActiveChange(true)
    onClose()
  }

  const adjustFineOffset = (change: number) => {
    const nextOffset = Math.max(-MAX_FINE_OFFSET, Math.min(MAX_FINE_OFFSET, fineOffset + change))
    try {
      if (nextOffset === 0) window.localStorage.removeItem(COMPASS_FINE_OFFSET_KEY)
      else window.localStorage.setItem(COMPASS_FINE_OFFSET_KEY, String(nextOffset))
      setFineOffset(nextOffset)
      setError('')
    } catch {
      setError('The fine adjustment could not be saved. Check browser storage settings and try again.')
    }
  }

  if (!open) return null

  const calibratedHeading = reading && offset !== null ? applyCompassOffset(reading.heading, offset + fineOffset) : null
  const isFlat = Boolean(reading && Math.abs(reading.altitude) <= 20)
  const canCalibrate = Boolean(reading?.absolute && isFlat && calibrationQuality?.stable)
  const calibrationProgress = calibrationQuality
    ? Math.min(100, Math.min(
        calibrationQuality.sampleCount / MIN_CALIBRATION_SAMPLES,
        calibrationQuality.duration / MIN_CALIBRATION_DURATION_MS
      ) * 100)
    : 0
  const stabilityState = !reading?.absolute
    ? { tone: '', label: 'Waiting for absolute compass data' }
    : !isFlat
      ? { tone: 'is-unstable', label: `Lay the phone flatter · ${Math.round(Math.abs(reading.altitude))}° tilt` }
      : calibrationQuality?.stable
        ? { tone: 'is-stable', label: `Stable · ${calibrationQuality.spread.toFixed(1)}° variation` }
        : calibrationQuality && calibrationQuality.spread > MAX_CALIBRATION_SPREAD
          ? { tone: 'is-unstable', label: `Hold steady · ${calibrationQuality.spread.toFixed(1)}° variation` }
          : { tone: '', label: 'Collecting steady readings' }

  return (
    <aside ref={panelRef} className="compass-panel" id="compass-panel" aria-labelledby="compass-title" tabIndex={-1} onKeyDown={(event) => {
      if (event.key === 'Escape') onClose()
    }}>
      <div className="panel-heading">
        <div>
          <h2 id="compass-title">Point with your phone</h2>
          <p>Calibrate north before the sky follows your device.</p>
        </div>
        <button className="icon-button" type="button" aria-label="Close compass panel" onClick={onClose}><X /></button>
      </div>

      {!permissionReady ? (
        <div className="compass-intro">
          <Compass aria-hidden="true" />
          <p>Spica only reads orientation while this page is open. Sensor readings are never stored or sent anywhere.</p>
          <button className="primary-action" type="button" onClick={requestMotionAccess}>Allow motion access</button>
        </div>
      ) : (
        <>
          <div className="bearing-readout">
            <Navigation aria-hidden="true" style={{ transform: `rotate(${(calibratedHeading ?? reading?.heading ?? 0) - 45}deg)` }} />
            <div>
              <strong>{reading ? `${Math.round(calibratedHeading ?? reading.heading)}°` : 'Waiting'}</strong>
              <span>{calibratedHeading === null ? 'Raw compass heading' : `${getCardinalDirection(calibratedHeading)} · calibrated heading`}</span>
            </div>
            {reading && <small>{Math.round(reading.altitude)}° altitude</small>}
          </div>

          {offset === null ? (
            <div className="calibration-step">
              <h3>Set true north</h3>
              <p>Keep the phone in portrait, lay it flat, and point its top edge toward true north. Hold still while Spica measures the sensor.</p>
              <div className={`calibration-quality ${stabilityState.tone}`}>
                <div className="stability-meter" aria-hidden="true"><span style={{ transform: `scaleX(${calibrationProgress / 100})` }} /></div>
                <span>{stabilityState.label}</span>
              </div>
              <button className="primary-action" type="button" disabled={!canCalibrate} onClick={calibrateNorth}>
                <Compass /> Set north
              </button>
            </div>
          ) : (
            <div className="calibration-step is-ready">
              <h3><Check /> Calibration ready</h3>
              <p>Check that north reads near 0°. Lift the phone’s top edge toward the object you want to find.</p>
              <div className="fine-adjustment">
                <div><strong>Fine adjustment</strong><output>{fineOffset > 0 ? '+' : ''}{fineOffset}°</output></div>
                <p>While pointing at true north, adjust until the heading reads 0°. If ±15° is not enough, recalibrate.</p>
                <div className="fine-adjustment-controls">
                  <button type="button" aria-label="Decrease compass adjustment by 1 degree" disabled={fineOffset <= -MAX_FINE_OFFSET} onClick={() => adjustFineOffset(-1)}><Minus /> 1°</button>
                  <button type="button" disabled={fineOffset === 0} onClick={() => adjustFineOffset(-fineOffset)}>Reset</button>
                  <button type="button" aria-label="Increase compass adjustment by 1 degree" disabled={fineOffset >= MAX_FINE_OFFSET} onClick={() => adjustFineOffset(1)}><Plus /> 1°</button>
                </div>
              </div>
              {active ? (
                <button className="primary-action" type="button" onClick={() => onActiveChange(false)}>Stop device pointing</button>
              ) : (
                <button className="primary-action" type="button" disabled={!reading?.absolute} onClick={startPointing}>Start device pointing</button>
              )}
              <button className="text-action recalibrate-action" type="button" onClick={recalibrate}><RotateCcw /> Recalibrate north</button>
            </div>
          )}
        </>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
    </aside>
  )
}
