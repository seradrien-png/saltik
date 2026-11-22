# Roulement amorti intégré — 22 novembre 2026

L’utilisateur valide explicitement la démo v66 pour tout le jeu. Joueurs Striker, Gatling et BT, leurs costumes de niveaux, BT ennemis, Striker ennemi, Longrange et DR-01 utilisent désormais une articulation de suspension à deux segments, avec racine fixe et roue rigide au contact réel du terrain. Aucun cycle de pas n’est produit par le temps ou la distance sur terrain plat ; la rotation des roues reste liée au déplacement réel.

Les rendus natifs partagent src/rolling-suspension.js via drawJumpLegStrut. Le châssis reprend l’amortissement de support existant tout en conservant l’inclinaison nécessaire aux escaliers raides. Les poses aériennes, retournements dessinés, KO, interactions et armes gardent leurs chemins existants. Pas de nouveau fichier graphique/audio ; physique, trajectoires, dégâts et temps de recharge inchangés.

Revue indépendante : compression extrême corrigée après reproduction RED puis GREEN sur l’escalier du checkpoint, trois modèles. La compression verticale suit les longueurs des deux segments pour éviter leur retournement lorsque la suspension totale reste positive.

Contrôles de publication : suite Node complète, intégrité des attaches et jointures, contacts sur sols et escaliers dans les deux sens et à plusieurs échelles, contrôle Chromium mobile des 15 combinaisons personnage/niveau, pause/arrêt/sauts/retournements (restrictions habituelles conservées dans la traversée extérieure du niveau 4). Résultats définitifs et publication dans la sauvegarde GitHub rolling-suspension-integration-release.json.
