# Niveau 2 — monde illustré et profondeur

Demande : retrouver la qualité visuelle du niveau 1, avec un monde massif et plusieurs plans proches, de vraies structures traversables, des ennemis visibles et aucune musique au niveau 2. Le niveau 1 et les dessins des Saltiks sont la référence à préserver.

## Analyse et réalisation

Le niveau 1 utilise des illustrations détourées détaillées, enregistrées dans le monde, avec contours de marche et escaliers mesurés sur les pixels natifs. Les formes géométriques du niveau 2 ne produisaient pas cette matière ni cette échelle. Elles sont remplacées dans le rendu par des aqueducs, observatoires, bastions et portes illustrés : maçonnerie, racines, végétation cuivrée et mécanismes astronomiques. Aucun personnage n’est généré ou redessiné.

Deux illustrations transparentes originales ont été générées avec l’outil image, dans le style de l’observatoire couleur du niveau 1 :

- `dist/assets/lunar-monuments.png` : atlas 1536×1024, observatoire, remparts et porte, également utilisé dans les quartiers proches en parallaxe. Original conservé : `/workspace/generated_images/exec-f5951d98-0a2e-4148-a66d-4e603759e4a6.png`.
- `dist/assets/lunar-aqueduct.png` : aqueduc complet 1774×887 avec arches transparentes et escalier intégré. Original conservé : `/workspace/generated_images/exec-06a8958a-da49-48af-9fb5-ed1091dd14d0.png`.

Les fichiers sont copiés tels quels ; découpage et placement se font au rendu Canvas. `lunar-landmarks.js` contient les relevés des crêtes, escaliers et chemin inférieur. Les berges du terrain rejoignent les pieds des illustrations. Les routes hautes et les passages bas existent dans la physique ; aucun changement du moteur partagé n’est nécessaire. Les districts derrière le parcours ont des vitesses distinctes (0,20 et 0,47), en plus du fond lointain et des éléments au premier plan. Les anciens monolithes vectoriels et les simples dalles ne sont plus utilisés dans le rendu lunaire.

## Défauts corrigés

- Les identifiants textuels `lunar-encounter-*` entraient dans `Math.sin(time*10+id)` et produisaient `NaN` pour la position et les canons des ennemis standards. Les identifiants numériques conservent leur animation exacte ; les identifiants textuels utilisent la phase numérique déjà initialisée. Régression observée en échec sur un soldat, puis corrigée.
- La protection contre les atterrissages depuis une ancienne fosse était encore active sur le sol continu. Elle pouvait faire manquer une pente en sortie d’aqueduc et provoquer des chutes répétées. Le drapeau des fosses n’est plus activé en l’absence de fosses.
- La caméra du niveau 2 suit aussi les pieds de Striker dans les passages profonds. La formule originale du niveau 1 reste inchangée.
- Le rendu attend désormais chaque image réellement chargée avant d’appeler Canvas. Une régression vérifie le premier rendu avant la fin du chargement asynchrone.

## Audio et préservation

Un réglage dédié coupe la piste musicale au départ du niveau 2, sans couper les effets, voix ou tirs. Pause, reprise et réactivation générale du son ne redémarrent pas cette musique ; le niveau 1 retrouve sa piste normale. Son du canon principal conservé à son réglage précédemment augmenté. Les textures et modules de personnages natifs ne sont pas modifiés.

Les tests de préservation gardent leurs empreintes initiales et normalisent uniquement les changements autorisés de musique et la correction des identifiants textuels. Les autres modifications imprévues de ces fichiers continuent à faire échouer le contrôle.

Les résultats définitifs de la suite, du parcours et des essais Chromium sont consignés dans le bilan de livraison sur GitHub. Aucun téléphone physique n’est annoncé comme testé.
