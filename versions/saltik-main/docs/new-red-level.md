# Nouveau niveau5 : Les Fossiles rouges

20 novembre 2026. Correction de la portée de v52 selon les cinq précisions de l’utilisateur.

Le Désert rouge du niveau4 est restauré : panorama original, piste vers C‑07, changement progressif de taille demandé pour cette ancienne mission, nettoyage des trois salles et retour. Ses fichiers `desert-level.js` et `desert-world.js` correspondent exactement à la version51, source8fa2dae. Il n’est plus remplacé par le prototype à deux voies. La version52 est conservée dans l’historique, ainsi que ses ressources.

Le nouveau niveau5 se sélectionne séparément au lancement et suit le4 dans la campagne. La durée visée est90–120secondes avec les combats habituels : 23000unités, vitesse native230unités/s. L’essai intégré avec armure normale, canon, MIRV et guidés atteint la sortie en109,72s, avec32ennemis détruits, les trois Saltiks neutralisés et100points d’armure restants. Les arrêts volontaires et le rythme de tir propre à chaque personnage font naturellement varier cette durée ; aucun chronomètre n’accélère le joueur ni n’attend artificiellement devant la sortie.

Le moteur habituel gère directement les35ennemis, dont trois Saltiks, et les six réparations. Saut, accroupissement, esquive, QTE, dégâts, chargeurs, recul, chauffe et recharges sont inchangés. La sélection de distance MIRV et les missiles guidés sont conservés ; aucun hook de voie ne contraint les tirs. Les bornes de caméra, de projectile et de mouvement des Saltiks utilisent désormais la longueur du niveau courant, pour permettre le combat aprèsx20000. Un test reproduit l’ancienne limite de caméra avant correction. L’arrivée nettoie les projectiles et les armes en attente.

Le défilement suit la caméra normale. Le personnage n’est plus comprimé dans une image fixe. La direction artistique emploie les panoramas INK rouges existants, un véritable crâne détouré et une grande illustration de sable continu, sans découpe de terre au premier plan. Le sol dessiné s’étend devant et derrière les roues ; les petites dunes physiques restent dans ce plan. Les tenues et retournements désert approuvés sont réutilisés, à l’échelle normale. Un passage unique de pieds et tibias géants conserve les os chauds du décor et l’articulation des chevilles ; il reste cosmétique et ne bloque pas les armes.

Les nouveaux assets `red-wastes-sand-plane.png` et `red-wastes-skull.png` sont additifs. Tous les anciens assets, poses, voix, musique et A10 sont préservés. La publication conserve le conditionnement WebP sans perte existant.

Contrôles : suite complète, essais navigateur au clavier pour les trois personnages (y compris arsenal aprèsx20000 et caméra visible), cinquième choix au lancement, niveau4 restauré, pause, sortie et multitouch BT sur téléphone émulé. Les captures finales ont vérifié l’absence de triangle de fond autour du crâne et de bord de plateforme au sol. Revue indépendante des corrections caméra et nettoyage de victoire, sans point bloquant.
