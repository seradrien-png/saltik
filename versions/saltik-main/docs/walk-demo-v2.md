# Démo de marche articulée — 22 novembre 2026

Retour de l’utilisateur : le premier essai ne faisait que monter et descendre les pattes ; il attend un vrai mouvement de marche. La modification porte uniquement sur la page de démonstration, pas sur le jeu.

La nouvelle version utilise un cycle complet : le pied part vers l’avant, prend appui au sol en reculant à la vitesse du décor, se soulève et revient en arc. Les trois pattes visibles ont des phases décalées d’un tiers de cycle, avec au moins deux appuis simultanés. La phase d’appui représente 68 % du cycle. Le retour utilise une courbe cubique dont la vitesse horizontale rejoint celle du sol à la pose ; la levée en sinus carré a une vitesse verticale nulle à la pose et au départ.

Le dessin des pattes est articulé en trois zones : racine de hanche fixe, segment supérieur jusqu’au genou, segment inférieur jusqu’à la roue rigide. Les transformations des deux segments se rejoignent au même genou et à la roue. Les pixels d’attache au corps restent en place ; les anciens emplacements des pieds sont masqués. Les pincettes conservent leur pivot d’origine. Aucune image n’est redessinée ou remplacée.

La démo compare le mouvement actuel à gauche et le cycle proposé à droite. Les modèles Striker, Gatling et BT, la longueur du pas, la pause et le ralenti à demi-vitesse sont disponibles sur ordinateur et mobile. La page reste à demo-marche.html?v=2. Les commandes de gameplay, les armes, les collisions et les mouvements du jeu publié restent byte-identiques à la version 63. Le choix de l’utilisateur reste nécessaire avant toute intégration en jeu.

Vérifications de prototype : déplacement horizontal réel, continuité du cycle, vitesse d’appui égale au défilement du sol et au moins deux appuis pour trois amplitudes ; rendu des phases, trois modèles, contrôles, pause, ralenti et boutons tactiles dans Chromium. Comparaison Git sans modification des sources, entrées et ressources du jeu.
