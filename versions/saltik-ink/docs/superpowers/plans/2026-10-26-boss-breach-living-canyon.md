# Boss Breach and Living Canyon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Root alone builds/commits/packages/publishes; disjoint ownership.

**Goal:** Loop the melancholic score, slow the charge, add a3press native boss assault and animate real background water/leaves.

**Architecture:** Pure boss-breach state machine integrates into existing engine freeze/physics paths. Root consumes it in UI and native atlas renderer. Background motion samples only masked original canyon pixels. Existing local media lifecycle stays intact.

**Tech Stack:** JavaScript/Canvas/WebAudio/Ogg/WebP, Node, existing Python Playwright/ffmpeg; no dependencies.

**Spec:** docs/superpowers/specs/2026-10-26-boss-breach-living-canyon-design.md

## Global Constraints
Preserve Site id/audience, held rear/no-cooldown parry, all routes, five-press enemy duel, source assets/anatomy, no time limit and local/offline runtime. No hidden state mutation in browser QA. >=44px touch targets.

## Review Focus
- Held or preheld action, double physical sources, phase transitions and pause cannot accept extra QTE taps.
- Boss deaths and charge/mounted transitions cannot strand Saltik or hide the cannon before automatic safe return.
- Three rapid taps still produce3complete native effort strokes, firing follows tearing, one use/damage only.
- Background masks remain attached to real painted waterfalls through flipped tiles, resize and pause; foliage never bends stone/buildings.
- New music wraps audibly and effects stay louder, including embedded/offline playback.

### Task1 Engine (agent owns src/engine.js,src/boss-tank.js,new src/boss-breach.js and focused tests)
- [ ] RED tests slower timings, halfHP/manual trigger,3distinct queued full efforts, pause/preheld safety, one damage/ejection/landing/optional normal win.
- [ ] Pure create/advance breach API and engine integration. Coordinate exact fields/phases/root input action bossAction. Preserve prior boss mechanics. No edits to main/renderer/input/index.
- [ ] Focused tests GREEN; send root interface and freeze files.

### Task2 Audio (agent owns src/audio.js,dist/audio/forest-loop.ogg,tests/audio.test.js,tests/browser_music.py,tests/browser_audio_mix.py)
- [ ] Inspect source endpoints and replace local runtime score; exact bytes if suitable, source/report external.
- [ ] Update focused tests and duration assumptions. Root owns index/path unchanged. No browser until exclusive preview slot assigned.
- [ ] Focused checks/report pass.

### Task3 Background (agent owns new src/background-motion.js and tests/background-motion.test.js)
- [ ] Inspect canyon.webp and identify source-space polygon masks on its actual water/foliage.
- [ ] Export drawCanyonMotion(c,image,{x,y,w,h,time,sourceHeight}) called inside each native tile transform. Own-pixel small deformations with water flow; do not edit renderer.
- [ ] Test masks/transforms/timing and give root integration instructions; no new images or unrelated procedural waterfalls.

### Task4 Root native art/UI/render/delivery
- [ ] Generate/inspect6frame native boss-assault.webp, register per-cell contacts, draw through new boss-breach-art.js. No procedural substitute geometry.
- [ ] Add bossAction input/B, ASSAUT availability and3press red button following Saltik; clear input at breach phases and pause; expose readonly state. Preserve old duel.
- [ ] Remove old waterfalls and integrate native background motion in sky tiles. Keep input/runtime UI error free.
- [ ] Review integration, full Node/build, physical browser trigger/3efforts/fire/cannon return/victory, desktop/phone/score/offline/routes as affected.
- [ ] Package verified exact commit/source/dist/Ogg/standalone/tar. Push exactSHA, private native publish and terminal ledger.
