# Carrier and V1 breach implementation plan

> **For agentic workers:** Independent bounded workers, root engine/UI integration and verification before completion.

**Goal:** Same-sized protected carrier with destructible equipment/nonlethal unplug, faithful V1 breach motion, readable live ammo and softer weapon mechanics.
**Architecture:** Pure carrier/swarm/shutdown state, standalone native carrier rig using selected PNG; root integrates engine scheduling/collision/action and renderer. Separate weapons/boss workers maintain measured native geometry. Exact-source backup and same public Site publication.
**Tech Stack:** JS ESmodules, Canvas2D, original game atlases, Node and Chromium, Sites.
**Spec:** ../specs/2026-11-02-carrier-and-v1-breach.md

## Review focus
- Four real damageable bay bounds only; cabin remains intact, no kill/explosion on unplug; escort must protect meaningful encounter.
- Drone release starts at moving docks, active cap and replacements correct across long frames/pause/death/bay destruction.
- Single-action carrier shutdown cannot hijack boss action or revive after pause; small native hands reach actual plug.
- Coax/MIRV/enemy pod muzzle geometry matches visible movement in both directions/turns.
- Original V1 breach choreography retained while current native models/style remain consistent; finite roof support and smooth transition.

## Tasks
- [ ] Native carrier art/rig, bay damage/port and shutdown rendering; footprint comparisons and contact/muzzle tests.
- [ ] Pure carrier/swarm equipment and nonlethal shutdown state, bounded deployment/retire; red-green tests.
- [ ] Readable solid pod noses, separate coax recoil, smooth roof cannon and measured enemy deployment; geometry/pose tests.
- [ ] Restore V1 boss brace/tear/six beats from original references; tests and visual proof.
- [ ] Root: schedule guardian+carrier midlevel, bay collision/targeting, actual drone lifecycle and firing, red single action/UI, sound, load/renderer; integrated tests.
- [ ] Full suite, encounter/browser/touch/boss checks, campaign/performance; source/archive backup, push/save/public deployment and URL.


Implementation and local validation completed; see ../carrier-validation-2026-11-02.md. Publication follows exact-commit backup packaging.
