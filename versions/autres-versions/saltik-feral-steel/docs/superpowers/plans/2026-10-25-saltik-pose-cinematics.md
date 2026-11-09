# Saltik pose and mission cinematics implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Shared checkout, disjoint ownership; root alone commits/builds/publishes.

**Goal:** Correct anatomy and timing, hold the grounded rear pose, queue five efforts and introduce closer mission camera moves.

**Architecture:** Fixed-step game state owns intro and duel progress. Native art and pure geometry own poses; renderer owns exact zoom/viewport. UI suppresses help popups and gates controls during intro.

**Tech Stack:** Native JS/Canvas/Web Audio, lossless WebP, Node tests and existing Python Playwright.

**Spec:** docs/superpowers/specs/2026-10-25-saltik-pose-cinematics-design.md

## Global Constraints

Keep Site audience/identity, original music/sound mix, all physical routes and support, parry/weapon behavior and mobile controls. Touch targets>=44px; no giant arms, camera-specific collision changes, held/repeated QTE counting or premature throw. Existing automatic tests/snapshots stay read-only in browser.

## Review Focus

- Single hit/blast cannot bypass the6HP guard; no guard activates above6HP.
- Five fast inputs finish five visible efforts; pause and QTE rearm cannot replay input.
- Static dodge feet remain grounded in both directions/on slopes with no cycling silhouette.
- Intro rejects rather than queues movement/fire/parry; camera pause/resize/reset do not drift.
- Only two biped profiles shrink; high-route player pod silhouette and native victory stay in frame.

### Task1: Native assets

View existing player/enemy sheets; create corrected2×2 saltik-duel sheet (engage/strain/frontal flight/impact) with original tiny manipulator arms and a separate saltik-victory pose. Inspect native anatomy/alpha; encode lossless WebP and report true crops/foot anchors/dimensions. No programmatic image editing. Ownership dist/assets/saltik-duel.webp,new saltik-victory.webp and external masters/report.

### Task2: Simulation

Ownership src/engine.js,src/enemy-saltik.js,src/saltik-duel.js and engine/enemy/duel/campaign tests. TDD threshold6, no guard before6, all-source clamp; queue five0.24s efforts before throw. Add fields effortsCompleted,effortElapsed; preserve phase=qte until both counts5. Add optional createGame({intro:true}) with introDuration2.2/introElapsed0; default duration0. Intro advances game clock only, freezes movement/enemies/projectiles/queues; emits intro-end once. Pause freezes. Pin regressions and preserve melee threshold/physical contact behavior.

### Task3: Held pose and enemy sizes

Ownership src/evasion.js,src/tachikoma-pose.js,src/tachikoma-art.js,src/enemy-art.js and focused tests. Use one native tilt frame/pose for the rear hold; remove oscillating roll/frame/body motion. Keep timed protection and contact anchors. Shrink walker/soldier profile art scale, dimensions, target and muzzle by.85 only; retain white heavy. Meaningful native support and bounds/muzzle tests.

### Task4: Camera and victory renderer

Ownership src/renderer.js,new src/mission-camera.js,new src/victory-art.js and renderer/camera/art-loader tests. BASE_ZOOM1.155, intro2.2s close→ordinary, won camera reverse2.2s using renderer terminal age; expose cameraZoom/presentationAge for read-only verification. Consume game.introDuration/introElapsed and native victory pose metadata. Root removes popups in main/UI, renderer removes enemy APPROCHEZ. New victory asset required and manifest exact dimensions. Match world projection/cameraY/viewport and keep high routes/pods framed. Paused intro does not move; terminal victory pose stays on physical feet and result-delay4.5s root.

### Task5: Root integration and delivery

Ownership src/main.js,index.html,style.css,src/duel-art.js,duel-art tests,browser checks/docs/helpers. Five visual effort strokes use native engage/strain poses, small grounded bracing; red QTE five marks without text. Remove tutorial/notice/objective/approach/QTE instructions; retain accessible labels. Start browser createGame({intro:true}), disable/gate controls until intro-end and clear inputs at boundary. Victory result delay4.5s. Consume corrected crop anchors. Review whole branch, run full Node and actual phone/desktop intro/static dodge/duel/sizing/victory/all-path campaign; package offline/native archives with exact commit proof, no-force push and publish current owner-private Site.


## Verification checkpoint

- [x] Corrected small-arm native duel and victory artwork; lossless alpha/visible RGBA checked against PNG masters. Eighteen required/local atlases including new victory.
- [x] Guard activates at6/24HP only; queued five0.24s efforts, physical support/contact behavior and optional intro frozen simulation.
- [x] Entire dodge uses native frame1 only, no rocking or cycling; measured far-wheel contact on both slope directions. Walker/soldier art and combat geometry85%, heavy unchanged.
- [x] Base zoom1.155 and intro/terminal camera math, grounded native victory, no explanatory combat overlays, accessible five-mark QTE.
- [x] Full Node suite290/290 passes. Actual desktop/667 intro: close zoom>2.07→1.155, pause freezes, held/repeated intro inputs never leak, controls restore; no page errors.
- [x] Actual 844 phone QTE at6HP passes, including all five visible effort peaks>=.965, held/repeat protection, pause, one kill, unchanged feet/HP and restored controls. Static dodge frame set is exactly[1]; 844/667 touch layout and manual parry pass.
- [x] Actual full route/victory: all seven raised paths, victory93.38s with8 armor, minimum native top85, close victory zoom2.1 and native pose held before result. Mobile tier descent2→1→0 one tier per press,92 armor, no errors.
- [x] Standalone18-asset game: embedded music, three weapons, static native dodge, manual parry, melee and five-effort duel with one kill/restored controls pass; zero external requests/page errors. Read-only final review found no blockers.
- [ ] Exact committed source/archive publication to the existing owner-private Site. Terminal IDs go in the external delivery ledger.
