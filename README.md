# saltik
vidéo game


## Sauvegarde des versions Saltik

Les cinq états ci-dessous sont conservés dans des dossiers indépendants, sans modification de leur gameplay. Les sources, sprites, décors, sons, animations, vidéos, tests et builds web de chaque édition restent ensemble. Le README initial ci-dessus et son commit sont préservés.

| Jeu / sources | État réel | GitHub Pages après activation | Commit source |
| --- | --- | --- | --- |
| [SALTIK V2 — Matin Doré](versions/saltik-main) | Publiée v31 — 3 niveaux, Striker + Gatling + BT | [Jouer](https://seradrien-png.github.io/saltik/versions/saltik-main/dist/) | `22939ba5849d` |
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

## Monde assemblé et réellement jouable — version 21

[Jouer au niveau 2](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site?level=2). Dix structures au premier plan utilisent le même registre pour leur dessin et leurs collisions, avec quatorze escaliers reliés à de vraies terrasses, dont les deux côtés des remparts. Trois annexes décoratives sont devenues jouables ; les placements qui se chevauchaient ont été retirés. Marches recalées sur les pixels de l’atlas, tailles des illustrations préservées, sol raccordé aux pieds peints. Les façades fantômes ont été supprimées au profit d’une composition opaque avec une tête de pierre nette. 627 tests réussis ; montées réellement vérifiées dans Chromium et campagne de 94,82 s sans chute. [Bilan exact](lunar-cohesion-release.json).


## Boss final — version 22 publiée

Nouveau blindé ivoire/orange avec quatre états et épave conservée au sol après la victoire. Pod arrachable après trois salves lancées, canon principal en rafales successives de trois, deux petits canons alternés avec pauses, frénésie à 20 % de vie. Interactions de coque/pod recalées sur le nouveau blindage. 635 tests réussis ; Chromium : états, interactions, trois tirs successifs et épave encore visible après destruction réelle. Source `4759b68c37c2fb177e747b528a05955e9b8dc1a2`. [Jouer](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site). [Bilan vérifié](boss-release.json). Autres éditions et niveau lunaire préservés.


## Les Jardins de velours — version 23 publiée

[Jouer directement au niveau 3](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site?level=3). Grand arbre brodé, arc-en-ciel monumental, montagnes bleues et cascades reprennent la composition de référence. Huit structures natives, six escaliers et deux ponts en trois quarts avec profondeur progressive ; trois sceaux défendus au long du parcours. Saltik doré réservé à ce niveau, avec ses commandes et ses armes habituelles. Menu à trois choix et continuation du niveau 2 vers le niveau 3. Le niveau 2 reçoit quelques îlots opaques au plan intermédiaire, à défilement distinct ; son architecture et le fond existant sont préservés. Le boss du niveau 1 et son épave restent intacts.

645 tests réussis. Campagne avec commandes normales : 78,73 secondes, 100 points de blindage, aucune chute. Chromium : pont dans les deux sens, escalier du sanctuaire, transition 2→3 et contrôles sur téléphone émulé vérifiés, aucune erreur JavaScript. Source `7ce68b1cdf4cb6d5d34ec1fa6adb9e8ea4a536b1`. [Bilan exact](royal-release.json). Autres éditions et archives préservées.


## Apparences et profondeur — version 24 publiée

[Niveau 3](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site?level=3) : Saltik agrandi de 20 % à toute profondeur, poteaux et rambardes proches réellement devant lui, trois formes praticables nouvelles (racine arquée, roue à eau, racines autour d’une bobine), végétation plus dense et neuf grands objets opaques de premier plan pouvant le masquer brièvement. Les pixels de la rambarde proviennent du pont d’origine via un masque complet, sans décalage de texture. [Niveau 2](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site?level=2) : nouveau Saltik ivoire/or, drapés lunaires rouges et lumières cyan d’après la photographie fournie. Ses animations et commandes sont conservées.

651 tests réussis, deux campagnes terminées sans chute avec blindage natif, sept accès réellement parcourus dans Chromium, téléphone émulé et transition 2→3 validés, aucune erreur JS. Source `e7625a06befc829bd4a6a111ee495d3bcf7d8516`. [Bilan exact](density-release.json). Autres éditions, niveau 1 et architecture lunaire préservés.


## Échelle du niveau 2 — version 25 publiée

Saltik joueur augmenté littéralement de 0,10 % (×1,001, échelle .8008) ; tous les ennemis de la mission réduits de 10 % (×.9), Saltiks et drones déployés compris. Les points de tir et zones de collision suivent les dessins. Échelles des niveaux 1 et 3 conservées. 655 tests réussis, six familles inspectées dans Chromium, téléphone émulé validé. [Jouer au niveau 2](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site?level=2). [Bilan exact](lunar-scale-release.json). Source `ed97563496192fa2481f5d6b6a6bc963ed7a9697`.

### Habillage des ennemis — version 26

Les ennemis des Archives lunaires et des Jardins de velours reprennent les matières de leur Striker : émail et gravures célestes au niveau 2, velours matelassé et broderies dorées au niveau 3. Les Saltiks ennemis gardent leur vert/orange et le porte-drone son bleu. Contours natifs conservés pixel par pixel, aucune modification des comportements, rencontres ou tailles. Niveau 1 préservé.

658 tests réussis ; six cartes de matière sans différence d’alpha ; douze scènes d’ennemis contrôlées dans Chromium, tir tactile/pause/redémarrage validés sur téléphone émulé. Source `808ac762df53ed0a001488865673fc92c9fb4848`, version 26 publiée. [Bilan détaillé](enemy-style-release.json). [Niveau 2](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site?level=2) · [Niveau 3](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site?level=3).

### Niveau 2 — profondeur basse et ciel naturel, version 27

Deux nouveaux plans opaques de maçonnerie et de roche occupent le bas de la vue, derrière la route et les personnages, avec deux vitesses de défilement. Le ciel conserve la grande lune, la tête de pierre et les architectures ; les écritures, diagrammes astronomiques et rubans flottants sont retirés. La base des nouveaux plans reprend la vraie texture de pierre sans étirement dans les creux du terrain. L’ancien panorama est conservé. Aucune modification du gameplay ou des autres niveaux.

661 tests réussis ; six positions inspectées dans Chromium, tir tactile/pause/redémarrage validés sur petit écran, aucune erreur JS. Atlas converti en silhouettes aux surfaces entièrement opaques. Source `f6268033d616c2525b16be25e3f8527d8b704bfa`. [Bilan détaillé](lunar-low-depth-release.json) · [Jouer au niveau 2](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site?level=2).

### Niveau 2 — couches fixes et fanions, version 28

Les deux nouveaux plans bas restent fixés au même repère que le terrain : même déplacement, altitude et dimensions constantes en coordonnées du monde. Les Saltiks ennemis portent deux fanions rouges à lune/laurier dorés, attachés aux vrais supports des pods ; ceux du porte-drone suivent ses plateformes. Leurs couleurs et tailles sont conservées. Aucun fanion ajouté aux niveaux 1 et 3, aucun changement de mécanique.

664 tests réussis, six positions et six états de robots inspectés dans Chromium, petit écran et commandes validés, aucune erreur JS. Source `02bccd706ef5856062a9d9c53d4cc19e3d8dcab3`. [Bilan détaillé](lunar-pennants-release.json) · [Niveau 2](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site?level=2).

### Niveau 2 — continuité de caméra et DR01 habillé, version 29

Le découpage lié à l’écran qui effaçait les toits dans les vallées est supprimé. Les deux plans bas passent par la même transformation de caméra et de secousse que le terrain, en conservant leur ancrage fixe et leur opacité. Le DR01 bleu reçoit un mantelet cramoisi/or et des panneaux brodés ajustés à la coque, sans fanions pendants. Les fanions du Saltik vert/orange sont conservés ; les autres niveaux et les mécaniques restent inchangés.

664 tests réussis, traversée de la vallée profonde avec caméra jusqu’à-336, comparaison de pixels reproduisant l’ancien défaut puis sa correction, captures bureau/petit écran et commandes validées, aucune erreur JS. Source `75f051926ca13331f3eb4466792fc09f58dedaba`. [Bilan détaillé](lunar-continuity-release.json) · [Niveau 2](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site?level=2).

### Gatling — version 30

Nouveau Saltik jouable dans les trois niveaux, deux mitrailleuses et huit roquettes non guidées, camouflage neige et matériaux adaptés aux missions. Tir immobilisant, recul après 2 s, surchauffe après 5 s, refroidissement 5 s. Striker conservé. [Jouer sur le site publié](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site/?level=1&character=gatling). 689 tests passés ; essais Chromium ordinateur/téléphone, commandes, transitions et interactions vérifiés. Les quatre autres éditions restent inchangées.

### BT vert et orange — version 31

Le BT existant devient sélectionnable avec Striker et Gatling sur les trois missions, sans nouveau graphisme. Canon : trois tirs par pression. K maintenu : 1 verrou / 0,25 s, relâcher lance les missiles guidés correspondant aux verrous valides. L/R : salve panique non guidée avec le stock restant, sans deuxième salve au relâchement. Stock8, recharge1/2s après5s sans lancement, suspendue pendant le lock. Déplacement/esquive et canon restent possibles pendant le lock. [Jouer avec BT](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site/?character=bt). 706 tests, essais Chromium ordinateur/téléphone, trois niveaux/transitions, interactions et conservation des verrous pendant l’esquive vérifiés. Les69assets antérieurs et quatre autres éditions sont inchangés.
