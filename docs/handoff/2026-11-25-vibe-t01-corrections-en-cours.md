# Passation — 2026-11-25 — Vibe — T-01 module 8 : corrections en cours

**Issue / tâche :** #4 · **Branche :** `agent/vibe/t01-corrections-en-cours` · **PR :** (draft, voir GitHub)

## Objectif de la session
Découpage de la dernière grande tranche « élèves et corrections en cours » en **trois PR** (consigne de la relecture Claude/Anthropic de la PR #21). Cette PR est la première de la série : le cœur sensible, charger/sauvegarder la correction de l'élève courant.

## Fait
- Bloc **contigu** déplacé octet-à-octet (2 876 caractères) : de `function loadStudentCorrection(` à `function activateLoadedGrid(` exclu : `loadStudentCorrection`, `openStudentCorrection`, `updateCorrectionStudentNavigation`, `navigateCorrectionStudent`.
- Balise `<script src="src/js/corrections-en-cours.js"></script>` insérée en **huitième** position, après `stockage.js`.
- **`captureActiveCorrection` reste volontairement dans `correction.html`** : c'est une fonction de borne des marqueurs de tests (`[resetChoices, captureActiveCorrection]` dans `tests/methodes.test.cjs`) et la consigne AGENTS.md interdit de déplacer une fonction frontière sans adapter les tests. Compte tenu de la sensibilité (elle est appelée par `workspaceSnapshot` de `src/js/stockage.js`), la prudence a primé : elle ne bouge pas, et `loadStudentCorrection` (déplacée) l'appelle sans problème à l'exécution.
- Toutes les références externes du module (`captureActiveCorrection`, `pauseMethodTimers`, `setStatus`, `getSortedTrombiStudents`, `createTrombiPortrait`, `openCorrectionPopup`, `render`, états globaux `methodStates`/`studentCorrections`/…) sont résolues **à l'appel**, jamais au chargement.

## Vérifications
- Aucune instruction top-level dans le module (4 déclarations de fonctions) ; accolades équilibrées ; `node --check` OK.
- **Parité par reconstruction** : `HTML PARITE: True`, `MODULE OCTET-A-OCTET: True` (2 876/2 876).
- `npm test` : **23/23 pass** (aucun marqueur de test couvre ce bloc ; l'e2e de la CI valide le chemin réel).

## Zone sensible
Oui : sauvegarde/restauration de la correction en cours (`loadStudentCorrection` est le pendant de `captureActiveCorrection`, tous deux appelés par `workspaceSnapshot`). **PR volontairement en draft : relecture par Claude/Anthropic demandée avant fusion**, conformément à la consigne. Point d'attention : `loadStudentCorrection` écrase `manualChoices`/`methodStates`/… au changement d'élève — code identique au caractère près, seul l'emplacement change.

## Découpage proposé pour la suite de la tranche (2 PR après celle-ci)
- **Module 9 — devoir & élèves** : bloc contigu de `activateLoadedGrid` à `applyLoadedGrid` exclu (~10 500 caractères : formulaire d'affectation, table élèves, filtres et tri, import CSV élèves, création d'élève, dialogues de classe/groupe).
- **Module 10 — chargement des grilles** : bloc contigu de `applyLoadedGrid` aux instructions top-level exclues (~5 700 caractères : `applyLoadedGrid`, `applyCsvText`, `loadRepositoryGrid`, `loadGridCatalog`) ; les instructions top-level de câblage (boutons export/précédent/suivant/info élève) restent dans `correction.html`, même motif que le module 7.
- Ensuite ne resteront que les dialogues/menus/navigation (~280 lignes) et le câblage final — à redécouper séparément si souhaité.
