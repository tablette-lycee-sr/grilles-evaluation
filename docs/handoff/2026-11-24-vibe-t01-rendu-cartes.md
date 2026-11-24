# Passation — 2026-11-24 — Vibe (Codestral) — T-01 module 2 : rendu des cartes et fenêtre d'information

**Issue / tâche :** #4 (T-01, un module par PR) · **Branche :** `agent/vibe/t01-rendu-cartes` · **PR :** (draft, après fusion de #12)

## Objectif de la session
Deuxième module du découpage : déplacer de `correction.html` vers `src/js/rendu-cartes.js` les utilitaires de rendu des cartes de méthodes (jauges, minuteur SVG, champs) et la fenêtre d'information.

## Fait
- Bloc **contigu** `[function formatDuration( … function renderMethodCategory)` déplacé tel quel : 24 fonctions et 7 constantes `METHOD_*`.
- Parité vérifiée par reconstruction : l'ancien HTML reconstitué = nouveau HTML + module (octet à octet, hormis le retour à la ligne final).
- `correction.html` : deux balises `<script src="src/js/…">` avant le script en ligne (ordre : `methodes-calcul.js`, `rendu-cartes.js`, puis script principal) ; les constantes globales restent visibles partout (portée lexicale globale des scripts classiques).
- Aucune fonction des sections marquées des tests (liste `IN` vérifiée par repérage d'offsets) : le moteur VM de `tests/methodes.test.cjs` est inchangé.

## Pas fait / blocages
- `npm run test:e2e` en local : impossible (bibliothèques système Chromium absentes du bac à sable) ; couvert par la CI (les scénarios `rendu`/`methodes` vérifient jauges, géométrie du minuteur, fenêtre d'info, et l'absence d'erreur JS de page).
- `renderMethodCategory`, `refreshMethodDisplay`, `renderCorrectionPopupCategories`, `openCorrectionPopup`, `closeCorrectionPopup` restent en place : modules suivants (3 : grille complète ; 4 : fenêtre de correction).

## Décisions prises
- Deuxième balise externe **avant** le script principal (pas de `type="module"` ni de defer) pour conserver l'exécution au chargement dans l'ordre d'écriture du document.
- Pas d'entrée `docs/DECISIONS.md` sans objet : aucun changement de comportement ni mise en page.

## Fichiers touchés
- `correction.html` — bloc retiré (20 448 caractères), balise script ajoutée.
- `src/js/rendu-cartes.js` — nouveau, contenu déplacé tel quel.
- `docs/handoff/2026-11-24-vibe-t01-rendu-cartes.md` — cette note.

## Tests
- `npm test` : ✅ 21 verts (éditeur et méthodes, sans modifier les marqueurs).
- `npm run test:e2e` : en CI sur la PR (l'environnement local n'a pas Chromium) ; à vérifier vert + captures.

## Pièges découverts
- Les constantes `METHOD_*` étaient au niveau supérieur **entre** deux fonctions du bloc : la découpe doit inclure les lignes de niveau 0 (fait) ; tout futur découpage devra refaire la vérification « lignes de niveau 0 hors fonctions ».
- `chosenOrigin`, `categorySliderStops`, `bonusCap`, `totalBonus`, `setBonus` vivent **dans** les sections marquées : les déplacer exigera d'adapter `makeEngine()`.
