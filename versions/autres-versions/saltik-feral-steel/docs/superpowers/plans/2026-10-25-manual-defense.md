# Manual defense, framing and terrain plan

Spec: docs/superpowers/specs/2026-10-25-manual-defense.md. Contracts: .superpowers/manual-defense/contracts.md. User authorizes autonomous execution and agents. Root chooses small timing/UI details; no new approval loop.

- [x] Player: two rear animations and pure timed protection/manual parry, tests late/edge damage and unchanged hand recovery.
- [x] Engine: all-source rear protection, manual parry rising edge/reflection/cooldown/locks, physical/campaign tests.
- [x] Terrain: remove incoherent surface imagery, add substantial filled foreground sections, preserve traversal.
- [x] Audio: foreground effects audible above music; actual browser evidence for guns/reload/missiles.
- [x] Root: new native dodge art, zoom1.1, .9transparent pad, right-hand manual button/H and recharge, real input/viewport/music tests.
- [x] Root: independent review, final suite, desktop/mobile campaign and screenshots.
- [x] Root: standalone artifact and browser verification.
- [ ] Root: exact committed source provenance and same-private publication; terminal result is recorded outside the source archive.


Verification checkpoint

- Independent engine review approved: projectile entry and exit use swept relative overlap. A protected shot continues in the forward plane; if it still overlaps on return, the first exposed instant wins. Earlier terrain collision or expiry still takes priority.
- Full Node suite: 254 tests pass, 0 fail.
- Actual browser route campaign: all seven raised routes, victory at 84.07 seconds with 16 armor; mobile three-tier descent passes; minimum native top is 85.
- Actual browser manual controls: both new native dodge sequences, exact durations and protection boundaries, separate H action, pause/held semantics, 844×390 and 667×375 touch layouts. Pad width 147.59px with 44px minimum targets; projection zoom 1.1.
- Actual AudioWorklet capture with Surtr playing: foreground sound RMS is 5.6–19.2 times music for sampled shot/reload/MIRV/parry; output peak 0.4963, mute zero, duck recovery and media transitions pass.
- Native dodge PNG to WebP is lossless for every visible RGBA pixel; original supplied MP3 unchanged.
- Real scheduled enemy plasma reflected using ordinary H at hand elapsed 0.1833 seconds; returned projectile team is player and vx is +498.35; no page errors. The harness now times the original combat shell rather than the larger art silhouette.
- Actual controls regression: eight directions, drag, independent ownership, pause/portrait/blur on desktop and both phones; no errors. MIRV elevation and 5-second/0.7-second reload regression passes.
- Standalone browser: embedded Surtr playing, all three weapons, new native dodge atlas, separate manual H and native melee; zero subresources and page errors. Inline JavaScript syntax and source/dist parity pass.
