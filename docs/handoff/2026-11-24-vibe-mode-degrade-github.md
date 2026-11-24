# Passation — 2026-11-24 — Vibe (Codestral) — mode dégradé GitHub dans AGENTS.md

**Tâche :** incident réel de relai · **Branche :** `vibe/agents-mode-degrade-0a47fb`

## Objectif de la session
Rendre impossible la situation constatée : un agent (Codex) sans accès à GitHub a deviné le contenu de l'issue #4 par coïncidence de numéros (il croyait #4 = T-04, c'est T-01), sur le mauvais périmètre, dans un environnement sans droit d'écriture.

## Fait
- `AGENTS.md` : nouvelle section « Si les outils GitHub sont indisponibles (mode dégradé) » — ne pas déduire une issue de son numéro, demander le texte, ne pas modifier de fichiers si le dépôt est en lecture seule.

## Pas fait / blocages
- `docs/STATUS.md` : la table `T-0N ⇢ #N` référencée arrive via la PR `vibe/status-issues-link-0a47fb` (#10), en attente de fusion. Fusionner #10 de préférence avant la première session qui s'appuiera sur cette règle.
- Incident côté utilisateur traité hors dépôt : session Codex à interrompre, `git checkout -- docs/STATUS.md` si elle a écrit, relance sur clone local avec `gh` installé.

## Questions pour l'utilisateur
À deux options, non bloquantes : faut-il aussi un mot d'avertissement dans les modèles d'issue (`.github/ISSUE_TEMPLATE/tache.md`) ? Retenu : non, `AGENTS.md` suffit ; alternative : une ligne « l'agent doit vérifier le titre de cette issue avant de commencer ».

## Prochaine étape recommandée
Fusionner #10 puis la présente PR, puis relancer Codex sur l'issue #4 avec le texte en dur ou `gh` installé.
