# OpenNGC Data Pin

Spica generates its deep-sky catalog from the OpenNGC database.

- Repository: https://github.com/mattiaverga/OpenNGC
- Pinned commit: `da90466031b0372c896588b85be6016c617e205b`
  ("Fix data for NGC4526", 2026-07-26)
- License: CC BY-SA 4.0 (full text in `CC-BY-SA-4.0.txt`)
- Files:
  - `NGC.csv` — SHA-256 `be150bdaa1997dacbcb39f303074403edec7a953b589b36d5f1c4522c0cc6fae`
  - `addendum.csv` — SHA-256 `1d8f0914e643ada325a5a94d88d8fefad6a4937a2f77cc34f21483af22b11983`
- Generator: `scripts/make-dso.mjs`, which overwrites
  `vendor/stellarium-web-engine/apps/test-skydata/dso/`.

The generated survey records the combined input hash in its `properties` file.
Regenerate with `node scripts/make-dso.mjs` after replacing the pinned CSV
files; run `node scripts/make-dso.mjs --check` for a dry run.

Spica's deep-sky survey is a share-alike adaptation: it retains the CC BY-SA
4.0 terms of the OpenNGC data and is not relicensed under Spica's AGPL.
Attribution is in `THIRD_PARTY_NOTICES.md`.
