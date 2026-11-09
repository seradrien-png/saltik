# Lunar level two implementation plan

> Execute inline with one bounded implementation subagent for campaign/model/render work; controller integrates menu, audio, verification and publication. User approved the design and execution. Do not request another permission gate.

**Goal:** Add Archives lunaires, a distinct campaign of similar playable duration, menu selection and post-level-one access, and +20% primary cannon volume.

**Architecture:** Existing native player/physics and Saltik art remain shared. An independent lunar scene definition and renderer module own level2 terrain, platforms, encounters, falls, checkpoints and three-wave portal defense. Default level1 stays unchanged. Campaign selection is runtime state, not a second unrelated game.

**Tech:** JavaScript modules, Canvas2D, native WebAudio, existing Node tests and Chromium QA.

**Spec:** docs/level-design/niveau-2-proposition.md, plus user approval: after level1 and menu selection, similar duration, +20% main fire volume.

## Global constraints

- Preserve native Striker, green/orange Saltik and approved blue/ivory carrier drawings.
- Level1 layout and timings unchanged, current film still accessible after its victory.
- Level2 must differ in real layout and encounter order, not only its background.
- Same controls, weapon mechanics and native animation; main cannon amplitudes multiplied by 1.20 from current values only.
- Level2 final objective is three-wave portal defense; no automatic Colosse.
- Both menu access and level1 results access, replay restarts the selected level.
- Test source copies first, update GitHub versions/saltik-main and deploy Matin Doré when verified.

## Review focus

- Platform traversal and falling cannot softlock, checkpoints restore safe footing.
- Level1 victory film then next-level button, without skipping film or losing replay.
- Pause freezes wave/fall timers and renderer effects; fresh restart resets objective.
- Saltik visuals and muzzle geometry remain unchanged; non-Saltik styling must not alter projectiles.
- Actual campaign traversal time comparable to level1, including combat windows.

### Task 1 — lunar campaign and rendering

- [x] Add failing meaningful tests for level identity, unique route/schedule, duration scale, no Colosse, wave progression, safe falls and pause.
- [x] Implement src/lunar-level.js and src/lunar-world.js with shared native geometry. createInkScene({level:2}) returns lunar scene; updateInkScene delegates common update plus lunar objective. Add only minimal engine flags needed to suppress default boss and handle ground/death limits; preserve defaults.
- [x] Wire conditional lunar terrain/background painters into ink-renderer, preserving level1 branches. Generate reference-inspired original sky art if possible and register it as a required asset.
- [x] Run targeted meaningful tests, compare real game screens to reference, inspect layout/physics alignment.

### Task 2 — menu, transition and audio

- [x] Add level selector and a level2 button to won-level1 results after the existing film. Start/replay/home preserve sensible selected-level behavior. Expose level/objective in read-only snapshots and visible mission status.
- [x] Multiply the three primary-shot amplitudes by1.20, leave master/music/enemies unchanged. Update preservation normalization only for this authorized lift.
- [x] Verify actual menu clicks, pause/replay, transition availability and browser audio scheduling.

### Task 3 — validation and delivery

- [x] Run complete suite and build, inspect desktop and landscape phone images and real traversal, victory and pause behavior. Obtain independent final review.
- [ ] Commit canonical source; refresh official Sites base, push and deploy saved version. Update only GitHub versions/saltik-main with its current source/build, preserve other snapshots/history; refresh current version hashes and source refs in backup manifests.
- [ ] Verify remote source commit, successful Sites deployment and final URLs; persist progress and release record.
