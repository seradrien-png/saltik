# Dragon Velvet Striker — 14 November 2026

Replaces only the playable Striker Dragon costume in level 3 (Jardins de velours), using the user's emerald velvet, cream, gold embroidery, red scaled panels and tassels reference. Other Dragon missions, default Striker, BT and Gatling are preserved.

Two additive transparent assets:
- `dragon-velvet-body.png`: registered 724×724 body, foot anchor and existing 126px gameplay height unchanged.
- `dragon-velvet-turn.png`: 2172×724 atlas with separately drawn right-quarter, front and left-quarter views, registered to existing native turn anchors.

Artwork was generated from the attached reference, then only cropped/resampled and placed into the established native atlas frames. No old sprite was overwritten. Original generated drawings are retained under `/workspace/generated_images/exec-995121b8-5e5f-443e-930a-6d11f85a0ae3.png` and `exec-30bb6f8a-75d0-4294-93aa-d9e1ba964839.png`.

`prepareModernStriker` selects these assets exclusively for level3/dragon. Existing articulated rig, weapon emission sockets, jump, crouch, cannon elevation/recoil, ammunition, audio, physics and damage are unchanged. The level3 Dragon menu portrait is baked from the actual new renderer; all nineteen other portraits remain byte-identical.

Validation: full suite 838 tests passes; original tracked illustration files unchanged. See GitHub release report for final browser and publication results.

The new illustration has its own local draw masks for the right suspension, right pincer and cannon/coax boundary. The native socket/physics geometry is not changed; these image-specific masks avoid cutout gaps, wheel fragments while crouching and moving a sliver of the shoulder decoration with the raised cannon. Other skins keep the original masks.
