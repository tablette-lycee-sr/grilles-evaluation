# Passation — 2026-11-25 — Vibe — T-01 module 5 : fenêtre de correction

**Issue / tâche :** #4 · **Branche :** `agent/vibe/t01-fenetre-correction` · **PR :** (draft, voir GitHub)

## Objectif de la session
Module 5 du découpage : déplacer l'interface de la fenêtre de correction (catégories, trombinoscope, ouverture/fermeture de la vue trombi) en `src/js/fenetre-correction.js`, sans réécrire le code.

## Fait
- Bloc **contigu** déplacé octet-à-octet : de `function getCorrectionTrombiCategories(` à `function createStudentGroupGrid(` exclu (17 145 caractères) :
  - trombinoscope : `getCorrectionTrombiCategories`, `normalizeTrombiPhotoName`, `trombiPhotoKey`, `getStudentTrombiPhotoCount`, const `TROMBI_GROUP_ROWS` / `TROMBI_GROUP_COLORS` / `TROMBI_CUSTOM_GROUP_COLORS`, `getTrombiGroupColorMap`, `updateStudentGroupColors`, `parseTrombiNote`, `getTrombiNoteColor`, `createTrombiPortrait`, `createTrombiLevelScale`, `compareTrombiStudentNames`, `getSortedTrombiStudents`, `createTrombiCardHeader`, `createTrombiCardPhoto`, `createTrombiCardName` ;
  - fenêtre : `renderCorrectionPopupCategories`, `openCorrectionPopup`, `renderCorrectionTrombi`, `updateCorrectionTrombiToggle`, `closeStudentColumnMenu`.
- Balise `<script src="src/js/fenetre-correction.js"></script>` insérée en cinquième position, avant le script en ligne.
- Vérifications avant déplacement : aucune instruction top-level parasite (les 3 const sont des initialisations pures, sans DOM, dans le bon ordre), aucun `addEventListener` de niveau 0, accolades équilibrées.
- **Parité par reconstruction** : ancien `correction.html` = nouveau `correction.html` − balise + bloc réinséré, octet-à-octet (`HTML PARITE: True`, `MODULE OCTET-A-OCTET: True`).
- `docs/STATUS.md` : ligne « Découpage » passée à « modules 1-5 … ; restent éditeur, stockage ».

## Pas fait / blocages
- `npm run test:e2e` impossible en local (bibliothèques système manquantes) : la CI fournit le verdict.
- La capture/chargement des corrections (`captureActiveCorrection`, `loadStudentCorrection`, `openStudentCorrection`, navigation) reste dans `correction.html` : couplée à l'état, à basculer avec le module 6 ou 7, section marquée en fin de bloc 3 des tests à ne pas toucher.

## Décisions prises (et ajoutées à `docs/DECISIONS.md` ?)
- Aucune décision de conception : purement un déplacement (règle du module T-01). Le trombinoscope part avec la fenêtre de correction car `renderCorrectionTrombi` est la vue d'accueil du popup et partage ses 16 auxiliaires ; garder la contiguïté du bloc.

## Fichiers touchés
- `correction.html` — bloc retiré, balise script ajoutée.
- `src/js/fenetre-correction.js` — nouveau module (octet-à-octet).
- `docs/STATUS.md` — ligne « Découpage ».

## Tests
- `npm test` : ✅ 23/23.
- `npm run test:e2e` : à confirmer en CI (10 e2e attendus + captures).

## Écarts constatés entre code et spec
- Aucun.

## Questions pour l'utilisateur (deux options chacune)
- Module 6 : « éditeur de grilles » (~`editeur-grille.js` — attention, c'est déjà un fichier) signifie l'import de grilles dans `correction.html` (`gridFromCsv`/`parseCsv`/`applyLoadedGrid`…) ; à confirmer avant découpage.

## Prochaine étape recommandée
- Module 6 (import de grilles) puis module 7 (stockage, zone sensible — relecture Claude).

## Pièges découverts
- `createStudentGroupGrid` (resté dans `correction.html`) lit la constante `TROMBI_GROUP_ROWS` du nouveau module : ok (portée globale des scripts classiques, ordre de chargement = calculs → rendu → carte → impression → fenêtre).
- `closeStudentColumnMenu` sert le menu de colonnes du tableau élève ET la fenêtre : une seule définition, maintenue ici.
