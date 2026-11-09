# Ink Edition — reference pass, 2026-11-01

Scope: separate playable Ink demo, exit at x5150. Original V1 repository and its saved release remain untouched. The approved canyon and enemy atlas are unchanged.

- Native transparent stone/root bridge and overgrown observatory; measured upper walking edges share coordinates with collisions. A separate lower ravine exposes the bridge arch. Minimum centerline lower clearance is144worldunits, with225unit blended shoulders beyond each landmark.
- Per-game ground sampler is used by player/enemy placement, suspension, collision and missile navigation. Games without this sampler retain V1 terrain.
- Three independently drawn intermediate turn views join the two side views; the retained0.60s yaw state selects all five. Native wheel pieces follow slopes; the rigid faceplate is not animated. No collapse-to-zero mirror transition.
- Reference black/cream controls: contiguous nine-sector pad, drop above, four right-hand actions including existing evasion. Functions and enemy art retained.

Verification:
- Full Node suite:386passed,0failed,27.24s. Includes real jump onto the bridge, per-game ground isolation, continuous lower corridor, both turn directions/retargeting, turn wheel grounding on slopes and native image masks.
- Simulated complete traversal without invulnerability:won in21.62s,5151.83worldunits,100armor,160shots,4MIRVs,1guided salvo,9kills,4destroyed obstacles. This remains a short style demo.
- Chromium desktop1280×576/mobile851×393: start, movement/fire, upper path/drop, MIRV/guided, deflection, held evasion, pause, ending/replay; no script errors or failed responses.
- Additional browser probes: bridge top, under-arch, bridge exit, observatory top/exit; all five turn views visually inspected.
- Actual CDP multitouch at1280×576,851×393 and667×375: move+fire, releasing one finger preserves the other, cancellation clears inputs, evasion hold/release, pause while firing clears inputs; all visible targets≥44CSSpixels and within viewport. No page errors.
- Independent review found inadequate clearance at the two original cutout exits. Corrected and rechecked: minimum144at center,125.36/122.43over the full hull width. No remaining actionable issue in the bounded review.

Screenshots and browser reports are kept outside the source tree under /workspace/deliverables/saltik-ink-reference-qa. Source, standalone and deployment packages are saved separately from the preceding Ink release under /workspace/deliverables/saltik-ink-reference-pass.
