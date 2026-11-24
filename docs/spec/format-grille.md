# Format du fichier de grille JSON (`versionFormat: 1`)

Source de vérité technique : la fonction `gridFromJson` de `correction.html` (validation) ; exemple complet : `grille-exemple-oral.json`. En cas d'écart entre ce document et le code, le signaler dans le handoff.

## Principes
- Un fichier = une grille autonome, sans correction d'élève.
- `versionFormat` = version du **format** (actuellement `1`). `metadonnees.version` = version de **la grille**.
- Les **identifiants** (`id`) sont des chaînes non vides, **uniques dans toute la grille** et **stables** (ils ne changent pas quand un titre change). L'ordre des listes détermine l'affichage.
- Pourcentages : échelle 0–100. Durées du Minuteur : **secondes**.
- Les commentaires proposés pour un niveau sont des **listes** `[{id, texte}]` ; le premier est présélectionné ; le correcteur peut en choisir un autre, aucun, ou écrire un texte libre (stocké à part, voir `donnees.md`).

## Structure générale
```
versionFormat, id, titre
metadonnees { version, dateCreation, auteur (null possible), langue, etiquettes[], description }   (facultatives)
parametres  { noteMaximum, plafondBonus, decimalesNote, decimalesPourcentage }
parties[]   { id, titre, categories[] }
```

## Catégorie (commun)
`id`, `titre`, `methode` (`capacites` | `bareme` | `distribution` | `compteur` | `minuteur` | `bonus`), `evaluee`, `priseEnCompte` (`obligatoire` | `facultative`), `coefficient`, `informationsFonctionnement` (consigne affichée dans la fenêtre d'information), `niveaux` (`["NA","ECA","A"]` ou `["NA","ECA-","ECA+","A"]`), `commentaires { niveaux{niveau:[{id,texte}]}, attention[], depasse[] }`.
La méthode **Bonus** n'a ni coefficient, ni niveaux, ni prise en compte : elle a `pointsMaximum`, `pas`, `commentairesValorisation[]`.

## Champs propres à chaque méthode
| Méthode | Champs |
|---|---|
| `capacites` | `valeursNiveaux {niveau: 0–100}`, `seuilsPourcentage {niveau: seuil}`, `capacites[] { id, titre, poids, aideNotation, commentaires{niveau:[…]} }`, `sousCategories[] { id, titre, capacites[] }` |
| `bareme` | `seuilsPourcentage`, `criteres[] { id, titre, pointsMaximum, pas, aideNotation }` |
| `distribution` | `valeursNiveaux`, `seuilsPourcentage` |
| `compteur` | `seuilsOccurrences { ECA, A, D }` (entiers croissants ; `D` = seuil de « Dépassé ») |
| `minuteur` | `dureeCibleSecondes`, `seuilsSecondes { naTropCourt, entreeA, sortieA, naTropLong }`, `separationsECASecondes { tropCourt, tropLong }` (4 niveaux), `courbe { origine, interpolation, points[] { secondes, pourcentage } }` |
| `bonus` | `pointsMaximum`, `pas`, `commentairesValorisation[] { id, texte }` |

Le premier niveau n'a pas de seuil ; les seuils sont entiers et strictement croissants.

## Validation (extraits des messages d'erreur du code)
Format ou version non pris en charge · identifiant manquant ou répété · liste de commentaires ou commentaire invalide · coefficient invalide · niveaux invalides · prise en compte invalide · valeurs ou seuils de niveau invalides · aucune capacité / aucun critère · seuils du compteur invalides · paramètres, séparations ou courbe du minuteur invalides · paramètres du bonus invalides · plafond de bonus invalide · aucune catégorie.
Une grille invalide est **refusée avant chargement** (test unitaire existant).

## Règles d'évolution
- Ajouter un champ **facultatif** : autorisé, sans changer `versionFormat`, avec test et mise à jour de ce document.
- Rendre un champ obligatoire, en renommer ou en supprimer un : **changement de format** ⇒ nouvelle version de format, migration, validation humaine.
- Les grilles existantes (`grille-exemple-oral.json`, grilles de l'utilisateur) doivent toujours se charger.
