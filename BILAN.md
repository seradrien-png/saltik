# Bilan des copies Saltik

Dépôt cible choisi par l’utilisateur : https://github.com/seradrien-png/saltik (public). L’ancien dépôt privé Saltik-ink n’a pas été modifié. Le dépôt cible contenait un README et le commit `a2658100e8259a69c772a6dd4cfbfcdb833f1221`, tous deux préservés.

## Versions réelles conservées

| Jeu | Dossier autonome | Commit source |
| --- | --- | --- |
| SALTIK V2 — Matin Doré | [versions/saltik-main](versions/saltik-main) | `9f0aafbca8588004fc6666942d833f3dbe0e9488` |
| SALTIK — Ink Edition publiée | [versions/saltik-ink](versions/saltik-ink) | `44110aa2dd80e668b2b9fd15aa6635ad9da6cef2` |
| SALTIK INK — brouillon local avec épilogue | [versions/autres-versions/saltik-ink-brouillon](versions/autres-versions/saltik-ink-brouillon) | `21dcc4ca32c52232ca5fe84795d1f66e37a56191` |
| Feral Steel — Opération Canopée, référence Saltik | [versions/autres-versions/saltik-feral-steel](versions/autres-versions/saltik-feral-steel) | `dbc331d0b7a24469ff9a1d23d0e3bd2f3e1834a2` |
| SALTIK V2 — Missile Link | [versions/autres-versions/saltik-missile-link](versions/autres-versions/saltik-missile-link) | `1af9f1f9bd1e0884eb40148d4d6fe5cec2e763bc` |

## Contrôles

- 1 485 fichiers originaux copiés et vérifiés par SHA-256, aucune modification du gameplay.
- Quatre historiques Git source complets accessibles inclus et vérifiés par empreintes ; restauration du principal testée.
- Dix démarrages navigateur réussis : cinq éditions sur ordinateur et téléphone émulé, aucune erreur JS ou requête de ressource échouée.
- Tests complets réussis : Main 602/602, INK publiée 418/418, Feral Steel 363/363.
- Brouillon INK : 393 tests réussis, 25 annulés lors de la limite de 120 s. Missile Link : suite interrompue à la même limite, pas de résultat complet. Leurs démarrages navigateur passent.
- Aucun test sur téléphone physique ni partie intégrale de chaque campagne n’est revendiqué.
- Sources originales intactes, y compris les modifications non commitées du brouillon INK.

## Contenu et limites d’accès

Les états historiques supplémentaires réellement accessibles se restaurent depuis les bundles de `history/`. Aucun état fictif n’est ajouté. Tachikoma — Secteur 09 a été inspecté mais identifié comme un fan-game distinct, sans preuve qu’il s’agit d’une édition Saltik : il n’est donc pas renommé Saltik et n’est pas inclus. Aucun autre projet Saltik accessible n’a été trouvé.

## Ressources et lancement

Tous les fichiers des commits source ou du dossier de travail du brouillon sont inventoriés dans backup-manifest.json. Aucun manque de ressource n’a été observé au démarrage. Les jeux se lancent séparément dans leur propre dist/. Les liens Sites d’origine restent conservés dans les écrans d’installation Android. Voir README.md pour les commandes locales et les liens Pages après activation.

## État de publication

**Sauvegarde GitHub effectuée et vérifiée** : [commit `55e0af7`](https://github.com/seradrien-png/saltik/commit/55e0af78812ba737a6758403be9c2993ef2fa903). Les 1 510 fichiers du commit ont été comparés par leurs identifiants de blobs à la copie locale, avec correspondance complète. Les 1 485 fichiers source originaux et leurs historiques sont présents. Le commit initial du dépôt et le début exact du README sont préservés.

**GitHub Pages non déployé** : la création du site est refusée à la connexion avec HTTP 403 « Resource not accessible by integration ». Le workflow et les chemins indépendants sont prêts ; le propriétaire doit sélectionner GitHub Actions comme source dans Settings → Pages avant de lancer le workflow. Aucun lien Pages n’est annoncé comme opérationnel. Les sites Sites d’origine restent inchangés.

## Livraison suivante : version17

La version principale inclut maintenant le niveau2 Les Archives lunaires, accessible directement depuis le menu et après le film du niveau1. Le jeu est publié sur son URL Sites d’origine ;612tests réussissent, les essais ordinateur/téléphone passent et le parcours automatisé ordinaire termine en82,02s. Le tir principal est20%plus fort. Le rapport complet est dans lunar-release.json. Les données de la sauvegarde initiale ci-dessus restent une trace historique ; les autres éditions ne sont pas modifiées.

## Révision publiée : version 18

Les treize commits GitHub jusqu’à `4c9b8e6` sont intégrés et les Archives lunaires affinées : architecture, maçonnerie des escaliers, gravures, bannières, portail ancré et objectifs par secteur. Source `1c65baccc0e11e8683c7b5339a61033c21c4b052`, publiée en v18. [Accès direct au niveau 2](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site?level=2). 615 tests réussis, build valide, campagne simulée de 82,02 s, essais Chromium ordinateur et téléphone émulé réussis. Les sept ressources publiées vérifiées correspondent octet par octet au build. La limite temporaire du contrôle automatique est résolue. Voir `lunar-revision-status.json`. Les quatre autres éditions sont inchangées.

## Refonte lunaire publiée : version 19

Source `b629bb43cb35f1edcecfa0f2a4fdf9643e92355c`, publiée avec succès. Architecture illustrée et relief traversable, profondeur en plusieurs plans, correction des ennemis invisibles et du cadrage des passages bas. Musique du seul niveau 2 désactivée. 619 tests réussis, contrôles Chromium ordinateur/téléphone émulé réussis, campagne à commandes ordinaires gagnée en 93,02 s sans chute. 463 fichiers de la version principale comparés au source et au manifeste. Aucun autre jeu sauvegardé modifié. Voir `lunar-depth-release.json`.

## Intégration publiée : version 20

Source `dea7b563da107570378a626983f506e350aedafd`, publiée avec succès. Taille du seul Striker lunaire à 80 %, illustrations inchangées ; raccords au sol recalés ; nouvelle texture chaude et arrière-plan séparé en couches indépendantes. 623 tests réussis, huit zones inspectées, essais Chromium ordinateur et téléphone émulé réussis. Le niveau 1 et les autres jeux sauvegardés restent préservés. Voir `lunar-integration-release.json`.

## Monde cohérent publié : version 21

Source `39a4475bfcfddb23dda2ca51c2fc497736ceefa5`, publiée avec succès. Dix structures physiques, quatorze escaliers, sol raccordé, tracés mesurés et fond opaque avec tête de pierre lisible. 627 tests réussis, essais des deux escaliers des remparts, annexe et portail par les touches dans Chromium, campagne de 94,82 s sans chute. Le niveau 1, Striker réduit au niveau 2, la musique coupée au niveau 2 et les autres éditions sont préservés. Voir `lunar-cohesion-release.json`.


## Boss final — version 22 publiée

Nouveau blindé ivoire/orange avec quatre états et épave conservée au sol après la victoire. Pod arrachable après trois salves lancées, canon principal en rafales successives de trois, deux petits canons alternés avec pauses, frénésie à 20 % de vie. Interactions de coque/pod recalées sur le nouveau blindage. 635 tests réussis ; Chromium : états, interactions, trois tirs successifs et épave encore visible après destruction réelle. Source `4759b68c37c2fb177e747b528a05955e9b8dc1a2`. [Jouer](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site). [Bilan vérifié](boss-release.json). Autres éditions et niveau lunaire préservés.


## Les Jardins de velours — version 23 publiée

[Jouer directement au niveau 3](https://saltik-v2-matin-dore.ser-adrien.chatgpt.site?level=3). Grand arbre brodé, arc-en-ciel monumental, montagnes bleues et cascades reprennent la composition de référence. Huit structures natives, six escaliers et deux ponts en trois quarts avec profondeur progressive ; trois sceaux défendus au long du parcours. Saltik doré réservé à ce niveau, avec ses commandes et ses armes habituelles. Menu à trois choix et continuation du niveau 2 vers le niveau 3. Le niveau 2 reçoit quelques îlots opaques au plan intermédiaire, à défilement distinct ; son architecture et le fond existant sont préservés. Le boss du niveau 1 et son épave restent intacts.

645 tests réussis. Campagne avec commandes normales : 78,73 secondes, 100 points de blindage, aucune chute. Chromium : pont dans les deux sens, escalier du sanctuaire, transition 2→3 et contrôles sur téléphone émulé vérifiés, aucune erreur JavaScript. Source `7ce68b1cdf4cb6d5d34ec1fa6adb9e8ea4a536b1`. [Bilan exact](royal-release.json). Autres éditions et archives préservées.
