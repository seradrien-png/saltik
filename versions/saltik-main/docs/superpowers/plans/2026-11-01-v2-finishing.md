# V2 Finishing Implementation Plan

> **For agentic workers:** Use executing-plans / independent parallel workers for bounded files.

**Goal:** Apply approved colors and pencil controls, fair held dodge, livelier enemy duel, coherent boss poses/terrain and faster missiles.
**Architecture:** Existing Canvas/ESmodules engine, preserve frozen V1. Independent UI/art/boss/world work, root owns combat/evasion/navigation integration.
**Tech Stack:** ESmodules, Canvas2D, native generated PNG maps, Node tests, Chromium touch QA, public Sites.
**Spec:** ../specs/2026-11-01-v2-finishing-design.md

## Constraints and review
- Hold/release/exhausted dodge, pause and multiple pointers must remain coherent; no player deflection path remains.
- Enemy movement stays supported by finite routes, no shooting through own body or QTE below terrain.
- Guided obstacle avoidance and red lock markers survive optimization; benchmark equal recorded scenes before/after.
- Native hand geometry, both boss actions and visible muzzle flash match actual contact.
- Same mobile target sizes; partial UI fading must not disable touches.

## Tasks
- [x] UI: index/style/input/main and UI tests; pencil border/icons, center held shift, no deflect shortcut, QTE above pair, player overlap opacity. Root provides capped engine state.
- [x] Art: three player/turn/enemy material washes only, approved palette; no changes to other enemies/native geometry. Root integrates maps/outline cache.
- [x] Boss: compare original V1 renderer and implement coherent native limb effort/tear/fire/pod poses in ink-encounters, targeted geometry tests and visual snapshots.
- [x] World: trace native atlas/support and obstacle drawings, correct floating foundations/destructible style with route-aware bases; targeted tests/screenshots.
- [x] Combat: failing tests for 2s cap/release and no deflection, stronger Saltik/20% threshold/seeded retreat and approach; implement and check.
- [x] Performance: record missile simulation/profile baseline; cache immutable navigation surfaces and shared geometry where measured; retain collision tests and compare timings.
- [x] Integrate: meaningful whole suite and full campaign, touch release/overlap screenshots, both boss actions, preserve V1 hashes. Exact-source commit and standalone/source/archive publication follow the verified checks; native save/deployment IDs are recorded outside the repository in deliverables/saltik-pastel-v2-finishing/deployment.json.
