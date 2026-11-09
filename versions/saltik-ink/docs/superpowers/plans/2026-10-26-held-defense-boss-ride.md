# Held defense and boss ride implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Disjoint ownership, root alone builds/commits/packages/publishes.

**Goal:** Loop the new score, make defense responsive to holds/presses, animate victory and implement a climbable charging boss.

**Architecture:** Shared boss module owns charge and physical geometry. Engine integrates moving support/collisions; renderer reads the same state. Pure defense functions and queued input distinguish hold from one-shot actions. Local audio keeps existing lifecycle.

**Tech Stack:** Buildless JavaScript/Canvas/Web Audio, local Ogg/WebP, Node tests, Python Playwright and ffmpeg.

**Spec:** docs/superpowers/specs/2026-10-26-held-defense-boss-ride-design.md

## Global Constraints

Preserve Site identity/audience, prior art/anatomy, native grounded stance,18 active image names unless necessary, music mute/pause/restart mix, all paths and QTE. No hidden state mutation in browser probes. Touch controls retain>=44px. Root owns publication and exact source provenance.

## Review Focus

- Release/blur/pause cannot leave rear immunity; holding beyond10s remains active; tiny released taps cannot queue rear activation.
- Rapid manual parry can restart without a recharge while a held button never repeats or auto-reflects.
- Charge collider cannot tunnel, damage a rider/back/upper jump or shove a held rear actor; snapshot viewport fixes travel extent.
- Riding, jump-off, ejection and boss death cannot strand or teleport the player; roof fire must hit by real projectile travel.
- New Ogg repeats at its actual boundary and survives pause/mute/restart; standalone embeds the same exact runtime audio.

### Task1: Pure held defense and input

Own src/evasion.js,src/input.js and focused defense/input/pose tests. Define begin/advance/release held API with zero recharge, constant native frame1. isEvasionProtected is active held rear only. Remove shift from one-tap queue; manual parry remains buffered and restarts on a fresh press with cooldown0. Send engine exact interface. Test long hold/release, rapid taps, one reflection, unchanged support/hand.

### Task2: Boss simulation and engine integration

Own src/engine.js,new src/boss-tank.js,src/world.js support changes and engine/boss/campaign tests. Shared boss geometry exports bounds/front/roof/turretPivot; boss state exposes action/charge progress/rotation/rider time and actual translation. Add telegraph/charge/recover and rider rotation/ejection, integrate physical support and real downward aim, swept frontal damage. Integrate Task1 hold/release/retrigger API in engine and adjust old timing tests. Preserve ordinary campaigns and no support leaks on death. Focused TDD before whole suite root.

### Task3: Audio loop

Own src/audio.js,dist/audio/forest-loop.ogg and audio/music tests. Inspect supplied Ogg endpoints, create continuous local loop if needed with source-preserving external master/report. Send path/MIME/duration to root for index/standalone helper. Keep existing bus/duck/gating and terminal sound. Actual browser wrap check waits for root exclusive preview slot.

### Task4: Scene/victory/boss visuals

Own src/renderer.js,src/scenery.js,src/victory-art.js,new src/boss-tank-art.js,dist/assets/saltik-victory.webp and focused render/scenery tests. Remove ghost primitive ridges/cliffs/trees and keep opaque coherent vines/painted scenery. Create four-frame native victory animation from current small-arm original; inspect/measure/encode lossless with correct contacts. Render boss using Task2 geometry/state, intact chassis plus visibly rotating turret (native masks/crops), charge tracks/dust/telegraph. Do not change engine/main/UI/audio. Coordinate geometry interface early; root consumes render getters and assets.

### Task5: Root UI and delivery

Own index.html,style.css,src/main.js,README/docs,browser probes and packaging helpers. New local Ogg source, remove parry/held dodge recharge UI without division by zero; clear held rear on transient transitions. Test real long touch/keyboard hold/release and no-cooldown re-press. Run actual boss charge/roof fire/turret ejection, victory animation and route campaigns on desktop/phone. Review/full Node, offline loop/duel/weapons, source/dist/original audio/commit/tar checks, same-private push/publication with terminal ledger.
