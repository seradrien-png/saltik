# Feral Steel — Saltik Striker and ancient wreck refonte

The user authorized this refonte and continued implementation. The parent coordinates assets, final browser review and publication. This document defines implementation boundaries for that existing authorization; the integration worker waits for the parent's contract review before changing runtime code. Baseline: `8f41ff1497616e1ab442c5d90bb18e74a90d592e`.

## Required result

- Replace the player with the **SALTIK, model STRIKER**: angular orange/ivory armor over a charcoal mechanical shell, **two blue-cyan eyes**, four articulated spider legs with wheel feet and a roof turret carrying a large MIRV barrel beside a smaller coaxial rapid-fire barrel. Two box-shaped multicell missile pods attach to the cabin sides; the side pods must not become tall roof racks.
- Show real right → front quarter → front → opposite quarter → left directional artwork over approximately 0.60 seconds. Movement responds immediately; body orientation and weapon readiness follow the turn.
- PLAN remains a temporary evasion, with 1.15-second duration and 3.6-second recharge. Its feet travel on a visible rear dirt path at full body scale. It must retain the actual jump height and cross to/from that path smoothly.
- Retain the existing canyon art and add an immense ancient crashed off-white/orange spaceship, partly buried and overgrown across the canyon. Retain eight depth planes.
- Some foreground sections contain two or three playable paths cut through full earth/rock masses. Their floor crowns, substantial bodies and recessed openings must read as terrain rather than floating shelves.
- The playable ground must match the existing canyon background's material detail, lighting and organic style. The generated `ground-surface` artwork is a required material asset for the terrain pass; visible dirt, broken rock, moss and vegetation must remain detailed along the exact playable contours.
- Ground enemies comprise a slender white/orange humanoid robot, an olive armored human soldier and a somewhat larger white/orange bulky biped robot. Preserve drones and the final boss.
- Preserve the original left directional pad, right weapon controls, three weapon behaviors, three naturally jumpable tiers, destructible obstacles, approximately 90-second ordinary campaign and absence of a countdown.

## Ownership

| Worker | Runtime files | Tests |
| --- | --- | --- |
| Player art | `src/tachikoma-art.js`, `src/tachikoma-pose.js` | `tests/tachikoma-art.test.js`, `tests/tachikoma-pose.test.js` |
| World/scenery | `src/world.js`, `src/scenery.js` | `tests/natural-world.test.js`, new `tests/depth-world.test.js` |
| Integration | `src/engine.js`, `src/renderer.js`, new `src/tachikoma-turn.js`, new `src/enemy-art.js`, one queue-clearing hook in `src/main.js` | `tests/engine.test.js`, `tests/routes.test.js`, `tests/tachikoma-combat.test.js`, `tests/art-loading.test.js`, `tests/campaign.test.js`, new `tests/tachikoma-turn.test.js`, new `tests/enemy-art.test.js` |
| Parent | Generated assets and their measured manifest; final QA and publication | Browser campaigns and screenshot review |

No worker changes another worker's files, generated assets, `dist`, deployment metadata or git history. The unused tank artwork module is outside scope.

## Grounded depth contract

`world.js` exports:

```js
export const DEPTH_LANE_RISE = 38;
export function projectDepthPoint(x, y, depth = 0) // -> {x, y}
export function projectPlayer(p) // -> {x, y, groundY, depth, scale: 1}
```

Depth is clamped to 0..1; projection preserves x and returns `y - DEPTH_LANE_RISE * depth`. The engine stores `p.supportY`, the canonical front-lane height of the terrain, route or obstacle presently beneath the player. `projectPlayer` applies that same projection to `p.y` and `p.supportY`; therefore `groundY - y === supportY - p.y` through a jump. Default support for geometry-only callers is `p.supportY ?? p.y`.

Scenery renders each traversable crown as a continuous dirt terrace between its depth=0 and depth=1 contours. The rear crown, connecting top surface and earth below it are visible; the rear path is not a detached line. The renderer and pose must not introduce another position, transparency or perspective scale for PLAN. The engine retains canonical coordinates for movement and existing collision calculations, using `projectPlayer` for visible event/attachment positions. Lateral solids occupy the width of the terrace; their drawn volume must communicate the same footprint. Obstacle-top support uses the same projection.

The existing eased entry/exit envelope remains: 0.18-second entry, 0.20-second return, total 1.15 seconds. No horizontal teleport occurs, no floor identity changes because of PLAN, and the player's existing airborne displacement remains unchanged. Shift still grants immunity and locks all weapons. Entering PLAN discards delayed weapon requests.

## Size, headroom and jumping

Set `PLAYER_SCALE=1.0`, retaining `PIXEL_SCALE=.30`; use measured feet lines and mounting points supplied with the new Striker assets. The expected full standing silhouette, including the roof turret, is approximately 99 world units. Author adjacent path gaps within **128..148** world units and load-bearing roof thickness at most **22** units over traversable openings, leaving at least **106** units of unobstructed standing headroom. All supported silhouettes must fit their openings, including the rear lane. Open approach regions preserve the existing jump-through route model.

Use jump launch velocity `-720` and gravity `1550`, giving an apex of approximately 167.2 units. Drive and crouch speeds remain 230 and 100. Tests replace old 65..112 gap assertions with explicit headroom and reachable-apex assertions. Floor profiles remain individually authored, retain six broad sections, and keep enemies, repairs and obstacles anchored to `surfaceHeight`.

Effective weapon speeds and radii remain their baseline values despite the changed body scale: primary speed 1025; MIRV launch `(325 * dir, -600)` before terrain tilt, MIRV gravity 125; five child grenade x speeds `(-81.25 + i*125) * dir`, y speeds `93.75 + i*15`, gravity 775 and splash 147.5. Existing damage, lifetimes, cadence and cooldowns remain unchanged. The smaller roof-turret coaxial muzzle supplies rapid fire and the larger barrel supplies MIRV; compatibility geometry names remain `arm` and `cannon`. Homing salvo remains three guided missiles with the current guidance. Its three cell mouths are distributed across the **two lateral box pods**; do not draw replacement tubes or roof missile racks above the new artwork.

The shared vertical world-camera offset keeps the complete measured Striker silhouette, including its roof turret, at least 85 screen units from the upper edge during a top-route jump. The offset applies consistently to scenery, entities and effects; it must not change physical positions or control layout.

## Turning and delayed shots

The integration-owned `tachikoma-turn.js` exports:

```js
export const TURN_DURATION = .60;
export function createTachikomaTurn(dir = 1) // -> {yaw, targetYaw, active}
export function advanceTachikomaTurn(turn, dir, dt) // mutates and returns turn
export function tachikomaTurnFrame(turn) // -> integer 0..7
```

`yaw=0` faces right and `yaw=Math.PI` faces left. Cells 0..7 are right, front quarter, front, opposite front quarter, left, rear quarter, rear and opposite rear quarter. Full reversals use the front arc by default. Advancing moves continuously at `Math.PI / TURN_DURATION` radians per second toward the current requested side; retargeting starts from the current yaw. Frame selection chooses the nearest octant. All five front-arc poses must be observed during an ordinary 60 Hz full reversal in both directions, including rendering intervals that batch eight fixed steps. Each intermediate octant lasts 0.15 seconds, exceeding that approximately 0.133-second render interval; the cabin is still turning at 0.30 seconds and settles at 0.60 seconds. The parent chose this duration after real-browser captures skipped intermediate views at the original 0.30-second speed. Turn cells are authored directions and are never horizontally mirrored.

The engine initializes `p.turn=null` and lazily creates it from the previous `p.dir` before applying a requested movement direction. `p.dir` and movement respond immediately. Geometry-only callers without a turn retain the direction supplied in `p.dir`. The pose exposes the current atlas/frame plus the same shared world-space `arm`, `cannon`, `cabinTubes` and `tubes` mounts used by combat. Stable action cells are walk 0..3, idle 4, crouch 5, jump 6 and damage 7; active directional turns take the direction atlas. The asset worker measures the mounts and feet for both atlases.

Engine-owned `p.weaponQueue={fire:false,missile:false,homing:false}` retains one rising-edge request per ready weapon received during a turn. A released quick tap still fires exactly once when the body settles. Held weapons resume normal cadence when settled; retargeting cannot fire early or duplicate a request. A failed no-target homing attempt consumes that queued request without using recharge. Requests during PLAN are discarded. Export `clearPlayerWeaponQueue(p)` and call it from `main.js`'s existing `clearInput` to discard turn queues and edge history on pause, blur, orientation pause and restart. No change to `input.js` is needed: it already preserves sub-frame weapon taps.

## Enemy and asset integration

`enemy-art.js` owns enemy atlas crops, measured feet, uniform scale and frame choice. Existing `walker` maps to slender robot, new `soldier` to olive human, existing `turret` to bulky biped; drone, crate and boss paths remain unchanged. Soldiers share walker health/movement/cadence, and replace the second walker slot in the existing five-entry schedule. This adds all three silhouettes without adding encounter count or changing encounter positions. Heavy robots retain turret health and cadence. Their drawn size is moderately larger than the other ground enemies; bounds and muzzle placement track their measured silhouettes.

Asset keys remain `tachikoma` and `tachikoma-turn` for compatibility even though all visible vehicle names are Saltik Striker; module filenames and exported APIs also remain unchanged. Action and turn sheets are both 1536x1024 and 4x2 and are remeasured against the new two-eye/turret/lateral-pod artwork. The 1536x1024 `enemies` sheet is 3x4 with columns robot/soldier/heavy and rows idle/walk A/walk B/fire. Both `wreck` and required `ground-surface` art are 2172x724; the ground material is RGB. Load-time validation checks these exact dimensions. Workers use measured opaque crops rather than assuming equal painted margins. New headline assets are required at load time, with meaningful errors instead of silently missing player, turns, cast, wreck or ground material. Existing optional canyon details retain their fallbacks. Preserve the canyon, drones and boss assets.

## Acceptance

Behavior checks cover continuous turns and reversals, one-shot released queues, pause/PLAN cancellation, full-scale grounded PLAN on every tier/obstacle and during a jump, standing headroom, real ground→middle→top jumps, exact drawn/launch mount agreement, all three enemy classes, original weapon semantics and both complete campaigns. Parent browser review must inspect both reversal directions, PLAN entry/hold/return, raised-route jumps, recessed two/three-level masses and the immense overgrown wreck. The ordinary and all-six-upper-section campaigns must still win within 75..110 simulated seconds using normal controls and no teleportation.
