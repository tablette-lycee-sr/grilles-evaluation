# Passation — 2026-11-24 — Vibe (Codestral) — T-01 module 3 : assemblage des cartes

**Issue / tâche :** #4 (T-01, un module par PR) · **Branche :** `agent/vibe/t01-carte-methodes`

## Objectif de la session
Troisième module du découpage : déplacer l'assemblage des cartes de méthodes (`renderMethodCategory`, `refreshMethodDisplay`, `renderCategory`) dans `src/js/carte-methodes.js`.

## Fait
- Bloc contigu `[function renderMethodCategory( … function calculateFinalScore(` déplacé tel quel : 3 fonctions, 21 625 caractères.
- Parité vérifiée par reconstruction octet à octet ; balise script insérée après `rendu-cartes.js`.
- `docs/STATUS.md` : ligne « Découpage » passée à 🟡 avec l'état des modules.

## Pas fait / blocages
- e2e en local : impossible (Chromium absent du bac à sable) ; couvert par la CI (cartes, largeur unique, axe central, absence d'erreur JS).
- Modules suivants identifiés : impression (`makePrint*`, avant les marqueurs CSV), fenêtre de correction (`captureActiveCorrection` … méthodes associées), éditeur (`editeur-grille.js` éléments), stockage (zones sensibles, dernière).

## Décisions prises
- Deuxième et troisième extractions se font par blocs contiguës de fonctions ; chaque découpage est précédé de la vérification « lignes de niveau 0 hors fonctions » (aucune trouvée ici).

## Fichiers touchés
- `correction.html` — bloc retiré, troisième balise script ajoutée.
- `src/js/carte-methodes.js` — nouveau, contenu déplacé tel quel.
- `docs/STATUS.md` — ligne « Découpage » mise à jour.
- `docs/handoff/2026-11-24-vibe-t01-carte-methodes.md` — cette note.

## Tests
- `npm test` : ✅ 21 verts (marqueurs intacts).
- `npm run test:e2e` : en CI sur la PR.

## Pièges découverts
- `renderCategory` porte le complément `renderMethodCategory` : les deux doivent partir ensemble (fait) ; `renderNode` (grille complète) reste en place pour un module dédié.
- Le marqueur `function calculateFinalScore(` sert de borne de fin aux deux côtés : tout découpage qui l'utilise doit commencer par lui en fin de bloc, en conservant son intégrité.
