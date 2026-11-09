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
