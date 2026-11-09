# Archives lunaires — reprise des modifications GitHub

Base publiée : Sites v17, source `75f3484645fffcc5485a4c0abcbd563efd37626e`.
Base GitHub récupérée par le connecteur natif : `seradrien-png/saltik`, commit `4c9b8e64bf3232c222f9b6f534ca37d660da3f7b`, treize commits après la précédente synchronisation `6eba4ffb32c3f51cd2b11596f39b8fa301b07f33`.

Les sept fichiers source/tests modifiés ont été lus à ce SHA précis. Leurs versions de distribution sont reconstruites depuis les sources. L’historique GitHub et les autres éditions restent conservés.

## Révision du niveau

- Terrain continu, sculpté, sans les cinq fosses de la première livraison : ce choix provient des changements GitHub récupérés.
- Citadelles, observatoires et portes de pierre sur plusieurs plans de profondeur, fond lunaire et matériau gravé existants conservés.
- Finitions supplémentaires : maçonnerie sous les escaliers, bannières cuivrées, phases lunaires gravées, piédestaux et noyau doré du portail ancrés au véritable sol.
- Indications de mission selon la progression : citadelles, observatoire, remparts, porte ; compteur explicite pendant les trois vagues et leur préparation.
- Accès depuis le menu et lien `?level=2` récupéré de GitHub. Passage après le niveau 1 conservé.
- Dessins et mécaniques des Saltiks inchangés, tir principal à son gain déjà augmenté de 20 %. Aucun autre jeu sauvegardé modifié.

## Vérification et limites de publication

La base GitHub récupérée passe 614 tests. Le parcours automatisé par commandes ordinaires gagne en 82,02 secondes, avec 92/100 de blindage, sans chute, après les trois vagues réellement vaincues. La durée humaine dépend du joueur.

Les résultats de la suite finale sont consignés dans `lunar-revision-validation.json` après exécution. Une vérification visuelle fraîche en navigateur n’a pas pu être exécutée : création du serveur local refusée par le bac à sable (`PermissionError: Operation not permitted`). Les captures et validations de v17 décrivent cette ancienne publication et ne valident pas les nouveaux décors.

La commande Git distante a été refusée avant exécution par le contrôle automatique, en raison d’une limite d’utilisation. La lecture et la sauvegarde GitHub peuvent passer par le connecteur natif ; la publication Sites nécessite aussi un envoi du commit exact sur son dépôt source officiel. Aucun ancien SHA ne doit être utilisé pour publier cette nouvelle archive. Tant que cet envoi n’a pas réussi, l’URL Sites reste en v17 et ne représente pas la révision ci-dessus.
