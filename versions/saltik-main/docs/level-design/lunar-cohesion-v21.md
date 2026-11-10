# Cohérence entre décors et jeu

Les captures utilisateur révèlent deux problèmes réels : de grandes illustrations de remparts/observatoires comportaient des marches sans collisions associées ; plusieurs quartiers superposés à faible opacité donnaient l’impression de façades fantômes devant la tête de pierre.

## Structures et sol

Le monde visible au premier plan contient maintenant dix structures réellement enregistrées dans `LUNAR_SITES` : les six monuments principaux, trois anciennes annexes décoratives converties en routes jouables, et le portail final. Les trois autres placements décoratifs qui chevauchaient les monuments ont été retirés. Les dimensions des illustrations conservées ne changent pas.

Les deux escaliers illustrés de chaque rempart sont accessibles. Quatorze volées d’escaliers, au total, possèdent leurs points d’appui ; ils conduisent à des terrasses physiques. Les constructions au premier plan sont dessinées exclusivement à partir du même registre que la physique. Les anciennes copies de remparts sous le cadre ont été remplacées par une végétation basse : elles ne suggèrent plus de fausses plateformes.

Les contours inférieurs des dessins commandent directement le sol, qui peut remonter ou descendre jusqu’à la pierre. Les raccords entre deux bâtiments sont interpolés sans discontinuité. Une fonction de terrain de base séparée évite toute dépendance circulaire dans les annexes. Les quatorze pieds d’escalier rejoignent exactement leur surface inférieure. La configuration des rencontres et des réparations hautes reste limitée aux six structures principales ; les nouvelles annexes ne rajoutent pas automatiquement des vagues d’ennemis.

Le portail utilise aussi sa vraie terrasse et son escalier. Son chemin inférieur culmine à environ 883 unités, sous le seuil de récupération à 930. Les réparations entre les vagues sont posées au sol réel. Striker reste à 80 % de sa taille d’origine dans le niveau 2 et la musique reste coupée ; le niveau 1 n’est pas modifié.

## Fond assemblé

`dist/assets/lunar-coherent-world.png` est une nouvelle peinture opaque complète : tête de pierre claire, architecture opaque, profondeur par les échelles, les ombres, l’occultation et les couleurs atmosphériques. Les grandes façades à 42 %, 65 %, 72 % et 84 % d’opacité ont disparu. Un seul petit groupe d’îles proche, lui aussi dessiné à pleine opacité, complète le panorama à droite, derrière le monde jouable. Le visage n’est pas couvert par une superposition de quartiers transparents.

Illustration créée avec l’outil image d’après les références du projet, puis copiée sans modification. Original conservé : `/workspace/generated_images/exec-b134134f-7ef3-4c3f-9c16-1b1583b7f0e5.png`, 1672×941.

## Vérifications

- Suite complète : 627 tests réussis, aucun échec ; build valide.
- Quatorze escaliers montés par les commandes ordinaires dans le moteur ; pieds au sol contrôlés, toutes les annexes et le portail atteignables.
- Chromium : les deux escaliers des remparts du niveau, le nouvel escalier d’annexe et celui du portail sont effectivement montés avec les touches ; arrivée au bon `platformId`, appui au sol et aucune chute. Aucune erreur JavaScript.
- Ordinateur et téléphone émulé : choix du niveau, marche/tir, pause, redémarrage, film du niveau 1 puis passage au niveau 2 ; musique 2 silencieuse et musique 1 préservée.
- Partie complète à commandes ordinaires : victoire en 94,82 secondes, 100 de blindage, aucune chute, trois vagues vaincues. La durée humaine dépend du joueur.
- Revue indépendante : pas de problème important trouvé ; raccords, emprises non chevauchantes, descente des escaliers et maintien des six rencontres de toit examinés.

Les déplacements de préparation des tests navigateur sont ajoutés uniquement dans les réponses locales de test ; aucun raccourci de téléportation n’est présent dans le jeu publié. Aucun téléphone physique n’a été testé. Les identifiants de publication et le commit GitHub sont consignés dans le bilan final du dépôt.

Dernier contrôle des marches : repères Canvas sur les trois cellules de l’atlas, correction des centres de marches des remparts, de l’observatoire et du portail. Les points de recalage originaux sont conservés séparément du contour jouable afin de ne pas redimensionner les illustrations.
