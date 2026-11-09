# Ink Liberation Epilogue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a thirty-second liberation film after SALTIK Ink victory.
**Architecture:** Offline deterministic Canvas animation renders into an H.264/AAC MP4. A small isolated DOM media controller opens after the existing celebration and returns to the unchanged results. The same media has a standalone viewing page.
**Tech Stack:** Existing vanilla JS/Canvas, Python Playwright for capture and QA, ffmpeg for encoding, native Sites publication.
**Spec:** docs/superpowers/specs/2026-11-03-ink-liberation-design.md

## Global Constraints
- 30 seconds, 1280×720, French narrative, black and warm ivory.
- Four distinct Saltik designs, including both user-supplied missile variants.
- Preserve 4.5-second victory flourish; show results after playback/skip/failure.
- Preserve gameplay, death flow, sound preference and public Site identity.

## Review Focus
- Autoplay rejection exposes a useful manual play control.
- Late play promise resolution after leaving does not restart sound.
- Defeat and rapid replay/home never accidentally open the film.
- Hidden document pauses the film, and a video error cannot trap the player.
- Phone landscape controls and captions remain visible; film is not downloaded at initial game load.

### Task 1: film assets and export
Files: scripts/epilogue-render.html, scripts/epilogue-render.js, scripts/render-epilogue.py; dist/assets/epilogue-*; dist/video/saltik-libres-ensemble.mp4.
Interface: window.renderEpilogueFrame(timeSeconds) renders a deterministic 1280×720 frame after window.epilogueReady resolves. MP4 path consumed by Task 2 is ./video/saltik-libres-ensemble.mp4.
- [ ] Copy generated reference adaptations and environment into versioned art assets; retain source provenance.
- [ ] Draw six animated scenes using canonical cast art and generated assets. Camera movement, gate opening, particles and typography express story beats.
- [ ] Capture 900 frames at 30 fps; encode H.264 yuv420p/AAC with faststart and 30-second duration. Mix the recovered epic music with fade-in and fade-out.
- [ ] Inspect six representative frames, verify duration, dimensions, audio and opening/closing transitions with ffprobe/ffmpeg.

### Task 2: post-victory media integration
Files: src/epilogue-player.js, src/main.js, index.html, style.css, epilogue.html, scripts/build.mjs, tests/browser_epilogue.py.
Interface: createEpiloguePlayer(root,{soundEnabled,onToggleSound}) returns open(onDone), cancel(), syncSound(), active. open loads video lazily and resets playback; ended, skip and media error complete once; cancel never calls onDone.
- [ ] Write browser tests that trigger the real victory boundary with a test-only routed module, then assert film-before-results, skip/results/review, defeat exclusion, mute persistence, autoplay denial, late promise cancellation, visibility pause and media-error completion.
- [ ] Run against unchanged app and observe missing-film assertion failure.
- [ ] Implement isolated player and wire it at resultAt, after the existing win flourish. Add replay-film only on victory results and an independent viewing/download page.
- [ ] Run browser tests desktop and phone; run npm test and npm run build. All checks pass.

### Task 3: review and publication
- [ ] Obtain one fresh whole-change review, address important findings with regression checks.
- [ ] Commit source and media, push exact source to the same Site repository, package dist and publish preserving public access.
- [ ] Confirm successful deployment, return game and standalone film URLs, record verified commit and limitations.
