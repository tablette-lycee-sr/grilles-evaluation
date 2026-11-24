# Passation — 2026-11-24 — Vibe — T-07 cycle de notation par catégorie

**Issue / tâche :** #16 · **Branche :** `agent/vibe/t07-statuts-categorie` · **PR :** (draft, voir GitHub)

## Objectif de la session
Faire défiler, par clics sur le bouton coefficient d'une catégorie, un cycle de quatre statuts de notation : Noté → NN → 2(+) → NE → Noté (D-014, remplace D-009).

## Fait
- `categoryStatut(node)` ajoutée à `src/js/methodes-calcul.js` : détermine le statut d'une catégorie (`"note"` / `"nn"` / `"plus"` / `"ne"`) depuis `state.statut`, à défaut de `evaluee` (ancien marqueur NN, grille ou sauvegarde), à défaut de `priseEnCompte` (facultative → `plus`), sinon `note`.
- `src/js/carte-methodes.js` : le bouton `note` fait le cycle selon `CATEGORY_STATUT_SUIVANT` ; libellés `1` / `NN` / `1(+)` / `NE` (facultative : `(2)` / `(2+)`) ; classes `method-hors-note` (nn/ne) et `method-ne` ; en NE tous les contrôles sauf `.note` et `.aide` sont `disabled`. Le Bonus reste sur deux états (+ / NN, champ `evaluee` inchangé).
- `correction.html` — `calculateFinalScore` : NN et NE exclus ; statut `plus` traité comme les facultatives (incluse seulement si elle augmente la moyenne) ; `updateFinalScore` : signe « * » (note provisoire) limité aux catégories au statut `note`.
- `src/js/impression.js` : sur la fiche, le bloc NE est réduit au titre (sommaire « NE ») ; le bloc NN gagne la ligne « Évaluée mais non notée (NN) ».
- `correction.css` : `.method-hors-note` ne conduit plus à 50 % d'opacité (contours de la carte en tirets) ; `.method-ne` : opacité 25 %, `pointer-events:none` de la carte sauf `.note` et `.aide`.
- Docs : `DECISIONS.md` (D-014), `spec/ui-correction.md` (§3 cycle), `spec/methodes-correction.md` (statuts et règle 2(+) = règle facultative), `spec/donnees.md` (champ `statut`), `STATUS.md` (ligne fonctionnalité + tâche T-07).

## Pas fait / blocages
- `npm run test:e2e` impossible en local (Playwright : bibliothèques système manquantes dans le sandbox) ; les e2e tournent en CI.
- Le cycle n'existe pas pour les catégories sans méthode (arborescence) ni dans l'éditeur de grilles (hors périmètre de #16).

## Décisions prises (et ajoutées à `docs/DECISIONS.md` ?)
- Oui : D-014 (cycle 4 statuts, remplace D-009 ; la carte NN repasse à opacité 1).
- Une catégorie facultative **au statut “noté” reste facultative** (incluse seulement si favorable) : la prise en compte vient de la grille, le statut ne force pas l'inclusion.
- Étiquette du bouton pour une facultative : `(2)` (notée) et `(2+)` (si favorable) — les parenthèses continuent de marquer « facultative ».

## Fichiers touchés
- `src/js/methodes-calcul.js` — `categoryStatut`, constantes `CATEGORY_STATUT(S)/SUIVANT`.
- `src/js/carte-methodes.js` — bouton de note : cycle, libellés, classes, désactivation en NE.
- `correction.html` — `calculateFinalScore` / `updateFinalScore` (statuts).
- `src/js/impression.js` — fiche : NE = titre seul, NN = ligne explicite.
- `correction.css` — styles `method-hors-note` / `method-ne`.
- `tests/methodes.test.cjs` — accès `engine.statut(id)` ; tests statut par défaut, NN/NE/2(+).
- `tests/e2e/methodes.e2e.cjs` — ancien test NN (bloc à 50 %) remplacé par cycle complet + cas facultative.
- Docs citées ci-dessus ; cette passation.

## Tests
- `npm test` : ✅ (23 tests : 21 existants + 2 nouveaux).
- `npm run test:e2e` : à confirmer en CI (le sandbox local ne peut pas exécuter Playwright) ; 2 e2e ajoutés/remplacés.
- Vérification visuelle : captures e2e de la CI ; **PDF à imprimer par l'utilisateur** (vérifier le bloc NE réduit au titre).

## Écarts constatés entre code et spec
- Aucun nouveau ; D-009 corrigé dans la spec (§3 de `ui-correction.md`).

## Questions pour l'utilisateur (deux options chacune)
- Facultative au statut « 2(+) » : afficher `2(+)` (retenu, plus homogène) ou conserver `(2)` seul ?
- Bloc NE sur la fiche : titre + mention « NE » (retenu) ou titre strictement seul ?

## Prochaine étape recommandée
- Suite du découpage T-01 : module 5 « fenêtre de correction » — attention, `pauseMethodTimers`/`snapshotMethodStates` sont dans les sections marquées des tests.

## Pièges découverts
- `renderCategory` des catégories sans méthode (arborescence) n'a pas de bouton de note : ne pas y brancher le cycle sans décider du rendu.
- En NE, la désactivation passe par `disabled` (boutons/inputs) **et** `pointer-events:none` (glisser sur la jauge du Minuteur, tiroir), sinon le pointeur court-circuite les boutons.
