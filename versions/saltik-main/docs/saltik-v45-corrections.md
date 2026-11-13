# Corrections v45 — cinématique, netteté et chargement

Demande : résoudre le blocage d'embarquement en velours, rendre l'anguille plus nette, donner au Gatling une voix enfantine/innocente, animer la cascade illustrée sous le pont, afficher un menu propre pendant le chargement et conserver des pattes solidement attachées pendant les sauts.

## Causes et corrections

- La finale mettait `player.evasion` à `null` alors que `updateUI` lit encore `p.evasion.active`. La cinématique conserve maintenant cet objet et annule seulement l'esquive. Régression reproduite pour les trois personnages ; contrôle en lecture continue de la boucle réelle `main.js`, jusqu'à la victoire.
- L'anguille géante utilisait des dessins de ~790 pixels de large, redimensionnés vers un canevas intermédiaire de 1024 pixels avant agrandissement. Huit dessins indépendants de 2172×724 pixels sont maintenant utilisés à leur définition native. L'ancien atlas reste disponible et conservé ; aucun simple agrandissement logiciel ne remplace les nouveaux dessins.
- Sept nouvelles répliques Gatling : synthèse AWB avec timbre relevé et adouci, sans écho métallique ni trémolo. Phrases conservées, dont « Enemy brother » et « See you later ». A10, Striker et BT restent identiques par SHA-256.
- La cascade de premier plan avait un déplacement inférieur à deux pixels, peu perceptible à l'écran. Son eau bleue native descend désormais de façon continue ; le masque protège exactement les pixels de velours, pont et or. Comparaisons de frames au temps 0/.5 s à la définition native et à l'échelle téléphone, pause stable.
- Le menu dessinait les images historiques à mesure qu'elles arrivaient, avant la préparation des modèles modernes. Pendant la préparation, il utilise vingt petits portraits complets tirés du moteur natif, correspondant aux personnages/apparences/niveaux. Les portraits ont priorité réseau haute, les textures de jeu basse ; trois chargements parallèles au lieu de deux. Aucun fragment d'ancien modèle n'est affiché en attendant. Les portraits sont en WebP sans perte, total 3 968 894 octets. La préparation complète reste nécessaire avant de jouer.
- La déformation des jambes extrapolait au-dessus de leur pivot, laissant voir la découpe fixe du corps. Les racines restent fixes ; seule la suspension située sous le pivot se déforme. Écartement cosmétique réduit de 12 à 8 unités, sans modification de la physique.

## Préservation et publication

Les anciens dessins, huit poses précédentes, toutes les éditions et les fichiers source audio restent conservés. Le paquet léger de v44 reste la méthode de publication : exclusion des 13 images historiques inutilisées uniquement dans l'archive, WebP actif sans perte, copies audio/vidéo identiques aux nouvelles sources validées. Les nouveaux assets sont inclus par le registre actif et `dist/menu/`.

Le dépôt GitHub complet conserve `dist/` en version PNG originale jouable. Les changements v45 doivent être validés, poussés et publiés sur le Site existant, sans changer son audience. Ne déclarer la mise en ligne qu'après réussite du déploiement natif.
