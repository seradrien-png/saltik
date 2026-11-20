# Correction du nouveau désert rouge

L’utilisateur précise cinq critères : niveau supplémentaire, durée90–120s, vitesse et combats usuels, toutes les armes normales, direction artistique intégrée sans tranche de terre au premier plan.

1. Restaurer intégralement `desert-level.js`/`desert-world.js` et leurs tests à la source v51 (`8fa2dae`), maintenir l’emplacement niveau4 et son intérieur C-07.
2. Ajouter niveau5 avec `red-wastes-level.js` : parcours23000unités à230unités/s,35ennemis natifs dont3Saltiks, réparations, objectif atteint par déplacement réel, aucun timer d’attente. Utiliser directement engine.update, aucun contrôle de voie ni changement d’armes.
3. Retrouver les limites de projectile et de déplacement ennemi à partir du niveau courant plutôt que du seul LEVEL_END17800. Vérifier les trois arsenaux aprèsx20000.
4. Ajouter `red-wastes-world.js` : parallax de tableaux INK et monuments découpés, dunes opaques, sol de sable continu calé sur la collision. Caméra standard, personnages à l’échelle normale, saut/accroupissement/esquive inchangés. Réutiliser les tenues désert et leurs retournements. Garder le passage cosmétique du géant, pieds/tibias seulement.
5. Ajouter le cinquième choix et la navigation de campagne, restaurer les commandes du4, faire les tests de durée/combats/QTE et de parité, les contrôles navigateur/mobile et une revue indépendante.
6. Conditionner sans perte, publier sur le même site et sauvegarder les cinq éditions/historiques GitHub sans suppression. Conserver la version52 dans l’historique.

Implémentation distribuée : logique et dessin du niveau5 dans deux fichiers indépendants ; intégration, restauration, vérification et publication par l’agent principal. Choix de mise en œuvre : défilement natif au lieu de comprimer le parcours dans une image fixe, pour satisfaire les demandes explicites de vitesse et de fonctionnement habituel des armes.
