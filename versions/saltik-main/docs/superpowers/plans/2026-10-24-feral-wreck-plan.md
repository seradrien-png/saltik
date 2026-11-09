# Feral Steel Wreck Refonte Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. The parent has already assigned scoped workers; do not create further agents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the authorized Saltik Striker, grounded PLAN path, immense overgrown wreck, richly textured multi-level terrain and three ground enemy silhouettes in the existing playable canyon game.

**Architecture:** Keep the fixed-step engine, authored route profiles and eight-plane Canvas renderer. Share one depth projection, separate turn state and enemy art into small focused modules, and preserve the existing pose/weapon mounting contract. Each worker owns disjoint runtime files.

**Tech Stack:** Buildless HTML/CSS, native JavaScript ES modules, Canvas 2D and Node's built-in test runner.

**Spec:** `docs/superpowers/specs/2026-10-24-feral-wreck-design.md`

## Global Constraints

- No commits, pushes, build, `dist` changes, native Sites operations, publishing or additional agents by scoped workers.
- Preserve the original left directional pad, right weapon controls, three weapon behaviors, three naturally jumpable tiers, destructible obstacles, approximately 90-second ordinary campaign and absence of a countdown.
- Retain the existing canyon art, drones and final boss; retain exactly eight world depth planes.
- Vehicle identity is SALTIK // STRIKER: two blue-cyan eyes, orange/ivory armor, roof turret with large MIRV barrel and smaller coaxial rapid-fire barrel, and two lateral box missile pods. Keep compatibility module filenames, exports and action/turn asset keys unchanged.
- Playable ground material and lighting must match the canyon background's detailed organic style; `ground-surface` is a required image with exact parent-supplied dimension validation.
- PLAN: duration 1.15 seconds, recharge 3.6 seconds, entry 0.18 seconds, return 0.20 seconds, constant player scale.
- Turning: 0.60 seconds per half-turn, real directional atlas frames, immediate movement and weapons held until settled.
- `PLAYER_SCALE=1.0`, `PIXEL_SCALE=.30`, adjacent tier gaps 128..148, roof slab at most 22 and minimum standing headroom 106; jump launch -720 and gravity 1550.
- Keep the baseline effective projectile physics, damage, cadence, guidance, cooldowns and three guided missiles, distributed over the two integrated multicell pods.

## Review Focus

- A rapid left/right reversal mid-turn must continue from the current yaw without a mirrored body or premature shot; Task 1 tests both directions and retargeting.
- A tap released before turning finishes must fire once, while a pause or PLAN must clear it; Task 4 tests queue lifecycle and input integration.
- PLAN while standing on an upper route or obstacle, or while airborne, must preserve its exact support/jump displacement; Tasks 2 and 3 test projection invariants across those supports.
- The complete Striker silhouette and roof turret must clear recessed routes and top-tier jumps must remain visible; Tasks 2 and 5 check explicit headroom/reach and parent browser framing.
- A valid asset file with the wrong atlas shape or a missing new required asset must prevent a silent incomplete release; Task 5 tests each required load failure.

---

### Task 1: Continuous directional turn state — integration worker

**Files:** Create `src/tachikoma-turn.js`; create `tests/tachikoma-turn.test.js`.

**Interfaces:** Produce `TURN_DURATION=.60`, `createTachikomaTurn(dir=1)`, `advanceTachikomaTurn(turn,dir,dt)` and `tachikomaTurnFrame(turn)` exactly as specified. Player art consumes the frame and yaw; engine consumes active/readiness.

- [ ] Write tests that observe frames `[0,1,2,3,4]` over a right→left turn and `[4,3,2,1,0]` over its reverse at 60 Hz and at eight-step render intervals, require turning at .30 seconds and a settled endpoint at .60 seconds, and ensure mid-turn retargeting has continuous yaw with no early readiness. Queue tests derive their complete half-turn wait from `TURN_DURATION`.
- [ ] Run `node --test tests/tachikoma-turn.test.js`; confirm the missing module causes failure.
- [ ] Implement the focused state module, clamped finite deltas and shortest front-arc default with continuity on retarget.
- [ ] Re-run that command; require all turn checks to pass. Notify the player-art worker that the API is available.

### Task 2: Visible rear paths and substantial rock masses — world/scenery worker

**Files:** Modify `src/world.js`, `src/scenery.js`, `tests/natural-world.test.js`; create `tests/depth-world.test.js`.

**Interfaces:** Produce `DEPTH_LANE_RISE=38`, `projectDepthPoint(x,y,depth=0) -> {x,y}` and `projectPlayer(p) -> {x,y,groundY,depth,scale:1}`. Retain `terrainHeight`, `surfaceHeight`, `createRoutes` and `routeThickness` signatures. Consume parent-delivered `wreck` art and measured crop.

- [ ] Write projection tests asserting clamped depth, unchanged x/scale, feet on projected terrain/route/obstacle support, and unchanged airborne height for depths 0/.5/1.
- [ ] Update contour tests to require independent profiles, 128..148 adjacent gaps, at least106 standing headroom under<=22-unit roofs and maximum gap below the -720/1550 jump apex. Run the two affected test files and observe failures.
- [ ] Implement shared projection, revised route profiles, continuous front/rear dirt terraces and full earth/rock masses with recessed two/three-path openings. Use required `ground-surface` material along the playable contours to match the canyon background's detailed style. Integrate the immense anchored wreck in the existing ruins plane, preserving canyon art.
- [ ] Run `node --test tests/natural-world.test.js tests/depth-world.test.js`; require pass. Supply the integration worker any geometry observations needed for visual event/obstacle placement.

### Task 3: New player action/direction artwork and exact mounts — player-art worker

**Files:** Modify `src/tachikoma-art.js`, `src/tachikoma-pose.js`, `tests/tachikoma-art.test.js`, `tests/tachikoma-pose.test.js`.

**Interfaces:** Consume Task1 turn state, Task2 `projectPlayer`, parent atlas dimensions/crops. Retain `tachikomaGeometry(p,time,{camera,scale})`, `drawTachikoma`, `tachikomaMounts`, world-space `arm`, `cannon`, `cabinTubes` and `tubes`. Export `PLAYER_SCALE=1.0` and measured atlas constants.

- [ ] Write atlas selection tests for walk0..3/idle4/crouch5/jump6/damage7 and native directional turn frames. Replace old mount-number assertions with measured new asset points; require drawn and launch attachment agreement in both settled directions, crouch, tilt and PLAN.
- [ ] Write tests asserting feet remain on `projectPlayer` support and body pixel scale stays constant throughout PLAN; assert two integrated pods supply three guided mouths. Run those tests and observe failures.
- [ ] Implement measured feet/mount geometry and Saltik Striker drawing: two cyan eyes, roof MIRV/coaxial turret and two lateral box missile pods. Keep compatibility geometry `arm` at the smaller turret muzzle and `cannon` at the larger barrel. Remove old procedural three-tube overlays, old PLAN shrink and independent depth offset. Active turns draw authored direction frames without mirroring.
- [ ] Run `node --test tests/tachikoma-art.test.js tests/tachikoma-pose.test.js`; require pass after integration is available, or report the exact engine-dependent check pending Task4.

### Task 4: Turn readiness, support state and delayed weapons — integration worker

**Files:** Modify `src/engine.js`, `src/main.js`, `tests/tachikoma-combat.test.js`, `tests/routes.test.js`, `tests/engine.test.js`.

**Interfaces:** Consume Tasks1–3. Add `p.turn`, `p.supportY`, `p.weaponQueue`, weapon-edge history and exported `clearPlayerWeaponQueue(p)`. Wire that export into existing `main.js:clearInput` only.

- [ ] Add tests for immediate opposite movement with delayed facing, no firing in intermediate frames, a released tap on each weapon firing once on settle, no duplicate after mid-turn retarget, held cadence after settle, queue clearing on pause/PLAN and consumed no-target homing attempts. Run affected tests and confirm failures.
- [ ] Add engine checks for projected grounding through PLAN on all three tiers/obstacles and invariant airborne displacement. Retain real jump/drop/obstacle regressions, updating the deliberately changed gap/apex expectations only.
- [ ] Initialize/advance turn state, maintain supportY from the same terrain/route/obstacle support used by collision, use shared projection for visible events, apply -720 launch and1550 gravity, and implement delayed shot lifecycle. Preserve effective baseline weapon physics with explicit constants independent of body scale.
- [ ] Run `node --test tests/tachikoma-turn.test.js tests/engine.test.js tests/routes.test.js tests/tachikoma-combat.test.js`; require pass.

### Task 5: Enemy artwork, strict asset loading and renderer integration — integration worker

**Files:** Create `src/enemy-art.js`, `tests/enemy-art.test.js`; modify `src/renderer.js`, `src/engine.js`, `tests/art-loading.test.js`, `tests/campaign.test.js`.

**Interfaces:** Enemy art consumes parent-delivered 3x4 atlas measurements; `drawGroundEnemy(c,images,e,time,{camera=0})` draws a grounded measured frame and returns whether it handled the type. `enemyProfile(type)` provides shared bounds/muzzle/aim offsets. Scenery continues to own the wreck and terrain drawing.

- [ ] Test robot/soldier/heavy column choice, idle/walk/fire rows, grounded feet and moderately larger heavy silhouette. Test required action/turn/enemy/wreck/ground-surface load failures and malformed dimensions; retain optional legacy detail fallbacks. Run both new/updated test files and observe failures.
- [ ] Implement enemy drawing and profiles. Replace the second walker schedule slot with soldier, use walker health/speed/cadence for soldiers, retain turret behavior for bulky robots and leave drones/crates/boss on their existing rendering paths. Integrate new asset loading and preserve full projected obstacle footprints.
- [ ] Run `npm test`; require every existing and new check to pass, including ordinary and all-six-upper-section campaigns within75..110seconds, positive armor and boss victory.
- [ ] Hand parent the source changes and evidence. Parent runs real-browser reversal/PLAN/top-jump/wreck/mass review and complete campaign. Verify that the shared vertical framing offset keeps the complete roof-turret silhouette visible and re-run affected renderer/browser checks after new asset measurements; parent owns build and publication.

## Handoff

This plan is ready for the parent's contract review. Workers do not independently ask the user to reapprove the already authorized scope. Runtime implementation starts only after the parent sends execution go-ahead; then each scoped worker proceeds without commits, builds or publication.
