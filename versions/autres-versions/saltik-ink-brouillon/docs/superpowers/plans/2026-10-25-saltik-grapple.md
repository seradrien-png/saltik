# Saltik grapple implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Follow the shared contracts and file ownership.

**Goal:** Relocate manual parry, provide a deterministic rear dodge and add the five-press enemy Saltik grapple/throw with better weapon audio.

**Architecture:** Existing fixed-step engine owns combat and a pure duel phase state; root connects touch/keyboard UI and native render sequence. Player and audio changes are independently testable.

**Tech Stack:** Buildless JavaScript, Canvas2D, Web Audio, Node tests, Python Playwright, native lossless WebP.

**Spec:** docs/superpowers/specs/2026-10-25-saltik-grapple-design.md

## Global Constraints

Preserve current Site audience and identity, support geometry, 1.1 zoom, translucent .9 pad, original MP3 and local runtime. No automatic/held QTE taps, damage leaks during the duel or duplicate kills. Work on isolated feature branch; root alone builds, commits, packages, pushes and publishes.

## Review Focus

- Explosive/queued hits cannot skip or bypass the75% guard transition.
- Contact on a different tier or in the air cannot trigger an unsupported grapple.
- A held/multitouch/repeated key cannot produce five presses; pause/resume cannot replay input.
- New external dodge button remains clear of diagonal/down/drop targets on667×375 and844×390.
- Duel teardown, restart and consecutive opponents preserve world support, audio and weapon reload accounting.

### Task1: Player defensive state

Files src/evasion.js, src/input.js, src/tachikoma-pose.js, src/tachikoma-art.js and their focused tests. First pin1.9s duration, half-open protection[.2,1.7), deterministic tilt and qte buffered input in failing tests. Implement and pass these plus native support/contact/arm checks. Shared interface keeps evasion state/begin/isProtected/EVASION_MOVES.tilt; qte is a queued boolean input.

### Task2: Enemy guard and duel simulation

Files src/engine.js, src/enemy-saltik.js, new src/saltik-duel.js, engine/enemy/duel tests and affected deterministic campaigns. Pin HP24, threshold18, all-source guard, physical contact gating, five rising edges, pause, non-skippable phases, single kill and consecutive duels before implementing. Engine emits enemy-guard, enemy-deflect, duel-start, duel-tap, duel-throw, duel-impact, duel-end. game.duel uses phase,elapsed,taps,enemyId,x,y,dir,playerX,enemyX,playerY,enemyY; null inactive. Input qte boolean. PRIMARY_RELOAD1.1. Root consumes state/events without mutating snapshots.

### Task3: Weapon audio

Files src/audio.js, audio tests and optional local sample assets/license. Improve main gun, MIRV, missile and mechanical reload sound. Any asynchronous loads must have fallback and lifecycle-safe behavior. Coordinate added sample names with root's standalone packager. Verify actual music+SFX output, no clipping/mute leaks and reload timing1.1.

### Task4: Root controls and native duel render

Files index.html, style.css, src/main.js, src/renderer.js, new src/duel-art.js, native atlas and browser/art tests. Centre deflect, external lower-right dodge, three right weapons only, simple red QTE overlay with5-count. Map Space/Enter only during QTE. Clear/rearm inputs at phase boundaries and pause. Generate native two-Saltik hands-locked poses plus enemy frontal impact/slide. Renderer replaces actors in world, projects toward screen, draws crack/slide over the scene and cleans up. Check routes, all direction gestures and live enemy-to-QTE through ordinary inputs.

### Task5: Review and delivery

Independent review, full Node suite, actual desktop/mobile QTE/control/weapon/music/campaign checks and screenshots. Build/package standalone, verify no external requests and exact source/dist/commit/archive provenance. Commit source, no-force push and publish the exact archive to existing owner-private Site; record terminal native result.


## Verification and delivery checkpoint

- [x] Player defensive state: deterministic native tilt,1.9s total with half-open protection[.2,1.7), grounded activation, centre manual parry and queued QTE input.
- [x] Enemy/duel:24 armor, guard at18, all-source threshold clamp, same-support contact, five distinct presses, pause/combat freeze, exactly one kill, consecutive encounters. Independent reviewer verified the same-tick melee threshold regression and no remaining blocker.
- [x] Audio:9 focused tests plus real AudioWorklet capture with Surtr. Gun/reload/MIRV clearly above music; max measured peak.776, mute0, pause/restart cancel queued voices; terminal win cue preserved. Authored synthesis, no downloaded samples.
- [x] Root controls and native cinematic:17th lossless atlas1536×1024, exact source alpha/visible pixels, measured crops; world pair, frontal throw, glass fracture, slide/fall and cleanup. Centre DÉVIER, external lower-right ESQUIVE, three weapons on right.
- [x] Full Node suite276/276 after review fix; desktop plus844×390 and667×375 controls pass, minimum touch target44px, transparent pad147.59px, zoom1.1.
- [x] Real enemy duel on desktop/mobile: continued fire holds enemy at18HP, grounded contact locks hands, held/repeated keys count once, pause freezes, fifth press projects, one kill and same physical support/HP afterward. No page errors.
- [x] Actual all-route campaign: victory89.35s with16 armor, all seven raised paths; minimum player silhouette top85. Mobile roof/gallery/ground descent succeeds one tier per press with92 armor. No page errors.
- [x] Final right-side QTE visibility check and standalone duel bundle: phone real encounter recheck passes; standalone five-press duel,17 native atlases, embedded Surtr, all three weapons, melee and restored controls pass with zero external requests/page errors.
- [ ] Exact committed archive/source proof and same-private publication. Terminal publication identifiers are written to the external delivery ledger.
