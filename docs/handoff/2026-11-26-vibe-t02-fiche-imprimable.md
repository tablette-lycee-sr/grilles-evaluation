# Passation — 2026-11-26 — Vibe — T-02 : fiche imprimable cohérente écran/papier

**Issue / tâche :** #5 · **Branche :** `agent/vibe/t02-fiche` · **PR :** (draft, voir GitHub, `Closes #5`)

## Protocole respecté
1. **Inventaire des écarts écran/papier posté sur l'issue #5** (commentaire du 2026-11-25) : 5 écarts relevés dans le code, 2 points déjà conformes (NE, D-007), 1 question ouverte (coefficient).
2. **Validation utilisateur** (commentaire du 2026-11-26 sur #5) : les 5 propositions validées telles quelles ; **le coefficient ne sera pas imprimé**.
3. Implémentation dans le présent PR — aucune retouche du calcul de la note (hors périmètre).

## Fait (corrections de la fiche, `src/js/impression.js`)
- **Écart 1 — NN** : l'en-tête de catégorie affiche « NN » à la place du niveau et du pourcentage ; le détail (commentaires, capacités/critères/occurrences) est conservé à titre indicatif ; la ligne « Évaluée mais non notée (NN) » reste.
- **Écart 2 — 2(+)** : mention « (+) » après le pourcentage dans l'en-tête + ligne « Notée seulement si elle augmente la note finale ».
- **Écart 3 — Bonus NN** : en-tête « NN » + ligne « Bonus non pris en compte » ; plus de « +0 pt », ligne du commentaire de bonus supprimée en NN.
- **Écart 4 — Motifs des catégories sans méthode** : le motif Attention précis (`motifIds.warning`, repli `motifId`) est imprimé dans l'en-tête ; une ligne « Dépassé : <motif> » est ajoutée quand Dépassé est actif (les catégories avec méthode le faisaient déjà).
- **Écart 5 — Minuteur (D-011)** : la fiche imprime la **durée retenue** (`manualSeconds` si position manuelle, sinon la mesure), la mesure est rappelée « (mesurée …) » quand elle existe et diffère de plus de 0,5 s ; « — » seulement si jamais démarré et sans position manuelle.
- **Coefficient** : non imprimé (décision utilisateur).

## Tests
- **e2e** : `tests/e2e/impression.e2e.cjs`, 3 scénarios sur `grille-exemple-oral.json` (+ grille par défaut pour les catégories sans méthode, seules à porter des motifs) : statuts dans l'en-tête, durée du minuteur (4 cas), motifs. Captures `fiche-statuts-t02.png` et `fiche-motifs-t02.png` dans l'artefact `captures-e2e` pour validation visuelle.
- **Unitaires** : la mise en forme de la fiche est couplée au DOM (`document.createElement`) et non factorisable sans réécriture → pas de test unitaire ajouté (justification demandée par l'issue ; le chemin papier est couvert par les 3 scénarios e2e).
- `npm test` : 23/23 (unitaires inchangés).

## Docs
- `docs/spec/methodes-correction.md` (§ « Sauvegarde, compatibilité et fiche ») : contenu exact du papier décrit.
- `docs/STATUS.md` : fiche ✅ (e2e 13 au total), entête datée.

## Zone sensible (label `sensible`)
Oui : contenu de la fiche visible par l'élève. **PR en draft** : (1) relecture Claude demandée ; (2) validation visuelle attendue — télécharger l'artefact `captures-e2e` du run CI et vérifier les deux captures, ou imprimer un vrai PDF depuis l'app. Le merge reste à ton initiative après ces deux feux verts.

## Point d'attention pour la relecture
- Le seuil de 0,5 s entre durée retenue et mesurée (affichage de « (mesurée …) ») est un choix d'implémentation discrétionnaire — à ajuster si l'utilisateur préfère un autre seuil.
- Pour les catégories sans méthode, `motifId` générique reste un repli si `motifIds` est absent (compatibilité anciens états sauvegardés).
