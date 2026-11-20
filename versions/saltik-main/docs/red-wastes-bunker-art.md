# Buried Red Wastes bunker

`dist/assets/red-wastes-bunker.png` is an additive RGBA scenery cutout generated on 2026-11-20 with the image generation tool. Visual references were the existing `red-wastes-skull.png` and `red-wastes-sand-plane.png`; those originals remain unchanged. Original generated file: `/workspace/generated_images/exec-bd3c5d77-abbb-4a78-a619-c943d443cdd5.png`.

The 2172×724 image preserves warm bone concrete, orange sand, near-black ink stippling, connected dune access slopes, and opaque bunker walls. It introduces no machinery, bridges, glow, translucent building layers, or character imagery. Asset size is approximately 1.9 MB.

`src/red-wastes-world.js` crops transparent padding with source rectangle `(0,160,2172,515)` while drawing, then aligns the bunker roof to the shared native support coordinates in `red-wastes-layout.js`. The original connected sand slopes remain intact; no rectangular platform strips or ramp slabs cover the painting. An 18px vertical registration lift places its painted terrace and roof near the native walking supports. Both bunker instances use the same cutout.

The eye passage reuses the original skull at its natural aspect ratio. `drawRedWastesFrontStructures` draws an opaque lower orbital rim after native actors, while the main skull and dark eye are drawn before actors. The route follows the eye opening at 400 units above the local sand ground. There is no replacement character physics or scale adjustment in the scenery renderer.

Validation: JavaScript syntax check; draw smoke check across six camera positions covering both bunkers, eye passage, distant skulls, and route boundaries, with all canvas numeric arguments finite. Browser registration and gameplay checks are performed after integration.
