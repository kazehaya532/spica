# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React, TypeScript, and Vite. The interactive sky is rendered by Stellarium Web Engine compiled to JavaScript and WebAssembly.

## Users

Spica is primarily for learners and casual stargazers who want to identify and understand what is visible from their location. Amateur observers are a secondary audience and need accurate coordinates, visibility information, and time controls without the interface becoming expert-only.

## Product Purpose

Spica is an installable browser planetarium. It renders a realistic, location- and time-correct sky and lets people explore stars, constellations, planets, the Moon, the Milky Way, and prominent deep-sky objects. Success means a first-time user can orient the sky, find an object, understand its basic observing data, and move through time without prior astronomy software experience.

## Positioning

Spica combines a scientifically grounded sky renderer with a learner-first observation workflow. The sky remains the primary interface while controls explain rather than expose the engine's internal model.

## Operating Context

People use Spica outdoors at night, indoors while planning an observation, and in casual learning settings. The product must support mouse, keyboard, touch, changing connectivity, denied geolocation, and low-light use.

## Capabilities and Constraints

- Responsive installable PWA for modern desktop and mobile browsers.
- Realistic spherical sky rendered by Stellarium Web Engine.
- Current or user-selected time and observer location.
- Search, selection, centering, tracking, coordinates, visibility, layer controls, and time controls.
- Hybrid offline operation: application and essential data can be cached; extended catalogs and imagery require a connection.
- Stellarium Web Engine is used under AGPL-3.0. Spica and the combined distributed work will be published under AGPL-3.0 unless a commercial engine license is obtained.
- Data and visual assets require independent provenance and license review.
- The first release excludes telescope hardware control, plugins and scripting, dome projection, ocular simulation, full Gaia deep zoom, satellites, comets, eclipses, and full offline high-resolution catalogs.
- English is the first-release interface language; user-facing strings remain structured for later translation.

## Brand Commitments

The product name is Spica. Its identity and interface must be original and must not use Stellarium trademarks, logos, or imply endorsement. Stellarium attribution appears only where legally and factually appropriate.

Spica intentionally follows the familiar modern planetarium interaction model. Stellarium Web, Star Walk 2, Sky Guide, and SkySafari set the usability and finish bar, but their layouts, artwork, icons, and branding are not source material to copy.

## Evidence on Hand

Anemoi game logo images were supplied as visual references only and are not
bundled into the application. Spica uses an original windmill mark rather than
copying that proprietary wordmark or symbol.
No proprietary astronomy content, customer claims, or testimonials have been
supplied. Demonstration and catalog content must come from documented,
redistributable sources and must not be presented as Spica-owned research.

## Product Principles

- Keep the sky, not application chrome, as the dominant experience.
- Make accurate astronomy understandable without hiding useful observing detail.
- Ask permission before using location and keep preferences on the device.
- Degrade honestly when WebGL, network data, or location services are unavailable.
- Treat source availability, attribution, and data provenance as shipping requirements.

## Accessibility & Inclusion

All controls and selected-object information must have semantic, keyboard-operable equivalents outside the canvas. Maintain visible focus, strong contrast, reduced-motion support, large touch targets, and a clear fallback when the 3D renderer is unavailable.
