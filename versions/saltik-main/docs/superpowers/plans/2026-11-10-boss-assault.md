# Level one boss replacement

Goal: faithfully integrate the four supplied ivory/orange boss designs, keeping the destroyed wreck visible after victory.
Architecture: transparent four-frame atlas, shared world-space weapon anchors, timed main and fender bursts. Keep existing roof collisions, interactive pod/hull assaults, and victory flow.

- [x] Preserve published v21 on GitHub before editing (fe38b5e).
- [x] Add failing behavior tests for third salvo, three separated main shots, alternating fender sequences, 20% frenzy, persistent wreck.
- [x] Implement art and combat, update only tests superseded by the explicit new specifications.
- [ ] Run full suite, inspect all four states and real combat in Chromium, review bounded boss changes.
- [ ] Build, synchronize exact source, publish and back up independent main edition on GitHub.

Chosen interpretation: three actual rocket salvos launched by the boss unlock the optional pod removal. Main cannon .19s between three large rounds; fender pair alternates twelve .24s shots then 2.2s recovery. At HP <=20%, weapon clock x1.55 and charge pace x1.4; warning remains visible. Full wreck remains in world with no active attacks or collision target.
Review focus: no live pod removed merely by entering frenzy; pause freezes bursts; no extra shots after death; muzzle/art registration; wreck survives victory and celebration. Other editions and lunar architecture preserved.

Review corrections: native shoulder deck at -120, hull interaction on turret at -151; shared native hatch and pod grip/tear anchors. Legacy art paths retained for compatibility.
