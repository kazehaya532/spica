# Spica

Spica is a client-side astronomy guide for learning the night sky. It combines a location-aware 360-degree star map with lessons, object profiles, and short knowledge checks.

## Features

- Interactive Three.js 360-degree star map with drag, zoom, keyboard, fullscreen, search, and time controls
- Dense HYG Database v4 star field through visual magnitude 10.5
- All 88 IAU constellation figures with original Spica-rendered line art
- Optional atmosphere, horizon rim, azimuthal/equatorial grids, deep-sky objects, red night mode, and zodiac focus
- Planet visibility and stargazing targets calculated for the selected observer location
- Device orientation support when explicitly enabled on a compatible secure-context device
- Beginner-friendly astronomy lessons, object profiles, and quizzes

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Commands

```bash
npm run build
npm run lint
npm test
```

## Project Layout

- `src/` application code, astronomy calculations, content, and generated display data
- `scripts/` reproducible data-generation scripts
- `DESIGN.md` visual design system
- `PRODUCT.md` product scope and constraints

## Data And Attribution

- HYG Database v4, Astronexus, CC BY-SA 4.0
- Astronomy Engine, Donald G. Cross, MIT License
- Three.js, MIT License
- Stellarium Web Engine western sky-culture constellation references, AGPL-3.0; Spica does not ship Stellarium code or illustration assets
- Lucide icons, ISC License

See the in-app Credits page for details and source links.

## Deployment

The production output is generated in `dist/` by `npm run build`. The application is static and can be deployed to any host that serves a single-page application fallback for client-side routes.
