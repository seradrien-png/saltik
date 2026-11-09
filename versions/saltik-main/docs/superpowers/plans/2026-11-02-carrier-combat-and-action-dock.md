# Carrier Combat and Action Dock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Ship approved normal-drone carrier platform, staged nonlethal combat, right-side red actions and hydraulic MIRV presentation.
**Architecture:** Keep pure carrier combat and shutdown clocks separate from native sprite geometry, reuse normal game drones, integrate all transitions in engine. One UI action dock owns the existing red buttons. Optimize only measured rendering/simulation hot paths.
**Tech Stack:** Native JavaScript ES modules, Canvas2D, WebAudio/OGG, existing Node and Chromium/Playwright checks.
**Spec:** ../specs/2026-11-02-carrier-combat-design.md

## Global Constraints
- No killing occupied Saltiks. Thresholds60%/85%, body stays visible. Normal drone size and normal Saltik footprint.
- All red actions replace right weapon controls; no action moves to world center. Distinct presses remain required.
- Exact established voice, existing music/mix, no physical gameplay shortcuts/debug hooks in shipped code.
- Preserve original Encre and colored V1 and prior V2 release. Publish exact tested commit only.

## Review Focus
- A large damage event crossing both thresholds must emit each transition once and never kill the cabin.
- Damage, pause or unplug during docking/reload cannot release a ghost drone or retain held weapon inputs.
- Both facings and real slopes must keep wheels, turret mouths, drones and small unplug hand aligned.
- Touch-held fire when red controls replace it cannot leak into a cinematic or resume firing on release.
- Crowded rendering must improve without changing actual projectiles, guidance hits or evade protection.

### Task1: Pure carrier combat
Files: src/drone-carrier.js; tests/carrier-behavior.test.js.
Produces createDroneCarrier, damageDroneCarrier, damageCarrierBay compatibility, isCarrierTargetable, advanceDroneCarrier, advanceCarrierDrone. State backDestroyed/immobilized/legDestroyed, hp120→48→18, disabled only at immobilization. Two docks, three normal scale1 drones; docked/undock/escort/retire states. Medium distance movement and sustained burst/reload; real geometry mouth.
- [x] Write/run failing threshold, reload, distance, docking size/cap and pause-independent pure tests.
- [x] Implement, run focused tests, communicate API.

### Task2: Native platform/damage/unplug art
Files: src/ink-carrier.js, src/carrier-shutdown-art.js, src/carrier-shutdown.js; new dist/assets/carrier*.png; art/shutdown tests.
Produces inkCarrierGeometry and drawInkCarrier preserving public signatures. Geometry bays[2] with real muzzle/bounds, muzzle/muzzleDirection for lateral gun, bodyBounds/bounds/target/port, sourcePoint. carrierShutdownPlacement safe outside cabin. Native damaged sprites never baked live drones. Root renders normal docked drone descriptors after carrier. Tests exact sprite registration, native supported leg/contact, rigid hand/connector and every shutdown phase.
- [x] Generate/inspect matching frames, measure native masks.
- [x] Add tests and native draw/geometry/unplug changes.

### Task3: Action dock and colored weapons
Files: index.html, style.css, src/main.js; focused UI/browser tests.
Use existing qte and bossAction bindings and availableCarrierShutdown export. Central right action dock hides three weapons while existing red duel/boss/unplug action replaces them, including availability before entry. Primary round larger; secondary square, amber/cyan/coral palettes and glyphs. Clear replaced held weapons without locking directional movement. Preserve every QTE count and pause.
- [x] Add/run failing layout/semantic tests.
- [x] Implement and verify mobile667×375/851×393 plus desktop.

### Task4: Hydraulic MIRV
Files: src/ink-saltik.js and native pose tests. Root changes engine timing.
Consumes player.turretLift0..1, cannonElevation, mirvFlash; produces actual moving upper housing, two supports and shared arm/cannon mount positions. Preserve INK_SALTIK_PARTS.cannon for existing boss rig. Full turret lifts≈16 world units before elevation/recoil; body face/legs stay planted. No new large imagery.
- [x] Verify rest/lift/fire/recovery in both facings and precise projectile/draw mouths.

### Task5: Voice
Files: src/voice-lines.js, dist/audio/voices/saltik-dont-kill-saltik.ogg, voice tests. Reuse original voice-generation pipeline, add carrier-disconnected mapping once. No audio mix changes.
- [x] Inspect/reuse original synthesizer, generate clip and verify decode/queue/mapping.

### Task6: Profile, root integration and release
Files: src/engine.js, src/ink-scene.js, src/ink-renderer.js and measured render hot paths; integration/performance tests.
- [x] Baseline crowded fixture and measured bottlenecks; bounded cache/culling fixes only.
- [x] Integrate new damage once per physical impact/blast, target until immobilized, action gate at85%, normal size docked drones and gesture/voice event.
- [x] MIRV preparation .64s: initial turret lift over.30s, barrel elevation starts.30s; hold/recover smoothly after real launch. Reset queued poses at cinematics.
- [x] Full tests/build, browser action sequences, full campaign and before/after crowded proof.
- [x] Commit source, exact standalone/source/deployment backups, verify unchanged original repositories, push/save/deploy same public V2 URL.


Local implementation and validation completed. Publication is finalized only from the exact committed source/archive. See ../platform-combat-validation-2026-11-02.md.
