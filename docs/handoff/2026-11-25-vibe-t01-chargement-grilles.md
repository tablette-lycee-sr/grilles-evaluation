# Passation — 2026-11-25 — Vibe — T-01 module 10 : chargement des grilles

**Issue / tâche :** #4 · **Branche :** `agent/vibe/t01-chargement-grilles` · **PR :** (draft, voir GitHub)

## Objectif de la session
Troisième et dernière PR de la série « élèves et corrections en cours » (découpage en trois validé par Claude/Anthropic lors de la relecture de la PR #22) : application d'une grille chargée et catalogue des grilles.

## Fait
- Bloc **contigu** déplacé octet-à-octet (3 253 caractères) : de `function applyLoadedGrid(` aux instructions top-level exclues : `applyLoadedGrid`, `applyCsvText`, `loadRepositoryGrid`, `loadGridCatalog`.
- Balise `<script src="src/js/chargement-grilles.js"></script>` insérée en **dixième** position, après `devoir-eleves.js`.
- **Les instructions top-level de câblage restent dans `correction.html`** (boutons export/précédent/suivant/info élève, écouteurs des dialogues, boucle `saveWorkspace`, `initializeWorkspaceStorage()`, minuteur des méthodes) : même motif que le module 7 — conserver l'ordre d'exécution au millimètre prime.
- Le module ne référence les globals du HTML qu'**à l'appel**, jamais au chargement. `fetch` n'y est utilisé que pour charger un fichier de grille depuis *ce même site* (contrôle `url.origin!==location.origin`), inchangé depuis l'origine.

## Vérifications
- Aucune instruction top-level parasite (4 déclarations de fonctions, dont 2 `async`), accolades équilibrées, `node --check` OK.
- **Parité par reconstruction** : `HTML PARITE: True`, `MODULE OCTET-A-OCTET: True` (3 253/3 253).
- `npm test` : **23/23 pass**. Aucune fonction frontière des marqueurs vivants déplacée.

## Zone sensible
Non par nature (application d'une grille au workspace et catalogue ; calculs et sauvegarde inchangés). PR en draft par cohérence avec le rythme de relecture de la série.

## Ce qui reste dans `correction.html` après fusion de ce module (≈ 1 090 lignes de script)
- L'état global initial (constantes par défaut, variables d'état, éléments DOM) — **non déplaçable sans risque** : tout le reste s'appuie dessus.
- La zone `setStatus` → `updateFinalScore` : fonctions frontières des trois marqueurs de tests vivants (`[allNodes, makeChoiceButton]`, `[resetChoices, captureActiveCorrection]`, `[calculateFinalScore, updateFinalScore]`) et leurs sections — chaque extraction future de sous-blocs contigus à l'intérieur devra adapter `tests/methodes.test.cjs`.
- Les dialogues/menus/navigation (popup de correction, menu de mode, vue trombinoscope, boîte « autre ») et leur câblage top-level.
- Le câblage final (écouteurs globaux, initialisation du stockage, minuteur).

Fin de la série des trois PR ; le solde restant est surtout du câblage DOM hautement couplé au HTML — à redécouper avec Claude ou à laisser en place.
