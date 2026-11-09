# Saltik melee and canyon expedition refinement

## Intent

Make close contact visibly produce a blow from one unarmed front arm, give the accepted three-route expedition distinct situations, and make the Saltik's painted wheels and legs follow the actual terrain. Saltik names the vehicle/species; Striker names its assault class. Preserve its established orange/ivory body, two cyan optics, roof main/coax guns and lateral missile pods.

The user already authorized this refinement and prefers autonomous execution. Root approves routine implementation contracts and owns final review, browser verification and publication. This document records engineering choices within that scope; it does not introduce another user approval round.

## Approaches and choice

- A generic damage pulse or procedural replacement arm would be cheap, but would not satisfy the requested single-arm action in the existing art style.
- **Chosen:** a native six-pose melee sheet, a short target-locked contact state machine, six authored canyon scenarios, measured destructible artwork, and support computed from the real wheelbase. This builds on the current renderer, world coordinates and campaign.
- A full skeletal character/physics rewrite could model every limb, but adds substantial regression risk to the accepted design and controls. Native painted distal parts with bounded suspension are sufficient here.

## Invariants

- Three independently controlled weapons, existing keyboard/touch controls, original ballistics and recharges; no added melee button.
- Genuine 0.60-second native perspective turns; melee cancels during a turn.
- PLAN remains grounded, shifts by precisely 38 world units, keeps scale 1, locks weapons/melee and uses the near-roof occlusion mask.
- All six upper sections remain reachable by ordinary jumps, with ground plus two upper routes, at least 107 units of standing headroom and adjacent crown rises within 128–148 units.
- Preserve the immense wreck, drones, final boss, no countdown, and an ordinary forward combat run of 75–110 seconds with positive HP.
- Keep the existing eight scene planes, world-space feet/collision positions and finished painterly visual style. No dist/build/publication work in worker tasks.

## Automatic one-arm melee

When a live target enters the forward fist's measured contact region, acquire the nearest intersecting target. Both acquisition and impact use target AABBs intersected with the **actual extended fist region**, including vertical reach. Do not use a global center-distance attack. Enemies, destructible cover and the boss are eligible only when the painted hand can reach them; the boss's existing 235-unit movement barrier consequently does not grant a remote punch.

Builder defaults: 0.08 s windup, 0.12 s impact, 0.35 s recovery, 0.70 s recharge measured from acquisition, 6 damage, one hit on one acquired target per strike. The six sheet cells are grounded windup/impact/recovery, then airborne windup/impact/recovery. The other arm remains at rest; roof weapons may fire independently.

Lock the acquired target for the strike. Recheck living status and AABB overlap at impact; a departing or destroyed target causes a miss, never a remote hit or automatic retarget. A living solid obstacle intersecting the arm-root-to-fist segment before the target blocks that hit. Apply a single-hit flag before damage, even if the impact spans several frames. Surviving ground enemies, including stationary heavy units, receive a modest 18-unit forward shove and are immediately reanchored to their platform/terrain; clamp a shove at platform edges. Obstacles and the boss do not slide. During windup, suppress body-contact damage only from that target so the automatic windup cannot cause an unavoidable first collision. Projectiles and other enemies remain harmful. PLAN, a body turn, death or leaving playing state prevents/cancels attacks; pause freezes simulation. Jumping retains the strike only while genuine vertical contact remains possible.

Shared player state is `p.melee = {phase, elapsed, cooldown, targetKey, hit}`. `phase` is `idle`, `windup`, `impact` or `recovery`; `targetKey` namespaces obstacle/enemy/boss IDs. The engine owns state transitions and damage; pose/art only consume it. Emit `melee` on acquisition and `melee-hit` at a real hit, positioned at the hand; renderer/audio consume these effects. Counters are `stats.meleeSwings` for acquisitions and `stats.meleeHits` for successful resolutions.

## World and destructibles

Six scenario families replace repeated contour bands: rooted talus, wreck/hull passages, wet waterfall gorge, overgrown concrete checkpoint, scree/escarpment, and the final approach. Their route lengths, entrances, crown shapes, exposed cross sections, material and local scenery must differ; palettes alone do not count. Keep continuous traversable floors and clear first-section jump approaches. The large existing wreck remains the landmark.

Cover uses four recognizable authored types: `rock`, `barricade`, `checkpoint`, `hull`. Each has stable ID, floor/tier/platform anchors, collision width/height, HP and damage state. The new atlas has four columns by two rows, 384×512 cells: intact types on top, damaged counterparts below. Artwork is measured to the physical feet and hull, with no stretched placeholder rectangles. Cover rests on the same height function as driving and has real projectile and movement collision. Place metal deliberately at roadblocks/checkpoints, rock with talus, and hull fragments near the wreck. Checkpoints receive nearby scheduled guards by repositioning/reusing existing encounters; preserve the 45-entry schedule and enemy classes.

## Shared interfaces and ownership

### World owner

Owns `src/world.js`, `src/scenery.js`, new `src/obstacle-art.js`, and world/scenery/obstacle tests. Produces:

- Existing world exports remain compatible.
- `createObstacles(platforms)` returns the authored obstacle array, replacing the engine-local generator.
- `authorCheckpointGuards(schedule, obstacles, platforms)` returns a sorted 45-entry schedule with existing IDs/types/counts preserved and selected ground/upper guards moved to checkpoint approaches. Set `tier` and `platformId` consistently.
- `supportHeight(world, player, x)` returns a finite physical height on the player's current supporting surface, or `null` outside that surface. An active obstacle uses its real top and width; an active platform uses its actual crown and extent; ground uses `terrainHeight(x)`. For airborne players the grounding module should not plant contacts. No depth projection occurs here.
- `drawObstacle(context, images, obstacle, {camera=0, time=0}={})` draws the measured atlas, matching `w/h` and world floor anchoring, with intact/damaged selection and existing hit feedback. `obstacleGeometry(obstacle,{camera=0}={})` returns at least `{bounds, crop, feet}` for verification. Image key is `destructibles`.

### Grounding/art owner

Owns `src/tachikoma-pose.js`, `src/tachikoma-art.js`, new `src/support-pose.js`, and their pose/art/support tests. Produces:

- `computeSupportPose(player, sampleHeight, previous=null, dt=1/60)` returns `{tilt, heave, contacts, grounded}`. `sampleHeight(x)` uses world coordinates. Each contact is `{id,x,y,offset,grounded}`; IDs and nominal wheelbase are measured from the native sheet. `offset` is a bounded distal wheel/leg displacement after the body's best-fit support line. Use at most ±0.20 radians body pitch, ±6 units body heave and ±9 units distal adjustment. Reset/relax on jump or invalid support, keep turning and PLAN coherent, and never change physical `p.y`. Engine supplies optional `p.supportClearance` (nearest upper slab above the support floor, Infinity outdoors); reduce upward heave/pitch where the measured body envelope would consume this headroom.
- Engine stores that value on `p.supportPose` and copies its `tilt` to `p.tilt`. Geometry/art apply heave to body/mounts and actually reposition measured painted distal parts; the floor anchor stays exact. Without support state all existing geometry remains compatible.
- `tachikomaMeleeReach(player,time=0,{camera=0,scale=1}={})` returns `{origin, fist, radius, hitbox}` from the **extended-impact cell metadata**, in the same projected world transform used by drawing. `origin={x,y}` at the active arm root, `fist={x,y}`, `hitbox={x,y,w,h}`; radius follows the visible knuckle, capped at 12 world units. It must work even while idle so simulation can acquire contact. The geometry/art share the sheet measurement, scale, mirror, pitch and heave. PLAN acquisition is engine-disabled, so physical/front-lane melee never attacks across depth.
- `tachikomaGeometry()` selects `saltik-melee` and the correct one-arm pose while `p.melee.phase !== 'idle'`, unless PLAN/turn requires the established pose. Its measured weapon mounts, bounds and scale remain accurate. Image key is `saltik-melee`, a 1536×1024 sheet with three columns and two rows of 512×512 cells.

### Integration owner

Owns `src/engine.js`, `src/renderer.js`, `src/main.js`, `src/audio.js`, `index.html`, optional `src/melee-state.js`, integration tests and these docs. Consumes the preceding interfaces, removes the old procedural obstacle renderer, validates both new required images, schedules contact melee before body-contact damage, applies support after physical movement, and corrects menu/tutorial wording to vehicle **SALTIK**, **CLASSE STRIKER** and automatic contact strike.

Root owns generated assets and measurements, build/browser QA, source commit/push and publication to the existing private Site. Workers do not spawn agents, build, commit, push, publish or edit dist. Disjoint worker test files prevent conflicting edits; changes to another owner's API require an explicit message before edits.

## Verification and acceptance

Meaningful automated checks cover one-hit target locking, actual fist overlap in both directions/air, windup fairness, distant boss exclusion, PLAN/turn/pause cancellation, independent gun fire, finite state at invalid deltas, exact required image dimensions, real collision artwork, unique scenarios/checkpoint defenses, support on rising/falling/bumpy floors, support extent edges, and unchanged PLAN/turn/mount contracts. Keep both full campaign tests passing, including all six upper sections. Root then verifies desktop, phone landscape and tablet controls/visuals, actual melee, terrain support and a fresh full browser campaign before rebuilding and publishing the same private audience.
