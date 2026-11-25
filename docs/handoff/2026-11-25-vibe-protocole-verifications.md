# Passation — 2026-11-25 — Vibe — Protocole : fusion, consultations, vérifiabilité

**Issue / tâche :** — (suite à la consultation Claude·Anthropic sur le circuit) · **Branche :** `agent/vibe/protocole-verifications` · **PR :** (draft, voir GitHub)

## Objectif de la session
Ratifier dans le kit agents les garde-fous proposés à la suite de la consultation externe : règles de fusion, usage de « Closes », relais des consultations vers la documentation, vérifiabilité des affirmations.

## Fait
- `AGENTS.md` : nouvelle section « Fusion d'une PR — vérifications avant de cliquer » (onglet Checks, bouton « Approve and run workflows », jamais de fusion avec CI en attente/rouge ; interdiction de `Closes` pour une PR partielle) ; nouvelle section « Consultations IA extérieures » (note dans `docs/consultations/`, décision ⇒ `DECISIONS.md`, comportement ⇒ `spec/`, citation dans le handoff) ; nouvelle section « Vérifiabilité des affirmations » (preuve du dépôt exigée, hypothèse signalée comme telle) ; « Définition de « terminé » » complétée (point 7 : `Closes #N` vs `Partie de #N`).
- `.github/pull_request_template.md` : la ligne de tâche rappelle la règle `Closes` / « Partie de # ».
- Aucun fichier de code touché.

## Pas fait / blocages
- La ruleset `Protection main` (PR obligatoire + check `tests`) est un réglage GitHub effectué par l'utilisateur dans les Settings : seul point A du plan, hors dépôt.

## Décisions prises (et ajoutées à `docs/DECISIONS.md` ?)
- Oui, implicitement via `AGENTS.md` (règles opérationnelles, pas des décisions de conception applicative). D-014 reste la dernière décision applicative.

## Fichiers touchés
- `AGENTS.md` — trois nouvelles sections + point 7 de la définition de « terminé ».
- `.github/pull_request_template.md` — rappel « Closes » / « Partie de # ».
- Cette passation.

## Tests
- `npm test` : non exécuté localement (aucun changement de code exigé) ; CI verte en vérification.

## Écarts constatés entre code et spec
- Aucun (PR documentaire).

## Questions pour l'utilisateur (deux options chacune)
- Conserver la règle « vérifiabilité » telle quelle, ou exiger en plus que toute consultation soit citée dans une table d'index (`docs/consultations/INDEX.md`) ?

## Prochaine étape recommandée
- Suite du découpage T-01 : module 5 « fenêtre de correction » (sections marquées `pauseMethodTimers` / `snapshotMethodStates` à ne pas couper).

## Pièges découverts
- La ruleset rend tout push direct sur `main` impossible (message « changes must be made through a pull request ») : comportement attendu, ne pas tenter de contournement.
