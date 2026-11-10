# SALTIK V2 — Matin Doré

Independent pastel edition of Encre V1. Player: amber/ivory/petroleum; enemy Saltik: olive/orange. Pencil controls partially fade over the player. Enemy Saltiks have 40 HP, varied seeded movement/attacks, and autonomously approach for a five-press duel at 8 HP (20%). V1 remains at https://saltik-ink-edition.ser-adrien.chatgpt.site; this edition uses https://saltik-v2-matin-dore.ser-adrien.chatgpt.site.

The original ink geometry and source pixels remain intact; generated material washes are baked once at load. Bastion boss art uses new integrated pod/hatch anchors. See docs/superpowers/specs/2026-11-01-pastel-v2.md for scope and docs/ink-v1-source.json for provenance.

The living Saltik update articulates native player/enemy legs, rotating wheel details, bounded spring feedback, hands and eye glints. Three player guided rounds and two enemy rounds leave real pod sockets sequentially; spent sockets remain empty and refill near cooldown readiness, including turn/duel views. The hull QTE retains a caught hatch as a hand brace, leans the whole native body into the hole, uses a short axial cannon recoil and blends safely into the existing ejection. Cosmetic motion changes neither the weapon damage nor the defense rules. Previous V2 source is retained at backup/v2-before-living-saltiks-20261102 and in deliverables/saltik-pastel-v2-finishing.

---

# FERAL STEEL — Opération Canopée

A complete French browser arcade game, with a Saltik shell menu in orange, ivory, anthracite and cyan and the signature “by limule & regalec” after the title. Pilot the orange/ivory **Saltik, class Striker**, through a reclaimed canyon and an immense ancient transport wreck. Fight infantry, robots, drones, three enemy Saltiks and the terminal Colosse. The expedition takes approximately 80–100 seconds with ordinary forward combat; there is **no time limit**.

Seven raised paths alternate with ground-only stretches. Rooted stone arches, a broken deck, wreck rubble, a gorge crossing, a military gallery and its roof, scree and the final spur create changing one-, two- and three-path sections. Substantial sloped banks and thick physical vaults connect upper paths to dense rock, earth and root masses. The vessel and old buildings remain intact native landmarks behind the terrain, without pasted facade or hull textures on driving banks. Playable surfaces use the canyon’s earth, rock, vegetation and weathered materials. Physical support, projectile collision and artwork share route heights and slab thickness.

## Play

Serve `dist/` over HTTP. Runtime is HTML/CSS and native JavaScript modules, local lossless WebP artwork and synthesized Web Audio. There are no runtime dependencies or external requests. The supplied “Feral_Steel_Black_Canopy_Dark_Phonk.ogg” plays locally in a continuous native media loop during a run and follows the sound and pause controls. Runtime audio is an exact copy of the supplied file. Music is more present at a 0.20 playback level. The primary report is raised 15% from the quieter mix and remains a quiet low pulse and 900 Hz puff with a smooth attack, and firing leaves the score at 90% of its normal gain. Other launch reports are quieter, simultaneous hostile shots share one bounded cue, and reload and speech stay legible. Resume preserves its position; a new run restarts it. A separate effects bus and shared limiter keep gunfire, reloads and missiles audible over the music, with gentle ducking during transients. Weapon sounds use authored layered Web Audio noise, low-frequency impulse and metal mechanisms; reloading adds magazine withdrawal, insertion and a bolt clack. Active and scheduled sounds cancel on pause, mute or restart. Six locally generated V2 robot voice clips share a dedicated speech bus: “Limule and Regalec, ready!” at deployment, “Target lock!” per successful guided salvo, “Saltik detected!” when an opposing Saltik enters view, “Grab him!” when its melee guard is ready, “Goodbye!” as an opposing Saltik is thrown toward the screen, and “Victory!” after the boss falls. Lines queue without overlap, duck the music briefly and cancel with pause, mute, home and restart; missing voice files cannot interrupt play.

- Move: arrow keys, A/D or Q/D.
- Jump: Space, Up, W or Z. Release before jumping again.
- Crouch: Down, S or C.
- Evade: **ESQUIVE** in the centre of the directional pad, or F/Shift. Hold to stay in the static native inner-leg rear pose; release to return immediately to the foreground. A hold lasts at most two seconds; release before starting another hold. There is no recharge. The painted far wheel stays registered on the real local slope. Contact, projectiles and hostile blasts cannot hurt while held in the rear plane; shots continue through the foreground. Requires grounded support; jumping, blur, pause and input cancellation release it.
- Descend: E or **DESCENDRE**. Each press drops one tier.
- Primary fire: hold J or X. After three seconds of actual firing, a 1.32-second mechanical reload interrupts the gun; held fire then resumes. Pausing, turning and evading do not consume firing time. The gun can aim at visible approaching hostile missiles with a clear shot.
- MIRV: K. The native roof cannon elevates for 0.24 seconds before launching its carrier, which splits into five explosive grenades. Recharge: 5.2 seconds.
- Guided missiles: L or R. Three native pod mouths launch distinct obstacle-avoiding approaches toward living visible targets, marked by red lock brackets. Missiles reacquire if a target dies. Recharge: 9.5 seconds; no target leaves the weapon ready.
- Melee: an automatic native arm strike when an enemy is in contact range.
- Boss assaults: the nearby red **POD** button or B becomes available after at least one real rocket volley. Three separate presses on the button above Saltik rip off the launcher, disable it permanently and remove 20 armor. At 45% armor or less, the red central **ARRACHER** button takes priority and stays available independently of pod destruction and distance. It launches the original hull assault: three full pulling strokes, a native hatch tear and six animated shots into the machinery for 60 armor. Both actions end with a cannon sweep and safe physical return jump; each is optional and usable once, has no QTE deadline and pauses with the game. The enemy-Saltik duel still takes five presses.
- Pause: Escape or P. Sound and fullscreen buttons are at top right.

On mobile, use landscape. The left pad supports eight directions and combined diagonals; directly pressing its centre deflects, while dragging across the centre remains neutral. DESCENDRE sits above the pad. ESQUIVE sits outside the lower-right corner of the pad. GUIDÉS, MIRV and TIR remain on the right. Each has independent input ownership. The pad keys are 10% larger than the prior compact version (55.44 px desktop, 48.4 px landscape phone), with 6 px / 5 px seams and translucent surfaces and at least 44-pixel touch cells; ordinary world zoom is 1.155 (the previous 1.1 view enlarged another 5%). Portrait rotation, blur and pause clear every input. In-play explanatory popups and QTE instruction text are removed; Only player armor, boss armor and control readiness remain in the live HUD; mission progress, live score and its weapon-status line are removed. End results retain the score.

Native action, direction, melee and evasion sheets preserve the Saltik’s two cyan optics, four wheeled legs and weapon apertures. Reversals show intermediate perspectives over 0.60 seconds. Weapons wait for the turn to settle; pause or evasion discards delayed shots. Native gun geometry drives projectile origins and cannon elevation.

Rock piles, metal barriers and checkpoints can be crossed or destroyed. The olive enemy Saltik has 24 armor and alternates aimed gun bursts and a visible lock followed by two homing missiles, which player bullets and blasts can intercept in flight. At 6 armor (25% remaining), it dodges or deflects every ranged hit. Approach it on the same grounded support to lock hands automatically. Press the simple red button five separate times, or Space/Enter. Its five marks show accepted inputs, and every press queues a complete 0.24-second native bracing effort with the original short manipulator hands. All five efforts finish before the throw; the native frontal enemy hits and cracks the glass, slides down and falls away. Other combat freezes during the contest; pause freezes the animation and all held input clears at phase changes. Each opponent awards one kill. There is no QTE deadline. Explosions combine animated fire and smoke, light, pressure and irregular debris. Repair packs restore 30 armor. The boss telegraphs its attacks and becomes more aggressive below 45% armor. Its native cannon barrel recoils on every volley. One shared weapon schedule alternates a deployed pod volley and a cannon volley. The pod launches eight distinct interceptable homing rockets after a 0.72-second raise; the cannon follows 4.5 seconds later. The next pod waits 12 seconds after its previous launch before raising. The first pod waits 2 seconds. After pod destruction, cannon volleys are five seconds apart. A painted rocket pod rises on its own hydraulics before launching eight interceptable guided missiles, then retracts; the first assault leaves a ruined socket and disables this weapon permanently. Its charge crosses about three quarters of the visible world width over about 1.94 seconds (15% less forward velocity), preceded by a 0.85-second warning; returning takes 1.5 seconds. The exposed nose damages grounded players; rear evasion, a high jump and roof riding avoid it. Jump from the front onto its physical deck or turret, ride the moving hull and fire real downward shots into its armor. After 3.2 seconds the turret turns and automatically throws Saltik clear into a safe landing arc, then returns to its forward profile.

The mission opens with a 2.2-second close view that pulls back to the ordinary camera. Simulation and controls wait during that shot; pausing freezes the camera and held intro inputs cannot fire later. Victory reverses the camera over 2.2 seconds, reuses the exact ordinary idle Saltik sprite for a four-stage little-hand victory flourish, keeping its original lower-eye service housing, cabin and wheeled legs rigid on the physical ground before the result screen at 4.5 seconds. A final hit from the tank roof or an ordinary jump waits for a natural landing before victory begins. Only walker and soldier bipeds are reduced 15%, including their native art, muzzles and collision bounds. The larger white heavy, Saltiks, drones and boss retain their size.

## Develop and verify

Node 22+ is sufficient; no dependency installation is needed.

```sh
npm test
npm run build
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Deterministic checks cover real ground and elevated campaigns, support and route headroom, native art and weapon geometry, evasion collision windows, cannon preparation, reload input boundaries, guided navigation around terrain and cover, target reacquisition, and chronological swept interception. Campaign checks exercise ordinary forward fighting and every raised path, including the manual QTE input sequence.

Browser checks use an existing Python Playwright installation and Chromium:

```sh
python tests/browser_menu_balance.py
python tests/browser_controls.py
python tests/browser_tachikoma.py
python tests/browser_turn_queue.py
python tests/browser_arsenal.py
python tests/browser_manual_defense.py
python tests/browser_manual_reflect.py
python tests/browser_saltik_duel.py
python tests/browser_mission_cinematics.py
python tests/browser_audio_mix.py
python tests/browser_music.py
python tests/browser_enemy_saltik.py
python tests/browser_saltik_expedition.py
python tests/browser_routes.py
python tests/browser_boss_ride.py
python tests/browser_dual_boss.py
python tests/browser_voice_lines.py
python tests/browser_background_motion.py
python tests/browser_waterfall_visibility.py
```

These exercise normal keyboard/touch inputs and read-only snapshots: three screen sizes, input ownership, pause and portrait handling, required-art failures, local music playback and pause/mute/restart, the rear balance, centre manual parry and five-press grapple, MIRV elevation, reload interruption, red locks, hostile missile interception, melee, the full campaign and every raised route. `tests/browser_standalone.py` verifies the separately packaged single-file game on a second server at port 4174, including no subresource requests.

Source lives in root `index.html`, `style.css` and `src/`. The build copies these to `dist/` while preserving `dist/assets/`. Twenty-one lossless WebP sheets preserve source dimensions, alpha and every visible pixel. Hosting identity remains in `.openai/hosting.json`.

The painted canyon, native ruins and wreck, physical terrain, combat and foreground foliage retain depth and parallax. Five actual painted waterfall regions now use a continuously descending loop of their own water texture, bright foam ribbons and small clipped spray; the original contours stay fixed. Three leafy regions keep local sway. All movement follows the original mirrored sky tiles and freezes on pause; the unrelated translucent procedural waterfalls are removed. The translucent procedural ridges, cliff polygons and jungle silhouettes have been removed; rooted lianas have opaque stems and leaves. Simulation runs at a fixed 60 Hz with seeded gameplay randomness; cosmetic randomness does not affect combat.


### Raccourci sur smartphone

Le menu et l’écran d’accueil vertical proposent « Ajouter à l’accueil ». Chrome peut afficher sa confirmation d’installation ; un guide reste disponible quand le navigateur ne propose pas cette boîte de dialogue. Sur iPhone, ouvrir le jeu dans Safari puis Partager → Sur l’écran d’accueil → Ajouter. Le raccourci s’appelle SALTIK et utilise son icône dédiée. Le manifeste ouvre le jeu en mode autonome avec une préférence pour le paysage ; iOS conserve son écran de rotation si nécessaire. Aucun cache de jeu ni mode hors connexion n’est ajouté.

Sur Android, le guide propose un lien `intent://` vers Chrome déclenché uniquement par un appui, avec retour HTTPS et copie manuelle du lien si nécessaire. Si une icône installée ne s’ouvre pas, `/android.html` propose le même jeu sous forme de raccourci Chrome ordinaire : menu ⋮ → Installer et créer un raccourci → Créer un raccourci → Ajouter (ou Ajouter à l’écran d’accueil sur les anciennes versions). Cette page est générée depuis `index.html` sans manifeste ni mode autonome. Elle ne répare pas l’application déjà installée. Le problème du lanceur Android n’a pas été reproduit sur un appareil physique ; les vérifications navigateur couvrent les liens, le démarrage et la réouverture du jeu, la copie de secours et l’absence de lancement externe automatique.


## Niveau 2 — Les Archives lunaires

Le menu permet de choisir directement le canyon du niveau1 ou les Archives lunaires du niveau2. Après la victoire du niveau1, le film reste disponible et les résultats proposent de continuer vers le niveau2. Redéployer/recommencer relance le niveau sélectionné.

Les Archives proposent un nouveau parcours de ruines suspendues avec marches, cinq franchissements et points de reprise. Une chute retire10points de blindage. La porte finale s’ouvre après trois vagues effectivement vaincues, sans second Colosse. Une partie automatisée avec les commandes normales termine en environ82secondes, proche de la campagne initiale. Les dessins natifs des Saltiks restent inchangés. Le tir principal est20%plus fort que dans la version16 ; la musique et les autres effets restent identiques.

Validation détaillée : docs/level-design/lunar-implementation-validation.md.

### Boss final — nouveau blindé ivoire et orange

Quatre états illustrés : intact, pod arraché, frénésie à 20 % de vie, épave persistante après la victoire. Le canon principal tire trois gros projectiles successifs ; les deux petits canons alternent douze tirs espacés puis laissent 2,2 secondes de récupération. La frénésie accélère les armes et les rushs. Trois salves réellement lancées par le pod sont nécessaires avant de proposer son arrachage interactif. Les interactions de coque, le retour au sol et le film de victoire restent disponibles.

L’atlas transparent `dist/assets/boss-assault-atlas.png` adapte les quatre références graphiques fournies dans la conversation. Les pieds, les points de saisie et les départs de tir suivent les nouveaux visuels. L’épave reste dans le monde jusqu’au changement de partie.

### Niveau 3 — Les Jardins de velours

Accès indépendant par le menu ou `?level=3`, et bouton de continuation après les Archives lunaires. Le fond reprend la composition de référence : grand arbre brodé à gauche, arc-en-ciel monumental, montagnes bleues, lune et cascades. Huit structures natives massives portent leurs vrais trajets ; six escaliers et les deux accès de chaque pont sont reliés aux collisions. Deux ponts illustrés en trois quarts traversent la profondeur avec un changement progressif de taille de Saltik, sans changer les commandes.

Le joueur porte une apparence de velours doré, vert émeraude et bordeaux uniquement au niveau 3. Les cartes de matière conservent l’alpha, les coordonnées des armes et l’articulation des atlas natifs. Trois sceaux sont défendus dans trois lieux différents au long du parcours ; il faut réellement éliminer leurs gardiens. Une partie avec les commandes normales termine en environ 79 secondes, avec 100 points de blindage et aucune chute dans le scénario de vérification. Musique du niveau 3 laissée silencieuse, effets et voix conservés.

Le niveau 2 reçoit quelques îlots astronomiques opaques au plan intermédiaire, à un défilement distinct. Son fond avec tête de pierre, ses structures et ses collisions sont conservés. Le boss du niveau 1 et son épave restent inchangés.

### Finitions des niveaux 2 et 3

Le Saltik lunaire du niveau 2 reprend la nouvelle référence ivoire/or, drapés rouges, motifs de lune et lumières cyan, avec atlas normal et trois vues de retournement aux coordonnées natives. Les autres apparences restent propres à leur mission.

Au niveau 3, Saltik est agrandi de 20 % à toute profondeur (.96 près / .792 loin). Le pont possède désormais une passe de premier plan extraite de ses pixels d’origine : poteaux, cordes et bord proche masquent réellement Saltik, sans duplication décalée de texture. Trois anciens ensembles à escaliers sont remplacés par une racine arquée praticable, une roue à eau avec dos arrondi et un passage de racines autour d’une bobine. Des buissons plus fréquents et neuf grands objets de premier plan (lys, vase, bobine-lanterne, troncs) densifient le monde et masquent brièvement le joueur. Les troncs se prolongent hors de l’écran pour éviter un bord de découpe flottant. Les gros objets sont des éléments du premier plan, pas des obstacles physiques.

### Échelle du niveau 2

Saltik joueur : augmentation littérale de 0,10 % par rapport à la taille précédente (multiplicateur 1,001 ; échelle .8008). Tous les ennemis de cette mission sont réduits de 10 %, y compris les Saltiks, le porte-drone et ses drones déployés. Dessins, départs de tir et zones de collision utilisent le même facteur .9. Les niveaux 1 et 3 gardent leurs échelles.

### Ennemis par univers

Les niveaux 2 et 3 disposent de six cartes de matière dédiées : atlas des troupes, Saltik ennemi et porte-drone pour chaque mission. Les Archives lunaires reprennent l’émail, les gravures célestes et l’or du Striker lunaire ; les Jardins de velours reprennent le matelassage, le tissu et les broderies dorées du Striker royal. Les Saltiks ennemis conservent leur coque verte et leurs pattes/pods orange ; le porte-drone conserve son bleu et ses garnitures bleu clair. Les contours et l’alpha des dessins natifs, leurs articulations et leurs armes restent les références géométriques. Aucune modification des rencontres, comportements ou échelles approuvées ; le niveau 1 garde ses dessins.
