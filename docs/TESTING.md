# Tests

## Lancer
```
npm install                        # une fois
npx playwright install chromium    # une fois, pour les tests e2e
npm test                           # unitaires (node --test) : rapides, sans navigateur
npm run test:e2e                   # navigateur réel : nécessite le navigateur Playwright
npm run test:all                   # les deux
```
Un seul test e2e : `node --test --test-name-pattern="minuteur" "tests/e2e/*.e2e.cjs"`.
Les captures d'écran des tests e2e sont écrites dans `test-results/screens/` (artefact de la CI : les ouvrir dans la PR pour valider l'interface sans rien lancer).

## Ce que couvrent les tests
| Fichier | Couvre |
|---|---|
| `tests/methodes.test.cjs` | Chargement de la grille d'exemple, calculs des six méthodes, courbe du Minuteur, bonus plafonnés, note finale, refus d'une grille invalide. |
| `tests/editeur-grille.test.cjs` | Arbre de l'éditeur : création, déplacement, changement de niveaux. |
| `tests/e2e/rendu.e2e.cjs` | Fenêtre à 90 %, six cartes, largeur et axe central identiques, bandeau fixe en portrait, bouton de fermeture ≥ 48 px. |
| `tests/e2e/methodes.e2e.cjs` | Couleurs des niveaux, Distribution et Compteur, échelle du Bonus, poignée du Minuteur sur le fer à cheval, NN, commentaires éditables, fenêtre d'information. |

## Conventions
- Runner natif `node:test` + bibliothèque `playwright` ; pas de framework supplémentaire.
- **Logique pure** ⇒ test unitaire. **Interface** ⇒ test e2e. Un bug corrigé ⇒ un test qui l'aurait détecté.
- Les tests e2e partent de `grille-exemple-oral.json` et d'un élève fictif (`tests/e2e/helpers.cjs`) : jamais de données réelles.
- Les tests unitaires extraient des fonctions de `correction.html` par marqueurs (voir `AGENTS.md`, « Pièges »).

## Vérifications manuelles (avant de publier sur Pages)
À faire sur une **vraie tablette** — l'automatisation ne les remplace pas :
1. Glisser la poignée du Minuteur au doigt, de bout en bout du fer à cheval.
2. Faire pivoter portrait / paysage avec la fenêtre de correction ouverte (bandeau fixe, cartes lisibles).
3. Corriger deux élèves de suite, recharger la page : corrections et commentaires libres conservés (les photos sont à réassocier).
4. Imprimer ou exporter la fiche d'un élève avec : NN, texte libre, Attention, Dépassé, Minuteur manuel.
5. Ouvrir la fenêtre d'information de chaque méthode.

## Scénarios à ajouter (voir T-05)
Import CSV d'élèves · création d'un devoir depuis le catalogue · éditeur de grille (export puis rechargement) · fiche imprimable.
