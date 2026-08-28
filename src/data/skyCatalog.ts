export interface SkyCatalogEntry {
  id: string
  name: string
  ra: number
  dec: number
  magnitude: number
  kind: 'star' | 'nebula' | 'galaxy' | 'cluster'
  color: string
}

export const skyCatalog: SkyCatalogEntry[] = [
  { id: 'polaris', name: 'Polaris', ra: 2.53, dec: 89.26, magnitude: 1.98, kind: 'star', color: '#fff5d6' },
  { id: 'betelgeuse', name: 'Betelgeuse', ra: 5.92, dec: 7.41, magnitude: 0.42, kind: 'star', color: '#ffaf7f' },
  { id: 'rigel', name: 'Rigel', ra: 5.24, dec: -8.2, magnitude: 0.13, kind: 'star', color: '#c7ddff' },
  { id: 'bellatrix', name: 'Bellatrix', ra: 5.42, dec: 6.35, magnitude: 1.64, kind: 'star', color: '#d9e7ff' },
  { id: 'saiph', name: 'Saiph', ra: 5.8, dec: -9.67, magnitude: 2.07, kind: 'star', color: '#d8e7ff' },
  { id: 'mintaka', name: 'Mintaka', ra: 5.53, dec: -0.3, magnitude: 2.23, kind: 'star', color: '#edf4ff' },
  { id: 'alnilam', name: 'Alnilam', ra: 5.6, dec: -1.2, magnitude: 1.69, kind: 'star', color: '#e5efff' },
  { id: 'alnitak', name: 'Alnitak', ra: 5.68, dec: -1.94, magnitude: 1.77, kind: 'star', color: '#e2edff' },
  { id: 'sirius', name: 'Sirius', ra: 6.75, dec: -16.72, magnitude: -1.46, kind: 'star', color: '#eff7ff' },
  { id: 'vega', name: 'Vega', ra: 18.62, dec: 38.78, magnitude: 0.03, kind: 'star', color: '#d5e5ff' },
  { id: 'deneb', name: 'Deneb', ra: 20.69, dec: 45.28, magnitude: 1.25, kind: 'star', color: '#e4eeff' },
  { id: 'altair', name: 'Altair', ra: 19.85, dec: 8.87, magnitude: 0.77, kind: 'star', color: '#f0f5ff' },
  { id: 'arcturus', name: 'Arcturus', ra: 14.26, dec: 19.18, magnitude: -0.05, kind: 'star', color: '#ffd39e' },
  { id: 'spica', name: 'Spica', ra: 13.42, dec: -11.16, magnitude: 0.98, kind: 'star', color: '#d8e6ff' },
  { id: 'regulus', name: 'Regulus', ra: 10.14, dec: 11.97, magnitude: 1.35, kind: 'star', color: '#dce9ff' },
  { id: 'aldebaran', name: 'Aldebaran', ra: 4.6, dec: 16.51, magnitude: 0.85, kind: 'star', color: '#ffb77f' },
  { id: 'capella', name: 'Capella', ra: 5.28, dec: 46, magnitude: 0.08, kind: 'star', color: '#fff0bd' },
  { id: 'm31', name: 'Andromeda Galaxy', ra: 0.71, dec: 41.27, magnitude: 3.44, kind: 'galaxy', color: '#cbd8ff' },
  { id: 'm42', name: 'Orion Nebula', ra: 5.59, dec: -5.45, magnitude: 4, kind: 'nebula', color: '#e9a6c7' },
  { id: 'm45', name: 'Pleiades', ra: 3.79, dec: 24.12, magnitude: 1.6, kind: 'cluster', color: '#bcd7ff' },
  { id: 'm13', name: 'Hercules Cluster', ra: 16.7, dec: 36.46, magnitude: 5.8, kind: 'cluster', color: '#ffe1ae' },
  { id: 'm57', name: 'Ring Nebula', ra: 18.89, dec: 33.03, magnitude: 8.8, kind: 'nebula', color: '#a8e3d4' },
  { id: 'm51', name: 'Whirlpool Galaxy', ra: 13.5, dec: 47.2, magnitude: 8.4, kind: 'galaxy', color: '#c8d5ff' },
  { id: 'm27', name: 'Dumbbell Nebula', ra: 19.99, dec: 22.72, magnitude: 7.5, kind: 'nebula', color: '#9ee0c6' },
  { id: 'm81', name: 'Bode’s Galaxy', ra: 9.93, dec: 69.06, magnitude: 6.9, kind: 'galaxy', color: '#d6def5' },
  { id: 'm8', name: 'Lagoon Nebula', ra: 18.06, dec: -24.38, magnitude: 6, kind: 'nebula', color: '#efa5b7' },
  { id: 'm104', name: 'Sombrero Galaxy', ra: 12.67, dec: -11.62, magnitude: 8, kind: 'galaxy', color: '#f4d6b3' },
  { id: 'm44', name: 'Beehive Cluster', ra: 8.67, dec: 19.67, magnitude: 3.7, kind: 'cluster', color: '#d8e8ff' },
  { id: 'm1', name: 'Crab Nebula', ra: 5.58, dec: 22.01, magnitude: 8.4, kind: 'nebula', color: '#e8b6aa' },
]

export const skyEntryById = (id: string) => skyCatalog.find((entry) => entry.id === id)
