# Mortier MIRV Striker — bruitages événementiels

Intégration dans Matin Doré existant. Dernière version fonctionnelle vérifiée sur GitHub avant modification : `c0eca837dde542436ce82c26bc2e4f09ac3bc6ee` (v45), source `2677b3bdc111d5b26e6ef6df3da2a156a298f4d3`.

Le ZIP fourni reste conservé dans `audio-sources/`. Seuls ses sept OGG, inchangés, sont extraits dans `dist/audio/mirv/`. Les MP3 et le HTML de démonstration ne sont ni utilisés ni publiés. Les autres sons, voix et dessins sont préservés.

## Synchronisation

- `launchMirv` attribue au projectile Striker son identifiant de salve et émet `mirv-launch` ; `01` joue une fois, `02` boucle tant que le projectile existe.
- `deployMirv` émet `mirv-separation` exactement avec les cinq enfants physiques ; la boucle de vol sort en fondu et `03` joue une fois.
- Les grenades héritent uniquement de l'identifiant audio. Une seule boucle `04` commune suit les enfants réellement en descente, même si plusieurs salves se chevauchent.
- Vitesse verticale réelle positive → vitesse de lecture lissée de .85 à 1.35 et gain progressif. Aucun temps de chute prédéfini. `01`, `03` et les impacts restent à vitesse normale.
- La résolution des collisions émet `mirv-impact`, une fois par projectile, sur les positions réellement résolues du sol ou d'une cible. L'un des trois fichiers `05` est choisi indépendamment, avec petite variation de gain.
- Expiration, sortie du monde ou disparition sans collision : arrêt des boucles, aucun impact sonore artificiel. Les explosions visuelles/physiques d'expiration existantes restent inchangées.
- Les anciens sons synthétiques de départ et d'explosion primaire sont remplacés uniquement pour ces tirs. Les événements visuels `cluster`, `spark`, `explosion` restent présents.

## Navigateur mobile et cycle de vie

Décodage des sept OGG une fois lors du déverrouillage audio ; aucune détonation tardive n'est jouée si un échantillon n'était pas prêt à l'événement. Les futures boucles se recalculent uniquement depuis les projectiles encore actifs. Pause, menu, mort, victoire, changement de personnage et son coupé annulent les voix avec fondus de 80 ms et invalident les démarrages tardifs.

Au plus deux boucles principales et une boucle de chute commune. Voix ponctuelles plafonnées à douze, sous-bus compressé, limiteur principal existant conservé. Mémoire de déduplication bornée. Les boucles utilisent des points stéréo proches de zéro dans les 40 premières/dernières millisecondes, sans réencoder les fichiers ni étirer les sons mécaniques.

## Préservation physique et essais

Trois tirs réels déclenchés en maintenant le choix de portée pendant 40, 120 et 200 pas physiques (60 Hz). Comparaison avant/après exacte des positions, vitesses, durées de vie, dégâts, obstacles, statistiques et positions des explosions. Aucun changement de `mirv-trajectory.js`, des collisions, des distances ou des constantes de dégâts.

Les durées sonores suivent ces trajectoires existantes, y compris les cas où un tir plus tendu et plus lointain touche le sol plus vite qu'un tir court en cloche. Ne pas ajouter un délai pour simuler une portée longue : cela désynchroniserait le son ou exigerait une modification physique interdite.
