# AGENTS.md — instructions pour les agents IA (Codex, Copilot, Claude…)

Application web **statique** (hébergée sur GitHub Pages) pour corriger des devoirs d'histoire-géographie avec des grilles d'évaluation.
Utilisateur : un enseignant, **sur tablette** (portrait et paysage). Langue : **français** (interface, commentaires de code, messages de commit).

## Démarrage (3 étapes)

1. Lis `docs/STATUS.md` (état, tâches) puis le **dernier** fichier de `docs/handoff/`.
2. Lis uniquement la spec utile dans `docs/spec/` (voir la carte ci-dessous). `docs/PROJECT.md` donne le vocabulaire.
3. Traite **une seule** tâche (issue GitHub indiquée par l'utilisateur) sur une branche `agent/<nom>/<sujet>`. Ne pousse jamais sur `main`.

## Carte du dépôt

| Fichier / dossier | Rôle |
| --- | --- |
| `correction.html` | Application complète : HTML + JavaScript en ligne (~2 600 lignes). Se repérer **par nom de fonction**, pas par numéro de ligne. |
| `correction.css` | Styles. Bloc « Catégories par méthode » (classes `.method-*`, `.carte`, `.jauge`…), fenêtre de correction (`.correction-popup-*`), fenêtre d'information (`.method-info-dialog`). |
| `editeur-grille.js` | Éditeur de grilles JSON (arbre, formulaires, courbe du minuteur). |
| `grilles.json` | Catalogue des grilles proposées à la création d'un devoir. |
| `grille-exemple-oral.json` | Grille JSON d'exemple (les six méthodes) — sert aussi de jeu de test. |
| `*.csv`, `parametresCorrection.json` | Anciennes grilles CSV, catalogue des classes, paramètres. Ne pas modifier sans demande. |
| `icones/`, `fonts/`, `smileys/` | Ressources locales (aucun CDN). |
| `design/schemas-evaluation.html` | Maquette de référence des cartes de méthodes (visuel validé). |
| `docs/` | Spécifications, état d'avancement, décisions, tests, passations. |
| `tests/` | `*.test.cjs` : unitaires (rapides). `tests/e2e/*.e2e.cjs` : navigateur réel. |

Repères dans `correction.html` (approximatifs) : calcul et état des méthodes (`methodCalculation`, `timerPercentage`, `methodState`) · rendu des cartes (`renderMethodCategory`, `updateMethodGauge`, `openMethodInfo`) · impression (`makePrint*`) · import de grille (`gridFromJson`, `gridFromCsv`) · correction d'un élève (`captureActiveCorrection`, `loadStudentCorrection`) · fenêtre de correction (`openCorrectionPopup`) · stockage (`saveWorkspace`, `restoreWorkspace`).

## Commandes

```bash
npm install                # une fois
npx playwright install chromium   # une fois (tests e2e)
npm test                   # unitaires : node --test
npm run test:e2e           # navigateur réel (captures dans test-results/screens/)
npm run serve              # http://localhost:8080 (l'app charge des fichiers par fetch : http obligatoire)
```

## Règles à ne jamais enfreindre

- **La spec prime** (`docs/spec/`). Si le code et la spec divergent, ne corrige pas en silence : note l'écart dans le handoff. Si tu changes un comportement voulu, mets à jour la spec **dans la même PR** et ajoute une ligne à `docs/DECISIONS.md`.
- **Compatibilité des données** : ne casse jamais (a) le format de grille JSON `versionFormat: 1`, (b) la base IndexedDB `grilles-evaluation` (v1, store `workspace`) et ses états, (c) le CSV d'élèves (`Nom`, `Prénom`, `Classe`, `PAP`). Tout changement de structure persistée exige migration + test + validation humaine.
- **Aucune dépendance d'exécution, aucune requête réseau, aucun CDN.** Les données des élèves restent sur l'appareil.
- **Données personnelles** : ne commite jamais de vrais noms d'élèves, de photos ni de CSV de classe. Jeux de test fictifs uniquement.
- **Tablette d'abord** : cibles tactiles ≥ 44 px, rien qui dépende du survol, vérifier portrait et paysage.
- **Cartes de méthodes** : toutes les dimensions sont en unité `--u` (jamais de px fixes dans ces blocs) ; largeur de carte unique ; colonnes centrales alignées (voir `docs/spec/ui-correction.md`).
- **Nuancier des niveaux** : NA rouge · ECA- orange · ECA et ECA+ jaune · A vert. Les jauges gardent leurs teintes désaturées.
- **Interface en français correct** : accents, apostrophe typographique ’, guillemets « », espace insécable avant `: ; ? !` dans les textes affichés.
- **Diff minimal** : pas de reformatage de fichier entier, pas de refactor sans issue, ne pas changer les fins de ligne.
- **Ne renomme pas** les `aria-label`, ids, classes `data-*` ni les noms de fonctions globales utilisés par les tests sans mettre les tests à jour.

## Zones sensibles — demander avant, de préférence confier à Claude ou à l'humain

Calculs de notes (`methodCalculation`, `calculateFinalScore`, `timerPercentage`) · format et validation de grille (`gridFromJson`) · stockage et migration (`saveWorkspace`, `workspaceSnapshot`, `restoreWorkspace`) · fiche imprimable de l'élève · tout ce qui modifie des corrections déjà enregistrées.

## Pièges connus

- `tests/methodes.test.cjs` et `tests/editeur-grille.test.cjs` **extraient des morceaux de `correction.html` par marqueurs** (`function allNodes(` … `function makeChoiceButton(`, etc.). Déplacer ou renommer ces fonctions casse les tests : adapter les marqueurs dans la même PR.
- Les tests e2e ouvrent la fenêtre de correction via des fonctions globales (`applyLoadedStudentGroup`, `loadStudentCorrection`, `openCorrectionPopup`) : voir `tests/e2e/helpers.cjs`.
- L'état d'une méthode vit dans `methodStates[id]` (copié tel quel dans la sauvegarde) : tout nouveau champ y est persisté, donc documenté dans `docs/spec/donnees.md`.
- Les éléments `<details>` des capacités et critères ont deux états distincts : `detailsOpen` (écran principal) et `popupDetailsOpen` (fenêtre de correction).

## Définition de « terminé »

1. `npm test` **et** `npm run test:e2e` sont verts.
2. Nouveau comportement ⇒ test ajouté (unitaire pour la logique pure, e2e pour l'interface).
3. `docs/STATUS.md` mis à jour (ligne concernée).
4. Décision de conception ⇒ ligne dans `docs/DECISIONS.md` ; changement de comportement ⇒ spec mise à jour.
5. Fichier `docs/handoff/AAAA-MM-JJ-<agent>-<sujet>.md` créé d'après `_TEMPLATE.md`.
6. PR remplie avec le modèle ; l'intégration continue joint des captures d'écran quand l'interface change.

## Si tu es bloqué ou si la spec est muette

N'invente pas. Écris la question dans le handoff avec **deux options** et leurs conséquences, puis arrête-toi sur ce point.

## Si les outils GitHub sont indisponibles (mode dégradé)

`gh` absent, réseau fermé, `.git` en lecture seule : ne contourne pas et ne devine pas.

- **Ne déduis jamais le contenu d'une issue de son numéro.** Le numéro GitHub `#4` n'est pas l'ID interne (`T-04`) : vérifie titre et label de l'issue, ou reçois son texte de l'utilisateur.
- Demande le **texte complet de l'issue** dans le prompt et continue avec lui, ou arrête-toi en expliquant ce qui manque.
- Sans droit d'écriture sur le dépôt (pas de branche possible), ne modifie pas les fichiers « en attendant » : signale le blocage et arrête-toi. Un travail non versionnable devient une source d'erreur au prochain agent.
- Les issues vivent dans GitHub (`gh issue view N`) ; la table de correspondance `T-0N ⇢ #N` est dans `docs/STATUS.md`.
