# Référence conservée — niveau 1

Base : SALTIK V2 — Matin Doré v16, commit 9f0aafbca8588004fc6666942d833f3dbe0e9488. Le source canonique reste /workspace/sites/saltik-v2-matin-dore ; sauvegarde GitHub versions/saltik-main.

## À conserver pour le niveau 2

- Dessins natifs de Striker, du Saltik vert/orange et du porte-drones bleu/ivoire approuvé. Aucun Saltik redessiné ou recoloré.
- Commandes tactiles/clavier, blindage maximal de 100, mouvement et saut, support physique des roues, pause et son.
- Canon principal, rechargement, MIRV, missiles guidés, esquive, parade et contact non létal avec les Saltiks.
- Son du canon principal déjà augmenté de 15 %, dialogues et mix actuel.
- Niveau 1 conservé avec ses ressources, son déroulement et son film de fin existants.

## Structure actuelle vérifiée dans le code

- createInkScene délègue à createGame puis applique ink-demo-layout. Une seule campagne est actuellement reliée au menu et aux résultats.
- Longueur 17 800 unités ; déclenchement du boss à 16 400 ; panorama initial de 2,2 s.
- Sept alternatives surélevées, avec contours et marches enregistrés sur les illustrations.
- Trois Saltiks remplacent des rencontres lourdes autour de 5 430, 9 510 et 13 590 ; le gardien proche du porte-drones est replacé à 8 700, le porteur à 8 940.
- Terminaison : combat du Colosse, célébration puis film de victoire.
- Recharges : MIRV 5,2 s ; guidé 9,5 s ; canon 3 s de tir avant rechargement de 1,32 s.

Les empreintes des modules de référence sont enregistrées dans level-1-reference-hashes.json. Aucune mécanique du niveau 1 n’est modifiée pendant ce cadrage.
