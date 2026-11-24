# Données sauvegardées et compatibilité

## Stockage local
- Base **IndexedDB `grilles-evaluation`, version 1**, magasin **`workspace`** : un seul enregistrement, l'espace de travail actif (un devoir, un groupe). Fonctions : `openWorkspaceDatabase`, `readWorkspace`, `writeWorkspace`, `workspaceSnapshot`, `saveWorkspace`, `restoreWorkspace`.
- Les **photos** des élèves ne sont pas sauvegardées. Aucune donnée n'est envoyée sur un réseau.
- Si un autre onglet modifie la sauvegarde, un avertissement signale que l'onglet courant n'enregistre plus.

## Contenu de l'enregistrement (`workspaceSnapshot`)
`version`, `gridLoaded`, `grid`, `config`, `partLayout`, `assignment`, `activeStudentGroup`, `assignmentStudentDetails`, `studentCorrections`, `activeCorrectionStudentId`, `correctionInteractionMode`, `currentCorrection`.

Une **correction** (`studentCorrections[idÉlève]` et `currentCorrection`) contient :
`manualChoices`, `manualCategoryPercent`, `categoryEvaluations`, `leafChoices`, `bonusChoices` (ancien), `methodStates`, `note` (+ `studentName` pour `currentCorrection`).

| Structure | Clé → valeur |
|---|---|
| `leafChoices` | id capacité → niveau choisi |
| `manualChoices` | id catégorie → niveau imposé par le correcteur |
| `manualCategoryPercent` | id catégorie → pourcentage imposé (curseur manuel) |
| `categoryEvaluations` | id catégorie → `{ warning, exceeded, activeMotifKind }` (Attention, Dépassé, motif) |
| `methodStates` | id catégorie → état de la méthode (ci-dessous) |

## `methodStates[idCatégorie]` — champs connus
| Champ | Méthode | Sens |
|---|---|---|
| `scores` | Barème | points par critère |
| `counts`, `decrement` | Distribution | comptage par niveau ; mode retrait |
| `count` | Compteur | nombre d'occurrences |
| `startedAt`, `elapsedMs`, `recorded` | Minuteur | chronomètre (`startedAt` est converti en `elapsedMs` à l'enregistrement) |
| `manualSeconds` | Minuteur | durée correspondant à la position manuelle sur le fer à cheval |
| `bonus`, `bonusComment`, `bonusText` | Bonus | points ; id du commentaire prédéfini ; texte libre (prioritaire s'il existe, même vide) |
| `commentSelections` | toutes | `"<idPropriétaire>:<niveau>"` → id du commentaire prédéfini (`""` = aucun) |
| `commentTexts` | toutes | `"<idPropriétaire>:<niveau>"` → **texte libre** (prioritaire sur le prédéfini, même vide) ; effacé quand on choisit dans la liste |
| `evaluee` | toutes | `false` = non noté (NN) ; absent = valeur de la grille |
| `detailsOpen`, `popupDetailsOpen` | Capacités, Barème | tiroir ouvert (écran principal / fenêtre de correction) |

`<idPropriétaire>` = id de la catégorie, ou de la capacité pour un commentaire de capacité.

## Règles de compatibilité
1. **Ne jamais perdre** une correction enregistrée : tout nouveau champ doit être **facultatif** avec une valeur par défaut explicite quand il est absent (ex. `manualSeconds` absent ⇒ position retrouvée par la courbe).
2. Renommer ou changer le sens d'un champ ⇒ **migration** : copie de l'ancien état conservée, vérification avant activation, jamais d'écrasement en cas d'échec (voir spec des méthodes).
3. Tout champ ajouté à `methodStates` est copié tel quel dans la sauvegarde ⇒ **le documenter ici** dans la même PR.
4. La sauvegarde locale n'est ni une synchronisation ni un export : l'export du devoir sur fichier reste à concevoir (voir `STATUS.md`).

## Fichiers échangés
- **Groupe d'élèves (CSV)** : colonnes `Nom`, `Prénom`, `Classe`, `PAP` uniquement ; le nom du groupe vient du nom du fichier ; aucune photo ni donnée de devoir.
- **Grille** : JSON `versionFormat: 1` (voir `format-grille.md`). Les anciennes grilles CSV restent lisibles par l'ancien chemin d'import mais ne sont pas converties automatiquement.
