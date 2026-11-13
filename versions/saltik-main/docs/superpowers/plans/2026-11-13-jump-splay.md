# Jump leg spread implementation

Goal: gentle takeoff/landing leg splay for Striker, Gatling and BT across skins/levels.
Architecture: src/jump-leg-pose.js owns fixed-step cosmetic envelope and world-to-native offsets; existing motor-motion hook advances it. Native geometry uses shifted support origins; native turn masks render same offset. No image changes.
Spec: docs/superpowers/specs/2026-11-13-jump-splay-design.md
- [x] RED tests: takeoff ramp, flight/landing return, zero-delta/pause, partition invariance, all3native rigs and shifted landing support, stable physics.
- [x] Add shared envelope via motor-motion, offset native Striker/Gatling/BT legs with correct ground sampling; preserve authored scripted/terminal poses.
- [x] Add same extension to front/quarter views without shifting torso/weapons; inspect actual jump sequences/landings for all3models, run full suite.
- [ ] Independent final review, fix important findings, commit tested build; push exact source, save/deploy public site, verify live changed files, update existing GitHub backup and recovery ledger.

Validation: 750 tests exercised; existing crouch mock exposed a transform compatibility path, corrected by retaining the original scale path when lateral spread is zero. All 13 affected tests then pass. Browser: 12 native takeoff/turn/landing poses rendered without errors, image inspected. Independent final review: no actionable issues. Publication/backup follow this verified build.
