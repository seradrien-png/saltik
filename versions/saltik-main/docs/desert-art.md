# Red desert / C-07 — native artwork

Reference supplied by user: vivid red dunes, cobalt sky, colossal skull/ribs/hand and rusted C-07 at distance. No new character art; all three current Saltiks retained.

- `dist/assets/desert-red-vista.png`: generated from supplied reference, 2172×724, original generated file `/workspace/generated_images/exec-9887d5c8-ffa1-4822-a960-6d0801895b70.png`.
- `dist/assets/desert-c07-interior.png`: companion industrial excavation hall, 2172×724, `/workspace/generated_images/exec-67e3ee98-66dc-4a25-ba36-8beda651049a.png`.
- `dist/assets/desert-structures.png`: 1536×1024 RGBA atlas, `/workspace/generated_images/exec-44da7401-dd36-4498-a501-c2a0b75c29c8.png`. Four768×512cells: excavation foundation/ramp, service arch, fossil/redrocks, pipe/pressurevessel. Loader bakes opaque silhouettes; no translucent architecture.

`desert-layout.js` owns track samples, perspective and physical floor/deck/ramp registration. Excavation ramp native foot[60,454], deck[374,213]→[735,213]; world draw and walkable route share one transform. Service arch has no invented ramp to ground, stays behind travel corridor. Foreground fossil/machine cutouts occlude briefly as opaque objects.

The whole exterior panorama is contain-fit at native3:1, with cinemascope bars when necessary rather than distortion or hidden gate. Depth scale1→.28 is reversible; shadow and body share the projected footprint. Interior uses a single deep opaque hall plate with near architecture, native illustrations, floor material sampled from the same hall and native circular gate silhouettes. The open final gate shows the exterior through an opaque cutout.
