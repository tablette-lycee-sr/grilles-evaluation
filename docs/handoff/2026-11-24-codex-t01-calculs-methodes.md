# Passation — 2026-11-24 — Codex — extraction des calculs des méthodes

**Issue / tâche :** #4 · **Branche :** `agent/codex/t01-src-js` · **PR :** —

## Objectif de la session
Extraire le premier module JavaScript de `correction.html` en déplaçant les fonctions de calcul des méthodes sans modifier leur logique.

## Fait
- Déplacé `methodState`, `timerSeconds`, `timerPercentage` et `methodCalculation` vers `src/js/methodes-calcul.js`.
- Chargé le fichier comme script classique avant le script principal pour conserver les fonctions globales et l’accès à l’état partagé.
- Adapté le test des méthodes pour inclure le nouveau module ; les marqueurs `allNodes` et `makeChoiceButton` restent dans `correction.html`.
- Mis à jour la ligne T-01 de `docs/STATUS.md`.

## Pas fait / blocages
- Les autres sous-modules prévus par T-01 restent à extraire dans des PR distinctes.
- Les tests e2e n’ont pas pu démarrer : le paquet de développement `playwright` est absent (`Cannot find module 'playwright'`). Aucune capture navigateur n’a été produite.

## Décisions prises (et ajoutées à `docs/DECISIONS.md` ?)
- Aucun changement de comportement ni décision de conception ; aucune modification de `docs/DECISIONS.md` nécessaire.

## Fichiers touchés
- `correction.html` — chargement du nouveau script et retrait des quatre fonctions déplacées.
- `src/js/methodes-calcul.js` — fonctions de calcul extraites.
- `tests/methodes.test.cjs` — chargement du code extrait dans le contexte unitaire.
- `docs/STATUS.md` — progression T-01.

## Tests
- `npm test` : ✅ (21 tests) · `npm run test:e2e` : ⚠️ non exécuté, Playwright absent · tests ajoutés : aucun (tests existants adaptés).
- Vérification visuelle : non effectuée ; aucune interface visuelle n’a été modifiée.

## Écarts constatés entre code et spec
- Aucun constaté.

## Questions pour l'utilisateur (deux options chacune)
- Aucune.

## Prochaine étape recommandée
Continuer T-01 dans une PR séparée avec le prochain sous-module, puis exécuter les tests e2e et comparer les captures en CI.

## Pièges découverts
- `tests/methodes.test.cjs` extrait toujours la section `allNodes` à `makeChoiceButton` du HTML ; le nouveau code du module doit être injecté explicitement dans son contexte VM.
