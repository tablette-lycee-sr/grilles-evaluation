# Passation — 2026-11-23 — Claude — mise en place du kit pour agents

**Branche suggérée :** `agent/claude/kit-agents`

## Objectif de la session
Organiser le dépôt pour travailler alternativement avec Codex, Copilot et Claude : instructions, spécifications, état d'avancement, tests, CI.

## Fait
- Rédaction de `AGENTS.md` (+ pointeurs `CLAUDE.md`, `.github/copilot-instructions.md`).
- Rédaction de `docs/` : projet, spécifications (format de grille, interface, données), état, décisions, tests, modèle de passation.
- Tests e2e (Playwright + `node:test`) : 10 scénarios, **tous verts** sur la version du dépôt reçue (commit `ea1ec7b`) ; tests unitaires existants : 21 verts.
- Modèles d'issue et de PR, workflow CI, `package.json`, `.gitignore`.

## Pas fait
- Aucun changement du code de l'application.
- `spec/methodes-correction.md` n'est pas régénéré : c'est `SPECIFICATION-METHODES-CORRECTION.md` à déplacer avec `git mv`.
- CI non exécutée sur GitHub (écrite sans accès au dépôt distant) : à vérifier à la première PR.

## État du dépôt reçu
`main` identique à `origin/main` (commit `ea1ec7b`). L'index git est déjà en LF : aucune normalisation des fins de ligne nécessaire. Les différences de fins de ligne (CRLF) vues dans l'archive viennent de Windows et ne comptent pas.

## Écarts constatés entre code et spec
Aucun écart bloquant relevé ; deux points à valider par l'utilisateur : échelle du Bonus (T-06) et couleur éventuelle des critères du Barème.

## Prochaine étape recommandée
1. Fusionner la PR « Kit agents » une fois la CI verte (vérifier les captures d'écran jointes).
2. Créer les issues T-01 à T-06 depuis `docs/STATUS.md`.
3. Premier agent conseillé pour T-01 (découpage du JavaScript) : Codex ou Copilot, un module par PR, avec relecture de Claude (zone sensible : calculs et stockage).

## Pièges découverts
- Les tests unitaires lisent `correction.html` par marqueurs de fonctions (voir `AGENTS.md`).
- Les tests e2e ouvrent la fenêtre via des fonctions globales ; voir `tests/e2e/helpers.cjs`.
