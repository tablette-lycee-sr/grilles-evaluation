# Modèle de PR

Fusionner seulement quand tout est coché (voir `AGENTS.md`, « Définition de terminé »).

## Issue / tâche
#N — courte description de la tâche

## Objectif de la session
(une phrase)

## Fait
- …

## Pas fait / points d'attention
- …

## Décisions prises
- Ajoutées à `docs/DECISIONS.md` ? (oui : D-0NN / non : pourquoi)
- Spec mise à jour si le comportement voulu a changé ? (oui, quel fichier / sans objet)

## Fichiers touchés
- `fichier` — pourquoi
- Tests marqués par extrait de fonction modifiés ? (nom des marqueurs)

## Tests
- `npm test` : ✅/❌ (n tests) · `npm run test:e2e` : ✅/❌ · tests ajoutés : …
- Vérification sur tablette réelle si l'interface change : (faite / à faire / sans objet)
- Captures d'écran jointes par la CI (artefact `captures-e2e`) : ouvertes et validées ? (oui / non)

## Vérification après fusion
- [ ] `docs/STATUS.md` : ligne mise à jour
- [ ] Fiche `docs/handoff/AAAA-MM-JJ-<agent>-<sujet>.md` créée
