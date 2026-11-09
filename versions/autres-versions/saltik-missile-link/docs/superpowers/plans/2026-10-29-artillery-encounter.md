# Artillery Encounter Implementation Plan

> Use focused parallel work for independent audio/art, root-owned simulation/UI/integration, and one fresh whole-branch review. Continue through publication under existing authorization.

**Goal:** More legible ally, powerful warned artillery, a three-tap enemy escape, and manual-fire allied boss support.
**Architecture:** Existing Canvas/ES modules, pure encounter states feeding the normal projectile engine. Native art compositing, local Ogg voice.
**Spec:** ../specs/2026-10-29-artillery-encounter.md

## Constraints
- Preserve original reference and existing public V2 identity/access.
- Enemy missile 50 HP; allied missile 18 / boss 10; shared 7.5s support cooldown.
- Exactly two pre-contact volleys; three separate QTE presses; no extra arms or automatic allied damaging fire.
- Real support surfaces, background anchor unchanged; pause/restart/input cancellation safe.

## Review Focus
- A warning during cooldown or pause cannot grant a free launch or count held input as repeated taps.
- Decoys must divert target selection and cannot merely hide damaging projectiles.
- A route-height difference must not trap the charging enemy or start an airborne, unsupported grapple.
- Boss death during a QTE or allied attack must finish once with both actors visible.
- New voice and art assets work in public and standalone packages without external dependencies.

### Task 1 — encounter simulation and UI (root)
- [x] Add failing behavioral tests for two salvos, cooldown interception, three press effort/escape, 50 HP impact and companion manual-fire/decoy behavior; run red.
- [x] Implement src/missile-campaign.js and integrate engine.js, missile-battery.js, missile-link.js, input/main/index/style. Inputs: intercept and qte; projectile spawn via existing helper; all suspended during cinematics.
- [x] Make targeted tests green and update obsolete assertions for changed encounter behavior.

### Task 2 — native presentation (art worker)
- [x] Increase canyon ally height/colour, add native-art clash, escape smoke/flares, foreground companion and paired victory in missile-link-art.js/renderer.js/new missile-campaign-art.js.
- [x] Increase artillery blast strength through combat-effects.js metadata; meaningful drawing tests and visual QA. Avoid changed player face/extra arms.

### Task 3 — voice (audio worker)
- [x] Generate the exact new line with the established voice chain; integrate event map and verify asset/voice lifecycle tests. Do not alter other clips.

### Task 4 — integrate, verify, release (root)
- [x] Full suite/build; phone/desktop browser screenshots for warning, clash, escape, companion/victory; check no JS errors.
- [x] Fresh review; fix significant findings with regressions; commit exact source and build.
- [ ] Package standalone/source/deployment; verify archives; push exact SHA, save and deploy the existing public V2. Persist release provenance.
