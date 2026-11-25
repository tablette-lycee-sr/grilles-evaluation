# Passation — 2026-11-25 — Vibe — T-01 module 9 : devoir & élèves

**Issue / tâche :** #4 · **Branche :** `agent/vibe/t01-devoir-eleves` · **PR :** (draft, voir GitHub)

## Objectif de la session
Deuxième PR de la série « élèves et corrections en cours » (découpage en trois validé par Claude/Anthropic lors de la relecture de la PR #22) : formulaire d'affectation et gestion des élèves.

## Fait
- Bloc **contigu** déplacé octet-à-octet (24 037 caractères) : de `function activateLoadedGrid(` à `function applyLoadedGrid(` exclu : `activateLoadedGrid`, `initializeAssignment`, `resetAssignment`, `renderAssignmentGrid`, `renderAssignmentNode`, `createStudentId`, `studentFieldValue`, `capitalizeStudentFirstNames`, `matchesStudentFilter`, `refreshStudentTableForField`, `renderStudentGroupTitle`, `renderStudentTable`, `createStudentGroupGrid`, `showStudentColumnMenu`, `openStudentGroupPalette`, `openStudentColumnMenu`, `addStudentRow`, `openStudentClassDialog` (async), `parseStudentCsv`, `serializeStudentGroupCsv`, `parseStudentGroupCsv`.
- Balise `<script src="src/js/devoir-eleves.js"></script>` insérée en **neuvième** position, après `corrections-en-cours.js`.
- Aucune instruction top-level dans le bloc (20 déclarations de fonctions) ; toutes les références externes (états globaux, `renderCorrectionTrombi`, `saveWorkspace`, `gridFromCsv`, …) sont résolues **à l'appel**, jamais au chargement.

## Vérifications
- Aucune instruction top-level parasite, accolades équilibrées, `node --check` OK.
- **Parité par reconstruction** : `HTML PARITE: True`, `MODULE OCTET-A-OCTET: True` (24 037/24 037).
- `npm test` : **23/23 pass**. Aucun test unitaire ne référence ces fonctions (aucun marqueur de test couvre ce bloc) ; l'e2e de la CI valide le chemin réel.
- Aucune fonction frontière des marqueurs vivants déplacée.

## Zone sensible
Non par nature (rendu et saisie élèves, pas de calcul ni de sauvegarde modifiée) — mais la PR reste en draft puisque la série « élèves et corrections en cours » est soumise à relecture Claude/Anthropic. Noter que les **données élèves restent personnelles** : les fonctionnalités CSV (`parseStudentCsv`, `serializeStudentGroupCsv`) travaillent sur le navigateur de l'utilisateur uniquement, rien n'est committé ni envoyé sur un réseau.

## Reste de la série après fusion de ce module
- **Module 10 — chargement des grilles** : bloc contigu de `applyLoadedGrid` aux instructions top-level exclues (~5 700 caractères : `applyLoadedGrid`, `applyCsvText`, `loadRepositoryGrid`, `loadGridCatalog`) ; le câblage top-level (boutons export/précédent/suivant/info élève) reste dans `correction.html`, même motif que le module 7. Dernier bloc de fonctions avant les dialogues/menus.
- Puis : dialogues/menus/navigation (~280 lignes) et câblage final — à redécouper séparément si souhaité.
