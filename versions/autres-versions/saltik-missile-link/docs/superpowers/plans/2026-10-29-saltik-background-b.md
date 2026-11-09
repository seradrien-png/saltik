# Saltik Background B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task.

**Goal:** Integrate approved natural background placement and a properly scaled foreground missile enemy.
**Architecture:** Shared canyon projection registers the tiny ally to original background pixels and supplies its missile origin. A foreground battery module supplies native geometry and attack descriptors to the existing engine; all damage uses existing collision handling.
**Tech Stack:** Canvas 2D, ES modules, Node tests, Playwright.
**Spec:** ../specs/2026-10-29-saltik-background-b.md

## Global Constraints
- Original v24 remains untouched; existing V2 stays public.
- Four wheel legs, two small hands; no new columns or scenery assets.
- Background actor may be occluded and never seeks screen clearance.
- Preserve cancellation, targeting, existing encounters, boss and audio.

## Review Focus
- Relative position on the painted rock stays constant during camera pan, vertical camera movement and phone resize.
- A launched missile never teleports when the camera moves.
- Foreground battery receives every ordinary weapon's damage and dies without a hidden guard/QTE lock.
- Enemy salvos originate from actual pods and remain interceptable/deflectable.
- Opening ally matches player scale; no duplicate distant robots or supports.

### Task 1: Anchored allied artwork
Files: new src/canyon-placement.js; modify missile-link.js, missile-link-art.js, renderer.js, engine.js; tests/missile-link-art.test.js and tests/canyon-placement.test.js.
Interfaces: canyonProjection(camera,width) returns the exact tile width/offset/scales; alliedBackgroundPoint(viewport) returns world-space source anchor; batterySpriteSize(team,height=99) calibrates native visible height.
- [x] Write failing camera/resize/mirror registration and equal-size checks; remove superseded clearance-search tests.
- [x] Share the original canyon projection, paint one tiny ally inside its tile, remove all rock-column rendering and reduce the introductory sprite.
- [x] Run node --test --test-isolation=none tests/canyon-placement.test.js tests/missile-link-art.test.js; expect all pass, then commit.

### Task 2: Foreground missile enemy
Files: new src/missile-battery.js; modify engine.js, missile-link.js, missile-link-art.js, main.js, renderer.js; tests/missile-battery.test.js and missile-link integration tests.
Interfaces: createMissileBattery(schedule,{y}) returns type battery; missileBatteryGeometry(e) returns bounds/target/podMuzzles/tilt/size; advanceMissileBattery(e,{player,dt,groundAt,inView}) returns shots/events.
- [x] Prove real foreground spawn, terrain support, four locking projectiles, regular bullet/MIRV/guided/support/melee damage, destruction and no offscreen artillery.
- [x] Replace the camera-relative remote opponent with the new actor and remove phantom remote targeting/volleys; connect ordinary collision, drawing, detection and warning UI.
- [x] Run the focused tests and full npm test; expect green, then commit.

### Task 3: Visual verification and publication
- [x] Build and check intro scale, approved ledge, continuous background registration, foreground combat and cancellation in desktop/mobile browser screenshots.
- [x] One fresh whole-branch review; fix significant findings with regression coverage.
- [ ] Package, verify archives/source, push exact commit, save/deploy existing public V2, retain original reference and record release provenance.
