# Rotations, BT jouable et skins optionnels

Demandes user : vrais frames intermédiaires de demi-tour pour BT et Gatling, Striker actuel conservé ; yeux BT jouable gentils comme Striker, adversaires inchangés ; BT se baisse réellement ; capacité16missiles prêts immédiatement puis après épuisement refroidissement identique/rechargeprogressive. Deuxskinsréférence reçus : Gatling Limule&Régalec monochromebeige, Striker Dragonor/turquoise/émeraude. Sélectionoptionnelle ; apparencesactuelles conservées ; versionsspécifiques4niveaux.

Implémentation : feuilles3vues quarter/front/oppositequarter natives par BT/Gatling, pasuniqueflip ; durées/plansd’armes/victory/duels conservés. Alphaopaque enregistrée/cachesnativematériaux4mondes. BT yeuxuniquement superposés via copie des pixelsStriker danslesorbitesnatives et glints, corpsvertorange inchangé ; posturebasse abaisse cabine12unités et raccourcitstruts sans déplacer pieds, hitboxcanon suitposture.

BT capacité16, maxlocks16 au mêmedélai.25s. Huitapertures visuelles utilisées2fois, vraiorigines. Recharge ne commencequ’aprèsépuisement16 ; délai5s puis1/2s, suspenduependantlock ; lesprojectilesenréservechargésrestentutilisables. Capacitéetlocks/stockHUD constants ; aucunmodifcanon3coups ouarmesStriker/Gatling.

Skins conservés entrechoixniveau/redémarrage, lienURLskin valide parpersonnage. DragonStriker et LimuleGatling matériauxsur géométrie/collisions originales ; palettesetmotifsdesréférences ; lunarbroderies, velvetpiquage, desertpoussière discrète. Matériauxnormauxtoujourschoisissables. AucunskinBT inventé.

Tests :16vraisrounds et8origines physiques, pasderechargeavantvide, même5/2cooldown, budgetpartielconservation, abaisseregistreetcanon/pieds/ennemisnonmodifiés, troisintermédiairesdistincts, skins4mondes/tours/defaults/invalidation, pause/phone/selection/restarthéritage4missions. PublieretGitHubcommed’habitude.
