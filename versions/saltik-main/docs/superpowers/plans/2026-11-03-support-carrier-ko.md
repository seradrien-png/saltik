# Support Carrier K.O. and MIRV Ink Implementation Plan

> **For agentic workers:** Independent nativeart/combat/scope ownership; TDD and final fresh review.

**Goal:** Approved new support-carrier visual with intactK.O./nonlethal rule and slower, bolder MIRV aim.
**Architecture:** Native carrier rig handles intact art, grounded crouch and animated head/stars; pure actor/engine handle combat readiness/K.O./automatic settled proximity unplug; root owns sweep/ink/render visibility.
**Tech Stack:** Existing JS/Canvas2D/PNG/Node/Playwright, no dependencies.
**Spec:** ../specs/2026-11-03-support-carrier-ko-design.md

## Constraints/review focus
- Same chassis scale/twoeyes, correct front Gatling nativeleft/worldheading, real normal-drone docks, no structural destruction art.
- ZeroHP means intactK.O., retained actor/positive KO clock, no kill/explosion; ordinarySaltiks/player defeat also nonexplosive.
- Auto-unplug only settled/on same grounded support/nearby/guardianneutralized; no repeat speech or combat afterK.O.
- All native tires stay grounded with crouch, eye/head overlays transform together, settled service lead reachable across actual curved terrain.
- MIRV slower sweep only; actual physical target unchanged, red scope legible above foreground, all cancellation/touch retained.

### Native model/K.O.
- [x] Generate/intact native correct model, masks/eye/head/gun/pads, bounded stars/spirals and grounded .6s crouch.
- [x] Registration/scale/axis/normaldocks/KO+quiet/service-curve physical tests and actual both-facing proof.
### Nonlethal combat
- [x] Replace damage stages/distress with full readiness bar→intactK.O.; retire drones, clear fire, retainKO actor.
- [x] Automatic settled close contact unplug/guardian gating/voice exactlyonce; ordinarySaltik nonlethal flags and intactplayerKO.
### MIRV/render
- [x] Slow5.6s sweep and thick saturated red ink scope RED→GREEN tests; render above foreground.
- [x] Exclude ordinary neutralizedSaltik from world render, preserve intact throw-screen cinematic.
### Release
- [x] Full checks/build/actual touch+KO+prediction/browser/campaign/fresh review; concrete fixes.
- [x] Commit exact source/standalone/archive, verify saved originals and publish same publicV2.

## Final corrections
Two small original-style claw hands added beneath the head. Automatic unplug selects a supported clear service side; real rock at 9140 stays intact. Defeated player remains visible as an intact native Saltik. Canvas regression resets shared landmark/texture state after loading fixtures.
