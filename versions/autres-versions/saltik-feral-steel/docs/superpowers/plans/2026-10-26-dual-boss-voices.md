# Dual Boss QTE and Voice Lines Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development. Disjoint owners; root alone builds/commits/packages/publishes.

**Goal:** Play5accepted voice lines and give the tank retractable rockets, cannon recoil and2native3press assaults.

**Architecture:** Engine extends shared boss geometry/state and typed pure assault state. Audio owns decoded voice samples and cancelable speech queue. Renderer consumes shared action/geometry and native atlases. Root integrates red central UI and exact standalone assets.

**Tech Stack:** Existing native JavaScript/Canvas/WebAudio/Ogg/WebP, FFmpeg/flite/rubberband, Node and existing Playwright; no dependencies.

**Spec:** docs/superpowers/specs/2026-10-26-dual-boss-voices-design.md

## Constraints / Review Focus
- Preserve current Site audience, gameplay/paths/5pressduel, assets/anatomy, flowing real waterfalls and exact current music.
- Every voice trigger is meaningful, onscreen sightings once per entity, guided salvo once, victory survives terminal audio stop; stale decodes/queued lines never restart on pause/mute/home.
- Two QTE stages are ordered, once each and independently armed;3rapidpresses queue3full strokes, held/phase/pause transitions cannot add taps.
- Pod destruction disables all later launches; normal rocket fire/muzzle/recoil is consistent with native art; no unsafe support or fatal-flight victory.
- Root verifies actual keyboard/touch/QTE/audio, new required assets, standalone/no external requests and exact source/artifact publication.

### Task1 Engine (agent)
Own src/engine.js,src/boss-tank.js,src/boss-breach.js and focused tests. RED/GREEN typed pod/hull assaults, thresholds/proximity/two-second gap, shot ticks/fire/recoil, physical rockets/visible enemy voice events, safe normal/fatal return. Publish exact API early. No main/audio/render edits.

### Task2 Voices (agent)
Own src/audio.js,new src/voice-lines.js,dist/audio/voices/*.ogg, audio/voice tests and external generation script/masters. Synthesize requested5phrases with accepted V2 pipeline. Literal document-relative voice paths ./audio/voices/*.ogg for root embedding. Cancelable decode/speech queue, voice bus/duck, start/homing/saltik-detected/saltik-grab-ready/won mappings. Root provides screen events viaengine. No engine/main/package edits; no browser until assigned slot.

### Task3 Native rendering (agent)
Own src/boss-tank-art.js,src/boss-breach-art.js,new src/boss-pod-art.js and focused visual tests. Consume root-generated boss-pod and saltik-breach-fire atlases, original short hands. Native barrel-only recoil, pod raise/fire/retract/destroy, animated breach burst, preserve tracks/anchors. bossBreachVisual exposes paintsTank for root composition; drawBossBreach returns whether actor is painted. No renderer/main/engine/assets edits. Root sends generated paths/measurements.

### Task4 Root integration/delivery
Generate/inspect/encode new atlases; own src/main.js,src/renderer.js,index/style,README/browser probes/package helper. Central red launch bothstages, aboveactor3marks during QTE, readonly availability/speech state. New required image manifest, standalone voice data URLs. Review integration, full tests/build + actual desktop/mobile doubleassault/voice lifecycle/native motion, artifact parity/exactaudio and sourceSHA; push and native private publish.

## Verification record

Engine, voices, native visual rendering and root integration are implemented. Root full Node suite:349 passed,0 failed; build passed. Both final atlases retain exact RGBA alpha/visible pixels after lossless encoding. Desktop1440×900 and touch844×390 campaigns reach both optional assaults and victory through ordinary controls; pod damage20, hull damage60, six native shot ticks, and physical ground returns were verified. Browser speech/lifecycle/missing-file checks and audio mix passed. Standalone contains21 native artworks, original music and five voice clips and makes no subresource requests. Read-only Sol xhigh review found no concrete defects. Delivery artifacts and exact published source are verified separately before native publication.
