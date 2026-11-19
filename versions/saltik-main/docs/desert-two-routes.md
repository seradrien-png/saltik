# Désert rouge : prototype à deux voies et marche du géant

20 novembre 2026 — intégration dans Matin Doré, niveau 4 existant.

Le cahier des charges « Deux Voies — Désert Rouge » fourni par l’utilisateur sert de référence au prototype : deux courbes manuelles autour du crâne monumental, sans monde 3D. Le panorama propre conserve les ruines, les os ivoire/caramel, le pointillisme INK et les dunes rouges ; les annotations rose/vert du document ne sont pas affichées dans le monde. L’ancien panorama reste intact pour ses autres usages.

- Flèche haut / bouton MONTER : voie haute, à 80 % de la taille basse. Bas / DESCENDRE : voie basse, à 100 %. Transition douce de 0,75 s. Gauche/droite parcourt la voie ; au retour, la piste reste réversible.
- `DESERT_LANE_DEFAULTS` dans `src/desert-two-lanes.js` isole le réglage. Le prototype autorise le changement partout ; `switchEverywhere:false` et `junctions` limitent les changements aux raccords choisis. Les courbes et masques sont enregistrés sur le nouveau panorama 1774×887, sans étirement.
- La voie haute passe derrière les dunes et le crâne, par redessin opaque des pixels natifs. La voie basse reste devant. Une mince lèvre de sable ancre le bas des roues ; aucun nouvel objet encombrant au premier plan.
- Les trois personnages gardent leurs armes, chargeurs, chauffe, recharges, recul et esquive natifs. Le canon direct touche principalement sa voie ; les guidés peuvent rejoindre l’autre. Les impacts du mortier gardent les distances et dégâts circulaires en coordonnées logiques communes, indépendants de la projection. Leurs empreintes affichées peuvent être elliptiques.
- Quatre gardes natifs espacés permettent de vérifier les deux voies sans transformer cette traversée en combat continu. Le retour reste calme et ne réinstancie pas ces gardes.
- À partir de x=2800, un squelette gigantesque traverse une seule fois pendant huit secondes. Seuls pieds, chevilles et très longs tibias/péronés existent dans l’illustration. Les parties hautes sortent du cadre. Les contacts plantés restent fixes pendant l’appui ; les pieds se soulèvent et avancent alternativement. Couleurs fossiles chaudes assorties au crâne, pas d’attaque ni de dégât ajouté. Pause et recommencement sont déterministes.
- Les trois salles de nettoyage de C-07, les portes et le retour obligatoire avant victoire restent fonctionnels. Les hooks extérieurs sont supprimés avant l’intérieur. Les niveaux 1–3 et la séquence de vol sur l’anguille sont préservés.

## Vérification

886 tests automatisés réussis, dont les collisions entre voies, le rayon du mortier commun, les stocks BT, la chauffe Gatling, l’esquive et les raccords du géant. Revue indépendante : aucun point bloquant après correction de la pose de dommage, de l’esquive, des réticules et de la géométrie d’évitement de la croix tactile.

Contrôle Chromium avec vrai clavier : trois personnages, montée/descente, tir manuel, pause, entrée C-07, sortie et victoire au retour ; aucune erreur JavaScript ni ressource manquante. Captures de contrôle et rapports : `/tmp/saltik-desert-two-routes/` pendant la session. Le contrôle tactile mobile émulé est consigné dans le rapport de validation associé.

La publication utilise le conditionnement WebP sans perte déjà en place : tous les pixels visibles restent identiques. Les anciens originaux, poses, voix et bruitages sont conservés dans les sources et l’historique. Aucun asset actif n’a été supprimé.
