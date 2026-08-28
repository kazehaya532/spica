import { useState } from 'react'
import { GLOBAL_OBSERVER, type ObserverLocation } from '../lib/astronomy'

const STORAGE_KEY = 'spica-observer-location'

function storedLocation(): ObserverLocation {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? JSON.parse(value) as ObserverLocation : GLOBAL_OBSERVER
  } catch {
    return GLOBAL_OBSERVER
  }
}

export function useObserverLocation() {
  const [location, setLocationState] = useState<ObserverLocation>(storedLocation)
  const [status, setStatus] = useState<'idle' | 'requesting' | 'denied' | 'unavailable'>('idle')

  const saveLocation = (next: ObserverLocation) => {
    const reduced = next.source === 'global' ? next : {
      ...next,
      latitude: Math.round(next.latitude * 100) / 100,
      longitude: Math.round(next.longitude * 100) / 100,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced))
    setLocationState(reduced)
    setStatus('idle')
  }

  const requestDeviceLocation = () => {
    if (!navigator.geolocation) {
      setStatus('unavailable')
      return
    }
    setStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => saveLocation({ latitude: coords.latitude, longitude: coords.longitude, label: 'Your approximate location', source: 'device' }),
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 900_000 },
    )
  }

  return { location, status, requestDeviceLocation, saveLocation, useGlobalLocation: () => saveLocation(GLOBAL_OBSERVER) }
}
