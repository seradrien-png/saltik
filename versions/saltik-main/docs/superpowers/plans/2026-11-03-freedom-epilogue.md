# Saltik Independence Epilogue Implementation Plan

> **For agentic workers:** Root produces film/art/audio and validates publication; bounded integration agent owns controller/main/HTML/CSS/tests.

**Goal:** A short English cinematic after the existing victory pose: Saltiks want independence from human service and to bring their brothers home, without hatred or destroying Saltiks.
**Architecture:** A 32-second ink-illustrated 2.5D montage is encoded as a real H.264/AAC MP4, with cinematic camera moves, light, grain, English caption cartouches, original score and processed original robotic narration from the established voice family. A lazy video controller gates the won result after the existing 4.5-second pose and safely returns to results on end/skip/error.
**Tech Stack:** Existing Canvas/JS/HTML/CSS; image_gen scene assets; ffmpeg/Flite and original synthesized music; local Chromium render and QA. No game dependencies added.
**Spec:** User's current request and two provided blue/lime and navy/red Saltik references; creative montage/duration delegated to us.

## Constraints / review focus
- Intact four-legged same-chassis Saltik siblings; no killing, hatred or militant anti-human message. Clear English independence/family narrative.
- Film is separate video resource, no download during menu/gameplay, no added gameplay rendering cost.
- Existing victory animation and cue play before movie; defeat never triggers movie. One movie per successful run.
- Autoplay rejection provides Play, skip always available; ends/error/stall returns results; pause/tab-hidden/mute/replay/home have guarded resource lifecycle.
- Phone landscape layout, baked subtitles, inline playback, original versions/backup retained, same public V2 Site.

## Tasks
- [x] Produce four consistent illustrated plates (hero reflection, tethered siblings, unplug rescue, dawn reunion) from references.
- [x] Synthesize seven short English voice phrases with existing Saltik pipeline and original warm minor-to-major score/effects, restrained mix.
- [x] Render 960 deterministic cinema frames at 30 fps/1280x720, H264/AAC faststart MP4, export poster and script.
- [x] Implement lazy controller with race/cancel/error/end/skip/readability tests and existing 4.5s pose gate; full source tests.
- [x] Inspect real movie frames and audio, ffprobe/decode/peak checks, browser won/end/skip/replay/mute/blocked-play/death/no-eager-load checks on desktop/phone.
- [x] Build, commit exact source/movie, verify source+offline artifacts and original repos, save and publish same public Site, update publication pointer only after success.
