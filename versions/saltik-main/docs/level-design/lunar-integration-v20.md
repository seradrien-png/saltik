# Intégration lunaire — proportions, matière et couches

Demande : conserver la taille des illustrations, réduire Striker de 20 % dans le niveau 2, corriger les raccords au sol, remplacer les parties grises du terrain et donner plusieurs plans réels à l’image d’arrière-plan. Le niveau 1 et les autres jeux sont préservés.

- Le joueur lunaire reçoit `artScale: 0.8`. La géométrie illustrée, les canons, les points de sortie des tirs, les pods, les vues de demi-tour et l’ombre suivent la même proportion. Le facteur normal reste 1 dans le canyon. Les roues du modèle réduit échantillonnent le terrain à leur véritable position, également pendant les trois vues de rotation ; la pente elle-même n’est pas redimensionnée. Les vitesses, armes et mécaniques restent celles du jeu.
- Aucune dimension des aqueducs, observatoires, bastions ou portes déjà approuvés n’a été modifiée. Les ruines décoratives sont recalées sur leur pied de pierre mesuré, plutôt qu’un point arbitraire à 86 % de leur hauteur. Les contours de marche et les escaliers des grandes structures restent mesurés sur leurs illustrations d’origine.
- Le terrain utilise une nouvelle texture de grès miel et ivoire, issue visuellement des fondations de l’aqueduc. Le remplissage gris et les facettes bleu-gris ont été remplacés par des tons pierre chaude, ocre et ombre brune. Le matériau garde ses proportions et s’ancre dans les coordonnées du monde pour ne pas glisser avec la caméra.
- Le fond lunaire est reconstruit avec un ciel/lune/nuages séparé, un groupe d’îles à visage de pierre et un groupe d’îles à arche astronomique, tous deux transparents. Ils défilent indépendamment (0,075 et 0,135), derrière les quartiers déjà illustrés (0,20 et 0,47). Le fond lunaire ne subit plus le saut de 100 pixels de l’ancien modulo.
- La musique du niveau 2 reste coupée, les effets et les voix restent disponibles.

## Illustrations et provenance

Les trois nouveaux fichiers ont été créés ou détachés avec l’outil image, puis copiés tels quels. Les originaux sont conservés.

| Fichier du jeu | Dimensions | Original conservé |
| --- | --- | --- |
| `dist/assets/lunar-sandstone.png` | 1672×941 | `/workspace/generated_images/exec-1e92b443-31e8-425a-9389-da8d01b63601.png` |
| `dist/assets/lunar-sky-layer.png` | 1672×941 | `/workspace/generated_images/exec-be7e7521-62fc-4be1-9b1b-1537fcabac8d.png` |
| `dist/assets/lunar-island-layers.png` | 1921×819, alpha | `/workspace/generated_images/exec-1883bf54-bc81-4e3a-b17b-d3e2ed846777.png` |

Le ciel précédent et les monuments de premier plan sont conservés dans le projet. Les deux anciens fichiers lunaires devenus inutiles ne sont plus chargés au démarrage.

## Vérifications

Tests dédiés : proportion 0,8 exacte et bouches des canons correspondantes, pieds sur les marches à l’échelle réduite, trois vues de rotation avec décalage caméra, parallaxe des îles distincte du ciel sans saut à l’ancienne limite. Les tests de préservation conservent les empreintes originales en normalisant uniquement le nouvel échantillonnage lunaire autorisé dans le module des demi-tours.

Inspection Chromium : arrivée, pied de l’escalier, aqueduc, sortie du pont, observatoire ouest, bastion, second observatoire et portail. Les déplacements de caméra de ces captures utilisent uniquement une réponse de test locale et recalculent les appuis ; aucun contrôle de téléportation n’est ajouté au jeu. Les résultats de campagne, tests complets et vérifications ordinateur/téléphone émulé sont consignés dans le rapport de livraison GitHub. Aucun appareil physique n’est annoncé comme testé.
