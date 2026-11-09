# Living Saltiks Implementation Plan

> **For agentic workers:** Use bounded independent workers and root integration with verification before completion.

**Goal:** Expressive lightweight native animation for both Saltiks, honest missile pods, and a body-braced boss breach.
**Architecture:** Existing native pixel masks and Canvas geometry; shared pod geometry and slot state, fixed-step movement presentation. Backup source3b36d0d and prior release archive remain intact.
**Tech Stack:** JS ESmodules, Canvas2D, Node tests, Chromium local QA, static Sites.
**Spec:** ../specs/2026-11-02-live-saltiks.md

## Global constraints / review
Keep all earlier gameplay rules and palettes, no manual deflect. Geometry must match drawn cannon/pod mouths at motion extremes. Planted wheels follow terrain in both directions; lifted wheels stay intentionally ungrounded. Native claws keep size, no facial mouth motion. Pod refill must not restart ammo early or animate in pause. No expensive per-frame raster operations. Source/dist, offline bundle, frozen V1, finite routes and both QTEs checked before publication.

## Tasks
- [x] Player: ink-saltik native suspension/body momentum, wheels, hands and eyes, short mechanical cannon recoil; maintain anchors and public geometry contract. Red/green pose tests.
- [x] Enemy: ink-enemy-saltik native leg/wheel rig, grounded support, recoil/hands/eyes; no changes to native colors or AI balance. Engine root supplies ground sampler. Red/green tests.
- [x] Boss: ink-encounters hull hatch retained brace, body lean and finite roof support, bounded cannon aiming, axial firing recoil, visible one-hand anchor. Preserve three-press effort and pod scene; geometry/visual tests.
- [x] Root pods: shared ink-pods geometry/render, timed empty/reload state from actual launches, sequential launch times, preserve counts/damage/recharge. Hook normal render paths and both weapon geometry functions. Test geometry/slot/cadence/pause.
- [x] Integrate/review: check all tests, native scene visual/contact sheets, full campaign, physical input and performance-sensitive salvo. Backup, commit/source push/archive, same public V2 publication and retained V1.

Native publication outcome is recorded separately in deliverables/saltik-pastel-v2-living/deployment.json after exact-source packaging.
