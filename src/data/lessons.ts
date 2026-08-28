import type { Lesson, Quiz } from '../types'

export const lessons: Lesson[] = [
  {
    id: 'reading-the-sky', title: 'How to read the night sky', category: 'Foundations', duration: 7, level: 'Start here',
    summary: 'Learn direction, altitude, sky motion, and the simple coordinate ideas behind every star chart.',
    intro: 'A sky chart turns the dome above you into a map. Unlike a street map, it appears to rotate as Earth turns, so orientation starts with a few dependable anchors.',
    sections: [
      { heading: 'Start with direction', body: 'Face north and find the horizon. Altitude tells you how high an object sits: zero degrees at the horizon and ninety degrees directly overhead. Your fist at arm’s length spans roughly ten degrees.' },
      { heading: 'Earth does the turning', body: 'Stars appear to travel east to west because Earth rotates west to east. Near Polaris, northern stars trace circles rather than rising and setting steeply.' },
      { heading: 'Charts are layered', body: 'Constellation lines are teaching aids, not physical structures. Coordinate grids, object labels, and deep-sky marks are separate layers that help answer different questions.' },
    ], relatedObjects: ['polaris', 'sirius'], quizId: 'sky-basics',
  },
  {
    id: 'patterns-in-the-sky', title: 'Why constellations work', category: 'Stars', duration: 6, level: 'Beginner',
    summary: 'Separate useful sky patterns from the stars’ true three-dimensional positions.',
    intro: 'Constellations are regions and patterns seen from Earth. Their stars can look close together while being separated by hundreds of light-years.',
    sections: [
      { heading: 'A line of sight', body: 'Your eye flattens the deep sky onto a dome. Two stars that appear side by side may have no physical connection at all.' },
      { heading: 'Eighty-eight regions', body: 'Astronomers divide the entire sky into 88 official constellations. The familiar stick figures sit inside these precisely bounded regions.' },
      { heading: 'Asterisms help us navigate', body: 'Recognizable shapes such as the Summer Triangle can cross constellation boundaries. They are practical stepping stones for finding fainter targets.' },
    ], relatedObjects: ['betelgeuse', 'bellatrix', 'vega'], quizId: 'constellation-check',
  },
  {
    id: 'measuring-starlight', title: 'Reading starlight', category: 'Stars', duration: 8, level: 'Beginner',
    summary: 'Use brightness and color to infer temperature, distance, and the nature of a star.',
    intro: 'A point of light carries information. Astronomers spread it into a spectrum, compare its brightness, and read the chemical fingerprints hidden inside.',
    sections: [
      { heading: 'Magnitude runs backward', body: 'Smaller apparent-magnitude numbers mean brighter objects. Sirius is magnitude -1.46, while a magnitude 6 star is near the limit of unaided human vision under dark skies.' },
      { heading: 'Color reveals temperature', body: 'Blue-white stars are hotter than yellow stars, while orange and red stars have cooler surfaces. Color is not simply an indicator of age.' },
      { heading: 'Distance changes the view', body: 'Apparent brightness is what reaches Earth. Intrinsic luminosity describes how much energy a star actually emits, independent of distance.' },
    ], relatedObjects: ['sirius', 'vega', 'arcturus'], quizId: 'starlight-check',
  },
  {
    id: 'solar-system-scale', title: 'A solar system built to scale', category: 'Solar system', duration: 9, level: 'Start here',
    summary: 'Understand why every useful solar-system diagram has to compromise on size, distance, or both.',
    intro: 'Space is mostly space. If Earth were a peppercorn, the Sun would be a large ball about 26 metres away and Neptune would be nearly a kilometre farther out.',
    sections: [
      { heading: 'Inner worlds', body: 'Mercury, Venus, Earth, and Mars are small rocky planets. They occupy only a tiny portion of the solar system’s full width.' },
      { heading: 'Giants beyond the belt', body: 'Jupiter and Saturn are gas giants; Uranus and Neptune are ice giants. All four have rings and extensive moon systems.' },
      { heading: 'Orbits are not tracks', body: 'Gravity continually bends each planet’s forward motion into an orbit. Most planetary paths are only mildly elliptical, not strongly stretched.' },
    ], relatedObjects: [], quizId: 'solar-system-check',
  },
  {
    id: 'lives-of-stars', title: 'The lives of stars', category: 'Stars', duration: 10, level: 'Next step',
    summary: 'Follow a star from collapsing cloud to giant, white dwarf, neutron star, or black hole.',
    intro: 'Gravity builds a star, fusion supports it, and mass decides most of what follows. A star’s life is a long negotiation between inward pressure and outward energy.',
    sections: [
      { heading: 'Fusion finds a balance', body: 'In a stable star, gravity compresses hot gas while energy from nuclear fusion pushes outward. This balance can last for millions or billions of years.' },
      { heading: 'Mass writes the ending', body: 'Sun-like stars become red giants and leave white dwarfs. Massive stars can explode as supernovae and leave neutron stars or black holes.' },
      { heading: 'The ingredients return', body: 'Dying stars return enriched gas to space. Carbon, oxygen, iron, and many other elements in planets and people were forged by earlier generations of stars.' },
    ], relatedObjects: ['betelgeuse', 'rigel', 'm57'],
  },
  {
    id: 'cosmic-nurseries', title: 'Inside a stellar nursery', category: 'Deep sky', duration: 7, level: 'Beginner',
    summary: 'See how cold molecular clouds collapse, fragment, and emerge as young clusters.',
    intro: 'Nebulae are not all the same. Some glow around newborn stars, some reflect nearby light, and others are shells left by dying stars.',
    sections: [
      { heading: 'Cold clouds collapse', body: 'Dense knots inside molecular clouds can collapse under gravity. As material falls inward, a protostar heats up before sustained hydrogen fusion begins.' },
      { heading: 'Young stars arrive together', body: 'Stars commonly form in groups. Over time, an open cluster can spread out as its members respond to the gravity of the wider galaxy.' },
      { heading: 'Dust both hides and builds', body: 'Dust blocks visible light, making dark lanes, but it also helps clouds cool and provides raw material for disks that may form planets.' },
    ], relatedObjects: ['m42', 'm45', 'm8'],
  },
  {
    id: 'island-universes', title: 'Galaxies: cities of stars', category: 'Deep sky', duration: 9, level: 'Beginner',
    summary: 'Zoom out from the Milky Way to understand spiral structure, galaxy groups, and cosmic distance.',
    intro: 'A galaxy binds stars, gas, dust, dark matter, and usually a central black hole. The Milky Way is one of billions, not the whole universe.',
    sections: [
      { heading: 'Shape tells a history', body: 'Spiral, elliptical, and irregular galaxies reflect different structures and histories. Interactions can distort all three and trigger new star formation.' },
      { heading: 'The Local Group', body: 'The Milky Way, Andromeda, Triangulum, and dozens of smaller galaxies form a gravitational neighborhood called the Local Group.' },
      { heading: 'Light is a time machine', body: 'Andromeda’s light takes about 2.5 million years to reach us. Looking farther into space also means looking further into the past.' },
    ], relatedObjects: ['m31', 'm51', 'm104'],
  },
  {
    id: 'choosing-a-telescope', title: 'Your first observing toolkit', category: 'Foundations', duration: 5, level: 'Start here',
    summary: 'Learn why dark adaptation, a plan, and binoculars often matter more than magnification.',
    intro: 'Astronomy starts with your eyes. A small, well-used instrument under a dark sky can reveal more than an expensive telescope used without preparation.',
    sections: [
      { heading: 'Let your eyes adapt', body: 'Night vision improves for twenty to thirty minutes in darkness. Use a dim red light for charts and avoid bright phone screens.' },
      { heading: 'Aperture gathers light', body: 'A telescope’s aperture determines how much light it collects and the finest detail it can resolve. Useful magnification is limited by aperture and atmospheric steadiness.' },
      { heading: 'Begin wide', body: 'Binoculars are excellent for the Moon, star clusters, and learning the sky. Their wide field makes targets easier to locate.' },
    ], relatedObjects: ['m45', 'm31'],
  },
]

export const quizzes: Quiz[] = [
  { id: 'sky-basics', title: 'Reading the sky', lessonId: 'reading-the-sky', questions: [
    { prompt: 'What point has an altitude of 90 degrees?', options: ['The northern horizon', 'The zenith', 'The celestial equator', 'Polaris'], answer: 1, explanation: 'The zenith is the point directly overhead, 90 degrees above every horizon.' },
    { prompt: 'Why do stars appear to move westward during the night?', options: ['The stars orbit Earth', 'The Moon pulls them', 'Earth rotates eastward', 'The Sun pushes them'], answer: 2, explanation: 'Earth’s eastward rotation makes the celestial sphere appear to turn toward the west.' },
  ]},
  { id: 'constellation-check', title: 'Patterns in the sky', lessonId: 'patterns-in-the-sky', questions: [
    { prompt: 'Stars in one constellation are usually…', options: ['At the same distance', 'The same age', 'A line-of-sight pattern', 'Orbiting one another'], answer: 2, explanation: 'Constellations flatten stars at very different distances into a pattern seen from Earth.' },
    { prompt: 'The Summer Triangle is best described as…', options: ['A galaxy', 'An asterism', 'One official constellation', 'A star cluster'], answer: 1, explanation: 'An asterism is a recognizable pattern that is not itself one of the 88 official constellations.' },
  ]},
  { id: 'starlight-check', title: 'Reading starlight', lessonId: 'measuring-starlight', questions: [
    { prompt: 'Which apparent magnitude is brightest?', options: ['-1', '1', '4', '6'], answer: 0, explanation: 'The magnitude scale runs backward: lower numbers indicate brighter objects.' },
    { prompt: 'A blue-white star is generally…', options: ['Cooler than a red star', 'Hotter than a red star', 'Always closer to Earth', 'Always younger'], answer: 1, explanation: 'A star’s color tracks its surface temperature; blue-white surfaces are hotter.' },
  ]},
  { id: 'solar-system-check', title: 'Solar system scale', lessonId: 'solar-system-scale', questions: [
    { prompt: 'Which statement best describes the solar system?', options: ['Planets are packed closely together', 'Most of it is empty space', 'All planets are similar in size', 'Orbits are very stretched'], answer: 1, explanation: 'Distances between planets are enormous compared with the planets themselves.' },
    { prompt: 'Which planets are ice giants?', options: ['Earth and Mars', 'Jupiter and Saturn', 'Uranus and Neptune', 'Mercury and Venus'], answer: 2, explanation: 'Uranus and Neptune contain larger proportions of water, ammonia, and methane-rich materials.' },
  ]},
]

export const lessonById = (id: string) => lessons.find((lesson) => lesson.id === id)
export const quizById = (id: string) => quizzes.find((quiz) => quiz.id === id)
