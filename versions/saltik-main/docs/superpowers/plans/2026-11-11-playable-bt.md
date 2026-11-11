# Playable BT Implementation Plan

> Execute inline with superpowers:executing-plans; one independent final review.

Goal: playable existing green/orange BT in all three missions.
Architecture: isolated bt-combat clocks/callbacks and bt-art adapter over original enemy rig; conditional branches preserve default characters.
Tech Stack: existing native JavaScript Canvas/Web Audio, Node tests.
Spec: docs/superpowers/specs/2026-11-11-playable-bt-design.md

## Constraints
Existing pixels unchanged; no new character artwork. Exact user timings 0.25/0.4/1.2 s, max8, stock conservation, no mortar/Gatling.
## Review Focus
Pointer cancellation must not fire; panic while held suppresses release; offscreen/dead targets invalid; pause/interaction cancels pending attacks; switching characters restores original controls.

### Task 1 — combat
Create src/bt-combat.js initializeBT/stopBT/advanceBT, BT_TUNING. Tests tests/bt-combat.test.js first and red; implement clocks and conservation; engine conditional callback emissions, current guidance and splash reused. Run focused tests and commit.
### Task 2 — native art
Create src/bt-art.js btActor/btGeometry/drawBT, reuse ink-enemy-saltik without image regeneration. Tests tests/bt-art.test.js first red; add player-specific pod aiming, stock slot presentation, cannon recoil, interaction grip adapters. Keep existing renderer defaults. Run art/scene/encounter tests and commit.
### Task 3 — UI and integration
Add BT menu, K lock/release and L panic labels, stock+locks HUD and reticles, audio mapping. Test input edge/cancel behavior and browser desktop/phone selection across3 levels. Full suite, build, reviewer, source push, publish and GitHub backup without other edition edits.
