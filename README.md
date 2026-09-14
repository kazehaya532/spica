# Spica

Spica is an installable, learner-focused browser planetarium built with React,
TypeScript, Vite, and Stellarium Web Engine.

The initial view advances to the next astronomical night for the selected
observer location, matching Stellarium Web's `-13°` solar-altitude threshold.
The Tonight control restores that view after exploring another time; red-light
mode is a separate display treatment and never changes simulation time. When the
sky is already dark for the selected time, Tonight confirms this instead of
silently leaving the view unchanged.

## Features

- Location- and time-correct night sky rendered by the real Stellarium Web
  Engine (WebAssembly), with independent layer toggles for constellations, deep
  sky, Milky Way, landscape, atmosphere, and grid lines.
- Observer location picker: an interactive OpenFreeMap/MapLibre map, a
  draggable pin, browser GPS, and exact manual coordinate entry.
- OpenStreetMap-powered place search via Photon, with an Open-Meteo fallback and
  Copernicus-DEM terrain elevation for the selected point (detailed enough to
  resolve Indonesian kecamatan and desa).
- Observing conditions panel: accurate moon phase, illumination, altitude,
  azimuth, horizon status, and rise/set for the selected sky time, plus a
  modeled sky-darkness estimate and an opt-in hourly night-weather outlook.
- Installable offline PWA: precached app shell and engine with cache-first sky
  data and lightmap, and a manually-first location flow that still works
  offline.

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

## Observing Conditions

Open **Observing conditions** from the cloud-and-moon button to see moon phase
and a local estimate of sky darkness for the saved observer location. Lunar
phase, illumination, altitude, azimuth, horizon status, and rise/set events are
calculated by Stellarium Web Engine for the selected sky time and location. The
sky-darkness estimate is derived from the Falchi et al. (2016) modeled 2015
atlas. It reports an approximate Bortle class, zenith brightness, naked-eye
limit, and brightness relative to a natural sky. The compact map loads from
Spica itself, is cached after first use, and does not send coordinates anywhere.
It is a planning estimate rather than a measurement: current lighting, terrain,
LED adoption, and nearby obstructions can differ from the model.

The derived lightmap is distributed separately under CC BY-NC 4.0 and is not
relicensed under Spica's AGPL. Its source GeoTIFF is not stored in the
repository. See `public/lightmap/README.md` for the GFZ access workflow and reproducible generation
command and `THIRD_PARTY_NOTICES.md` for attribution and restrictions.

Select **Check night forecast** in the same panel to load hourly cloud cover,
precipitation probability, visibility, humidity, wind direction, speed, and
gusts from Open-Meteo. This explicit action sends the saved observer coordinates
to Open-Meteo. Opening the app and loading the local lightmap do not.

The forecast follows the selected sky date: daytime selects the upcoming
sunset-to-sunrise period, while times before sunrise select the preceding night.
Weather times use the observing location's timezone; the sky time control uses
the device's timezone. UNIX timestamps preserve the actual instants across
midnight and daylight-saving changes. Missing dates or polar sunrise/sunset
events are reported as unavailable instead of substituting another night.

Spica highlights the lowest-cloud/precipitation two-hour window among consecutive
favorable hours. The panel explains the thresholds. This is weather guidance,
including twilight, not an astronomical seeing forecast; its score does not
incorporate the separately displayed moonlight or modeled sky darkness.
Forecasts stay in memory until the location changes or the page reloads, with
retrieval time shown and manual refresh available.
No background requests or service-worker weather caching are used.

## Choosing A Location

Opening **Observer location** loads an interactive MapLibre map from OpenFreeMap.
Viewed map regions and your IP address are sent to OpenFreeMap. Place searches
send the entered query and IP address to Photon, an OpenStreetMap-powered search
service hosted by Komoot. If Photon has no usable result or is unavailable, the
same query is sent to Open-Meteo's geocoding service. Selecting a Photon result,
clicking the map, or dragging its pin sends coordinates and the user's IP address
to Open-Meteo's elevation service. These requests are not stored by Spica's
service worker. Browser geolocation, exact manual coordinates, and previously
saved locations remain available without place search; manual entry works
offline.

Map data © OpenStreetMap contributors, available under ODbL, using the
OpenMapTiles schema and OpenFreeMap. Provider attribution remains visible on the
map.

The direct, keyless API is for this non-commercial app. Commercial deployment
requires a suitable provider plan and integration. See `THIRD_PARTY_NOTICES.md`.

## Offline Model

The PWA precaches the application shell, engine JavaScript/WASM, and renderer
fonts. Essential catalog tiles and the compact light-pollution map are cached on
first use with separate cache-first policies. This keeps installation bounded
while allowing previously viewed sky data to remain available when connectivity
changes.

The bundled offline star survey covers the all-sky bright catalog through
visual magnitude 7. Named targets use direct Hipparcos lookup with bounded
retry while their catalog tile loads. Full Gaia deep zoom remains outside the
first-release scope.

## Licensing And Deployment

Spica is licensed under AGPL-3.0-or-later because it distributes Stellarium Web
Engine under AGPL-3.0. Read `LICENSE`, `THIRD_PARTY_NOTICES.md`, and `PRODUCT.md`
before deployment.

Complete corresponding Spica source is published at
https://github.com/kazehaya532/spica. Per-dataset redistribution terms and
provenance are documented in `THIRD_PARTY_NOTICES.md`.
