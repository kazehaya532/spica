# Spica Light-Pollution Map

`spica-lightmap.bin` is generated from the 2015 simulated zenith-radiance map
published with Falchi et al. (2016), DOI `10.5880/GFZ.1.4.2016.001`.

The source is licensed CC BY-NC 4.0 and requires a download-access request
through GFZ Data Services. It is not included in this repository. After
downloading the GeoTIFF through that workflow, generate the compact derivative
with:

```sh
npm run build:lightmap -- path/to/falchi-atlas.tif --source-doi=10.5880/GFZ.1.4.2016.001
```

The converter rejects non-geographic, multiband, and non-global rasters. Record
and review the downloaded file's SHA-256 checksum before generation; pin it
here when GFZ supplies the source so future builds can verify exact provenance.

The generated binary remains CC BY-NC 4.0, is not relicensed under Spica's
AGPL-3.0 license, and may only be used for non-commercial purposes. See
`THIRD_PARTY_NOTICES.md` at the repository root for the complete attribution.
