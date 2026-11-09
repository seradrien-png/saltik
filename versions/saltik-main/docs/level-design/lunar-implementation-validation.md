# Niveau 2 — vérification de livraison

Demande validée : niveau 2 accessible depuis le menu et après le niveau 1, durée similaire ; tir principal +20 % par rapport au niveau actuel. Base : Matin Doré v16, commit9f0aafb.

- Nouveau parcours indépendant de17 800unités avec six terrasses/escalier, cinq vrais franchissements, réparations, points de reprise, rencontres non copiées du canyon et finale de trois vagues à vaincre pour ouvrir le portail. La chute coûte10blindage ; le dernier palier sûr restaure une position praticable.
- Parcours automatisé avec commandes ordinaires, blindage natif100, sans invulnérabilité ajoutée : victoire en82,02secondes,92blindage restants,0chute,3vagues, aucunColosse. Voir lunar-campaign-validation.json. Cette durée est une mesure de simulation, pas une garantie de durée pour chaque joueur.
- Dessins de Striker, du Saltik vert/orange et du porte-drones bleu/ivoire conservés ; nouveaux décors de fond et pierre gravée d’après l’image utilisateur, architecture/collisions propres au niveau2. Les autres ennemis gardent leurs dessins natifs.
- Menu : choix1/2 immédiatement disponible, redémarrage du niveau sélectionné, bouton niveau2 après le film de victoire1. Le niveau2 conclut sur son propre résultat, sans rejouer le film1.
- Audio : trois amplitudes du tir principal multipliées par1,20 à partir du volume précédent ; musique, limiteur, enveloppes et autres effets inchangés.
- Suite complète :612tests réussis,0échec. Nouveaux tests : vrai saut des5vides, appui des6accès, reprise et chute fatale, pause et tempsnul, vrai spawn desvagues, campagne complète, impossibilité de gagner une vague par simple disparition des ennemis.
- Revue indépendante : un défaut significatif détecté (nettoyage distant des ennemis vivants pouvait avancer la vague). Régression observée en échec, correction par maintien/patrouille dans l’arène et exemption du nettoyage pour ces acteurs, puis10/10tests lunaires et suite612/612 réussis.
- Chromium ordinateur1366×768 et téléphone paysage émulé844×390 : sélection, mouvement/tir, pause figée, même niveau après redémarrage, résultats2, film1 préservé et accès2 après le film. Aucune erreur JS ni ressource HTTP manquante. Les états de victoire ont été injectés uniquement dans la réponse navigateur de test pour vérifier le fluxUI ; la fin de campagne réelle est vérifiée séparément par la simulation à commandes ordinaires. Aucun raccourci de contrôle n’est ajouté au jeu.
- Captures inspectées : texte du menu lisible, interface et commande de déploiement accessibles sur téléphone, pierre gravée et ruines/ciel lunaires visibles ; pas de téléphone physique testé.

Publication Sites et mise à jour de versions/saltik-main sur GitHub seront consignées dans le rapport de livraison. Les autres jeux sauvegardés ne sont pas modifiés.
