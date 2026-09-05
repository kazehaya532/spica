# Spica Modifications

Spica distributes this pinned copy of Stellarium Web Engine under AGPL-3.0.

Upstream revision: `e7201246bdf7289c50a3ec59e98f69f0f9383b05`

## 2026-09-05

- Corrected the canvas resize comparison to use physical pixel dimensions.
  Without this correction, displays with a device pixel ratio above one reset
  the WebGL canvas on every animation frame.
- Run the asset-generation script through the active Python interpreter so the
  engine can be built reproducibly on Windows as well as Unix-like systems.
- Pass the active process PATH into SCons command environments so Emscripten's
  Python and Node launchers remain discoverable during Windows builds.
- Select GCC-style SCons builders explicitly. Windows otherwise chooses MSVC
  command flags before the Emscripten compiler replaces the executable.
- Expose the engine's existing Hipparcos lookup to JavaScript so named bright
  stars can load their catalog tile directly instead of relying on a full-sky
  asynchronous designation scan.
