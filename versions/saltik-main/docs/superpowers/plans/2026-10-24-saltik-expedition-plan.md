# Saltik Expedition Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. Root has already selected scoped parallel workers and owns commits; individual workers do not commit.

**Goal:** Add a visibly native one-arm contact strike, six distinct canyon situations, finished destructibles and real wheel/leg support while preserving the accepted campaign.

**Architecture:** Keep physical world positions and existing controls. World authoring and measured support/art stay in separate modules; the engine consumes their explicit interfaces for collision, melee and support, while the renderer delegates cover to its artwork module.

**Tech Stack:** Browser ES modules, Canvas 2D, static PNG atlases, Node's built-in test runner.

**Spec:** `docs/superpowers/specs/2026-10-24-saltik-expedition-design.md`

## Global Constraints

- Genuine 0.60-second native perspective turns; melee cancels during a turn.
- PLAN remains grounded, shifts by precisely 38 world units, keeps scale 1, locks weapons/melee and uses the near-roof occlusion mask.
- All six upper sections remain reachable by ordinary jumps, with ground plus two upper routes, at least 107 units of standing headroom and adjacent crown rises within 128–148 units.
- Preserve the immense wreck, drones, final boss, no countdown, and an ordinary forward combat run of 75–110 seconds with positive HP.
- Three independently controlled weapons, existing keyboard/touch controls, original ballistics and recharges; no added melee button.
- Root owns assets/build/browser QA/commit/push/private publication. Workers use their assigned source/test files and do not edit dist.

## Review Focus

- A target dying or escaping during windup must produce no remote hit or retarget; pin in integration melee tests.
- A wheel passing a platform/obstacle edge must not plant onto another tier; pin in support sampler and pose tests.
- Low ceilings plus PLAN/turn/support pose must retain the full Saltik silhouette and near-roof mask; pin in geometry and rendering tests, then browser review.
- Checkpoint relocation must preserve spawn ordering/counts, upper-floor anchors and ordinary campaign survival; pin in world and campaign tests.
- Required new art failures/dimension mismatches must keep deployment disabled; pin in loading tests.

---

### Task 1: Author distinct world scenarios and cover

**Files:** Modify `src/world.js`, `src/scenery.js`, `tests/natural-world.test.js`, `tests/routes.test.js`; create `src/obstacle-art.js`, `tests/expedition-world.test.js`, `tests/obstacle-art.test.js`.

**Interfaces:** Consumes root's 1536×1024 `destructibles` atlas/measurements. Produces existing world exports plus `createObstacles(platforms)`, `authorCheckpointGuards(schedule,obstacles,platforms)`, `supportHeight(world,player,x)`, `drawObstacle(c,images,o,{camera,time})`, and `obstacleGeometry(o,{camera})` exactly as in the spec.

- [x] Add failing assertions that six scenarios have genuinely different geometry/material situations, 12 unique crown profiles, six reachable upper paths, 128–148 rises, ≥107 standing headroom, and floor-anchored rock/barricade/checkpoint/hull obstacles.
- [x] Add assertions that checkpoint guards reuse schedule IDs/types/counts, remain sorted and floor-anchored; support samplers return null beyond the active upper/obstacle extent and real ground heights otherwise; artwork damage crops and collision bounds remain measured.
- [x] Run `node --test --test-isolation=none tests/expedition-world.test.js tests/obstacle-art.test.js` and confirm new assertions fail before implementing.
- [x] Implement the authored scenarios, sampler, schedule relocation and measured cover rendering. Preserve first-section jump approach and existing scene function signatures.
- [x] Run `node --test --test-isolation=none tests/expedition-world.test.js tests/obstacle-art.test.js tests/natural-world.test.js tests/routes.test.js`; report commands/results and changed API measurements to root/integration owner.

### Task 2: Measure native melee and terrain support

**Files:** Modify `src/tachikoma-pose.js`, `src/tachikoma-art.js`, `tests/tachikoma-pose.test.js`, `tests/tachikoma-art.test.js`; create `src/support-pose.js`, `tests/support-pose.test.js`, `tests/melee-art.test.js`.

**Interfaces:** Consumes root's 1536×1024, 3×2 melee sheet and `p.melee` state. Produces `computeSupportPose(player,sampleHeight,previous=null,dt=1/60)` and `tachikomaMeleeReach(player,time=0,{camera=0,scale=1}={})`, plus compatible `tachikomaGeometry`/`drawTachikoma`.

- [x] Add failing assertions for uphill/downhill/rough support across the measured wheelbase, bounded pitch/heave/distal offsets, null support at edges, airborne relaxation, exact PLAN38 and native turn registration.
- [x] Add failing assertions for six melee crops, one extended front arm, exact mirrored fist reach/hitbox and measured guns, grounded/airborne selection and compatible default art.
- [x] Run `node --test --test-isolation=none tests/support-pose.test.js tests/melee-art.test.js` and confirm the intended failures.
- [x] Implement measured support and native painted distal-part movement with limits ±0.20 rad pitch, ±6 heave, ±9 distal adjustment. Implement six melee cells and an idle-compatible extended fist reach; keep `p.y`/anchor projection exact.
- [x] Run `node --test --test-isolation=none tests/support-pose.test.js tests/melee-art.test.js tests/tachikoma-pose.test.js tests/tachikoma-art.test.js tests/tachikoma-turn.test.js tests/depth-world.test.js`; report measured reach and final interface details.

### Task 3: Integrate automatic contact melee and support

**Files:** Modify `src/engine.js`, `src/renderer.js`, `src/main.js`, `src/audio.js`, `index.html`, `tests/art-loading.test.js`, `tests/tachikoma-combat.test.js`; create `src/melee-state.js` only if it keeps the state machine focused, and `tests/melee-combat.test.js`, `tests/expedition-integration.test.js`.

**Interfaces:** Consumes Tasks 1–2 exports and generated atlas keys. Produces initialized `p.melee`/`p.supportPose`, automatic one-target punches and corrected product copy without new controls.

- [x] Add failing assertions for acquisition/impact using real fist AABB overlap in both directions, 6 damage once per acquired target, .08/.12/.35 phases and .70 recharge, target death/escape, cover occlusion, isolated windup contact guard, 18-unit surviving-enemy shove with terrain/platform reanchoring, unreachable boss exclusion, airborne vertical reach and gun independence.
- [x] Add assertions that PLAN/turn cancel melee, pause freezes it, death cannot attack, invalid time deltas remain finite, and engine support preserves physical floor/PLAN positions on every tier/obstacle.
- [x] Run `node --test --test-isolation=none tests/melee-combat.test.js tests/expedition-integration.test.js` and confirm intended failures.
- [x] Replace engine-local obstacle creation with world exports and relocate existing guards. Replace the old ±3 terrain tilt with `computeSupportPose` after movement and assign `p.tilt`. Move enemy body-contact damage after melee acquisition/impact; guard only the acquired target during windup. Emit hand-positioned effects and keep roof weapons independent.
- [x] Delegate obstacle rendering; require exact dimensions for `saltik-melee` and `destructibles`; add restrained melee effects/audio. Correct menu labels to `SALTIK` and `CLASSE STRIKER`, and mention automatic contact strike in tutorial copy.
- [x] Run `npm test`; resolve cross-owner interface issues by messaging before editing owned files. Preserve both full campaign tests and all established art/turn/PLAN contracts. Record final counts/results in progress.md and integration notes.

### Task 4: Root review, devices and publication

**Files:** Root-owned generated assets, verification artifacts, build output and private Site package.

**Interfaces:** Consumes Tasks 1–3 passing source tree. Produces a reviewed source commit and new version of the same owner-private Site.

- [x] Root obtains an independent review against this spec and fixes concrete findings in the relevant owner files.
- [x] Root runs fresh complete automated tests/build, then desktop/phone landscape/tablet visual/control checks of real melee, varied scenarios, cover art, ascending/descending/bumpy support, PLAN and perspective turns.
- [x] Root completes fresh browser campaign validation, including positive HP and all six upper sections; confirms no countdown or new control burden.
- [ ] Root packages, commits/pushes source, publishes to the existing private Site without audience changes, and verifies the published artifact.
