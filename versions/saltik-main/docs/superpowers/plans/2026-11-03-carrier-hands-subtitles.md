# Carrier Hero Hands and Voice Captions Implementation Plan

> **For agentic workers:** Execute inline, task by task. User approved visual and requested immediate integration.

**Goal:** Give blue carrier the hero's exact small articulated ivory/graphite arms and add readable colored speech cartouches.
**Architecture:** Reuse the actual hero atlas arm patches on carrier mounts, leaving chassis, wheel grounding, gun/drones and nonlethal KO unchanged. Actual queued voice start drives a small caption controller, with audio cancellation and view lifecycle clearing stale text.
**Tech Stack:** Existing JS, Canvas2D, HTML/CSS, Node tests, local Playwright. No dependencies or new large art.
**Spec:** Approved visual exec-5f2abe32-8df1-4c98-9488-54004fecf0e9.png and user request in thread.

## Constraints/review focus
- Both arms use same hero pixels, same world scale; no left-behind original claws, no floor crossing in KO, no change to muzzle or service hand contact.
- Captions show actual spoken English phrase, including Limule and Regalec and Saltik don't kill Saltik, never game events ahead of queued speech.
- Compact ivory/petroleum pencilled cartouche, bottom center clear of directional pad and weapons, no input capture.
- Pause/home/restart/mute cancel old captions; victory remains readable; short lines have reading time.
- Preserve prior versions, public audience, exact existing Sites project and original repositories.

## Tasks
- [x] Add caption mapping/controller tests and actual queued-audio callback regression RED; implement controller and lifecycle callbacks to GREEN.
- [x] Render hero atlas forearms at carrier mounts, articulate/tuck on KO, remove legacy claws; verify actual source atlas, scale, muzzle and grounded KO.
- [x] Add colored accessible cartouche DOM/CSS, wire main to actual voice starts/cancellation. Local browser screenshots at desktop/phone sizes and voice queue/cancellation checks.
- [x] Full tests, build, commit, source/archive verification and publish same V2 URL. Preserve rollback branch and update publication record after success.
