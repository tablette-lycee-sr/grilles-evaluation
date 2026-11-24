# Passation — 2026-11-24 — Vibe (Codestral) — kit consultations IA extérieures

**Tâche :** compléter le kit agents (suite de la passation du 2026-11-23) · **Branche :** `vibe/kit-consultations-0a47fb`

## Objectif de la session
Rendre traçables les contributions des IA extérieures (ChatGPT, Perplexity, Mistral…) qui ne lisent pas le dépôt, et créer le pointeur Copilot annoncé mais absent du kit.

## Fait
- `.github/copilot-instructions.md` : pointeur vers `AGENTS.md` (même mécanique que `CLAUDE.md`) avec les pièges Copilot usuels (marqueurs de tests, diff minimal, zéro dépendance, handoff en fin de session).
- `docs/consultations/_TEMPLATE.md` : gabarit de note de consultation (contexte envoyé, recommandation reçue, verdict de l'humain, actions, renvoi vers la session de reprise).
- `docs/README.md` : ligne d'index pour `docs/consultations/`.

## Pas fait / blocages
- Aucun changement du code de l'application ni de `AGENTS.md` (intentionnel : le protocole de consultation doit être évalué par l'utilisateur avant d'être normalisé plus haut).
- Les modèles d'issue et de PR annoncés dans la passation du 2026-11-23 sont toujours absents du dépôt : à créer dans une session suivante.

## Questions pour l'utilisateur
- Fallait-il aussi citer `docs/consultations/` dans `AGENTS.md` (étapes de démarrage) ? Option retenue : non, pour un premier essai ; option alternative : l'ajouter après la première vraie consultation.

## Prochaine étape recommandée
Rédiger la première note réelle dans `docs/consultations/` lors de la prochaine consultation d'une IA extérieure, puis vérifier que le relai vers Copilot/Codex fonctionne via le handoff.
