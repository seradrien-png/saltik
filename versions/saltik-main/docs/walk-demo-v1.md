# Démo séparée de marche inspirée de V1 — 22 novembre 2026

Demande : essayer de retrouver les mouvements de pattes des premières versions Saltik INK et montrer une démo avant toute intégration dans le jeu.

La page `demo-marche.html` et le module isolé `demos/walk-v1.js` comparent deux rendus des personnages actuels : déplacement publié à gauche, essai de suspension souple à droite. Striker, Gatling et BT sont sélectionnables. Trois préréglages et un curseur permettent de comparer une amplitude très douce (0,65), souple (1,8) et plus marquée (2,8). La pause et les boutons sont adaptés au mobile.

La V1 lue dans `/workspace/sites/saltik-ink-edition/src/ink-saltik.js` utilisait une oscillation de caisse pendant le roulement et le placement des roues par le solveur de suspension. L’essai utilise cette idée avec les rendus et les modèles actuels. Une petite variation locale de la surface de présentation crée un soulèvement alterné limité des pieds ; les composants restent articulés par le solveur natif, sans déplacer indépendamment des morceaux de sprite. La surface synthétique et les états d’acteurs existent uniquement sur la page de démonstration.

Le code du jeu, ses points d’entrée, ses assets, ses vidéos, ses commandes et ses paramètres restent byte-identiques à la version publiée 63 (source b4219a05cc92c1eb6864caacf922e7572a974863). Le build ajoute seulement la page et son module à dist. Aucune modification de marche n’est autorisée dans le jeu avant le retour de l’utilisateur.

Contrôles effectués dans Chromium : trois modèles, animation, pause, curseur, préréglages et boutons tactiles. Zéro erreur JavaScript et aucune image manquante. Comparaison Git sans différence pour src/, dist/src/, assets, sons, vidéos, points d’entrée, feuilles de style et icônes du jeu.
