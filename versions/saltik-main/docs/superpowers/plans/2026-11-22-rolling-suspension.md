# Rolling suspension implementation plan

**Goal:** Integrate the approved rolling suspension preview throughout the game.
**Architecture:** Share an anchored two-segment presentation transform. Actual support contacts drive compression and passive flex; existing fixed-step support pose supplies damped cabin pitch/heave. No synthetic terrain or timed gait enters gameplay.
**Tech Stack:** Existing JavaScript canvas renderer and Node tests.
**Spec:** docs/superpowers/specs/2026-11-22-rolling-suspension-design.md

## Constraints and review focus
Preserve all assets, costumes, weapons, collision rules, jump poses, native turns and KO. Flat terrain must not generate a walking cycle. Both facings and varying scale must keep roots and seams closed. Missing support at edges must remain missing. Verify all five levels and three playable models, plus enemy BT, specialists and DR-01.

## Task 1: Shared anchored articulation
- [x] Add tests for fixed roots, continuous knee/wheel seams, passive bend and flat/no-time-cycle behavior. Run RED.
- [x] Add src/rolling-suspension.js exposing rollingLegPose(part,k,anchorX,enabled) and rollingStrutPoint(part,point), plus drawRollingLegStrut. Route grounded native struts through it; retain existing jump/KO path.
- [x] Add damped body pitch selection when a support pose exists, keeping fallback and stage overrides. Use the original support solver for exact ground contacts.
- [x] Extend native players, enemy BT, specialist Striker/Longrange and DR-01. Remove DR-01’s remaining periodic wheel stride.
- [x] Run targeted tests and full npm test, fixing regressions.

## Task 2: Verify and publish
- [x] Build; browser-check all models/levels, slopes, stops, jumps, turns and KO.
- [x] Review diff, preserve unchanged active assets/audio and weapon code.
- [ ] Commit and push source, preserve all GitHub backup editions, package with existing lossless assets, publish same site, verify public files.

## Integration notes and review

The approved preview is mapped onto real game supports, without importing its artificial demonstration terrain or animation clock. Damped pitch uses the small support-pose transient relative to actual stair pitch so steep structures keep their required alignment. Original ground-contact solving remains unchanged. DR-01’s remaining periodic stepping has been removed in favor of this same rolling suspension.

Independent review found one important issue: vertical knee travel at .46 of total travel could invert the lower section on strong crouched descents although total strut length remained positive. Regression tests reproduced both the measured Striker case and the actual checkpoint descent for all three models before correction. Vertical travel now follows the .54/.46 segment lengths, preserving positive segment scales whenever total strut stretch is positive. No additional art or change to contacts is needed.

Final evidence: npm test passes 1037/1037; Chromium mobile passes all 15 character/level combinations, zero errors/missing files. Runtime265616568 bytes; existing active artwork/audio/video unchanged.
