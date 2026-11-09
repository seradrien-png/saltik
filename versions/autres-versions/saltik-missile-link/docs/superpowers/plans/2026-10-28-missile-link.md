# Missile Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Introduce two distant missile batteries and player-controlled laser support in a separate Saltik V2.

**Architecture:** A pure missile-link module owns targeting, cooldowns and distant flights. The engine supplies damage callbacks and admits hostile missiles into its existing collision system. Dedicated art and input modules keep the integration bounded.

**Tech Stack:** Existing JavaScript modules, Canvas 2D, Web Audio, Node tests, Playwright.

**Spec:** ../specs/2026-10-28-missile-link-design.md

## Global Constraints
- Original reference v24, its repository, tag, saved archive and Site remain untouched.
- New atlas retains exactly four wheel legs and two small manipulators per robot.
- Preserve existing combat, routes, audio, cinematic and installation behavior unless the new feature requires a named integration.

## Review Focus
- A canceled touch or pause must not launch a salvo on resume.
- Moving camera or player cannot teleport a missile already in flight.
- Dying targets, exhausted threats and no targets cannot leave missiles spinning forever.
- Enemy projectiles must remain shootable, deflectable and avoidable after entering the foreground.
- Phone controls and dialogue must not hide the active player or each other.

### Task 1: Long-range simulation
Files: create src/missile-link.js and tests/missile-link.test.js; integrate src/engine.js.
Interfaces: createMissileLink(), advanceMissileLink(g,input,dt,hooks), cancelMissileLink(g), batteryPositions(g), supportAim(g,input), linkIntroLine(g). Hooks damage(target,amount), impact(x,y,details); existing g.projectiles admit enemy-missile descriptors.
- [x] Write and run tests for release, cooldown, cancellation, halfway activation, interception, damage and target disappearance; observe failure.
- [x] Implement bounded flights, target selection and engine connection.
- [x] Run focused tests and commit.

### Task 2: Designator controls
Files: create src/support-input.js; modify input.js, main.js, index.html and style.css; tests/support-input.test.js.
Interfaces: bindSupportDesignator(button,input,isPlaying,unlock,onAim,onCancel); input support action and aim point feed the simulation.
- [x] Prove drag, tap, pointer cancel and independent movement in failing tests.
- [x] Add APPUI button, desktop M/mouse and cooldown state, cancellation on every view/cinematic change.
- [x] Run input and link tests and commit.

### Task 3: Art, distant staging and introductory conversation
Files: create src/missile-link-art.js; modify renderer.js, voice-lines.js and audio.js; new generated atlas in dist/assets; tests/missile-link-art.test.js.
- [x] Test correct atlas rows, visibility boundaries, targeting overlay and bounded projectile paths.
- [x] Paint the introductory ally, distant terrain-anchored batteries, laser, distinct trajectories and defensive interceptions.
- [x] Add short conversation using existing voice identity where available; retain start line and score.
- [x] Run focused and full regressions; commit.

### Task 4: Review and publish the separate game
- [x] Browser checks at start, halfway, attack/interception and phone control sizes; capture screenshots.
- [x] Fresh whole-branch review, resolve material findings and run relevant regressions.
- [ ] Update V2 identity/links, package standalone game and source, push only V2, save/deploy V2; verify original unchanged.
