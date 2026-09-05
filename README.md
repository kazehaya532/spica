# Spica

Spica is an installable, learner-focused browser planetarium built with React,
TypeScript, Vite, and Stellarium Web Engine.

The initial view advances to the next astronomical night for the selected
observer location, matching Stellarium Web's `-13°` solar-altitude threshold.
The Tonight control restores that view after exploring another time; red-light
mode is a separate display treatment and never changes simulation time.

## Requirements

- Node.js 24 or a current supported Node.js release

The repository includes the browser engine artifacts at
`vendor/stellarium-web-engine/build/stellarium-web-engine.{js,wasm}`. The engine
is pinned to commit
`e7201246bdf7289c50a3ec59e98f69f0f9383b05`. Local build notes are recorded in
`vendor/stellarium-web-engine/SPICA-MODIFICATIONS.md`.

## Development

```sh
npm install
npm run dev
```

`predev` and `prebuild` run `scripts/prepare-assets.mjs`. The script copies the
compiled engine, label fonts, and essential development sky data into generated
folders under `public/`. Those generated files are intentionally ignored by
Git; their corresponding source and engine artifacts remain in
`vendor/stellarium-web-engine/`.

## Verification

```sh
npm test
npm run test:e2e
npm run build
```

The browser suite covers Chromium desktop and a mobile viewport. It starts the
actual WebAssembly renderer rather than replacing it with a canvas mock.

## Offline Model

The PWA precaches the application shell, engine JavaScript/WASM, and renderer
fonts. Essential catalog tiles are cached on first use with a separate
cache-first policy. This keeps installation bounded while allowing previously
viewed sky data to remain available when connectivity changes.

The bundled offline star survey covers the all-sky bright catalog through
visual magnitude 7. Named targets use direct Hipparcos lookup with bounded
retry while their catalog tile loads. Full Gaia deep zoom remains outside the
first-release scope.

## Licensing And Deployment

Spica is licensed under AGPL-3.0-or-later because it distributes Stellarium Web
Engine under AGPL-3.0. Read `LICENSE`, `THIRD_PARTY_NOTICES.md`, and `PRODUCT.md`
before deployment.

Complete corresponding Spica source is published at
https://github.com/kazehaya532/spica. A public deployment still requires the
per-source sky-data redistribution review documented in
`THIRD_PARTY_NOTICES.md`.
