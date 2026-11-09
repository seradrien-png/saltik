# Implementation ledger — 2026-10-22-feral-steel-plan

Approved design and execution authority were supplied by the parent. The parent owns independent final review, registration, source integration and deployment. No original source or remote was modified.

- Task 1 complete: simulation acceptance tests failed before implementation; movement, jump, damage, weapons, repairs, pause, death/reset, no timeout and boss victory implemented. Eight distinct depth definitions established.
- Task 2 complete: renderer uses generated canyon, tank and boss, original supplied soldier/drone atlas, exactly eight world planes, animation and combat effects. Visual inspection found geometric roots/rocks too flat against the reference; root silhouettes refined and terrain now draws local canyon rock texture.
- Task 3 complete: French title, HUD, keyboard and independent multi-pointer controls, portrait prompt/pause, audio toggle, fullscreen, results and replay. Input ownership tests failed first and pass after implementation.
- Task 4: deterministic full campaign wins in 80.43 seconds with 40 HP, 34 kills, score 13400 while holding forward, machinegun and cannon. A stationary boss strategy wins in 81.03 seconds with 52 HP. 14 tests pass. Portable Chromium desktop/mobile controls, independent pointer cancellation, rotation pause, sound and restart pass with no JavaScript errors. Full real-browser campaign passed: victory in 80.57 simulated seconds, 40 HP, 34 kills, score 13400, zero JavaScript errors; victory screen and replay verified.
- Task 5 complete: buildless dist and README prepared; parent review and publishing remain in parent scope.

Ruling: retain artwork canonically in dist/assets because parent delivered/generated those files there; build copies only runtime source and preserves assets. Cost if changed: move assets and update build script.
Ruling: input bindings support both QWERTY and AZERTY because the interaction is in French; the visible guide favors arrows plus J/K. No extra complexity for touch.
Ruling: boss is a solid arena boundary. Regression demonstrated driving through the original boss hit region made the tank face away and receive contact damage. Blocking before its hull and reframing the arena fixes the physical behavior; red-to-green test added.

## Playable routes update — 2026-10-23

User-authorized update: six substantial sections with ground plus two elevated routes, 96 world units apart, reachable through the existing jump physics. One-way ledges support jump-through and edge fall; Down/S and DESCENDRE drop exactly one tier per press. Both weapons break solid barricades and rock piles, with closest-impact collision, health bars, cracks and debris. Elevated enemies and repairs accompany the routes; the existing eight parallax planes remain.

Eleven new behavior checks failed before implementation, then passed. Review found a turret beyond the shortened final ledge; a further failing regression reproduced it and the spawn now stays inside the platform. Ground and all-six-upper-section deterministic campaigns each win in 80.43 seconds with 40 armor; the elevated campaign uses only ordinary movement/jump/fire inputs. No time limit was introduced.
