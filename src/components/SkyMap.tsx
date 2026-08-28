import { LocateFixed, Minus, Plus, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { celestialObjects, constellations } from '../data/celestial'
import type { CelestialObject } from '../types'

interface SkyMapProps {
  selectedId?: string
  onSelect?: (object: CelestialObject) => void
  showConstellations?: boolean
  showLabels?: boolean
  showDeepSky?: boolean
  compact?: boolean
}

const backgroundStars = Array.from({ length: 150 }, (_, index) => ({
  x: ((index * 47.73) % 101),
  y: ((index * index * 11.17 + 17) % 97),
  size: 0.35 + ((index * 13) % 9) / 9,
  alpha: 0.25 + ((index * 7) % 6) / 10,
}))

export default function SkyMap({
  selectedId,
  onSelect,
  showConstellations = true,
  showLabels = true,
  showDeepSky = true,
  compact = false,
}: SkyMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef({ active: false, moved: false, x: 0, y: 0 })
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = rect.width * ratio
      canvas.height = rect.height * ratio
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      const width = rect.width
      const height = rect.height
      const labelRects: Array<{ x: number; y: number; width: number; height: number }> = []
      const point = (x: number, y: number) => ({
        x: width / 2 + (x / 100 * width - width / 2) * view.zoom + view.x,
        y: height / 2 + (y / 100 * height - height / 2) * view.zoom + view.y,
      })

      context.fillStyle = '#07182a'
      context.fillRect(0, 0, width, height)

      context.strokeStyle = 'rgba(168, 195, 206, 0.1)'
      context.lineWidth = 1
      for (let x = 10; x < 100; x += 10) {
        const start = point(x, 0)
        const end = point(x, 100)
        context.beginPath(); context.moveTo(start.x, start.y); context.lineTo(end.x, end.y); context.stroke()
      }
      for (let y = 10; y < 100; y += 10) {
        const start = point(0, y)
        const end = point(100, y)
        context.beginPath(); context.moveTo(start.x, start.y); context.lineTo(end.x, end.y); context.stroke()
      }

      backgroundStars.forEach((star) => {
        const p = point(star.x, star.y)
        context.beginPath()
        context.fillStyle = `rgba(244, 240, 218, ${star.alpha})`
        context.arc(p.x, p.y, star.size * Math.min(view.zoom, 1.5), 0, Math.PI * 2)
        context.fill()
      })

      if (showConstellations) {
        context.strokeStyle = 'rgba(99, 187, 196, 0.6)'
        context.lineWidth = 1.2
        context.setLineDash([5, 5])
        constellations.forEach((constellation) => {
          constellation.lines.forEach(([fromId, toId]) => {
            const from = celestialObjects.find((object) => object.id === fromId)
            const to = celestialObjects.find((object) => object.id === toId)
            if (!from || !to) return
            const start = point(from.x, from.y)
            const end = point(to.x, to.y)
            context.beginPath(); context.moveTo(start.x, start.y); context.lineTo(end.x, end.y); context.stroke()
          })
          if (showLabels && !compact) {
            const label = point(...constellation.anchor)
            context.font = '10px "Spline Sans Mono"'
            context.fillStyle = 'rgba(142, 211, 214, 0.7)'
            context.fillText(constellation.shortName, label.x, label.y)
          }
        })
        context.setLineDash([])
      }

      celestialObjects.forEach((object) => {
        if (!showDeepSky && object.type !== 'star') return
        const p = point(object.x, object.y)
        const isSelected = object.id === selectedId
        const radius = object.type === 'star' ? Math.max(1.7, 3.6 - object.magnitude * 0.5) : 5
        if (isSelected) {
          context.beginPath()
          context.strokeStyle = '#ef6548'
          context.lineWidth = 1.5
          context.arc(p.x, p.y, radius + 8, 0, Math.PI * 2)
          context.stroke()
        }
        context.beginPath()
        context.fillStyle = object.color
        if (object.type === 'galaxy') {
          context.save(); context.translate(p.x, p.y); context.rotate(-0.35); context.scale(1.8, 0.7); context.arc(0, 0, radius, 0, Math.PI * 2); context.fill(); context.restore()
        } else if (object.type === 'nebula') {
          context.globalAlpha = 0.72; context.arc(p.x, p.y, radius + 1, 0, Math.PI * 2); context.fill(); context.globalAlpha = 1
        } else if (object.type === 'cluster') {
          for (let i = 0; i < 5; i += 1) context.fillRect(p.x + (i % 3) * 3 - 3, p.y + Math.floor(i / 3) * 3 - 2, 1.5, 1.5)
        } else {
          context.arc(p.x, p.y, radius, 0, Math.PI * 2); context.fill()
        }
        if (showLabels && (isSelected || (!compact && (object.magnitude < 1 || object.type !== 'star')))) {
          context.font = isSelected ? '600 12px Geologica' : '11px Geologica'
          context.fillStyle = isSelected ? '#fff9e9' : 'rgba(244, 240, 218, 0.78)'
          const textWidth = context.measureText(object.name).width
          const candidates = [
            { x: p.x + radius + 6, y: p.y - 6 },
            { x: p.x + radius + 6, y: p.y + 15 },
            { x: p.x - radius - textWidth - 6, y: p.y - 6 },
            { x: p.x - radius - textWidth - 6, y: p.y + 15 },
          ]
          const chosen = candidates.find((candidate) => {
            const label = { x: candidate.x - 2, y: candidate.y - 12, width: textWidth + 4, height: 16 }
            const inside = label.x > 18 && label.x + label.width < width - 18 && label.y > 18 && label.y + label.height < height - 18
            const clear = labelRects.every((placed) => label.x + label.width < placed.x || label.x > placed.x + placed.width || label.y + label.height < placed.y || label.y > placed.y + placed.height)
            return inside && clear
          })
          if (chosen) {
            context.fillText(object.name, chosen.x, chosen.y)
            labelRects.push({ x: chosen.x - 2, y: chosen.y - 12, width: textWidth + 4, height: 16 })
          }
        }
      })

      context.strokeStyle = 'rgba(244, 240, 218, 0.32)'
      context.lineWidth = 1
      context.strokeRect(12, 12, width - 24, height - 24)
      context.font = '10px "Spline Sans Mono"'
      context.fillStyle = 'rgba(244, 240, 218, 0.55)'
      context.fillText('CURATED NORTHERN SKY · EDUCATIONAL PROJECTION', 24, height - 28)
    }

    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [compact, selectedId, showConstellations, showDeepSky, showLabels, view])

  const findObject = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas || !onSelect) return
    const rect = canvas.getBoundingClientRect()
    let nearest: CelestialObject | undefined
    let nearestDistance = 18
    celestialObjects.forEach((object) => {
      if (!showDeepSky && object.type !== 'star') return
      const x = rect.width / 2 + (object.x / 100 * rect.width - rect.width / 2) * view.zoom + view.x
      const y = rect.height / 2 + (object.y / 100 * rect.height - rect.height / 2) * view.zoom + view.y
      const distance = Math.hypot(clientX - rect.left - x, clientY - rect.top - y)
      if (distance < nearestDistance) { nearest = object; nearestDistance = distance }
    })
    if (nearest) onSelect(nearest)
  }

  return (
    <div className={compact ? 'sky-map compact' : 'sky-map'}>
      <canvas
        ref={canvasRef}
        aria-label="Interactive educational star map"
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { active: true, moved: false, x: event.clientX, y: event.clientY } }}
        onPointerMove={(event) => {
          if (!dragRef.current.active) return
          const dx = event.clientX - dragRef.current.x
          const dy = event.clientY - dragRef.current.y
          if (Math.abs(dx) + Math.abs(dy) > 3) dragRef.current.moved = true
          dragRef.current.x = event.clientX; dragRef.current.y = event.clientY
          setView((current) => ({ ...current, x: current.x + dx, y: current.y + dy }))
        }}
        onPointerUp={(event) => { if (!dragRef.current.moved) findObject(event.clientX, event.clientY); dragRef.current.active = false }}
        onWheel={(event) => { event.preventDefault(); setView((current) => ({ ...current, zoom: Math.min(2.8, Math.max(0.8, current.zoom - event.deltaY * 0.001)) })) }}
      />
      {!compact && (
        <div className="map-controls" aria-label="Map controls">
          <button type="button" className="icon-button" onClick={() => setView((current) => ({ ...current, zoom: Math.min(2.8, current.zoom + 0.25) }))} aria-label="Zoom in"><Plus size={18} /></button>
          <button type="button" className="icon-button" onClick={() => setView((current) => ({ ...current, zoom: Math.max(0.8, current.zoom - 0.25) }))} aria-label="Zoom out"><Minus size={18} /></button>
          <button type="button" className="icon-button" onClick={() => setView({ zoom: 1, x: 0, y: 0 })} aria-label="Reset map"><RotateCcw size={17} /></button>
        </div>
      )}
      {!compact && <div className="map-orientation"><LocateFixed size={15} /> Drag to move · scroll to zoom</div>}
    </div>
  )
}
