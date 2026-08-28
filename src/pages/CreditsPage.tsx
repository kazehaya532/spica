import { Code2, Database, ExternalLink, Scale } from 'lucide-react'

const credits = [
  {
    title: 'Astronomy Engine',
    detail: 'Sun, Moon, and planet ephemerides; horizon conversion; illumination; elongation; and rise/set searches.',
    source: 'Donald G. Cross · MIT License',
    href: 'https://github.com/cosinekitty/astronomy',
  },
  {
    title: 'HYG Database v4',
    detail: 'The background field uses real stars through visual magnitude 10.5, with J2000 positions, apparent magnitude, and B−V color index. Spica filters and quantizes the source data for web rendering.',
    source: 'Astronexus HYG Database v4 · CC BY-SA 4.0',
    href: 'https://github.com/astronexus/HYG-Database',
  },
  {
    title: 'Three.js',
    detail: 'WebGL scene rendering, spherical projection, input raycasting, and fullscreen sky presentation.',
    source: 'Three.js authors · MIT License',
    href: 'https://threejs.org/',
  },
  {
    title: 'Constellation references',
    detail: 'The 88 IAU constellation line figures use factual star connections and HIP anchors from the western sky-culture reference. Spica draws its own original line-art overlays from those connections and does not ship the reference illustrations.',
    source: 'Stellarium Web Engine western sky culture · AGPL-3.0 reference data',
    href: 'https://github.com/Stellarium/stellarium-web-engine',
  },
  {
    title: 'Interface assets',
    detail: 'Lucide provides interface icons. Geologica and Spline Sans Mono provide the typography through Fontsource.',
    source: 'Lucide · ISC; fonts · SIL Open Font License',
    href: 'https://lucide.dev/',
  },
]

export default function CreditsPage() {
  return (
    <main className="credits-page paper-section">
      <header className="credits-intro">
        <p className="eyebrow dark-label"><Database size={15} /> Data &amp; credits</p>
        <h1>A sky chart should show its workings.</h1>
        <p>Spica separates calculated positions from authored teaching layers. Here is where the map’s data, software, and limitations come from.</p>
      </header>

      <section className="credit-ledger" aria-label="Data and software credits">
        {credits.map((credit, index) => (
          <article key={credit.title}>
            <span className="credit-index">{String(index + 1).padStart(2, '0')}</span>
            <div><h2>{credit.title}</h2><p>{credit.detail}</p><small>{credit.source}</small></div>
            <a href={credit.href} target="_blank" rel="noreferrer" aria-label={`Visit ${credit.title} source`}><ExternalLink size={18} /></a>
          </article>
        ))}
      </section>

      <section className="credits-notes">
        <article><Scale size={21} /><h2>Accuracy</h2><p>Planet calculations are suitable for educational observing plans. The stellar field is magnitude-limited and deep-sky objects use a compact teaching catalog. Refraction near the horizon, terrain, buildings, weather, light pollution, and device compass error are not fully modeled.</p></article>
        <article><Code2 size={21} /><h2>Open source</h2><p>Spica does not ship Stellarium code or illustration assets. Its renderer and constellation artwork are independent Three.js and Canvas implementations. The constellation reference data is disclosed above under its source license.</p></article>
      </section>
    </main>
  )
}
