import { Maximize2, Minimize2, Minus, Navigation, Plus, RotateCcw, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Body } from 'astronomy-engine'
import { constellationFigures, type ConstellationFigure } from '../data/constellationFigures'
import { skyCatalog } from '../data/skyCatalog'
import { loadStarField, starCount } from '../data/starField'
import { bodyHorizontal, fixedHorizontal, fixedHorizontalFast, planetBodies, sunAltitude, type ObserverLocation } from '../lib/astronomy'
import { useDeviceOrientation, type DeviceOrientationReading } from '../hooks/useDeviceOrientation'

export interface StarMapLayers {
  constellations: boolean
  constellationArt: boolean
  zodiacFocus: boolean
  atmosphere: boolean
  azimuthalGrid: boolean
  equatorialGrid: boolean
  deepSky: boolean
  nightMode: boolean
}

interface StarMap3DProps {
  date: Date
  location: ObserverLocation
  layers: StarMapLayers
  selectedId?: string
  onSelect: (id: string) => void
}

const planetColors: Record<string, string> = {
  Mercury: '#b9b1a5', Venus: '#f2cf8f', Mars: '#e78361', Jupiter: '#e2c097', Saturn: '#ead69d', Uranus: '#9fdde0', Neptune: '#7399e6', Sun: '#ffd36b', Moon: '#eceddf',
}

function skyVector(azimuth: number, altitude: number, radius = 100) {
  const az = THREE.MathUtils.degToRad(azimuth)
  const alt = THREE.MathUtils.degToRad(altitude)
  return new THREE.Vector3(
    Math.sin(az) * Math.cos(alt) * radius,
    Math.sin(alt) * radius,
    -Math.cos(az) * Math.cos(alt) * radius,
  )
}

function setCameraDirection(camera: THREE.PerspectiveCamera, azimuth: number, altitude: number) {
  const direction = skyVector(azimuth, altitude, 1).normalize()
  camera.lookAt(direction)
}

function rotateCamera(camera: THREE.PerspectiveCamera, horizontal: number, vertical: number) {
  const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), horizontal)
  camera.quaternion.premultiply(yaw)
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize()
  const pitch = new THREE.Quaternion().setFromAxisAngle(right, vertical)
  camera.quaternion.premultiply(pitch)
}

function setDeviceOrientationQuaternion(reading: DeviceOrientationReading, output: THREE.Quaternion) {
  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(reading.beta),
    THREE.MathUtils.degToRad(reading.alpha),
    -THREE.MathUtils.degToRad(reading.gamma),
    'YXZ',
  )
  output.setFromEuler(euler)
  output.multiply(new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2))
  const screenAngle = typeof screen.orientation?.angle === 'number' ? screen.orientation.angle : 0
  output.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -THREE.MathUtils.degToRad(screenAngle)))
}

function dotTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64; canvas.height = 64
  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 30)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(.22, 'rgba(255,255,255,.95)')
  gradient.addColorStop(.45, 'rgba(255,255,255,.32)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient; context.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

function deepSkyTexture(kind: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 64; canvas.height = 64
  const context = canvas.getContext('2d')!
  context.strokeStyle = '#fff'; context.lineWidth = 4
  context.beginPath()
  if (kind === 'galaxy') context.ellipse(32, 32, 24, 9, -.35, 0, Math.PI * 2)
  else if (kind === 'cluster') { context.setLineDash([3, 5]); context.arc(32, 32, 20, 0, Math.PI * 2) }
  else { context.arc(32, 32, 18, 0, Math.PI * 2); context.arc(32, 32, 8, 0, Math.PI * 2) }
  context.stroke()
  return new THREE.CanvasTexture(canvas)
}

function labelSprite(text: string, color = '#f7f1dd', width = 18, height = 3.6) {
  const canvas = document.createElement('canvas')
  canvas.width = 320; canvas.height = 64
  const context = canvas.getContext('2d')!
  context.font = '500 22px Geologica'
  context.fillStyle = color
  context.textBaseline = 'middle'
  context.fillText(text, 8, 32)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, opacity: .86 }))
  sprite.scale.set(width, height, 1)
  return sprite
}

function artSprite(figure: ConstellationFigure) {
  const canvas = document.createElement('canvas')
  canvas.width = 320; canvas.height = 320
  const context = canvas.getContext('2d')!
  const points = figure.segments.flatMap(([fromRa, fromDec, toRa, toDec]) => [[fromRa, fromDec], [toRa, toDec]])
  const project = ([ra, dec]: number[]) => {
    const deltaRa = ((ra - figure.anchor[0] + 12) % 24 + 24) % 24 - 12
    return [deltaRa * Math.cos(THREE.MathUtils.degToRad(figure.anchor[1])), dec - figure.anchor[1]]
  }
  const projected = points.map(project)
  const minX = Math.min(...projected.map(([x]) => x)); const maxX = Math.max(...projected.map(([x]) => x))
  const minY = Math.min(...projected.map(([, y]) => y)); const maxY = Math.max(...projected.map(([, y]) => y))
  const scale = Math.min(220 / Math.max(maxX - minX, 1), 220 / Math.max(maxY - minY, 1))
  const centerX = (minX + maxX) / 2; const centerY = (minY + maxY) / 2
  const point = ([ra, dec]: number[]) => {
    const [x, y] = project([ra, dec])
    return [160 + (x - centerX) * scale, 154 - (y - centerY) * scale]
  }

  context.strokeStyle = 'rgba(103,187,194,.12)'
  context.lineWidth = 14
  context.lineCap = 'round'
  context.shadowColor = 'rgba(103,187,194,.25)'
  context.shadowBlur = 22
  context.beginPath()
  for (const [fromRa, fromDec, toRa, toDec] of figure.segments) {
    const start = point([fromRa, fromDec]); const end = point([toRa, toDec])
    context.moveTo(start[0], start[1]); context.lineTo(end[0], end[1])
  }
  context.stroke()
  context.shadowBlur = 0
  context.strokeStyle = 'rgba(151,222,218,.72)'
  context.lineWidth = 3
  context.setLineDash([8, 5])
  context.lineCap = 'round'
  context.beginPath()
  for (const [fromRa, fromDec, toRa, toDec] of figure.segments) {
    const start = point([fromRa, fromDec]); const end = point([toRa, toDec])
    context.moveTo(start[0], start[1]); context.lineTo(end[0], end[1])
  }
  context.stroke()
  context.setLineDash([])
  context.fillStyle = 'rgba(239,101,72,.82)'
  for (const [ra, dec] of points) {
    const [x, y] = point([ra, dec])
    context.beginPath(); context.arc(x, y, 3.5, 0, Math.PI * 2); context.fill()
  }
  context.fillStyle = 'rgba(151,222,218,.8)'
  context.font = '600 15px Spline Sans Mono'
  context.textAlign = 'center'
  context.fillText(figure.shortName, 160, 292)
  context.strokeStyle = 'rgba(151,222,218,.2)'
  context.lineWidth = 1
  context.beginPath(); context.arc(160, 160, 143, 0, Math.PI * 2); context.stroke()
  const texture = new THREE.CanvasTexture(canvas)
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: .8 }))
  sprite.scale.set(22, 22, 1)
  return sprite
}

function gridLine(points: THREE.Vector3[], color: number, opacity: number) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }))
}

function addAzimuthalGrid(group: THREE.Object3D) {
  for (let azimuth = 0; azimuth < 360; azimuth += 30) {
    group.add(gridLine(Array.from({ length: 35 }, (_, index) => skyVector(azimuth, -5 + index * 2.8, 99)), 0x67bbc2, .22))
  }
  for (const altitude of [0, 30, 60]) {
    group.add(gridLine(Array.from({ length: 73 }, (_, index) => skyVector(index * 5, altitude, 99)), altitude === 0 ? 0xef6548 : 0x67bbc2, altitude === 0 ? .45 : .2))
  }
}

function addEquatorialGrid(group: THREE.Object3D, date: Date, location: ObserverLocation) {
  for (let ra = 0; ra < 24; ra += 2) {
    group.add(gridLine(Array.from({ length: 37 }, (_, index) => {
      const pos = fixedHorizontal(ra, -90 + index * 5, date, location)
      return skyVector(pos.azimuth, pos.altitude, 98.5)
    }), 0xb39be0, .22))
  }
  for (const dec of [-60, -30, 0, 30, 60]) {
    group.add(gridLine(Array.from({ length: 73 }, (_, index) => {
      const pos = fixedHorizontal(index / 3, dec, date, location)
      return skyVector(pos.azimuth, pos.altitude, 98.5)
    }), 0xb39be0, dec === 0 ? .42 : .2))
  }
}

function starColor(colorIndex: number) {
  if (colorIndex < -.2) return new THREE.Color('#9cbcff')
  if (colorIndex < 0) return new THREE.Color('#b5ceff')
  if (colorIndex < .35) return new THREE.Color('#d9e7ff')
  if (colorIndex < .75) return new THREE.Color('#fff4df')
  if (colorIndex < 1.15) return new THREE.Color('#ffd6a6')
  return new THREE.Color('#ffad7c')
}

function atmosphereTransmission(sunlight: number) {
  if (sunlight <= -12) return 1
  if (sunlight >= -3) return .035
  return .035 + (-sunlight - 3) / 9 * .965
}

function horizonVisibility(altitude: number, atmosphere: boolean) {
  if (!atmosphere) return 1
  return .22 + THREE.MathUtils.clamp((altitude + 2) / 17, 0, 1) * .78
}

function addStarField(scene: THREE.Scene, date: Date, location: ObserverLocation, atmosphere: boolean, sunlight: number, pixelRatio: number) {
  const field = loadStarField()
  const positions = new Float32Array(starCount * 3)
  const colors = new Float32Array(starCount * 3)
  const sizes = new Float32Array(starCount)
  const alphas = new Float32Array(starCount)
  const skyLight = location.source === 'global' ? 1 : atmosphereTransmission(sunlight)

  for (let fieldIndex = 0, starIndex = 0; fieldIndex < field.length; fieldIndex += 4, starIndex += 1) {
    const rightAscension = field[fieldIndex]
    const declination = field[fieldIndex + 1]
    const magnitude = field[fieldIndex + 2]
    const horizontal = fixedHorizontalFast(rightAscension, declination, date, location)
    const vector = skyVector(horizontal.azimuth, horizontal.altitude, 104)
    const offset = starIndex * 3
    positions[offset] = vector.x; positions[offset + 1] = vector.y; positions[offset + 2] = vector.z
    const color = starColor(field[fieldIndex + 3])
    colors[offset] = color.r; colors[offset + 1] = color.g; colors[offset + 2] = color.b
    sizes[starIndex] = THREE.MathUtils.clamp(5.8 - (magnitude + 1.5) * .52, 1.05, 6.2)
    const magnitudeOpacity = THREE.MathUtils.clamp(1.3 - magnitude * .095, .52, 1)
    const horizonTransmission = horizonVisibility(horizontal.altitude, atmosphere)
    alphas[starIndex] = magnitudeOpacity * horizonTransmission * (atmosphere ? skyLight : 1)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('pointSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('pointAlpha', new THREE.BufferAttribute(alphas, 1))
  const material = new THREE.ShaderMaterial({
    uniforms: { pixelRatio: { value: pixelRatio } },
    vertexColors: true,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float pointSize;
      attribute float pointAlpha;
      varying vec3 starColor;
      varying float starAlpha;
      uniform float pixelRatio;
      void main() {
        starColor = color;
        starAlpha = pointAlpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = pointSize * pixelRatio;
      }
    `,
    fragmentShader: `
      varying vec3 starColor;
      varying float starAlpha;
      void main() {
        float distanceFromCore = distance(gl_PointCoord, vec2(0.5));
        if (distanceFromCore > 0.5) discard;
        float halo = 1.0 - smoothstep(0.08, 0.5, distanceFromCore);
        float core = 1.0 - smoothstep(0.0, 0.11, distanceFromCore);
        gl_FragColor = vec4(starColor * (halo * 0.8 + core * 1.15), starAlpha * halo);
      }
    `,
  })
  const points = new THREE.Points(geometry, material)
  scene.add(points)
}

function equatorialVector(ra: number, dec: number, date: Date, location: ObserverLocation, radius = 99) {
  const horizontal = fixedHorizontalFast(ra, dec, date, location)
  return skyVector(horizontal.azimuth, horizontal.altitude, radius)
}

function addMilkyWayDensity(scene: THREE.Scene, date: Date, location: ObserverLocation, atmosphere: boolean, sunlight: number, pixelRatio: number) {
  const count = 36000
  const positions = new Float32Array(count * 3)
  const alphas = new Float32Array(count)
  const sizes = new Float32Array(count)
  const skyLight = location.source === 'global' ? 1 : atmosphereTransmission(sunlight)
  const galacticNorth = new THREE.Vector3(
    Math.cos(THREE.MathUtils.degToRad(27.1283)) * Math.cos(THREE.MathUtils.degToRad(192.8595)),
    Math.cos(THREE.MathUtils.degToRad(27.1283)) * Math.sin(THREE.MathUtils.degToRad(192.8595)),
    Math.sin(THREE.MathUtils.degToRad(27.1283)),
  )
  const galacticCenter = new THREE.Vector3(
    Math.cos(THREE.MathUtils.degToRad(-28.9362)) * Math.cos(THREE.MathUtils.degToRad(266.4051)),
    Math.cos(THREE.MathUtils.degToRad(-28.9362)) * Math.sin(THREE.MathUtils.degToRad(266.4051)),
    Math.sin(THREE.MathUtils.degToRad(-28.9362)),
  )
  const galacticEast = galacticNorth.clone().cross(galacticCenter).normalize()
  let seed = 0x51ca
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0x100000000
  }
  for (let index = 0; index < count; index += 1) {
    const longitude = random() * Math.PI * 2
    const latitude = (random() - .5) * Math.PI * .24 * (random() * .7 + .3)
    const cosLatitude = Math.cos(latitude)
    const galactic = galacticCenter.clone().multiplyScalar(Math.cos(longitude) * cosLatitude)
      .add(galacticEast.clone().multiplyScalar(Math.sin(longitude) * cosLatitude))
      .add(galacticNorth.clone().multiplyScalar(Math.sin(latitude)))
    const ra = (Math.atan2(galactic.y, galactic.x) / (Math.PI * 2) * 24 + 24) % 24
    const dec = Math.asin(galactic.z) / Math.PI * 180
    const horizontal = fixedHorizontalFast(ra, dec, date, location)
    const vector = skyVector(horizontal.azimuth, horizontal.altitude, 102)
    const offset = index * 3
    positions[offset] = vector.x; positions[offset + 1] = vector.y; positions[offset + 2] = vector.z
    const horizonTransmission = horizonVisibility(horizontal.altitude, atmosphere)
    alphas[index] = (.12 + random() * .2) * horizonTransmission * skyLight
    sizes[index] = .9 + random() * 1.8
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('pointSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('pointAlpha', new THREE.BufferAttribute(alphas, 1))
  const material = new THREE.ShaderMaterial({
    uniforms: { pixelRatio: { value: pixelRatio } },
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float pointSize;
      attribute float pointAlpha;
      varying float starAlpha;
      uniform float pixelRatio;
      void main() {
        starAlpha = pointAlpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = pointSize * pixelRatio;
      }
    `,
    fragmentShader: `
      varying float starAlpha;
      void main() {
        float distanceFromCore = distance(gl_PointCoord, vec2(0.5));
        if (distanceFromCore > 0.5) discard;
        float glow = 1.0 - smoothstep(0.05, 0.5, distanceFromCore);
        gl_FragColor = vec4(0.45, 0.55, 0.8, starAlpha * glow);
      }
    `,
  })
  scene.add(new THREE.Points(geometry, material))
}

function addAtmosphereRim(scene: THREE.Scene) {
  scene.add(gridLine(Array.from({ length: 145 }, (_, index) => skyVector(index * 2.5, 0, 100)), 0x8ab7bd, .34))
}

const zodiacConstellationIds = new Set(['ari', 'tau', 'gem', 'cnc', 'leo', 'vir', 'lib', 'sco', 'sgr', 'cap', 'aqr', 'psc'])

function eclipticVector(longitude: number, date: Date, location: ObserverLocation, radius = 98.5) {
  const obliquity = THREE.MathUtils.degToRad(23.43928)
  const lambda = THREE.MathUtils.degToRad(longitude)
  const x = Math.cos(lambda)
  const y = Math.sin(lambda) * Math.cos(obliquity)
  const z = Math.sin(lambda) * Math.sin(obliquity)
  const rightAscension = (Math.atan2(y, x) / (Math.PI * 2) * 24 + 24) % 24
  const declination = Math.asin(z) / Math.PI * 180
  return equatorialVector(rightAscension, declination, date, location, radius)
}

function addEcliptic(scene: THREE.Scene, date: Date, location: ObserverLocation) {
  scene.add(gridLine(Array.from({ length: 145 }, (_, index) => eclipticVector(index * 2.5, date, location)), 0xf0b36d, .58))
}

function addZodiacHighlights(scene: THREE.Scene, date: Date, location: ObserverLocation, glow: THREE.Texture) {
  const positions: THREE.Vector3[] = []
  const seen = new Set<string>()
  constellationFigures.forEach((figure) => {
    if (!zodiacConstellationIds.has(figure.id)) return
    figure.segments.forEach(([fromRa, fromDec, toRa, toDec]) => {
      for (const [ra, dec] of [[fromRa, fromDec], [toRa, toDec]]) {
        const key = `${ra}:${dec}`
        if (seen.has(key)) continue
        seen.add(key)
        positions.push(equatorialVector(ra, dec, date, location, 101.8))
      }
    })
  })
  const points = new THREE.Points(
    new THREE.BufferGeometry().setFromPoints(positions),
    new THREE.PointsMaterial({ map: glow, color: 0xffd36b, size: 6, sizeAttenuation: false, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  scene.add(points)
}

export default function StarMap3D({ date, location, layers, selectedId, onSelect }: StarMap3DProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef({ fov: 76 })
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const lastFocusedRef = useRef('')
  const gyroOffsetRef = useRef<THREE.Quaternion | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const orientation = useDeviceOrientation()
  const orientationActiveRef = orientation.activeRef
  const orientationReadingRef = orientation.readingRef
  const sunlight = sunAltitude(date, location)
  const atmosphereState = !layers.atmosphere ? 'airless' : location.source === 'global' ? 'dark-sky' : sunlight > -3 ? 'daylight' : sunlight > -12 ? 'twilight' : 'dark-sky'

  const orientCamera = () => {
    const camera = cameraRef.current
    if (!camera) return
    camera.fov = viewRef.current.fov
    camera.updateProjectionMatrix()
    camera.updateProjectionMatrix()
  }

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(viewRef.current.fov, host.clientWidth / host.clientHeight, .1, 240)
    camera.position.set(0, 0, 0)
    cameraRef.current = camera
    setCameraDirection(camera, 180, 24)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(host.clientWidth, host.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    rendererRef.current = renderer
    host.prepend(renderer.domElement)
    orientCamera()

    const selectable: THREE.Sprite[] = []
    const positions = new Map<string, THREE.Vector3>()
    const glow = dotTexture()
    const deepTextures = new Map<string, THREE.CanvasTexture>()
    addMilkyWayDensity(scene, date, location, layers.atmosphere, sunlight, renderer.getPixelRatio())
    addStarField(scene, date, location, layers.atmosphere, sunlight, renderer.getPixelRatio())
    if (layers.atmosphere) addAtmosphereRim(scene)
    skyCatalog.forEach((entry) => {
      if (!layers.deepSky && entry.kind !== 'star') return
      const horizontal = fixedHorizontal(entry.ra, entry.dec, date, location)
      const position = skyVector(horizontal.azimuth, horizontal.altitude)
      positions.set(entry.id, position)
      const map = entry.kind === 'star' ? glow : deepTextures.get(entry.kind) ?? deepSkyTexture(entry.kind)
      if (entry.kind !== 'star') deepTextures.set(entry.kind, map)
      const horizonOpacity = horizonVisibility(horizontal.altitude, layers.atmosphere)
      const daylightOpacity = entry.kind === 'star' && location.source !== 'global' && layers.atmosphere ? atmosphereTransmission(sunlight) : 1
      const material = new THREE.SpriteMaterial({ map, color: entry.color, transparent: true, depthWrite: false, opacity: horizonOpacity * daylightOpacity })
      const sprite = new THREE.Sprite(material)
      const baseSize = entry.kind === 'star' ? Math.max(1.25, 3.3 - entry.magnitude * .28) : 2.8
      sprite.scale.setScalar(entry.id === selectedId ? baseSize * 1.8 : baseSize)
      sprite.position.copy(position)
      sprite.userData.id = entry.id
      scene.add(sprite); selectable.push(sprite)
      if ((!layers.atmosphere || horizontal.altitude > 0) && (entry.magnitude < 1.1 || entry.id === selectedId || entry.kind !== 'star')) {
        const label = labelSprite(entry.name, entry.id === selectedId ? '#ef6548' : '#f7f1dd')
        label.position.copy(position.clone().multiplyScalar(.985)).add(new THREE.Vector3(1.5, 1.2, 0))
        scene.add(label)
      }
    })

    const bodies = [Body.Sun, Body.Moon, ...planetBodies]
    bodies.forEach((body) => {
      const horizontal = bodyHorizontal(body, date, location)
      const position = skyVector(horizontal.azimuth, horizontal.altitude, 99.7)
      positions.set(body.toLowerCase(), position)
      const bodyOpacity = horizonVisibility(horizontal.altitude, layers.atmosphere)
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: planetColors[body], transparent: true, depthWrite: false, opacity: bodyOpacity }))
      sprite.scale.setScalar(body === Body.Sun || body === Body.Moon ? 5 : 3.1)
      sprite.position.copy(position)
      sprite.userData.id = body.toLowerCase()
      scene.add(sprite); selectable.push(sprite)
      if (!layers.atmosphere || horizontal.altitude > 0) {
        const label = labelSprite(body, body === Body.Sun ? '#ffd36b' : '#f7f1dd')
        label.position.copy(position.clone().multiplyScalar(.985)).add(new THREE.Vector3(1.5, 1.2, 0))
        scene.add(label)
      }
    })

    if (selectedId && !lastFocusedRef.current) {
      lastFocusedRef.current = selectedId
    } else if (selectedId && selectedId !== lastFocusedRef.current) {
      const target = positions.get(selectedId)
      if (target && (!layers.atmosphere || target.y > 0)) {
        const normalized = target.clone().normalize()
        camera.lookAt(normalized)
        lastFocusedRef.current = selectedId
        orientCamera()
      }
    }

    if (layers.constellations || layers.zodiacFocus) {
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x67bbc2, transparent: true, opacity: .58, depthWrite: false })
      const zodiacLineMaterial = new THREE.LineBasicMaterial({ color: 0xf0b36d, transparent: true, opacity: .92, depthWrite: false })
      constellationFigures.forEach((constellation) => {
        const linePoints: THREE.Vector3[] = []
        constellation.segments.forEach(([fromRa, fromDec, toRa, toDec]) => {
          linePoints.push(
            equatorialVector(fromRa, fromDec, date, location, 99.1),
            equatorialVector(toRa, toDec, date, location, 99.1),
          )
        })
        const isZodiac = zodiacConstellationIds.has(constellation.id)
        if (layers.constellations && linePoints.length) scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(linePoints), lineMaterial))
        if (layers.zodiacFocus && isZodiac && linePoints.length) {
          const highlightedPoints = constellation.segments.flatMap(([fromRa, fromDec, toRa, toDec]) => [
            equatorialVector(fromRa, fromDec, date, location, 98.2),
            equatorialVector(toRa, toDec, date, location, 98.2),
          ])
          scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(highlightedPoints), zodiacLineMaterial))
        }
        const anchorHorizontal = fixedHorizontal(constellation.anchor[0], constellation.anchor[1], date, location)
        if ((!layers.atmosphere || anchorHorizontal.altitude > -2) && (layers.constellations || (layers.zodiacFocus && isZodiac))) {
          const anchor = skyVector(anchorHorizontal.azimuth, anchorHorizontal.altitude, 97)
          const labelColor = layers.zodiacFocus && isZodiac ? '#f0b36d' : '#8ed0ce'
          const label = labelSprite(layers.constellationArt || (layers.zodiacFocus && isZodiac) ? constellation.name : constellation.shortName, labelColor, layers.constellationArt ? 12 : 9, layers.constellationArt ? 2.4 : 2)
          label.position.copy(anchor)
          scene.add(label)
        }
        if (layers.constellationArt && (layers.constellations || (layers.zodiacFocus && isZodiac))) {
          if (!layers.atmosphere || anchorHorizontal.altitude > -2) {
            const art = artSprite(constellation)
            if (layers.zodiacFocus && isZodiac) art.material.opacity = .98
            art.position.copy(skyVector(anchorHorizontal.azimuth, anchorHorizontal.altitude, 96.8))
            scene.add(art)
          }
        }
      })
      if (layers.zodiacFocus) {
        addEcliptic(scene, date, location)
        addZodiacHighlights(scene, date, location, glow)
      }
    }

    if (layers.azimuthalGrid) addAzimuthalGrid(scene)
    if (layers.equatorialGrid) addEquatorialGrid(scene, date, location)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const drag = { active: false, moved: false, x: 0, y: 0 }
    const pointerDown = (event: PointerEvent) => { gyroOffsetRef.current = null; drag.active = true; drag.moved = false; drag.x = event.clientX; drag.y = event.clientY; renderer.domElement.setPointerCapture(event.pointerId) }
    const pointerMove = (event: PointerEvent) => {
      if (!drag.active) return
      const dx = event.clientX - drag.x; const dy = event.clientY - drag.y
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true
      drag.x = event.clientX; drag.y = event.clientY
      rotateCamera(camera, -dx * .003, dy * .003)
      orientCamera()
    }
    const pointerUp = (event: PointerEvent) => {
      if (!drag.moved) {
        const rect = renderer.domElement.getBoundingClientRect()
        pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
        raycaster.setFromCamera(pointer, camera)
        const hit = raycaster.intersectObjects(selectable, false)[0]
        if (hit?.object.userData.id) onSelect(hit.object.userData.id as string)
      }
      drag.active = false
    }
    const wheel = (event: WheelEvent) => { event.preventDefault(); viewRef.current.fov = Math.max(24, Math.min(100, viewRef.current.fov + event.deltaY * .035)); orientCamera() }
    const keydown = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
      event.preventDefault()
      gyroOffsetRef.current = null
      if (event.key === 'ArrowLeft') rotateCamera(camera, THREE.MathUtils.degToRad(-4), 0)
      if (event.key === 'ArrowRight') rotateCamera(camera, THREE.MathUtils.degToRad(4), 0)
      if (event.key === 'ArrowUp') rotateCamera(camera, 0, THREE.MathUtils.degToRad(4))
      if (event.key === 'ArrowDown') rotateCamera(camera, 0, THREE.MathUtils.degToRad(-4))
      orientCamera()
    }
    renderer.domElement.addEventListener('pointerdown', pointerDown)
    renderer.domElement.addEventListener('pointermove', pointerMove)
    renderer.domElement.addEventListener('pointerup', pointerUp)
    renderer.domElement.addEventListener('wheel', wheel, { passive: false })
    renderer.domElement.addEventListener('keydown', keydown)
    renderer.domElement.tabIndex = 0
    renderer.domElement.setAttribute('aria-label', 'Interactive 360 degree star map. Drag or use arrow keys to look around.')

    const resize = () => {
      const width = host.clientWidth; const height = host.clientHeight
      camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height)
    }
    const observer = new ResizeObserver(resize); observer.observe(host)
    let animation = 0
    const sensorQuaternion = new THREE.Quaternion()
    const render = () => {
      const reading = orientationReadingRef.current
      if (orientationActiveRef.current && reading) {
        setDeviceOrientationQuaternion(reading, sensorQuaternion)
        if (!gyroOffsetRef.current) gyroOffsetRef.current = camera.quaternion.clone().multiply(sensorQuaternion.clone().invert())
        camera.quaternion.copy(gyroOffsetRef.current).multiply(sensorQuaternion)
      } else if (!orientationActiveRef.current) {
        gyroOffsetRef.current = null
      }
      renderer.render(scene, camera); animation = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(animation); observer.disconnect()
      renderer.domElement.removeEventListener('pointerdown', pointerDown); renderer.domElement.removeEventListener('pointermove', pointerMove); renderer.domElement.removeEventListener('pointerup', pointerUp); renderer.domElement.removeEventListener('wheel', wheel); renderer.domElement.removeEventListener('keydown', keydown)
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh
        mesh.geometry?.dispose()
        const material = mesh.material as (THREE.Material & { map?: THREE.Texture }) | Array<THREE.Material & { map?: THREE.Texture }> | undefined
        const disposeMaterial = (item: THREE.Material & { map?: THREE.Texture }) => { item.map?.dispose(); item.dispose() }
        if (Array.isArray(material)) material.forEach(disposeMaterial)
        else if (material) disposeMaterial(material)
      })
      glow.dispose(); deepTextures.forEach((texture) => texture.dispose()); renderer.dispose(); renderer.domElement.remove(); cameraRef.current = null; rendererRef.current = null
    }
  }, [date, layers, location, onSelect, orientationActiveRef, orientationReadingRef, selectedId, sunlight])

  const changeZoom = (amount: number) => { viewRef.current.fov = Math.max(24, Math.min(100, viewRef.current.fov + amount)); orientCamera() }
  const resetView = () => {
    viewRef.current.fov = 76
    gyroOffsetRef.current = null
    if (cameraRef.current) setCameraDirection(cameraRef.current, 180, 24)
    orientCamera()
  }
  const toggleFullscreen = async () => {
    const host = hostRef.current
    if (!host) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await host.requestFullscreen()
  }

  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [])

  return (
    <div ref={hostRef} className={`star-map-3d ${atmosphereState} ${layers.nightMode ? 'night-mode' : ''}`}>
      <div className="map-heading-overlay">
        <span><Navigation size={14} /> {location.label}</span>
        <strong>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
        <small>{layers.atmosphere ? 'Earth atmosphere · visible horizon' : 'Airless space · full celestial sphere'} · {starCount.toLocaleString()} stars</small>
      </div>
      {orientation.supported && (
        <button type="button" className={`map-orientation-toggle ${orientation.active ? 'active' : ''}`} onClick={orientation.active ? orientation.stop : orientation.request} aria-pressed={orientation.active}>
          <Smartphone size={15} /> {orientation.active ? 'Device orientation on' : orientation.permission === 'denied' ? 'Try device orientation' : orientation.permission === 'unavailable' ? 'Sensor unavailable' : 'Use phone orientation'}
        </button>
      )}
      <div className="map-controls map-controls-3d" aria-label="Star Map controls">
        <button type="button" className="icon-button" onClick={() => changeZoom(-8)} aria-label="Zoom in"><Plus size={18} /></button>
        <button type="button" className="icon-button" onClick={() => changeZoom(8)} aria-label="Zoom out"><Minus size={18} /></button>
        <button type="button" className="icon-button" onClick={resetView} aria-label="Reset view"><RotateCcw size={17} /></button>
        <button type="button" className="icon-button" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>{fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
      </div>
      <div className="star-map-compass" aria-hidden="true"><span>N</span><span>E</span><span>S</span><span>W</span></div>
      <p className="map-orientation">Drag to look around · scroll to zoom · select a plotted object</p>
    </div>
  )
}
