# Saltik Menu and Audio Balance Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for the independent engine and audio tasks; root owns UI integration and publication.

**Goal:** Give the menu the Saltik identity and implement the user’s HUD, audio, reload, voice and boss pacing changes.
**Architecture:** Existing native Canvas renderer and HTML/CSS shell; engine timing and actual volley counters feed UI, event-mapped local V2 clips feed existing cancelable voice queue.
**Tech Stack:** Native JS/Canvas/WebAudio, Ogg/WebP, FFmpeg/flite/rubberband, Node and existing Chromium/Playwright.
**Spec:** docs/superpowers/specs/2026-10-26-saltik-menu-audio-design.md

## Global Constraints
Preserve exact Black Canopy file, native routes/art, controls, private audience and optional two boss QTEs. No dependencies. Independent file ownership.

## Review Focus
A held input or pause cannot skip reload or add QTE taps; count only real rocket volleys; native pod action cannot appear before first firing; longer opening voice cancels correctly; six clips embed offline; removed HUD nodes cannot leave main.js null accesses; small landscape menus remain usable.

### Task1 — Engine worker
Files: src/engine.js,src/boss-tank.js, combat/boss tests. API: PRIMARY_FIRE_TIME3,PRIMARY_RELOAD1.32; boss.podVolleysFired; availableBossAssault(g) requires real volley for pod.
- [x] Add focused failing timing, slower boss cadence and actual-volley gating checks.
- [x] Implement timing and shared counters; update relevant old assumptions; run focused checks and deterministic campaigns.
- [x] Report API and freeze owned files. Root commits.

### Task2 — Audio worker
Files: src/audio.js,src/voice-lines.js,dist/audio/voices/ready.ogg,goodbye.ogg, audio/voice tests; generation masters outside checkout.
- [x] Pin requested event mapping/lifecycle and softer-shot/reload/music behavior with meaningful focused checks.
- [x] Reuse accepted V2 generator for only new Ready and Goodbye; retain other clips.
- [x] Raise music around.10, soften firing, strengthen and align reload1.32; run focused audio/voice checks.
- [x] Report paths, audio choices and freeze. Root commits.

### Task3 — Root UI/integration
Files: index.html,style.css,src/main.js, optionally renderer title framing, README and browser probes.
- [x] Restyle menu in Saltik colors/forms with exact adjacent credit; remove live progress/score/status and all obsolete updates.
- [x] Update3-second HUD/reload help; integrate worker APIs; build and full Node suite.
- [x] Verify responsive title/clean HUD, loop/mix/voices/reload, normal input campaign/pod gate/two QTEs and offline6clips.
- [ ] Independent fresh Sol xhigh review; fix actual issues, exact source/dist/artifact verification, commit/push and native same-Site publication.

## Verification record

Root full Node suite355passed/0failed and build passed. Menu/HUD normal keyboard/touch checks passed1440×900,844×390,667×375; live progress/score/status removed without errors, signature adjacent to title. Actual audio render checks confirm more present music during softer gunfire, marked reload cues and limiter output below clipping. Opening V2 voice1.5856s ends within intro; Goodbye.5604s plays once at each throw. Voice pause/mute/home/restart and missing-file fallback pass. Arsenal browser verifies3seconds fire/1.32seconds reload, no shots during reload and pause/input rules. Desktop and touch full boss campaigns verify physical2-rocket first salvo before pod button, 2ordered3pressQTEs, six hull shots, ground returns and victory; each records Ready1,Targetlock9,Detected3,Grabhim3,Goodbye3,Victory1,failed0. Standalone includes6clips+originalBlackCanopy, menu/cleanHUD/5tapduel/Goodbye work with zero observed subresource requests. Fresh read-only Solxhigh review found no concrete blocking or important issue in combat/audio/UI. Root handles exact committed source/artifact parity and native same-Site publication.
