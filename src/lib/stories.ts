export interface StorySection {
  culture: string
  title?: string
  text: string
}

export interface StoryStar {
  name: string
  hip?: number
  note?: string
}

interface StoryBase {
  id: string
  name: string
  tagline: string
  bestMonths: string
  visibility: 'north' | 'south' | 'both'
  stories: StorySection[]
  searchTerms?: string[]
}

export interface ConstellationStory extends StoryBase {
  kind: 'constellation'
  iau: string
  brightestStars: StoryStar[]
  asterismIds?: string[]
  centerAliases: string[]
}

export interface AsterismStory extends StoryBase {
  kind: 'asterism'
  stars: StoryStar[]
  constellations: string[]
  // Polylines of Hipparcos ids that draw the asterism on the sky. Every id is
  // verified against the bundled western skyculture stick figures.
  lineSegments: number[][]
  centerAliases: string[]
}

export interface StarStory extends StoryBase {
  kind: 'star'
  stars: StoryStar[]
  constellations: string[]
  centerAliases: string[]
  // Engine designation strings (without the leading "* ") that this story
  // owns, for stars the bundled data names by Bayer/Flamsteed only —
  // e.g. Albireo is "bet01 Cyg", Herschel 3945's gold star is "145 CMa".
  selectionAliases?: string[]
}

export type SkyStory = ConstellationStory | AsterismStory | StarStory

export const CONSTELLATION_STORIES: ConstellationStory[] = [
  {
    id: 'orion',
    kind: 'constellation',
    iau: 'Ori',
    name: 'Orion',
    tagline: 'The celestial hunter, striding across the winter sky',
    bestMonths: 'November – March (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Betelgeuse', hip: 27989, note: 'Red supergiant marking the shoulder' },
      { name: 'Rigel', hip: 24436, note: 'Blue supergiant at the foot' },
      { name: 'Bellatrix', hip: 25336 },
      { name: 'Saiph', hip: 27366 },
      { name: 'Alnitak', hip: 26727, note: 'Belt star' },
      { name: 'Alnilam', hip: 26311, note: 'Belt star' },
      { name: 'Mintaka', hip: 25930, note: 'Belt star' }
    ],
    asterismIds: ['orions-belt', 'winter-triangle'],
    centerAliases: ['CON western Ori'],
    stories: [
      {
        culture: 'Greek mythology',
        title: 'The hunter and the scorpion',
        text: 'Orion was a giant huntsman so proud of his skill that he vowed to kill every animal on Earth. The goddess Gaia, protector of beasts, sent a scorpion to stop him. Both were placed in the sky but kept apart: when Scorpius rises, Orion sinks below the horizon, still fleeing his killer.'
      },
      {
        culture: 'Around the world',
        title: 'Three stars in a row',
        text: 'The belt is among the most recognised patterns on Earth. To the Maya it was the smoke rising from the hearth of creation; to Javanese farmers it is Bintang Wuluh, a rice ladle whose pre-dawn appearance once signalled the planting season. Sailors on every ocean steered by it.'
      },
      {
        culture: 'Modern sky',
        text: 'Hanging from the belt is Orion’s sword, and inside it glows the Orion Nebula (M 42) — a stellar nursery visible to the naked eye as a faint fuzzy patch, where new stars are being born right now.'
      }
    ],
    searchTerms: ['hunter', 'wuluh', 'betelgeuse', 'rigel', 'nebula', 'm42']
  },
  {
    id: 'ursa-major',
    kind: 'constellation',
    iau: 'UMa',
    name: 'Ursa Major',
    tagline: 'The Great Bear, forever circling the pole',
    bestMonths: 'March – May (circumpolar in the north)',
    visibility: 'north',
    brightestStars: [
      { name: 'Dubhe', hip: 54061, note: 'Pointer star' },
      { name: 'Merak', hip: 53910, note: 'Pointer star' },
      { name: 'Alioth', hip: 62956 },
      { name: 'Alkaid', hip: 67301 },
      { name: 'Mizar', hip: 65378, note: 'Famous double with Alcor' }
    ],
    asterismIds: ['big-dipper'],
    centerAliases: ['CON western UMa'],
    stories: [
      {
        culture: 'Greek mythology',
        title: 'Callisto',
        text: 'Zeus transformed the nymph Callisto into a bear to hide her from the wrath of Hera, and later hurled her into the sky. Why does a bear have such a long tail? The Greeks said Zeus, flinging her heavenward, grabbed her short tail and it stretched.'
      },
      {
        culture: 'Chinese astronomy',
        title: 'The Northern Dipper',
        text: 'Chinese skywatchers saw the seven bright stars as Běidǒu, the Northern Dipper, the ladle of the celestial bureaucracy. Its handle was a calendar: when it pointed east in the evening, spring had arrived.'
      },
      {
        culture: 'Malay and American lore',
        text: 'Malay sailors called it Bintang Biduk, the little boat rocking across the northern water. In North America, enslaved people fleeing to freedom were told to follow the Drinking Gourd — the Dipper pointing the way north.'
      }
    ],
    searchTerms: ['great bear', 'big dipper', 'callisto', 'beidou', 'biduk', 'drinking gourd']
  },
  {
    id: 'ursa-minor',
    kind: 'constellation',
    iau: 'UMi',
    name: 'Ursa Minor',
    tagline: 'The Little Bear, home of the North Star',
    bestMonths: 'All year (circumpolar in the north)',
    visibility: 'north',
    brightestStars: [
      { name: 'Polaris', hip: 11767, note: 'The North Star' },
      { name: 'Kochab', hip: 72607 }
    ],
    centerAliases: ['CON western UMi'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'The smaller bear is often said to be Arcas, son of Callisto, placed beside his mother in the sky so the two could never truly be parted.'
      },
      {
        culture: 'Navigation',
        title: 'The sky’s pivot',
        text: 'Polaris sits less than one degree from the north celestial pole — the entire heavens appear to wheel around it. For millennia, travellers in the northern hemisphere have found true north simply by facing this star. A thousand years ago the pole star was Kochab; Earth’s slowly wobbling axis will one day pass the honour to Vega.'
      }
    ],
    searchTerms: ['north star', 'polaris', 'little bear', 'navigation']
  },
  {
    id: 'crux',
    kind: 'constellation',
    iau: 'Cru',
    name: 'Crux',
    tagline: 'The Southern Cross, compass of the southern seas',
    bestMonths: 'March – June (evenings)',
    visibility: 'south',
    brightestStars: [
      { name: 'Acrux', hip: 60718, note: 'Foot of the cross' },
      { name: 'Gacrux', hip: 61084, note: 'Head of the cross' },
      { name: 'Mimosa', hip: 62434 },
      { name: 'Imai', hip: 59747 }
    ],
    centerAliases: ['CON western Cru'],
    stories: [
      {
        culture: 'Polynesian and Māori tradition',
        title: 'The anchor',
        text: 'To Māori navigators the Cross is Te Punga, the anchor stone of Tama-rereti’s great canoe, and the two bright Pointers trail behind as its rope. Southern voyagers read its tilt to find the direction of the unseen south celestial pole and sailed thousands of kilometres of open Pacific.'
      },
      {
        culture: 'Aboriginal Australian',
        title: 'The Emu’s head',
        text: 'Beside the Cross lies the Coalsack, a dark nebula that blots out the Milky Way. In Aboriginal sky lore this darkness is the head of the Celestial Emu, a giant bird stretching across the sky — a constellation drawn in black, not in stars.'
      },
      {
        culture: 'Modern symbol',
        text: 'The smallest of all 88 constellations is also among the most famous: it appears on the flags of Australia, New Zealand, Brazil, Papua New Guinea and Samoa, and it hides from anyone north of about 25° latitude.'
      }
    ],
    searchTerms: ['southern cross', 'te punga', 'emu', 'coalsack', 'acrux', 'navigation']
  },
  {
    id: 'centaurus',
    kind: 'constellation',
    iau: 'Cen',
    name: 'Centaurus',
    tagline: 'The wise centaur, teacher of heroes',
    bestMonths: 'April – June (evenings)',
    visibility: 'south',
    brightestStars: [
      { name: 'Rigil Kentaurus', hip: 71683, note: 'Nearest star system to the Sun' },
      { name: 'Hadar', hip: 68702, note: 'One of the Southern Pointers' }
    ],
    centerAliases: ['CON western Cen'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'This is Chiron, the gentle centaur who tutored Greece’s greatest heroes — Achilles, Jason, Asclepius. Unlike his wild kin, Chiron was wise and kind, and the gods set him in the sky as an honour. He appears to be aiming a spear at the neighboring Wolf while pointing the way to the Southern Cross.'
      },
      {
        culture: 'Modern sky',
        text: 'Rigil Kentaurus (Alpha Centauri) is the closest star system to our own at 4.37 light-years — the sunlight reaching your eye tonight left those stars before humans photographed the Moon.'
      }
    ],
    searchTerms: ['chiron', 'centaur', 'alpha centauri', 'rigil kentaurus', 'pointers', 'hadar']
  },
  {
    id: 'scorpius',
    kind: 'constellation',
    iau: 'Sco',
    name: 'Scorpius',
    tagline: 'The scorpion that felled the hunter',
    bestMonths: 'June – August (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Antares', hip: 80763, note: 'Red supergiant, "rival of Mars"' },
      { name: 'Shaula', hip: 86228, note: 'The stinger' }
    ],
    centerAliases: ['CON western Sco'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'The scorpion that killed Orion was granted immortality in the sky — but placed exactly opposite him, so hunter and scorpion never share the horizon. Its curved tail, hooked like a fisherman’s catch, is one of the few constellations that truly looks like its name.'
      },
      {
        culture: 'Star name lore',
        text: 'Antares burns blood-red at the scorpion’s heart. Its name means "rival of Ares" — ancient skywatchers saw it challenge the planet Mars for the title of reddest light in the sky. It is so vast that if it replaced our Sun, its surface would swallow Mars.'
      }
    ],
    searchTerms: ['scorpion', 'antares', 'shaula', 'stinger']
  },
  {
    id: 'canis-major',
    kind: 'constellation',
    iau: 'CMa',
    name: 'Canis Major',
    tagline: 'The Great Dog, following Orion at the heel',
    bestMonths: 'December – February (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Sirius', hip: 32349, note: 'Brightest star in the night sky' },
      { name: 'Adhara', hip: 33579 },
      { name: 'Mirzam', hip: 30324 }
    ],
    centerAliases: ['CON western CMa'],
    stories: [
      {
        culture: 'Egyptian tradition',
        title: 'Sothis and the flood',
        text: 'The Greeks called it the dog of Orion; the Egyptians knew its brightest star as Sothis. Each year Sothis first rose before dawn in July, announcing the annual flood of the Nile on which Egyptian agriculture depended — and the Egyptian new year began with that starlight.'
      },
      {
        culture: 'Star name lore',
        text: 'Sirius comes from the Greek Seirios, "the scorcher". It is the brightest star in the night sky not because it is especially luminous, but because it is luminous and close — a mere 8.6 light-years away, with a faint white dwarf companion nicknamed the Pup.'
      }
    ],
    searchTerms: ['dog star', 'sirius', 'sothis', 'nile', 'great dog']
  },
  {
    id: 'canis-minor',
    kind: 'constellation',
    iau: 'CMi',
    name: 'Canis Minor',
    tagline: 'The Lesser Dog, faithful companion of the winter sky',
    bestMonths: 'February – March (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Procyon', hip: 37279, note: 'Rises before Sirius' },
      { name: 'Gomeisa', hip: 36188 }
    ],
    centerAliases: ['CON western CMi'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'The little dog of Orion — in some tellings the swift hound Laelaps, a beast destined always to catch its prey. Only two stars make up the whole animal, yet both are bright enough to anchor the Winter Triangle.'
      },
      {
        culture: 'Star name lore',
        text: 'Procyon means "before the dog": it rises ahead of Sirius, heralding the Dog Star. It is one of the nearest bright stars to the Sun, and telescope watchers know it as a tricky test — a tiny companion star orbiting close by.'
      }
    ],
    searchTerms: ['procyon', 'lesser dog', 'laelaps', 'winter triangle']
  },
  {
    id: 'taurus',
    kind: 'constellation',
    iau: 'Tau',
    name: 'Taurus',
    tagline: 'The bull with the crystal-encrusted shoulder',
    bestMonths: 'November – February (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Aldebaran', hip: 21421, note: 'The bull’s glaring orange eye' },
      { name: 'Elnath', hip: 25428, note: 'The horn tip' },
      { name: 'Alcyone', hip: 17702, note: 'Brightest of the Pleiades' }
    ],
    asterismIds: [],
    centerAliases: ['CON western Tau'],
    stories: [
      {
        culture: 'Greek mythology',
        title: 'The white bull',
        text: 'Zeus disguised himself as a magnificent white bull to carry the princess Europa across the sea to Crete. Only the front half of the bull is drawn in the stars — the rest was still in the water as he swam.'
      },
      {
        culture: 'Greek mythology',
        title: 'The weeping sisters',
        text: 'The V-shaped Hyades on the bull’s face are the half-sisters of the Pleiades, weeping eternally for their dead brother. Aldebaran, the fiery orange eye, is Arabic for "the follower" — forever chasing the Pleiades across the sky without ever catching them.'
      },
      {
        culture: 'Indonesian farming lore',
        text: 'Across the Indonesian archipelago the Pleiades, on Taurus’s shoulder, are Lintang Kartika or Bintang Tujuh, the Seven Stars. Their dawn appearances and disappearances tuned the traditional rice calendar, marking when to plant and when the monsoon would turn.'
      }
    ],
    searchTerms: ['bull', 'europa', 'aldebaran', 'hyades', 'pleiades', 'kartika', 'seven stars']
  },
  {
    id: 'gemini',
    kind: 'constellation',
    iau: 'Gem',
    name: 'Gemini',
    tagline: 'The inseparable twins',
    bestMonths: 'December – February (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Pollux', hip: 37826, note: 'The immortal twin' },
      { name: 'Castor', hip: 36850, note: 'A famous multiple star system' }
    ],
    centerAliases: ['CON western Gem'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'Castor and Pollux were twins so devoted that when the mortal Castor died, the immortal Pollux begged to share his own life with him. Zeus let them alternate between Olympus and Hades — and placed them together among the stars as the Dioscuri.'
      },
      {
        culture: 'Sailors’ guardians',
        text: 'Ancient Mediterranean sailors considered the twins their protectors; the ghostly electrical glow of St Elmo’s fire on ship rigging was read as their blessing. Their two heads, Castor and Pollux, stand side by side as a pair of matching beacons.'
      }
    ],
    searchTerms: ['twins', 'castor', 'pollux', 'dioscuri']
  },
  {
    id: 'leo',
    kind: 'constellation',
    iau: 'Leo',
    name: 'Leo',
    tagline: 'The lion of the Nemean trials',
    bestMonths: 'February – May (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Regulus', hip: 49669, note: '"The little king" at the lion’s heart' },
      { name: 'Denebola', hip: 57632, note: 'The tail' }
    ],
    centerAliases: ['CON western Leo'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'The first labour of Hercules was to slay the Nemean lion, a beast whose hide no weapon could pierce. Hercules strangled it and wore its skin as armour; Zeus raised the lion to the stars in memory of the struggle.'
      },
      {
        culture: 'Star name lore',
        text: 'Regulus, the star at the lion’s heart, means "little king" in Latin — one of the four Royal Stars of ancient Persia, watchmen of the four quarters of the sky. The backward question mark of stars below it is called the Sickle, the lion’s mane.'
      }
    ],
    searchTerms: ['lion', 'nemean', 'hercules', 'regulus', 'sickle', 'royal star']
  },
  {
    id: 'virgo',
    kind: 'constellation',
    iau: 'Vir',
    name: 'Virgo',
    tagline: 'The maiden holding the ear of wheat',
    bestMonths: 'April – June (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Spica', hip: 65474, note: 'The ear of wheat — and Spica’s namesake' },
      { name: 'Vindemiatrix', hip: 57442 }
    ],
    centerAliases: ['CON western Vir'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'Virgo is the maiden of the harvest — Demeter, goddess of grain, or Astraea, goddess of justice, said to be the last immortal to abandon Earth when humanity grew corrupt. In her left hand she holds a stalk of wheat: Spica, whose name means exactly that.'
      },
      {
        culture: 'Harvest calendar',
        text: 'For ancient farmers, Virgo’s evening return marked harvest season. Beyond her lies the nearest great cluster of galaxies — the Virgo Cluster, thousands of galaxies hidden in what looks like empty darkness.'
      }
    ],
    searchTerms: ['maiden', 'spica', 'demeter', 'astraea', 'harvest', 'virgo cluster']
  },
  {
    id: 'lyra',
    kind: 'constellation',
    iau: 'Lyr',
    name: 'Lyra',
    tagline: 'The harp of Orpheus, crowned by Vega',
    bestMonths: 'June – October (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Vega', hip: 91262, note: 'Fifth-brightest star; a corner of the Summer Triangle' }
    ],
    asterismIds: ['summer-triangle'],
    centerAliases: ['CON western Lyr'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'This is the lyre of Orpheus, whose music could charm stones, beasts and even Hades himself. When Orpheus died, the Muses gathered his harp and hung it in the sky; the Milky Way beneath it is said to be the road his music once travelled.'
      },
      {
        culture: 'Around the world',
        text: 'Vega’s name comes from the Arabic for "swooping eagle". Around 12,000 BCE, the slow wobble of Earth’s axis made Vega the pole star, and it will be again — navigators of the far future will steer by the Harp instead of the Bear.'
      }
    ],
    searchTerms: ['vega', 'lyre', 'orpheus', 'harp', 'summer triangle']
  },
  {
    id: 'cygnus',
    kind: 'constellation',
    iau: 'Cyg',
    name: 'Cygnus',
    tagline: 'The swan gliding down the Milky Way',
    bestMonths: 'July – October (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Deneb', hip: 102098, note: 'The tail; one of the most luminous stars known' },
      { name: 'Albireo', hip: 95947, note: 'A famous gold-and-blue double star' },
      { name: 'Sadr', hip: 100453 }
    ],
    asterismIds: ['summer-triangle', 'northern-cross'],
    centerAliases: ['CON western Cyg'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'Zeus took the shape of a swan in his pursuit of Leda, queen of Sparta; the swan’s image was honoured in the stars. The constellation is also called the Northern Cross, upright in the evening sky through autumn.'
      },
      {
        culture: 'Chinese astronomy',
        title: 'Ferryman of the Sky River',
        text: 'Chinese tradition sees the Milky Way as a celestial river, the Sky River separating the Weaver Girl from her Cowherd. In some tellings Deneb, at the swan’s tail, is the ferryman who carries the lovers across when the magpie bridge dissolves.'
      }
    ],
    searchTerms: ['swan', 'deneb', 'northern cross', 'albireo', 'sadr', 'sky river']
  },
  {
    id: 'aquila',
    kind: 'constellation',
    iau: 'Aql',
    name: 'Aquila',
    tagline: 'The Eagle of Zeus, diving along the Milky Way',
    bestMonths: 'July – September (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Altair', hip: 97649, note: 'Flanked by Tarazed and Alshain' },
      { name: 'Tarazed', hip: 97278 }
    ],
    asterismIds: ['summer-triangle'],
    centerAliases: ['CON western Aql'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'Aquila is the great eagle that carried Zeus’s thunderbolts — the same bird that bore the shepherd boy Ganymede up to Olympus to serve as cupbearer of the gods. The eagle flies headlong down the Milky Way as if racing the swan beside it.'
      },
      {
        culture: 'Chinese astronomy',
        title: 'The Cowherd',
        text: 'Altair is Niulang the Cowherd of the great love story Qixi: banished to one bank of the Sky River, staring across at his weaver-bride. On either side of Altair shine his two children, the small stars Tarazed and Alshain, waiting with their father.'
      }
    ],
    searchTerms: ['eagle', 'altair', 'tarazed', 'niulang', 'cowherd', 'qixi']
  },
  {
    id: 'cassiopeia',
    kind: 'constellation',
    iau: 'Cas',
    name: 'Cassiopeia',
    tagline: 'The vain queen condemned to wheel around the pole',
    bestMonths: 'September – December (evenings, circumpolar in the north)',
    visibility: 'north',
    brightestStars: [
      { name: 'Schedar', hip: 8886 },
      { name: 'Caph', hip: 746 },
      { name: 'Gamma Cassiopeiae', hip: 4427, note: 'An eruptive variable star' }
    ],
    centerAliases: ['CON western Cas'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'Cassiopeia, queen of Aethiopia, boasted that she was more beautiful than the sea nymphs. Poseidon punished her realm with a sea monster, and the queen herself was chained to a throne in the sky, circling the pole forever — spending half of every night upside down, a lesson in humility written across the heavens.'
      },
      {
        culture: 'Modern sky',
        text: 'Her W-shape is one of the easiest patterns to learn, and it sits directly in the band of the Milky Way — rich ground for binoculars, including two of the most famous supernova remnants in history that appeared in her borders.'
      }
    ],
    searchTerms: ['queen', 'w shape', 'schedar', 'caph', 'vanity']
  },
  {
    id: 'andromeda',
    kind: 'constellation',
    iau: 'And',
    name: 'Andromeda',
    tagline: 'The chained princess, guardian of the nearest great galaxy',
    bestMonths: 'September – December (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Alpheratz', hip: 677, note: 'Shared with Pegasus' },
      { name: 'Mirach', hip: 5447 },
      { name: 'Almach', hip: 9640 }
    ],
    centerAliases: ['CON western And'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'Cassiopeia’s boast doomed her daughter: Andromeda was chained to a sea cliff as sacrifice to the monster Cetus, and rescued at the last moment by Perseus, flying back from slaying Medusa. The whole tragic royal family — Cepheus, Cassiopeia, Andromeda, Perseus, even the sea monster — fills this corner of the sky.'
      },
      {
        culture: 'Modern sky',
        text: 'Dark of night, away from city lights, and you can find a faint oval smudge beside her sash: the Andromeda Galaxy (M 31), two and a half million light-years away and the most distant thing most human eyes can ever see.'
      }
    ],
    searchTerms: ['princess', 'andromeda galaxy', 'm31', 'chained', 'perseus']
  },
  {
    id: 'pegasus',
    kind: 'constellation',
    iau: 'Peg',
    name: 'Pegasus',
    tagline: 'The winged horse and its Great Square',
    bestMonths: 'September – December (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Markab', hip: 113881 },
      { name: 'Scheat', hip: 110349 },
      { name: 'Enif', hip: 107315, note: 'The horse’s nose' }
    ],
    asterismIds: ['great-square'],
    centerAliases: ['CON western Peg'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'Pegasus, the winged horse, sprang from the neck of the slain Medusa and was later ridden by the hero Bellerophon. After the hero tried to ride to Olympus, the horse was stabled in the sky — flying upside-down in most star maps.'
      },
      {
        culture: 'Modern sky',
        text: 'The Great Square is the autumn sky’s signpost: its corners point the way to Andromeda, and its mostly-empty interior is a classic dark-sky test — count the stars you can see inside the Square to gauge how light-polluted your night is.'
      }
    ],
    searchTerms: ['winged horse', 'great square', 'markab', 'scheat', 'enif', 'bellerophon']
  },
  {
    id: 'perseus',
    kind: 'constellation',
    iau: 'Per',
    name: 'Perseus',
    tagline: 'The hero carrying the head of Medusa',
    bestMonths: 'November – January (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Mirfak', hip: 15863 },
      { name: 'Algol', hip: 14576, note: 'The "Demon Star"' }
    ],
    centerAliases: ['CON western Per'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'Perseus, flying home with the severed head of Medusa, rescued Andromeda on the way and kept the Gorgon’s head forever after: Algol, the star in his hand, is the Demon’s Head — Ra’s al-Ghul in Arabic.'
      },
      {
        culture: 'Modern sky',
        text: 'Algol’s "demon" is real: every 2.87 days it dims noticeably as a companion star eclipses it — an eclipse you can watch with your naked eye across a few evening hours. Between Perseus and Cassiopeia glitters the Double Cluster, twin cities of young stars.'
      }
    ],
    searchTerms: ['perseus', 'medusa', 'algol', 'demon star', 'double cluster', 'mirfak']
  },
  {
    id: 'auriga',
    kind: 'constellation',
    iau: 'Aur',
    name: 'Auriga',
    tagline: 'The charioteer carrying a goat on his shoulder',
    bestMonths: 'December – February (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Capella', hip: 24608, note: 'The "Little She-Goat"' },
      { name: 'Menkalinan', hip: 28455 }
    ],
    asterismIds: ['winter-triangle'],
    centerAliases: ['CON western Aur'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'Auriga the charioteer — sometimes the inventor of the chariot himself, sometimes the lame king Erechtheus who needed wheels to walk. Clutched to his shoulder is a she-goat, Capella, whose two orphaned kids dangle beside her as the little triangle of the Kids.'
      },
      {
        culture: 'Weather lore',
        text: 'Capella means "little she-goat" in Latin, and ancient farmers watched her closely: a veil of cloud or haze around the golden star was read as a promise of rain. She is actually two giant suns locked in a four-day orbit, blazing a hundred times brighter than our Sun.'
      }
    ],
    searchTerms: ['charioteer', 'capella', 'goat', 'kids', 'menkalinan']
  },
  {
    id: 'bootes',
    kind: 'constellation',
    iau: 'Boo',
    name: 'Boötes',
    tagline: 'The herdsman driving the bears around the pole',
    bestMonths: 'May – July (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Arcturus', hip: 69673, note: 'Brightest star of the northern sky' }
    ],
    centerAliases: ['CON western Boo'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'Boötes the Herdsman strides behind the Great Bear, dogs at heel, forever driving it around the pole. His name and his brightest star are one pun across millennia: Arcturus is "the guardian of the bear" (Arktouros) in ancient Greek.'
      },
      {
        culture: 'Star name lore',
        text: 'Arcturus is an orange giant racing through the galaxy on a tilted path — it is not part of the Sun’s family of stars but a visitor from a younger, different neighbourhood. In 1933 its light opened the Chicago World’s Fair, signalled by telescope from the star to a phototube to the light switch.'
      }
    ],
    searchTerms: ['herdsman', 'arcturus', 'guardian of the bear', 'kite']
  },
  {
    id: 'sagittarius',
    kind: 'constellation',
    iau: 'Sgr',
    name: 'Sagittarius',
    tagline: 'The archer aiming at the heart of the galaxy',
    bestMonths: 'June – August (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Kaus Australis', hip: 90185, note: 'The bow star' },
      { name: 'Nunki', hip: 98437 }
    ],
    asterismIds: ['teapot'],
    centerAliases: ['CON western Sgr'],
    stories: [
      {
        culture: 'Babylonian origins',
        text: 'The Archer is among the oldest named constellations on Earth — Babylonian scribes drew him as the god Pabilsag, half man, half beast, three thousand years before the Greeks re-imagined him as a centaur with a drawn bow.'
      },
      {
        culture: 'Greek mythology',
        text: 'The Greeks made him the satyr Crotus, inventor of the bow, or simply one of the wise centaurs. His arrow points at Antares, the red heart of Scorpius — some myths say he guards the sky against that region, keeping the Scorpion in check.'
      },
      {
        culture: 'Modern sky',
        text: 'Behind the spout of his Teapot hides the centre of our Milky Way — tens of thousands of light-years of star-clouds, dust lanes and the four-million-solar-mass black hole every star here orbits, including our Sun.'
      }
    ],
    searchTerms: ['archer', 'teapot', 'pabilsag', 'galactic center', 'nunki', 'kaus']
  },
  {
    id: 'eridanus',
    kind: 'constellation',
    iau: 'Eri',
    name: 'Eridanus',
    tagline: 'The celestial river flowing to the world’s edge',
    bestMonths: 'October – December (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Achernar', hip: 7588, note: '"The River’s End" — the flattest star known' }
    ],
    centerAliases: ['CON western Eri'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'Eridanus is the river into which Phaethon crashed the Sun’s chariot, scorching a stripe across the sky — the Milky Way — before falling to Earth. The river begins beside Orion’s foot and winds across nearly a quarter of the heavens to end at Achernar.'
      },
      {
        culture: 'Star name lore',
        text: 'Achernar, Arabic for "the river’s end", is so distant from the north that the ancient Greeks never saw it — Ptolemy’s river simply trailed off into the unknown. Astronomers later discovered it spins so fast that it is squashed into the most flattened star known.'
      }
    ],
    searchTerms: ['river', 'phaethon', 'achernar', 'eridanus']
  },
  {
    id: 'piscis-austrinus',
    kind: 'constellation',
    iau: 'PsA',
    name: 'Piscis Austrinus',
    tagline: 'The Southern Fish drinking the flood',
    bestMonths: 'August – October (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Fomalhaut', hip: 113368, note: 'The "lonely star of autumn"' }
    ],
    centerAliases: ['CON western PsA'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'The Southern Fish saved the goddess of love and beauty in some tellings — the fish from which Aphrodite and Eros escaped the monster Typhon. It is the parent of the two fishes of Pisces, drinking alone at the mouth of the river Eridanus.'
      },
      {
        culture: 'Modern sky',
        text: 'Fomalhaut, "the mouth of the fish" in Arabic, blazes alone in an otherwise empty corner of the southern autumn sky, so lonely that stargazers call it the solitary star of autumn. Telescopes have photographed a vast ring of comet dust around it — a young planetary system under construction.'
      }
    ],
    searchTerms: ['southern fish', 'fomalhaut', 'lonely star', 'autumn']
  },
  {
    id: 'carina',
    kind: 'constellation',
    iau: 'Car',
    name: 'Carina',
    tagline: 'The Keel of the great ship Argo',
    bestMonths: 'January – May (evenings)',
    visibility: 'south',
    brightestStars: [
      { name: 'Canopus', hip: 30438, note: 'Second-brightest star in the night sky' },
      { name: 'Avior', hip: 41037 },
      { name: 'Miaplacidus', hip: 45238 }
    ],
    centerAliases: ['CON western Car'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'Carina is the keel of the Argo, the ship that carried Jason and the Argonauts after the Golden Fleece. The old constellation Argo Navis was so enormous that 18th-century mapmakers cut it into keel, sails and stern — and the sky has kept the pieces ever since.'
      },
      {
        culture: 'Around the world',
        text: 'Canopus, silver-bright above the southern horizon, guided Polynesian voyagers and desert caravans alike; Arabic tradition named it Suhayl, the sailor’s star whose first sighting marked the season of safe crossings.'
      }
    ],
    searchTerms: ['argo', 'keel', 'canopus', 'suhayl', 'jason']
  },
  {
    id: 'corvus',
    kind: 'constellation',
    iau: 'Crv',
    name: 'Corvus',
    tagline: 'The raven punished with a twisted neck',
    bestMonths: 'April – May (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Gienah', hip: 59803 },
      { name: 'Algorab', hip: 58053 }
    ],
    centerAliases: ['CON western Crv'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'Apollo sent his snow-white raven to fetch water in a cup. The bird dawdled all day beneath a fig tree, then flew back with the empty cup and blamed a water snake. Apollo saw through the lie: he condemned the raven to eternal thirst, turned its feathers black, and pinned the cup (Crater) and the snake (Hydra) into the sky beside it.'
      },
      {
        culture: 'Modern sky',
        text: 'The raven’s compact four-star sail is easy to spot standing on the back of Hydra, and it points a line toward Spica: star-hop from the sail and the wheat of Virgo falls right out of it.'
      }
    ],
    searchTerms: ['raven', 'crow', 'apollo', 'crater', 'hydra', 'gienah']
  },
  {
    id: 'ophiuchus',
    kind: 'constellation',
    iau: 'Oph',
    name: 'Ophiuchus',
    tagline: 'The serpent bearer, the healer between the zodiac signs',
    bestMonths: 'June – July (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Rasalhague', hip: 86032 }
    ],
    centerAliases: ['CON western Oph'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'Ophiuchus is Asclepius, the mortal physician who learned the secret of resurrection from a serpent — after watching one snake revive another with a healing herb. When he raised the dead too often, Zeus struck him down, then honoured him in the sky, still clutching the serpent (Serpens) that taught him.'
      },
      {
        culture: 'Modern sky',
        text: 'The Sun passes through Ophiuchus between Scorpius and Sagittarius, which occasionally makes news as a "13th sign" — but astrological zodiac signs were fixed to the calendar seasons, not the slowly drifting constellations.'
      }
    ],
    searchTerms: ['serpent bearer', 'asclepius', 'healer', 'thirteenth sign', 'rasalhague']
  },
  {
    id: 'aquarius',
    kind: 'constellation',
    iau: 'Aqr',
    name: 'Aquarius',
    tagline: 'The water bearer pouring the celestial river',
    bestMonths: 'September – October (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Sadalsuud', hip: 100751, note: '"The luckiest of the lucky"' }
    ],
    centerAliases: ['CON western Aqr'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'The Water Bearer is often Ganymede, the beautiful boy carried off by Zeus’s eagle to pour wine for the gods. The zigzag of faint stars beneath his jar was drawn as the stream itself — the same water that ends in the mouth of the Southern Fish.'
      },
      {
        culture: 'Babylonian origins',
        text: 'To Babylonian skywatchers this region belonged to Ea, god of the deep waters, and its rise before dawn signalled the season of rains. Its brightest star’s name, Sadalsuud, means "the luckiest of the lucky" — a star whose dawn rising was considered a good omen.'
      }
    ],
    searchTerms: ['water bearer', 'ganymede', 'ea', 'sadalsuud', 'rains']
  },
  {
    id: 'capricornus',
    kind: 'constellation',
    iau: 'Cap',
    name: 'Capricornus',
    tagline: 'The sea-goat, half mountain, half fish',
    bestMonths: 'August – September (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Algedi', hip: 104951 }
    ],
    centerAliases: ['CON western Cap'],
    stories: [
      {
        culture: 'Babylonian origins',
        text: 'The sea-goat is Babylonian in origin: suhurmašu, the goat-fish of Ea’s waters, drawn on boundary stones three thousand years ago. The Greeks told instead of the goat-nymph Amalthea, who suckled the infant Zeus — the horn she broke became the Horn of Plenty.'
      },
      {
        culture: 'Modern sky',
        text: 'Its stars are faint, forming a wide smile under Aquila. Around two thousand years ago this was where the Sun turned northward at the winter solstice — the Tropic of Capricorn still carries its name, though the Sun now turns there in neighbouring Sagittarius.'
      }
    ],
    searchTerms: ['sea goat', 'amalthea', 'horn of plenty', 'suhurmasu', 'tropic']
  },
  {
    id: 'aries',
    kind: 'constellation',
    iau: 'Ari',
    name: 'Aries',
    tagline: 'The golden ram of the flying fleece',
    bestMonths: 'November – December (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Hamal', hip: 9884, note: '"The lamb"' },
      { name: 'Sheratan', hip: 8903 }
    ],
    centerAliases: ['CON western Ari'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'The ram with the golden fleece carried the children Phrixus and Helle across the sky-sea to save them from a wicked stepmother. Helle fell into the strait that became the Hellespont, named for her; Phrixus arrived safely, sacrificed the grateful ram, and its fleece was hung in a sacred grove — the prize of Jason’s quest.'
      },
      {
        culture: 'Ancient calendar',
        text: 'Two thousand years ago the Sun’s yearly path began here at the spring equinox, and the vernal point is still called the First Point of Aries — though Earth’s wobble has since carried that invisible marker into Pisces.'
      }
    ],
    searchTerms: ['ram', 'golden fleece', 'jason', 'helle', 'hamal', 'first point']
  },
  {
    id: 'libra',
    kind: 'constellation',
    iau: 'Lib',
    name: 'Libra',
    tagline: 'The scales balancing night and day',
    bestMonths: 'May – June (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Zubeneschamali', hip: 74395, note: '"The northern claw"' },
      { name: 'Zubenelgenubi', hip: 72622, note: 'The scorpion’s southern claw' }
    ],
    centerAliases: ['CON western Lib'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'Libra was once the Scorpion’s outstretched claws — its star names still say so: Zubeneschamali, "the northern claw", and Zubenelgenubi, "the southern claw". The Greeks later cut the claws free and weighed them into the scales of Astraea, goddess of justice.'
      },
      {
        culture: 'Ancient calendar',
        text: 'It is the only lifeless object in the zodiac. When the Sun stood in Libra at the autumn equinox, day and night balanced on its scales — the perfect symbol in the perfect place.'
      }
    ],
    searchTerms: ['scales', 'balance', 'astraea', 'zubenelgenubi', 'zubeneschamali', 'equinox']
  },
  {
    id: 'cancer',
    kind: 'constellation',
    iau: 'Cnc',
    name: 'Cancer',
    tagline: 'The faint crab of Hercules’ second labour',
    bestMonths: 'February – March (evenings)',
    visibility: 'both',
    brightestStars: [
      { name: 'Tarf', hip: 42806 }
    ],
    centerAliases: ['CON western Cnc'],
    stories: [
      {
        culture: 'Greek mythology',
        text: 'While Hercules wrestled the many-headed Hydra, Hera sent a crab to nip his heel. The hero crushed it underfoot, but Hera — grateful for the effort even in defeat — set the little crab among the stars, though she gave it the faintest stars of the zodiac as a consolation.'
      },
      {
        culture: 'Ancient weather lore',
        text: 'At the crab’s heart glows the Beehive Cluster (M 44), a handful of stars ancient shepherds called the Manger between two donkeys. Sailors and farmers read it as a weather eye: if the Manger vanished in haze, rain was on the way.'
      }
    ],
    searchTerms: ['crab', 'beehive', 'm44', 'manger', 'hera', 'hercules']
  }
]

export const ASTERISM_STORIES: AsterismStory[] = [
  {
    id: 'summer-triangle',
    kind: 'asterism',
    name: 'Summer Triangle',
    tagline: 'Three bright beacons across three constellations',
    bestMonths: 'June – November (evenings)',
    visibility: 'both',
    stars: [
      { name: 'Vega', hip: 91262, note: 'In Lyra the Harp' },
      { name: 'Deneb', hip: 102098, note: 'In Cygnus the Swan' },
      { name: 'Altair', hip: 97649, note: 'In Aquila the Eagle' }
    ],
    constellations: ['Lyra', 'Cygnus', 'Aquila'],
    lineSegments: [[91262, 102098, 97649, 91262]],
    centerAliases: ['HIP 91262'],
    stories: [
      {
        culture: 'Chinese tradition',
        title: 'The Weaver and the Cowherd',
        text: 'Vega is Zhinü the Weaver Girl, daughter of heaven; Altair is Niulang the Cowherd. They married and were happy until the Queen of Heaven, furious that a goddess had married a mortal, drew the Milky Way across the sky as a river to part them. Each year on the seventh night of the seventh moon, ten thousand magpies spread their wings to form a bridge — and the lovers meet. This is the festival of Qixi, still celebrated across East Asia, and in Japan as Tanabata.'
      },
      {
        culture: 'Around the world',
        text: 'The "triangle" itself is a modern pattern, but every culture gave its corners meaning: Deneb, the faintest of the three, is actually one of the most powerful stars known — it outshines the Sun by tens of thousands of times. Find the Triangle high overhead on summer nights and you have found three different constellations at once.'
      }
    ],
    searchTerms: ['qixi', 'tanabata', 'vega', 'altair', 'deneb', 'weaver', 'cowherd', 'magpie']
  },
  {
    id: 'winter-triangle',
    kind: 'asterism',
    name: 'Winter Triangle',
    tagline: 'The brightest corner of the coldest nights',
    bestMonths: 'December – March (evenings)',
    visibility: 'both',
    stars: [
      { name: 'Sirius', hip: 32349, note: 'In Canis Major' },
      { name: 'Procyon', hip: 37279, note: 'In Canis Minor' },
      { name: 'Betelgeuse', hip: 27989, note: 'In Orion' }
    ],
    constellations: ['Canis Major', 'Canis Minor', 'Orion'],
    lineSegments: [[32349, 37279, 27989, 32349]],
    centerAliases: ['HIP 32349'],
    stories: [
      {
        culture: 'Around the world',
        text: 'Join Sirius, Procyon and Betelgeuse and you trace a triangle over the two hunter’s dogs and the hunter’s shoulder. Within it runs the faint winter Milky Way, and at its centre sits the Unicorn, Monoceros — a sky-unicorn hiding in plain sight. No season of the year offers more bright stars than this.'
      }
    ],
    searchTerms: ['sirius', 'procyon', 'betelgeuse', 'winter', 'monoceros']
  },
  {
    id: 'big-dipper',
    kind: 'asterism',
    name: 'Big Dipper',
    tagline: 'The sky’s compass, ladling out the seasons',
    bestMonths: 'March – May (evenings; circumpolar in the north)',
    visibility: 'north',
    stars: [
      { name: 'Dubhe', hip: 54061, note: 'The pointer star' },
      { name: 'Merak', hip: 53910, note: 'The other pointer star' },
      { name: 'Phecda', hip: 58001 },
      { name: 'Megrez', hip: 59774 },
      { name: 'Alioth', hip: 62956 },
      { name: 'Mizar', hip: 65378, note: 'Test your eyes: find tiny Alcor beside it' },
      { name: 'Alkaid', hip: 67301 }
    ],
    constellations: ['Ursa Major'],
    lineSegments: [[67301, 65378, 62956, 59774], [59774, 54061, 53910, 58001, 59774]],
    centerAliases: ['HIP 54061'],
    stories: [
      {
        culture: 'Finding north',
        text: 'Line up the two outer stars of the bowl — Merak and Dubhe — and extend the line five times: you land on Polaris, the North Star. This trick has steered travellers for centuries and is usually the first star-hopping lesson every stargazer learns.'
      },
      {
        culture: 'Chinese tradition',
        text: 'As Běidǒu, the Northern Dipper, these stars were the ladle of the celestial government, its handle a clock and calendar: in Chinese lore the handle pointing east at dusk meant spring had come — and each season had its own direction.'
      },
      {
        culture: 'Malay and American lore',
        text: 'To Malay sailors the shape was Bintang Biduk, a small boat; to many African-American communities escaping slavery, it was the Drinking Gourd, a written song hiding escape directions inside a folk lyric. Mizar, midway along the handle, hides a tiny companion — Alcor — a horse-and-rider eyesight test known to the Arabs.'
      }
    ],
    searchTerms: ['dipper', 'beidou', 'biduk', 'drinking gourd', 'pointer', 'polaris', 'mizar', 'alcor']
  },
  {
    id: 'orions-belt',
    kind: 'asterism',
    name: 'Orion’s Belt',
    tagline: 'Three stars in a perfect line, known on every continent',
    bestMonths: 'November – March (evenings)',
    visibility: 'both',
    stars: [
      { name: 'Alnitak', hip: 26727, note: 'Eastern belt star' },
      { name: 'Alnilam', hip: 26311, note: 'The central star' },
      { name: 'Mintaka', hip: 25930, note: 'Western belt star' }
    ],
    constellations: ['Orion'],
    lineSegments: [[26727, 26311, 25930]],
    centerAliases: ['HIP 26311'],
    stories: [
      {
        culture: 'Around the world',
        title: 'The three stars',
        text: 'Three hot blue giants in a near-perfect line, 1,000 light-years away and born of the same cloud. Cultures worldwide saw them as three: the Three Kings, the Three Sisters, Three Mules. Javanese farmers knew them as Bintang Wuluh, a rice ladle whose pre-dawn return set the planting season; the Maya saw the smudge beneath them — the Orion Nebula — as the cosmic hearth of creation.'
      },
      {
        culture: 'Finding your way',
        text: 'The belt is Orion’s gift to beginners: follow it southeast and you land on Sirius, the brightest star in the night sky; follow it northwest and you reach Aldebaran and the Pleiades. Hanging below the middle star is the sword — and in it the Orion Nebula, a cradle of newborn stars visible to the naked eye.'
      }
    ],
    searchTerms: ['belt', 'three kings', 'wuluh', 'alnitak', 'alnilam', 'mintaka', 'nebula']
  },
  {
    id: 'southern-cross-asterism',
    kind: 'asterism',
    name: 'Southern Cross & Pointers',
    tagline: 'Finding true south where no pole star shines',
    bestMonths: 'March – June (evenings)',
    visibility: 'south',
    stars: [
      { name: 'Acrux', hip: 60718, note: 'The foot of the cross' },
      { name: 'Gacrux', hip: 61084, note: 'The head of the cross' },
      { name: 'Rigil Kentaurus', hip: 71683, note: 'Brighter Pointer' },
      { name: 'Hadar', hip: 68702, note: 'Second Pointer' }
    ],
    constellations: ['Crux', 'Centaurus'],
    lineSegments: [[60718, 61084], [62434, 59747]],
    centerAliases: ['HIP 60718'],
    stories: [
      {
        culture: 'Finding south',
        text: 'The south celestial pole has no star of its own, so navigators borrow the Cross: draw a line through its long axis from head to foot and extend it about four and a half times — there is true south. The two bright Pointers trailing Alpha Centauri confirm you have the real Cross and not its imitators, the False Cross, nearby.'
      },
      {
        culture: 'Around the world',
        text: 'Māori tradition calls the Cross Te Punga, the anchor of the sky-canoe, its rope trailing as the Pointers. The Cross now crowns five national flags, and beside it the Coalsack — the Emu’s dark head in Aboriginal lore — reminds us that some constellations are drawn in shadow instead of starlight.'
      }
    ],
    searchTerms: ['southern cross', 'pointers', 'south pole', 'te punga', 'false cross', 'acrux']
  },
  {
    id: 'teapot',
    kind: 'asterism',
    name: 'The Teapot',
    tagline: 'A kettle in Sagittarius pouring the Milky Way',
    bestMonths: 'June – September (evenings)',
    visibility: 'both',
    stars: [
      { name: 'Kaus Australis', hip: 90185, note: 'The spout' },
      { name: 'Nunki', note: 'The handle' },
      { name: 'Kaus Media', hip: 89931, note: 'The lid' }
    ],
    constellations: ['Sagittarius'],
    lineSegments: [[96406, 89931, 90185, 92041, 90496, 88635, 96406]],
    centerAliases: ['HIP 90185'],
    stories: [
      {
        culture: 'Modern sky lore',
        text: 'Eight bright stars of the archer brew into a perfect teapot: a pot body, a handle, a lid and a spout tipped westward. On clear dark nights, the "steam" rising from the spout is real — the Great Sagittarius Star Cloud, the brightest stretch of the Milky Way, and beyond it the gravitational heart of our galaxy.'
      }
    ],
    searchTerms: ['teapot', 'sagittarius', 'galactic center', 'star cloud', 'nunki', 'kaus']
  },
  {
    id: 'northern-cross',
    kind: 'asterism',
    name: 'Northern Cross',
    tagline: 'The swan spread wide along the Milky Way',
    bestMonths: 'July – October (evenings)',
    visibility: 'both',
    stars: [
      { name: 'Deneb', hip: 102098, note: 'The head of the cross' },
      { name: 'Sadr', hip: 100453, note: 'The centre' },
      { name: 'Albireo', hip: 95947, note: 'The foot — a gold-and-blue double star' }
    ],
    constellations: ['Cygnus'],
    lineSegments: [[102098, 100453, 95947], [94779, 97165, 100453, 104732]],
    centerAliases: ['HIP 102098'],
    stories: [
      {
        culture: 'Modern sky lore',
        text: 'Cygnus doubles as the Northern Cross, upright on autumn evenings as if floating down the Milky Way. Its foot star Albireo is a treat in any telescope: two stars, one amber and one sapphire, framed together. Astronomers treasure another hidden sight here — Cygnus X-1, the first black hole ever identified.'
      }
    ],
    searchTerms: ['northern cross', 'cygnus', 'albireo', 'deneb', 'sadr', 'cygnus x-1']
  },
  {
    id: 'great-square',
    kind: 'asterism',
    name: 'Great Square of Pegasus',
    tagline: 'The autumn sky’s window — and its darkness meter',
    bestMonths: 'September – December (evenings)',
    visibility: 'both',
    stars: [
      { name: 'Markab', hip: 113881 },
      { name: 'Scheat', hip: 113963 },
      { name: 'Algenib', hip: 1067, note: 'The fourth corner' },
      { name: 'Alpheratz', hip: 677, note: 'The shared corner, also Andromeda’s head' }
    ],
    constellations: ['Pegasus', 'Andromeda'],
    lineSegments: [[677, 113963], [113963, 113881], [113881, 1067], [1067, 677]],
    centerAliases: ['HIP 113881'],
    stories: [
      {
        culture: 'Modern sky lore',
        text: 'Four second-magnitude stars frame an enormous, nearly perfect square flying high through autumn evenings. It is the winged horse’s body, the jumping-off point for star-hops to Andromeda’s galaxy — and famously almost empty. Count the stars you can see inside the Square: half a dozen or more means a genuinely dark sky; only two or three means city glow has won the night.'
      }
    ],
    searchTerms: ['square', 'pegasus', 'markab', 'scheat', 'algenib', 'alpheratz', 'dark sky test']
  }
]

// Individual stars famous enough to earn their own story. Centering works the
// same way as asterisms: by Hipparcos id in the essential catalog.
export const STAR_STORIES: StarStory[] = [
  {
    id: 'albireo',
    kind: 'star',
    name: 'Albireo',
    tagline: 'The gold-and-sapphire double star at the head of the Swan',
    bestMonths: 'August – November (evenings)',
    visibility: 'north',
    stars: [
      { name: 'Albireo', hip: 95947, note: 'β Cygni — the beak of the Swan' },
      { name: 'Albireo B', note: 'The sapphire companion, 5th magnitude' }
    ],
    constellations: ['Cygnus'],
    centerAliases: ['HIP 95947'],
    selectionAliases: ['bet01 Cyg'],
    stories: [
      {
        culture: 'Telescope classic',
        title: 'One star, two colors',
        text: 'To the naked eye Albireo is a single, modest star at the beak of Cygnus the Swan. Aim any small telescope and it splits into a pair: a warm gold giant of magnitude 3.1 and a dimmer sapphire companion of magnitude 5.4, about 35 arcseconds apart. The colors are real — the brighter star is a cool orange giant, the companion a much hotter blue-white star — and side by side, each makes the other look more vivid.'
      },
      {
        culture: 'Modern astronomy',
        title: 'A pair, or a chance alignment?',
        text: 'For a century astronomers argued whether the two stars really orbit each other. Gaia’s precise sky mapping now suggests the wide blue companion may be a line-of-sight neighbour far beyond the gold star — and the gold star itself hides a very close companion of its own. Albireo remains a favorite reminder that even the sky’s celebrities keep secrets.'
      },
      {
        culture: 'Name and lore',
        text: 'Albireo marks the head of the Swan — the foot of the Northern Cross — and its odd name has no confirmed meaning: it most likely arose from a garbled transcription in centuries-old star tables. Find it opposite Deneb, at the end of the swan’s long neck, high overhead on late-summer and autumn evenings.'
      }
    ],
    searchTerms: ['beta cygni', 'double star', 'swan', 'northern cross']
  },
  {
    id: 'winter-albireo',
    kind: 'star',
    name: 'Winter Albireo',
    tagline: 'The gold-and-blue double of Canis Major',
    bestMonths: 'December – February (evenings)',
    visibility: 'both',
    stars: [
      { name: '145 Canis Majoris', hip: 35210, note: 'The gold supergiant, magnitude 4.8' },
      { name: 'HD 56578', note: 'The blue-white companion, magnitude 5.8' }
    ],
    constellations: ['Canis Major'],
    centerAliases: ['HIP 35210'],
    selectionAliases: ['145 CMa'],
    stories: [
      {
        culture: 'Telescope classic',
        title: 'The colder-season Albireo',
        text: 'In the heart of Canis Major, the Great Dog, a star the naked eye sees as a single point of magnitude 4.5 hides a secret. Any small telescope splits it into a warm gold star paired with a blue-white companion about 30 arcseconds apart. Observers call it the Winter Albireo — the same gold-and-blue thrill as Cygnus’s famous double, riding high when the Swan has sunk low.'
      },
      {
        culture: 'Modern astronomy',
        title: 'A supergiant in the Great Dog',
        text: 'The gold star, 145 Canis Majoris, is no ordinary sun: it is a yellow supergiant shining from roughly 2,700 light-years away, tens of thousands of times more luminous than the Sun. It is also a slow, semiregular variable — its light gently swells and fades as the enormous star breathes in and out.'
      },
      {
        culture: 'Modern astronomy',
        title: 'A pair in name only',
        text: 'Like Albireo itself, this double is a line-of-sight accident: Gaia’s mapping shows the blue companion is a foreground A-type star only about 350 light-years away, drifting through the galaxy on its own path. John Herschel catalogued the pair during his Cape survey — h3945 — and skywatchers have treasured the easy, colorful split ever since.'
      }
    ],
    searchTerms: ['h3945', 'herschel 3945', 'winter albireo', '145 cma', 'canis major', 'double star']
  }
]

export const ALL_STORIES: SkyStory[] = [...CONSTELLATION_STORIES, ...ASTERISM_STORIES, ...STAR_STORIES]

const STORIES_BY_ID = new Map(ALL_STORIES.map((story) => [story.id, story]))

const STORIES_BY_HIP = new Map<number, SkyStory>()
for (const story of CONSTELLATION_STORIES) {
  for (const star of story.brightestStars) {
    if (star.hip !== undefined) STORIES_BY_HIP.set(star.hip, story)
  }
}
// A dedicated star story wins over its host constellation's story, so
// selecting Albireo offers the star's own tale.
for (const story of STAR_STORIES) {
  for (const star of story.stars) {
    if (star.hip !== undefined) STORIES_BY_HIP.set(star.hip, story)
  }
}

const STORIES_BY_STAR_NAME = new Map<string, SkyStory>()
for (const story of CONSTELLATION_STORIES) {
  for (const star of story.brightestStars) {
    STORIES_BY_STAR_NAME.set(star.name.toLowerCase(), story)
  }
}
for (const story of STAR_STORIES) {
  for (const star of story.stars) {
    STORIES_BY_STAR_NAME.set(star.name.toLowerCase(), story)
  }
}

// Engine designations for stars the bundled data never names ("* bet01 Cyg"
// is Albireo's only engine-side name). Matched after "*" prefix stripping.
const STAR_STORIES_BY_ENGINE_NAME = new Map<string, StarStory>()
for (const story of STAR_STORIES) {
  for (const alias of story.selectionAliases ?? []) {
    STAR_STORIES_BY_ENGINE_NAME.set(alias.toLowerCase(), story)
  }
}

export function searchStories(query: string): SkyStory[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []
  const words = normalized.split(/\s+/)
  return ALL_STORIES.filter((story) => {
    const haystack = [
      story.name,
      story.tagline,
      story.kind,
      ...story.searchTerms ?? [],
      ...(story.kind === 'constellation'
        ? [story.iau, ...story.brightestStars.map((star) => star.name)]
        : [...story.constellations, ...story.stars.map((star) => star.name)]),
      ...story.stories.flatMap((section) => [section.culture, section.title ?? '', section.text])
    ].join(' ').toLowerCase()
    return words.every((word) => haystack.includes(word))
  })
}

export function findConstellationStory(iau: string): ConstellationStory | undefined {
  return CONSTELLATION_STORIES.find((story) => story.iau.toLowerCase() === iau.toLowerCase())
}

// Matches an engine selection (which reports designations like "HIP 65474")
// to a story, so the object panel can offer the folklore.
export function findStoryForSelection(designation: string | null, objectName: string | null): SkyStory | undefined {
  if (designation) {
    const hipMatch = designation.match(/^HIP\s+(\d+)$/i)
    if (hipMatch) return STORIES_BY_HIP.get(Number(hipMatch[1]))
  }
  if (objectName) {
    const byName = STORIES_BY_STAR_NAME.get(objectName.toLowerCase())
    if (byName) return byName
    // Bayer/Flamsteed engine names arrive as "* bet01 Cyg".
    const stripped = objectName.toLowerCase().replace(/^\*\s+/, '').trim()
    return STAR_STORIES_BY_ENGINE_NAME.get(stripped)
  }
  return undefined
}
