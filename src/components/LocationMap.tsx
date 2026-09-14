import { useEffect, useRef, useState } from 'react'
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl'
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

interface LocationMapProps {
  open: boolean
  isOnline: boolean
  latitude: number
  longitude: number
  onPick: (latitude: number, longitude: number) => void
}

export function LocationMap({ open, isOnline, latitude, longitude, onPick }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markerRef = useRef<MapLibreMarker | null>(null)
  const onPickRef = useRef(onPick)
  const coordinateRef = useRef({ latitude, longitude })
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  onPickRef.current = onPick
  coordinateRef.current = { latitude, longitude }

  useEffect(() => {
    if (!open || !isOnline || !containerRef.current) return
    let active = true
    setStatus('loading')

    void import('maplibre-gl').then((maplibre) => {
      if (!active || !containerRef.current) return
      maplibre.setWorkerUrl(mapWorkerUrl)
      const initial = coordinateRef.current
      const map = new maplibre.Map({
        container: containerRef.current,
        style: 'https://tiles.openfreemap.org/styles/dark',
        center: [initial.longitude, initial.latitude],
        zoom: 8,
        attributionControl: false,
        cooperativeGestures: true
      })
      const marker = new maplibre.Marker({ color: '#e9b260', draggable: true })
        .setLngLat([initial.longitude, initial.latitude])
        .addTo(map)
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right')
      map.addControl(new maplibre.AttributionControl({
        compact: true,
        customAttribution: '<a href="https://openfreemap.org/" target="_blank">OpenFreeMap</a> · <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
      }))
      map.on('click', (event) => onPickRef.current(event.lngLat.lat, event.lngLat.lng))
      marker.on('dragend', () => {
        const point = marker.getLngLat()
        onPickRef.current(point.lat, point.lng)
      })
      map.once('load', () => { if (active) setStatus('ready') })
      map.once('error', () => { if (active && !map.loaded()) setStatus('error') })
      mapRef.current = map
      markerRef.current = marker
    }).catch(() => { if (active) setStatus('error') })

    return () => {
      active = false
      markerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
      setStatus('idle')
    }
  }, [open, isOnline])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return
    const current = marker.getLngLat()
    if (Math.abs(current.lat - latitude) < 1e-7 && Math.abs(current.lng - longitude) < 1e-7) return
    marker.setLngLat([longitude, latitude])
    map.easeTo({ center: [longitude, latitude], zoom: Math.max(map.getZoom(), 8), duration: 450 })
  }, [latitude, longitude])

  if (!isOnline) return <div className="location-map-state"><strong>Map unavailable offline</strong><span>Manual coordinates and saved locations still work.</span></div>

  return (
    <div className="location-map-shell">
      <div ref={containerRef} className="location-map" role="region" aria-label="Interactive observer location map" />
      {status === 'loading' && <p className="location-map-status" role="status">Loading world map…</p>}
      {status === 'error' && <p className="location-map-status form-error" role="alert">The world map could not load. Search or enter coordinates instead.</p>}
      <p className="location-map-hint">Click the map or drag the amber pin. Terrain elevation updates automatically.</p>
    </div>
  )
}
