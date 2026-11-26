# Passation — 2026-11-25 — Vibe — T-01 module 6 : import de grilles

**Issue / tâche :** #4 · **Branche :** `agent/vibe/t01-import-grilles` · **PR :** (draft, voir GitHub)

## Objectif de la session
Module 6 du découpage : déplacer l'import et la validation de grilles (`parseCsv` informatif, `gridFromCsv`, `gridFromJson`) en `src/js/import-grilles.js`, sans réécrire le code.

## Fait
- Bloc **contigu** déplacé octet-à-octet : de `function detectCsvDelimiter(` à `function resetChoices(` exclu (20 640 caractères) : `detectCsvDelimiter`, `parseCsv`, `csvNumber`, `gridFromCsv`, `gridFromJson`.
- Balise `<script src="src/js/import-grilles.js"></script>` insérée en sixième position.
- Vérifications : aucune instruction top-level parasite, accolades équilibrées, helpers « externes » (`nextGroup`, `allowed`, `seenId`, `firstComments`, `validateComments`) tous déclarés à l'intérieur du bloc.
- **Parité par reconstruction** : `HTML PARITE: True`, `MODULE OCTET-A-OCTET: True`.
- **Marqueur de tests déplacé** : `gridFromJson` vivait entre marqueurs `[gridFromJson, resetChoices]` dans `correction.html` ; le marqueur ne pointe plus sur le HTML → les deux moteurs de tests lisent désormais le module :
  - `tests/methodes.test.cjs` : `${section("function gridFromJson(", "function resetChoices(")}` remplacé par `${importGrillesSource}` (fichier lu au début du test) ;
  - `tests/editeur-grille.test.cjs` : `parseGrid()` lit `src/js/import-grilles.js` au lieu de découper le HTML (même assemblage VM).
- `docs/STATUS.md` : ligne « Découpage » ⇒ modules 1-6 ; restent élèves et corrections en cours, stockage.

## Pas fait / blocages
- `npm run test:e2e` impossible en local : CI seule.
- Les 7 échecs de unitaires observés pendant le travail étaient uniquement les tests de l'éditeur lisant l'ancien marqueur HTML — corrigé dans la même PR (23/23 en fin).

## Décisions prises (et ajoutées à `docs/DECISIONS.md` ?)
- Aucune décision de conception : déplacement pur. Le marqueur `[gridFromJson, resetChoices]` disparaît de `AGENTS.md`/« Pièges » ? — **non** : la règle générale reste valable ; les marqueurs vivants sont désormais `[allNodes, makeChoiceButton]`, `[resetChoices, captureActiveCorrection]`, `[calculateFinalScore, updateFinalScore]` (3 paires dans le HTML).

## Fichiers touchés
- `correction.html` — bloc retiré, balise script ajoutée.
- `src/js/import-grilles.js` — nouveau module (octet-à-octet).
- `tests/methodes.test.cjs` — charge le module au lieu du marqueur HTML.
- `tests/editeur-grille.test.cjs` — `parseGrid()` lit le module.
- `docs/STATUS.md` — ligne « Découpage ».

## Tests
- `npm test` : ✅ 23/23.
- `npm run test:e2e` : à confirmer en CI.

## Écarts constatés entre code et spec
- Aucun.

## Questions pour l'utilisateur (deux options chacune)
- Le dernier module (7) : tout le reste d'un coup (état, tableau élève, menus, stockage) ou a minima le stockage seul (zone sensible, relecture Claude) ?

## Prochaine étape recommandée
- Module 7 (stockage) ; prévoir l'inventaire des marqueurs restants à ce moment-là.

## Pièges découverts
- Deux fichiers de tests extrayaient le même marqueur : adapter `makeEngine()` ne suffit pas, `parseGrid()` de l'éditeur avait sa propre copie du découpage.
- Les helpers internes de validation (`seenId`, `allowed`…) sont des flèches locales : aucun couplage externe détectable par simple grep de fonctions — vérifier aussi les identifiants sans `function`.
