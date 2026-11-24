# .github/copilot-instructions.md

Lis d'abord **`AGENTS.md`** à la racine : c'est la source unique des instructions pour ce dépôt (règles, commandes, définition de « terminé »).

Spécificités pour Copilot :
- Avant de modifier `correction.html`, `correction.css` ou `editeur-grille.js`, repère la fonction visée **par son nom** et limite le diff à elle : pas de reformatage, pas de changement des fins de ligne.
- Ne renomme ni les marqueurs de fonctions extraits par les tests (`function allNodes(`…), ni les `aria-label`, ids, classes `data-*` et fonctions globales utilisées par `tests/` sans mettre les tests à jour dans la même PR.
- Suggestion de dépendance, de CDN ou de requête réseau = refus par défaut : l'application est statique, hors ligne, sans dépendance d'exécution.
- Termine la session par un fichier `docs/handoff/AAAA-MM-JJ-copilot-<sujet>.md` d'après `docs/handoff/_TEMPLATE.md`.
