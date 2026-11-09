# Living Saltiks release verification

Baseline V2 commit3b36d0daef8c9a8088633a4c887b75cad27da8f8 remains in history, local backup/v2-before-living-saltiks-20261102, native Site saved version2, and untouched source/standalone/archive at /workspace/deliverables/saltik-pastel-v2-finishing. Frozen Encre V1 remains44110aa2dd80e668b2b9fd15aa6635ad9da6cef2. No native PNGs, palette, controls or audio changed.

## Implementation
- Native player and enemy leg masks, planted suspension, wheel texture/ink rotation, bounded motor spring impulse, hands and reflected gaze; original four-legged anatomy with hidden fourth leg retained.
- Cosmetic spring motion reads actual displacement and velocity changes; no movement speed or collision dimensions altered. Momentum is bounded to .055rad and1.35px, no per-frame image baking/filtering added.
- Three player rounds launch at0/.085/.17s and two enemy rounds at0/.09s through measured existing bore centers. Counts, damage, target navigation and cooldown balance remain unchanged. Round sockets empty on actual launch and feed replacement rounds near readiness; original turnaround views and enemy front view retain slot state. Pausing freezes the pending launch and refill. Duel/boss entry cancels unlaunched reserved rounds instead of firing them after a cinematic. Rear-plane weapon mouths use the same .92 scale as drawing.
- Boss hull effort retains the original painted torn hatch caught at a corner; native claws grip without stretching their pixels. Whole-body pitch reaches~1.28rad; independent barrel trim stays<=.30rad, short axial recoil<=2.63px, six pulses illuminate the measured hole. Finite wheel support/tucked overhangs and a render-only .4s eject blend prevent snapping; gameplay timing, damage and ejection stay unchanged. Pod action preserved.

## Verification
- Fresh full suite475/475 passes, zero failures/skips.
- Full campaign simulation reaches victory at98.68s, both boss actions completed. Armor protected in fixture; this measures progression, not difficulty.
- Final built-dist Chromium campaign: nine routes, five-press enemy duel, both three-press boss actions, actual victory;1280x576,851x393,667x375 layouts. No JS errors or failed resources. Evidence /workspace/deliverables/saltik-living-qa.
- Desktop and844x390/667x375 physical key/touch holds retain2s cap/release/repress, removed H action, pause clearing. No errors.
- Native actor contact sheets: /workspace/deliverables/saltik-live-player and /tmp/live-enemy-sheet.png. Boss three actual QTE presses/six firing events, retained grip, aperture flash, spent pods and ejection proof: /workspace/deliverables/saltik-pastel-live-boss.
- Independent focused review:22 live tests passed, no Important/Critical findings. Additional motion impulse and rear-scale corrections have targeted/full-suite coverage.
- Equal simulation CPU fixtures against priorV2 atx900/3800/10300,360 steps at1/120 and3 repetitions: median totals183.75/217.77/252.97ms before vs182.54/194.33/252.46ms after, all three guided hits retained (targetHP76) in every repetition. This measures simulation CPU, not physical phone rendering FPS.

Exact source/dist and archive/commit identity, offline standalone and native publication outcome are recorded during release. Physical Android/iOS devices were not available for this verification.
