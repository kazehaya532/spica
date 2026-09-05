# Third-Party Notices

## Stellarium Web Engine

Spica uses Stellarium Web Engine, Copyright (c) Stellarium Labs SRL and
contributors, under the GNU Affero General Public License version 3.

Upstream source: https://github.com/Stellarium/stellarium-web-engine

Revision: `e7201246bdf7289c50a3ec59e98f69f0f9383b05`

Local modifications are recorded in
`vendor/stellarium-web-engine/SPICA-MODIFICATIONS.md`. The engine is provided
without warranty. The complete AGPL-3.0 text is included at
`vendor/stellarium-web-engine/LICENSE-AGPL-3.0.txt`.

## Sky Data

The development build copies essential sample data from the pinned Stellarium
Web Engine source tree. It includes the following upstream acknowledgements:

- Stars: ESA Gaia DR2 and DPAC; ESA Hipparcos/Tycho; Bright Star Catalogue,
  5th Revised Edition (Hoffleit+, 1991).
- Deep-sky objects: HyperLeda, SIMBAD/CDS, OpenNGC, Caldwell catalogue, and
  Wikipedia descriptions.
- Sun and Moon imagery: NASA/JPL public-domain imagery, repackaged upstream.
- Constellation lines: Fabien Chereau.
- Milky Way sample survey: distributed with the pinned engine test data.

The detailed upstream credits are in
`vendor/stellarium-web-engine/apps/web-frontend/src/components/data-credits-dialog.vue`.
These development data packs still require a final per-source redistribution
and integrity review before public production deployment. No remote catalog or
imagery URL is treated as redistribution permission.

## Fonts and Icons

- Manrope, Copyright 2019 The Manrope Project Authors, licensed under the SIL
  Open Font License 1.1.
- Newsreader, Copyright 2020 The Newsreader Project Authors, licensed under the
  SIL Open Font License 1.1.
- Roboto engine label fonts, Copyright 2011 Google Inc., licensed under the
  Apache License 2.0 and supplied by the pinned engine source tree.
- Lucide icons, Copyright Lucide Contributors, licensed under ISC; portions
  derived from Feather are Copyright Cole Bemis under MIT.

Complete dependency license texts remain included with their source packages
under `node_modules` after installation.
