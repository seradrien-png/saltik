# Distress and Variable MIRV Implementation Plan

> **For agentic workers:** Independent carrier/engine/overlay tasks, tests first and fresh final review.

**Goal:** Readable damaged carrier behavior and a farther MIRV with held angle control and ground preview.
**Architecture:** Carrier owns deterministic distress and measured smoke; engine/input own release and shared ballistics; overlay uses exported pure predictMirvImpact with12Hz cache.
**Tech Stack:** Existing Canvas2D/JS modules/Node/Playwright; no dependencies or new native atlas.
**Spec:** ../specs/2026-11-02-distress-variable-mirv-design.md

## Constraints and review focus
- NeverkillSaltik: stages60%/85%,18HP cabin, service pose settled before QTE.
- Actual native weapon mouths/bore, held/noautofire, real release vs cancellation, cooldown and multitouch.
- Prediction/live terrain/platform/cover/targetarmor agreement and zero live mutation; avoid prediction hitches.
- Fixed spot and planted tires during distress, neutralized quiet; real damaged emitter placement/bounded smoke.
- Preserve original versions, other weapons/boss/UI unless controls need held indication.

### Carrier
- [x] New smoke/distress tests RED→GREEN; bounded draw; all existing physical hand and wheel checks.
### MIRV engine/input
- [x] Release/hold/tap/cancel/turn/evade/pause/cooldown/multisource tests, increased range and actualbore release.
- [x] Shared launch/split/prediction; terrain/platform/cover actualfidelity and bounded/cached geometry performance.
### Scope
- [x] Overlay idle/cancel/cache/movement/offscreen badge tests RED→GREEN; actual ground footprints.
- [x] Integrate live predictor and inspect actual game aim/release at desktop/touch sizes.
### Release
- [x] Full checks/build/browser/campaign/fresh independent review; fix concrete findings.
- [ ] Commit verified source, immutable ZIP/standalone/deployment archive and publish same public V2.
