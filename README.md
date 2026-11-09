# saltik
vidéo game


## Sauvegarde des versions Saltik

Les cinq états ci-dessous sont conservés dans des dossiers indépendants, sans modification de leur gameplay. Les sources, sprites, décors, sons, animations, vidéos, tests et builds web de chaque édition restent ensemble. Le README initial ci-dessus et son commit sont préservés.

| Jeu / sources | État réel | GitHub Pages après activation | Commit source |
| --- | --- | --- | --- |
| [SALTIK V2 — Matin Doré](versions/saltik-main) | Publiée v20 — 2 niveaux | [Jouer](https://seradrien-png.github.io/saltik/versions/saltik-main/dist/) | `dea7b563da10` |
| [SALTIK — Ink Edition publiée](versions/saltik-ink) | Publiée v4 | [Jouer](https://seradrien-png.github.io/saltik/versions/saltik-ink/dist/) | `44110aa2dd80` |
| [SALTIK INK — brouillon local avec épilogue](versions/autres-versions/saltik-ink-brouillon) | Brouillon local non publié | [Jouer](https://seradrien-png.github.io/saltik/versions/autres-versions/saltik-ink-brouillon/dist/) | `21dcc4ca32c5` |
| [Feral Steel — Opération Canopée, référence Saltik](versions/autres-versions/saltik-feral-steel) | Publiée v24 | [Jouer](https://seradrien-png.github.io/saltik/versions/autres-versions/saltik-feral-steel/dist/) | `dbc331d0b7a2` |
| [SALTIK V2 — Missile Link](versions/autres-versions/saltik-missile-link) | Publiée v3 | [Jouer](https://seradrien-png.github.io/saltik/versions/autres-versions/saltik-missile-link/dist/) | `1af9f1f9bd1e` |

[Catalogue des jeux sur Pages](https://seradrien-png.github.io/saltik/) · [Bilan de sauvegarde](BILAN.md) · [Manifeste SHA-256](backup-manifest.json) · [Résultats des contrôles](validation-report.json). **Sauvegarde GitHub confirmée** dans le [commit `55e0af7`](https://github.com/seradrien-png/saltik/commit/55e0af78812ba737a6758403be9c2993ef2fa903). Les empreintes des 1 510 fichiers de ce commit ont été vérifiées sur GitHub. **Pages n’est pas encore actif** : son activation par cette connexion a été refusée avec HTTP 403. Les liens de la colonne Pages ne fonctionneront qu’après activation et déploiement.

### Vérifications et limites

Les 1 485 fichiers originaux des cinq exports sont vérifiés par SHA-256. Les cinq jeux démarrent séparément dans Chromium sur ordinateur et téléphone émulé, sans erreur JavaScript ni ressource manquante lors des essais. Matin Doré : 602/602 tests ; INK publiée : 418/418 ; Feral Steel : 363/363. Les suites complètes du brouillon INK et de Missile Link ont dépassé la limite de 120 secondes ; elles ne sont pas annoncées comme intégralement validées. Aucune mécanique n’a été corrigée ou fusionnée.

### Jouer et développer localement

```sh
python3 -m http.server 8000
```

Ouvrir http://localhost:8000/ et choisir un jeu. Chaque édition fonctionne depuis son propre `versions/.../dist/`. Pour travailler sur un jeu, suivre son README original dans son dossier ; ne pas mélanger les modules entre éditions.

### Contrôler et restaurer la sauvegarde

```sh
python3 tools/verify-backup.py
python3 tools/restore-history.py saltik-v2-matin-dore /tmp/saltik-main-history.git
```

Les quatre historiques Git source accessibles sont archivés dans `history/`, en parties de 45 Mio maximum avec leurs empreintes dans le manifeste. Ils conservent les états antérieurs réels, branches et tags. La restauration de l’historique principal a été vérifiée par clonage local et `git fsck --full`. Le brouillon INK non commité est également copié dans son propre dossier : il n’est pas perdu dans un bundle ne contenant que des commits. Les configurations Git, secrets, dépendances réinstallables et fichiers temporaires sont exclus.

### Publication web

Le workflow `.github/workflows/saltik-pages.yml` prépare uniquement les `dist/` existants, sans reconstruire ni modifier les jeux, puis publie avec GitHub Pages. Il peut être lancé manuellement depuis Actions. Les historiques et fichiers de développement ne sont pas copiés dans le site Pages. Les URL Sites d’origine utilisées par les liens d’installation Android restent inchangées.

Le propriétaire peut sélectionner **GitHub Actions** dans [Settings → Pages](https://github.com/seradrien-png/saltik/settings/pages), puis lancer le workflow **Saltik independent games on Pages** dans Actions. [Rapport du transfert vérifié](github-transfer-report.json).

## Livraison initiale v17 — historique du niveau 2

**[Jouer à la version actuellement publiée](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site)** : choisir **NIVEAU2** dans le menu pour tester directement, ou continuer après le film de victoire du niveau1. Redémarrer/rejouer conserve le niveau choisi. Le niveau1 et les dessins des Saltiks sont conservés. Le tir principal gagne20%de volume par rapport à la version16.

Les Archives ont leur propre parcours de17 800unités, six accès surélevés, cinq franchissements avec reprise sûre et une finale de trois vagues pour ouvrir le portail. Une partie automatisée avec commandes normales termine en82,02s,92blindage restants,0chute. Suite complète612/612 ; essais navigateur ordinateur/téléphone de sélection, pause, redémarrage et transition réussis. [Rapport de livraison](lunar-release.json). Les autres éditions et les archives source initiales sont conservées ; les mises à jour suivantes du jeu sont historisées par les commits de ce dépôt.

## Révision des Archives lunaires depuis GitHub

Les treize commits jusqu’à `4c9b8e6` ont été intégrés puis affinés : architecture, escaliers, bannières, portail et objectifs par secteur. Build et 615 tests réussis. La sauvegarde révisée se trouve dans `versions/saltik-main` ; `dist/` est autonome et accepte `?level=2`. **Révision publiée en v18** : [jouer directement au niveau 2](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site?level=2). Les vérifications Chromium ordinateur et téléphone émulé ont réussi. Les mentions de blocage dans les documents source décrivent l’étape précédente ; ce blocage est levé. Voir [le rapport exact](lunar-revision-status.json) et [les détails](versions/saltik-main/docs/level-design/lunar-github-revision.md). Les autres éditions et les archives historiques sont préservées.

## Refonte du monde lunaire — version 19

[Jouer au niveau 2](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site?level=2). Le décor utilise maintenant des structures illustrées, un aqueduc avec ses escaliers mesurés, des passages sous les arches et plusieurs quartiers proches en parallaxe. La position invalide des ennemis portant un identifiant textuel est corrigée ; soldats, tourelles, drones et marcheurs ont été vérifiés au dessin dans Chromium. Caméra adaptée aux chemins bas. Musique coupée uniquement au niveau 2, effets et voix conservés, musique du niveau 1 préservée. 619 tests réussis et campagne simulée de 93,02 s sans chute. [Bilan exact](lunar-depth-release.json). Les autres éditions restent intactes.

## Intégration du monde lunaire — version 20

[Jouer au niveau 2](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site?level=2). Striker est réduit de 20 %, illustrations de premier plan inchangées. Les roues, les rotations et les points de tir suivent la proportion réelle. Raccords des ruines recalés sur leur pied peint ; terrain gris remplacé par du grès chaud assorti aux fondations. Ciel, île au visage et îles astronomiques sont de vraies couches distinctes, derrière les quartiers en parallaxe. 623 tests réussis, campagne simulée de 93,08 s sans chute, contrôles ordinateur et téléphone émulé réussis. [Bilan exact](lunar-integration-release.json).
