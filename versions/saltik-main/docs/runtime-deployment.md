# Publication légère, originaux préservés

`dist/` reste une version complète et jouable avec tous ses PNG historiques.
La sauvegarde GitHub conserve ces fichiers, les sources audio et les autres éditions.
Aucun original n'est supprimé ou remplacé.

Le paquet publié utilise `out/`, construit séparément par `scripts/package-runtime.py`.
Il exclut uniquement 13 illustrations historiques absentes du registre résolu
`INK_ART_NAMES` et des URL directes du code, des pages HTML, du CSS et du manifeste :

- `ink-boss`, `ink-boss-parts` : le jeu charge `pastel-boss*` sous ces clés.
- `ink-carrier`, `ink-carrier-dr01`, `ink-carrier-platform`, `ink-carrier-profile-dr01`,
  `ink-carrier-support-dr01`, `ink-carrier-two-eyes-dr01` : actif = `ink-carrier-raised-dr01`.
- `lunar-archives-sky`, `lunar-archives-stone`, `lunar-carrier-material`,
  `lunar-coherent-world`, `lunar-sky-layer` : versions remplacées ; le matériau
  actif du porteur est `lunar-carrier-dressed-material`.

Les PNG actifs sont encodés en WebP sans perte, uniquement si le résultat est
plus petit. Chaque conversion vérifie dimensions, alpha et chaque pixel visible.
Les atlas ne sont ni redimensionnés ni recadrés. Les URL du chargeur et les URL
statiques sont adaptées uniquement dans la sortie générée. Les mécaniques,
les timings et les sources du jeu restent inchangés.

Tous les sons, voix, musiques, icônes, polices, deux films et affiches restent
présents. Les fichiers audio/vidéo/icônes sont comparés par SHA-256. Le son A10
et les nouvelles voix ne sont pas réencodés. Les huit poses de l'anguille sont
préservées. `promo.html` et `android.html` restent fonctionnels.

## Reproduction

Prérequis : Node, Python 3 et Pillow avec WebP. Depuis cette racine :

```sh
npm run build
python scripts/package-runtime.py --output /tmp/saltik-release --archive /tmp/saltik-release.tar
```

Choisir un nouveau dossier et une nouvelle archive pour chaque construction.
Le script refuse un dossier existant afin d'éviter tout écrasement. L'option
`--cache` accepte un dossier de WebP déjà convertis : chaque image est décodée
et comparée à son PNG original avant utilisation.

Le résultat contient `out/` et `asset-audit.json` avec les exclusions, tailles,
empreintes et contrôles de préservation. L'archive contient le manifeste et
`out/`. Publier sur le Site existant avec le SHA exact des sources poussées.
Ne jamais réutiliser un ancien SHA pour un autre paquet : Sites déduplique
les versions enregistrées par SHA.

Les deux publications précédentes ont échoué côté hébergeur. Une limite de
taille était une hypothèse, pas un diagnostic confirmé. Le résultat de cette
publication doit être vérifié séparément avant de la déclarer en ligne.
