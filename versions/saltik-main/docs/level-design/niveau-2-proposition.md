# Proposition — niveau 2 : Les Archives lunaires

Statut : réalisation autorisée par l’utilisateur ; accès après le niveau 1 et par le menu, durée similaire au niveau 1, tir principal +20 % par rapport au volume actuel. Demande utilisateur : créer le niveau 2 à partir de son image, préserver les Saltiks et changer les passages et affrontements du niveau 1 ; les autres ennemis peuvent être adaptés.

## Direction visuelle

Ruines de pierre ivoire suspendues dans les nuages, ciel bleu ardoise et énorme lune ocre, gravures astronomiques, lianes et feuillages cuivre/vert désaturé. Portes circulaires dorées, anneau brisé et sphère d’astrolabe lumineuse. Dessin à l’encre, papier texturé et couleurs de Matin Doré.

L’image utilisateur est la référence d’ambiance et d’architecture. Ses boutons, sa jauge, ses textes et le Saltik ne doivent pas être incrustés dans les décors générés : le jeu dessine sa véritable interface et ses véritables personnages.

## Déroulé proposé

1. **Parvis des astres** : départ depuis le portail inférieur, marches courtes vers une première terrasse ; sentinelles peu nombreuses pour laisser découvrir le lieu.
2. **Ponts des constellations** : succession de franchissements et changements de hauteur, avec pressions aériennes annoncées et abris courts ; rencontres positionnées sur les paliers, sans reprendre la cadence régulière du canyon.
3. **Jardins suspendus** : route haute exposée aux drones ou détour bas avec couvertures ; une rencontre de Saltik placée dans un espace adapté, avec le même dessin et les mêmes interactions non létales.
4. **Anneau brisé** : rapprochement du grand astrolabe, accès par deux terrasses et ponts décalés ; munitions, réparations et positions d’attaque organisées différemment du niveau 1.
5. **Porte des Archives** : objectif final de défense du portail contre trois vagues distinctes. La conclusion repose sur l’ouverture du portail ; elle ne rejoue pas le duel contre le Colosse.

## Ennemis

Les Saltiks restent les assets natifs existants. Le porte-drones bleu/ivoire approuvé conserve également son dessin exact. Les autres ennemis peuvent recevoir un habillage de gardiens astronomiques : céramique ivoire, métal patiné, éclairages ambrés et signes orbitaux. Les armes visibles, leurs points de départ et les collisions doivent rester cohérents. Les silhouettes doivent rester lisibles sur téléphone.

## Construction et intégration

- Conserver un niveau 1 autonome et introduire une définition propre au niveau 2 : terrain, paliers, marches, rencontres, décor et objectif de victoire.
- Réutiliser les commandes et la physique existantes. Chaque surface présentée comme praticable doit correspondre à un support physique réel ; les ruines de fond restent décoratives. Proposition pour les vides : reprise au dernier palier sûr après une chute, avec perte de 10 points de blindage et défaite si le blindage atteint zéro. Les paliers et reprises devront être testés ; ne pas dessiner un faux gouffre au-dessus d’un sol invisible.
- Rendre les limites et la condition de victoire dépendantes du niveau ; les constantes du niveau 1 ne doivent pas imposer une copie de son rythme. Le déclenchement automatique du Colosse à 16 400 doit être inactif au niveau 2.
- Accès proposé par défaut : après le film de victoire du niveau 1 et sélection directe dans le menu pour les essais. Ce choix est réversible. L’interface de transition doit cohabiter avec le film existant sans le supprimer.
- Créer des ressources séparées pour le décor et les ennemis non Saltiks. Préserver les fichiers originaux.
- Synchroniser la version principale GitHub après chaque livraison vérifiée, avec commit clair ; publication Sites quand le niveau jouable complet est validé.

## Vérification attendue

Passage réel des marches et ponts avec roues sur leurs supports ; absence de blocages ; combat et objectifs finissables avec les commandes normales ; comportements annoncés et lisibles ; pause/reprise/rejouer ; ordinateur et téléphone paysage. Comparaison visuelle au document utilisateur et contrôle de non-régression du niveau 1.

