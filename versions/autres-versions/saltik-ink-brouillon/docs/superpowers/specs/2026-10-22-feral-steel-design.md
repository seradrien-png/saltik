# Feral Steel — approved game design

The user approved a new horizontal run-and-gun inspired by their Tachikoma game and Metal Slug, using a squat orange/gray tank and a lush rocky jungle canyon inspired by Crashsite. Astra executes the approved scope. A complete run should take approximately 90 seconds, with **no time limit or countdown**.

The game uses buildless HTML, CSS, and ES-module Canvas JavaScript. A fixed-step simulation is independent of rendering and tested in Node. The presentation is French, cinematic, legible, and full-screen. Both keyboard and simultaneous multi-touch controls support movement, jump, machinegun and a recharging cannon. Pause, audio toggle, restart and a landscape prompt are included.

Exactly eight world depth layers: (1) sky/backdrop, (2) distant ridges, (3) striated canyon cliffs, (4) waterfalls and distant jungle, (5) roots and middle vegetation, (6) industrial ruins, (7) terrain/entities, (8) foreground ferns. Each layer has a distinct parallax factor. Generated canyon art can enrich the first layer; a faithful supplied tank sprite replaces a procedural fallback.

A roughly 17,000-unit traversal has ground mechs, turrets, flying drones, health pickups, destructible supply crates, projectile feedback and a final heavy walker boss with telegraphed attacks. Terrain is traversable without precision platforming. Jumping dodges attacks; slight forward targeting makes flying enemies accessible on touch. Completion means defeating the boss. Health loss permits immediate replay. Progress is distance based. No timer causes failure.

Acceptance: playable from title to victory, keyboard and mobile landscape inputs work, eight moving depth layers are explicit in code, no runtime dependencies, local tests and browser smoke checks pass. Parent owns registration, final independent review, source synchronization and deployment. Implementation proceeds under the already approved execution request; repeated spec/plan approval gates are superseded by developer autonomy instructions.
