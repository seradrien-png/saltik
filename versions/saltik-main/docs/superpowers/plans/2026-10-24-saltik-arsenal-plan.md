# Saltik arsenal update implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for your assigned task. Root dispatches disjoint workers using `.superpowers/saltik-arsenal/contracts.md`; no worker creates further agents.

**Goal:** Deliver the user's seven combat, visual and route changes while preserving the ordinary expedition.

**Architecture:** Native art remains authoritative for player/enemy apertures and silhouettes. Pure evasion, guidance and enemy modules feed the existing fixed-step engine; engine integrates all projectile motion and collision. Renderer reads the same state for poses, effects and locks.

**Tech Stack:** Browser ES modules, Canvas 2D, WebAudio, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-24-saltik-arsenal-design.md`

## Global constraints

- No worker commit, build/dist change, push or publish; root owns those operations.
- Preserve player orange identity, native melee and 0.60 s turns, existing controls except PLAN meaning, drones, terminal boss, no countdown and 75–110 s ordinary victory with positive HP.
- Engine owns motion, earliest swept collision, damage and removal; steering cannot teleport or bypass cover.
- Evasion has no depth shift or ghost sprite. Primary reload is 5.0 s actual firing, 0.70 s interruption.
- Root supplies art and review; routine implementation choices do not require another user approval.

## Review focus

- A target dying mid-salvo must reacquire living visible targets without stale reticles or unbounded loops.
- A high-speed bullet and hostile missile crossing within one step must resolve the earliest real collision.
- A trigger held through turn/dodge must not spend primary firing time; a released reload tap must never queue a shot.
- A dodge beginning/ending within a collision step must defend only within its compatible active interval.
- A jump/drop at changing route edges must still find tangible support and preserve ordinary-run completion.

## Task 1: Freeze geometry and simulation contracts (lead, planning only)

- [x] Read current engine, renderer, player geometry, world and tests.
- [x] Write this spec/plan and exact module contracts plus disjoint worker briefs.
- [x] Root reviews contracts and dispatches workers before any product edit.

## Task 2: Player poses, evasion and cannon articulation (player worker)

**Files:** `src/evasion.js`, `src/tachikoma-pose.js`, `src/tachikoma-art.js`, player art/pose/evasion tests only.
**Interfaces:** Exact evasion and cannon fields/functions in `contracts.md`.

- [x] Add failing tests for deterministic contextual move choice, active-window boundaries, incompatible projectile/contact damage, one deflection, no depth and cannon aperture/axis agreement.
- [x] Implement the four native pose rows, physical response query and isolated painted cannon elevation; preserve melee, support and turns.
- [x] Run owned tests and report measured asset geometry and verification.

## Task 3: Guided navigation and enemy Saltik logic (weapons worker)

**Files:** `src/guided-navigation.js`, `src/enemy-saltik.js`, matching pure tests only.
**Interfaces:** Normalized targets, steering context, launch descriptors and attack return values in `contracts.md`.

- [x] Add failing tests for visible target filtering, cover navigation, separated single-target approaches, target death and deterministic gun/lock/missile sequence.
- [x] Implement steering-only navigation and bounded two-attack enemy state using canonical enemy geometry.
- [x] Run owned tests and report unresolved steering/collision assumptions.

## Task 4: Varied physical routes (world worker)

**Files:** `src/world.js`, `src/scenery.js`, `src/obstacle-art.js`, owned world/route/scenery tests.
**Interfaces:** Preserve existing world exports; projection becomes identity; route mass/material/topology may expand as documented.

- [x] Replace fixed topology assertions with sampled meaningful 1/2/3-lane coverage, support/headroom/reachability and varied silhouette/material assertions.
- [x] Author route changes and repair support/visual forms, checkpoints and natural cover.
- [x] Run owned tests plus campaign; send lead any schedule/support contract changes.

## Task 5: Combat effects, enemy art and renderer (effects worker)

**Files:** `src/combat-effects.js`, `src/enemy-saltik-art.js`, `src/renderer.js`, matching effects/enemy/renderer tests.
**Interfaces:** Renderer uses canonical geometry, evasion state and `game.viewport`; exact new geometry and effect factory in `contracts.md`.

- [x] Test native alpha loading/registration, actual enemy apertures, red living-target brackets, bounded effect lifetimes and no square explosion particles.
- [x] Implement native enemy animation, fire/smoke effects, hostile missile visuals; remove rear-depth actor path/mask.
- [x] Run owned tests and report asset measurements/screens needed.

## Task 6: Engine and UI integration (lead, after root go-ahead)

**Files:** `src/engine.js`, `src/main.js`, `src/audio.js`, `src/input.js`, `index.html`, `style.css`, engine/input/combat/campaign integration tests. No edits to other workers' files without handoff.

- [x] Write failing integration tests for timed evasions, target/viewport geometry, obstacle collision, interception ordering, three Saltik replacements, cannon preparation/cancellation and primary reload accounting/input discard.
- [x] Remove old depth immunity, add evasion state and collision-fraction response, integrate pure guidance/enemy modules and shared normalized geometry.
- [x] Implement prepare-before-launch MIRV; implement primary 5.0/0.70 s state, sounds/UI; replace all PLAN labels and preserve input mapping.
- [x] Update superseded engine PLAN/immediate-MIRV tests and campaign topology assumptions with meaningful new behavior tests.
- [x] Run `npm test`, ordinary/upper-route campaigns and finite-state checks; resolve regressions with owning workers.

## Task 7: Root review and delivery

- [x] Root adds final RGBA assets, reviews all new/changed code and whole suite.
- [x] Root runs desktop/mobile browser evidence for every requested visual/functional feature; repair findings in owned files.
- [ ] Root builds, packages, source-pushes and publishes privately after all checks pass; record exact revision and URL in the external delivery ledger. Publication remains pending until native terminal success.

## Final verification,2026-10-25

All five implementation tracks delivered. Independent read-only review and root verification pass222behavioral tests. Review repaired a released tap at the last reload boundary, physical slab-end guidance, off-screen point-defense priority, unsupported ground-only evasions, and camera clearance during the highest roof jump. The native sore-hand recovery moves only the measured hand/forearm; lossless encoding preserves all15runtime sheets’ visible pixels and alpha.

Actual-browser evidence: ordinary victory82.23s40HP, all7raised routes84.0s8HP, mobile military roof/gallery/ground descent100HP, all4evasion modes and16poses, native cannon elevation,5s/.70sreload, two enemy attacks and physical missile interception, three-weapon multitouch at3sizes, and12required-art failure cases. Final cosmetic review removes pasted rear-panel fragments and follows the sloped crown with irregular finite buttresses.

The superseded depth-PLAN browser fixture is retired; current controls, arsenal and route fixtures cover its valid requirements. Final archive/standalone checks and exact pushed-commit publication are recorded outside the source tree to avoid changing the revision being published.
