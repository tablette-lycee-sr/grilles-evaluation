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
| `tests/e2e/impression.e2e.cjs` | Fiche imprimable : en-tête élève, NN sans note, 2(+), NE réduit, textes libres, Bonus NN, durée retenue du Minuteur, motifs Attention/Dépassé (D-015). |
| `tests/e2e/devoir.e2e.cjs` | Enregistrement puis restauration du devoir sur fichier (format `DEVOIR_<Date>_<Groupe>_<Titre>`), refus d'un fichier étranger, invitation si aucun devoir. |
| `tests/e2e/eleves-csv.e2e.cjs` | Import CSV d'élèves : premier groupe chargé sans confirmation (nom repris du fichier, PAP) ; second groupe soumis à confirmation — annulation ou remplacement avec effacement des données du devoir. |
| `tests/e2e/catalogue.e2e.cjs` | Création du devoir depuis le catalogue : grille du dépôt (après confirmation de remplacement) et fichier JSON local ; vue Devoir initialisée. |
| `tests/e2e/editeur.e2e.cjs` | Éditeur de grille : import d'un JSON, déplacement d'une partie au clavier (Alt+Flèche bas), export JSON valide, rechargement de la grille exportée à l'identique. |
| `tests/icones.test.cjs` | Garde : plus aucune référence `icones/*.svg` dans l'interface ; chaque icône utilisée possède sa règle data-URI, fidèle au fichier source. |

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

## Scénarios ajoutés (T-05 · #8)
Import CSV d'élèves (`eleves-csv`) · création d'un devoir depuis le catalogue (`catalogue`) · éditeur de grille, export puis rechargement (`editeur`). La fiche imprimable est couverte depuis T-02.
