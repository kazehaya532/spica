export interface SkyTarget {
  name: string
  subtitle: string
  kind: 'Planet' | 'Moon' | 'Star' | 'Deep sky'
  aliases: string[]
  searchTerms?: string[]
}

export const SKY_TARGETS: SkyTarget[] = [
  { name: 'Moon', subtitle: "Earth's natural satellite", kind: 'Moon', aliases: ['NAME Moon', 'moon'] },
  { name: 'Sun', subtitle: 'Our nearest star', kind: 'Star', aliases: ['NAME Sun', 'sun'] },
  { name: 'Mercury', subtitle: 'Innermost planet', kind: 'Planet', aliases: ['NAME Mercury', 'mercury'] },
  { name: 'Venus', subtitle: 'Bright evening or morning planet', kind: 'Planet', aliases: ['NAME Venus', 'venus'] },
  { name: 'Mars', subtitle: 'The red planet', kind: 'Planet', aliases: ['NAME Mars', 'mars'] },
  { name: 'Jupiter', subtitle: 'Gas giant', kind: 'Planet', aliases: ['NAME Jupiter', 'jupiter'] },
  { name: 'Saturn', subtitle: 'Ringed gas giant', kind: 'Planet', aliases: ['NAME Saturn', 'saturn'] },
  { name: 'Uranus', subtitle: 'Ice giant', kind: 'Planet', aliases: ['NAME Uranus', 'uranus'] },
  { name: 'Neptune', subtitle: 'Outer ice giant', kind: 'Planet', aliases: ['NAME Neptune', 'neptune'] },
  { name: 'Sirius', subtitle: 'Brightest star in the night sky', kind: 'Star', aliases: ['HIP 32349', 'NAME Sirius'] },
  { name: 'Canopus', subtitle: 'Bright southern supergiant', kind: 'Star', aliases: ['HIP 30438', 'NAME Canopus'] },
  { name: 'Arcturus', subtitle: 'Orange giant in Boötes', kind: 'Star', aliases: ['HIP 69673', 'NAME Arcturus'] },
  { name: 'Capella', subtitle: 'Bright star system in Auriga', kind: 'Star', aliases: ['HIP 24608', 'NAME Capella'] },
  { name: 'Vega', subtitle: 'Bright star in Lyra', kind: 'Star', aliases: ['HIP 91262', 'NAME Vega'] },
  { name: 'Rigel', subtitle: 'Blue supergiant in Orion', kind: 'Star', aliases: ['HIP 24436', 'NAME Rigel'] },
  { name: 'Procyon', subtitle: 'Bright star in Canis Minor', kind: 'Star', aliases: ['HIP 37279', 'NAME Procyon'] },
  { name: 'Betelgeuse', subtitle: 'Red supergiant in Orion', kind: 'Star', aliases: ['HIP 27989', 'NAME Betelgeuse'], searchTerms: ['bettelguese', 'betelguese'] },
  { name: 'Achernar', subtitle: 'Hot blue star in Eridanus', kind: 'Star', aliases: ['HIP 7588', 'NAME Achernar'] },
  { name: 'Hadar', subtitle: 'Blue giant in Centaurus', kind: 'Star', aliases: ['HIP 68702', 'NAME Hadar'] },
  { name: 'Altair', subtitle: 'Fast-spinning star in Aquila', kind: 'Star', aliases: ['HIP 97649', 'NAME Altair'] },
  { name: 'Acrux', subtitle: 'Brightest star in Crux', kind: 'Star', aliases: ['HIP 60718', 'NAME Acrux'] },
  { name: 'Aldebaran', subtitle: 'Orange giant in Taurus', kind: 'Star', aliases: ['HIP 21421', 'NAME Aldebaran'] },
  { name: 'Spica', subtitle: 'Brightest star in Virgo', kind: 'Star', aliases: ['HIP 65474', 'NAME Spica'] },
  { name: 'Antares', subtitle: 'Red supergiant in Scorpius', kind: 'Star', aliases: ['HIP 80763', 'NAME Antares'] },
  { name: 'Pollux', subtitle: 'Orange giant in Gemini', kind: 'Star', aliases: ['HIP 37826', 'NAME Pollux'] },
  { name: 'Fomalhaut', subtitle: 'Bright star in Piscis Austrinus', kind: 'Star', aliases: ['HIP 113368', 'NAME Fomalhaut'] },
  { name: 'Deneb', subtitle: 'Luminous supergiant in Cygnus', kind: 'Star', aliases: ['HIP 102098', 'NAME Deneb'] },
  { name: 'Regulus', subtitle: 'Brightest star in Leo', kind: 'Star', aliases: ['HIP 49669', 'NAME Regulus'] },
  { name: 'Polaris', subtitle: 'The North Star', kind: 'Star', aliases: ['HIP 11767', 'NAME Polaris'] },
  { name: 'Andromeda Galaxy', subtitle: 'Nearest large galaxy', kind: 'Deep sky', aliases: ['M 31', 'M31', 'NAME Andromeda Galaxy'] },
  { name: 'Orion Nebula', subtitle: 'Stellar nursery in Orion', kind: 'Deep sky', aliases: ['M 42', 'M42', 'NAME Orion Nebula'] },
  { name: 'Pleiades', subtitle: 'Open star cluster in Taurus', kind: 'Deep sky', aliases: ['M 45', 'M45', 'NAME Pleiades'] }
]

export function dateToMjd(date: Date): number {
  return date.getTime() / 86_400_000 + 40_587
}

export function mjdToDate(mjd: number): Date {
  return new Date((mjd - 40_587) * 86_400_000)
}

export function formatRightAscension(radians: number): string {
  const totalHours = ((radians * 12) / Math.PI + 24) % 24
  const hours = Math.floor(totalHours)
  const minutes = Math.floor((totalHours - hours) * 60)
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
}

export function formatDegrees(radians: number, signed = true): string {
  const degrees = radians * 180 / Math.PI
  const prefix = signed && degrees >= 0 ? '+' : ''
  return `${prefix}${degrees.toFixed(1)}°`
}

export function toDateTimeInput(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}
