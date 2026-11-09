# Approved DR-01 Integration Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline. User has already approved the visual implementation and asked for the additional sound adjustment.

**Goal:** Ship the approved carrier model and a 15% louder Striker primary cannon.

**Architecture:** Keep native cutout rendering and shared gameplay geometry. Remap the new artwork's parts, docks, firing axis and service port. Reuse existing terrain planting, tracking and KO timing.

**Tech Stack:** Canvas 2D, JavaScript modules, Web Audio, Node test runner.

**Spec:** docs/superpowers/specs/2026-11-04-approved-carrier-design.md

## Global Constraints

- Base is color Matin Doré v15; preserve controls and existing media.
- Approved cutout must retain its small native claws; no hero-hand graft.
- Two independent drone pads; four planted wheels; intact nonlethal shutdown.
- Only primary shot amplitudes increase by factor 1.15.

## Review Focus

- Both facings and terrain slopes keep wheels planted.
- Canon tracking follows the new right-facing native bore; recoil travels backward.
- Drone anchors sit on the raised pads and remain separate actors.
- KO eyes follow the low face; unplug remains reachable on curved terrain.
- Native masks do not duplicate seams, erase cabin ink or clip the new silhouette.

### Task 1: Native carrier integration

Files: src/ink-carrier.js, src/drone-carrier.js, dist/assets/ink-carrier-raised-dr01.png, tests/carrier-art.test.js, tests/carrier-dr01-native.test.js, tests/crowded-rendering.test.js.

- [x] Update geometry/real-pixel tests to the approved reference and run to observe expected failures.
- [x] Register artwork, masks, cannon orientation, bays and service anchors; retain existing timing and interactions.
- [x] Run carrier tests and inspect real browser images for idle, motion, shooting, docking and KO in both facings.

### Task 2: Sound, verification and publication

Files: src/audio.js, tests/audio.test.js, generated dist/src modules, validation documentation.

- [x] Multiply primary shot's three amplitudes by 1.15, updating the existing soft-report ceiling for the requested lift.
- [x] Run full npm test, build and desktop/mobile browser checks; inspect the diff and obtain independent review.
- [x] Commit, synchronize the official source, save and deploy the new version; verify the returned deployment status.
