# Épilogue du canyon, visée MIRV et repères KO — 22 novembre 2026

La vidéo de fin du niveau 1 est remontée et réencodée en 1 280 × 720, 30 images/seconde, 36 secondes. Elle utilise directement les dessins et les rendus articulés actuels du jeu : Striker noir/orange et Gatling blanc/rouge libres ; BT vert/orange, Striker noir/doré, Longrange bleu avec pince rouge/cobra et DR-01 bleu à libérer. Chaque personnage porte son apparence de base. Les deux anciens Saltiks lance-missiles rouge et bleu et l’ancien Striker ne sont plus montrés.

Les deux héros ont chacun un plan de présentation libre. Les frères restent derrière les grilles dans les plans de captivité, puis apparaissent à l’arrière-plan tandis que Striker et Gatling occupent le premier plan. Le carton final confirme : deux frères libres, quatre à libérer. Les mouvements sont produits par les rendus natifs, la rotation des roues et les mouvements de caméra. La narration, sa vitesse et la durée existantes sont conservées ; le déclenchement au niveau 1, pause, reprise, son et passage aux résultats utilisent le contrôleur existant.

La visée du mortier ne dessine plus la courbe de vol, les petits cercles ou les croix des impacts individuels. Elle conserve uniquement la zone rouge agrégée et le repère de portée/direction. Le prédicteur physique et les trajectoires, sous-projectiles, dégâts et distances sélectionnables ne changent pas.

Les ennemis Saltik hors service affichent brièvement « POUF ! », puis une petite bulle « K.O. » avec deux boucles d’encre animées. DR-01 reçoit le même repère lorsqu’il est assommé. Le repère suit la position et l’échelle du personnage, utilise le temps de simulation et se fige avec la pause. Aucun son ou sous-titre de voix n’est ajouté.

Les anciennes vidéos restent accessibles dans l’historique Git et la sauvegarde GitHub précédente 4138fa42acd8eb9c564093a6de4bd98266da64e5. Les ressources actives, huit poses, bruitage A10, voix, musiques et autres éditions restent conservés. Le script `scripts/faithful-film/export.py --output /tmp/saltik-film` permet de reproduire la vidéo à partir du storyboard et des assets actuels.
