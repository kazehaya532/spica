import { useEffect, useRef, useState } from 'react'

export interface DeviceOrientationReading {
  alpha: number
  beta: number
  gamma: number
  absolute: boolean
}

type PermissionState = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unavailable'

interface DeviceOrientationEventWithPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export function useDeviceOrientation() {
  const readingRef = useRef<DeviceOrientationReading | null>(null)
  const activeRef = useRef(false)
  const [supported] = useState(() => typeof window !== 'undefined' && window.isSecureContext && 'DeviceOrientationEvent' in window)
  const [permission, setPermission] = useState<PermissionState>(() => supported ? 'unknown' : 'unavailable')
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!active) return
    activeRef.current = true
    let receivedReading = false
    const timeout = window.setTimeout(() => {
      if (!receivedReading) {
        setPermission('unavailable')
        setActive(false)
        activeRef.current = false
      }
    }, 1800)
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (![event.alpha, event.beta, event.gamma].every((value) => typeof value === 'number')) return
      receivedReading = true
      readingRef.current = { alpha: event.alpha!, beta: event.beta!, gamma: event.gamma!, absolute: event.absolute }
      setPermission('granted')
    }
    window.addEventListener('deviceorientation', handleOrientation, true)
    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener('deviceorientation', handleOrientation, true)
      activeRef.current = false
      readingRef.current = null
    }
  }, [active])

  const request = async () => {
    if (!supported) {
      setPermission('unavailable')
      return
    }
    const eventType = window.DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission
    if (eventType.requestPermission) {
      setPermission('prompt')
      try {
        const result = await eventType.requestPermission()
        if (result !== 'granted') {
          setPermission('denied')
          return
        }
      } catch {
        setPermission('denied')
        return
      }
    }
    setPermission('prompt')
    setActive(true)
  }

  const stop = () => {
    setActive(false)
    activeRef.current = false
    readingRef.current = null
  }

  return { supported, permission, active, activeRef, readingRef, request, stop }
}
