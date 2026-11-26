# Passation — 2026-11-25 — Vibe — T-01 module 7 : stockage

**Issue / tâche :** #4 · **Branche :** `agent/vibe/t01-stockage` · **PR :** (draft, voir GitHub)

## Objectif de la session
Module 7 du découpage (tranche demandée par Claude/Anthropic : **stockage seul**) : déplacer les fonctions de sauvegarde locale (IndexedDB) en `src/js/stockage.js`, sans réécrire le code, et noter D-014 dans `docs/spec/donnees.md`.

## Fait
- Bloc **contigu** déplacé octet-à-octet (5 535 caractères) : de `let workspaceDatabase=` à la fin de `initializeWorkspaceStorage` (exclu : les instructions top-level qui suivent) : `workspaceDatabase` (état), `showStorageWarning`, `openWorkspaceDatabase`, `readWorkspace`, `writeWorkspace`, `workspaceSnapshot`, `saveWorkspace`, `restoreWorkspace`, `initializeWorkspaceStorage`.
- Balise `<script src="src/js/stockage.js"></script>` insérée en **septième** position, après `import-grilles.js`.
- **Les deux instructions top-level restent dans `correction.html`**, à leur place exacte : la boucle `for(... )document.addEventListener(eventName,saveWorkspace)` et l'appel `initializeWorkspaceStorage()`. Raison : elles dépendent de `saveWorkspace` (déclarée plus bas dans le HTML au chargement) et doivent s'exécuter après l'initialisation complète du script principal — conserver l'ordre d'exécution au millimètre prime sur l'extraction complète.
- `docs/spec/donnees.md` : D-014 désormais cité explicitement (renvoi vers `docs/DECISIONS.md`) sur la ligne du champ `statut` ; mention du module `src/js/stockage.js` et de ce qui reste dans le HTML dans la section « Stockage local » (D-014 était déjà intégré en PR #17).
- `docs/STATUS.md` : ligne Découpage mise à jour (modules 1-7 ; reste élèves et corrections en cours).

## Vérifications
- Aucune instruction top-level parasite dans le module (1 `let` + 8 déclarations de fonctions, dont 2 `async`) ; accolades équilibrées ; `node --check` OK.
- Toutes les références externes (`captureActiveCorrection`, `snapshotMethodStates`, `correctionModeMenu`, `correctionApp`, `levels`, `grid`, `render`, …) sont résolues **à l'appel**, jamais au chargement du module : aucun risque d'ordre de chargement.
- **Parité par reconstruction** : `HTML PARITE: True`, `MODULE OCTET-A-OCTET: True` (5 535/5 535).
- `npm test` : **23/23 pass** (les sections de tests unitaires ne couvrent pas le stockage ; l'e2e de la CI charge le HTML complet et valide le chemin réel).

## Découvertes
- Le stockage n'est pas seulement un bloc de fonctions : il se termine par deux instructions top-level (écouteurs globaux + démarrage). Les extraire aussi aurait décalé l'ordre d'exécution au chargement ; ils restent volontairement dans `correction.html`.
- `restoreWorkspace` lit `correctionModeMenu` (const du HTML) et `workspaceSnapshot` appelle `captureActiveCorrection`/`snapshotMethodStates` (HTML) : le module dépend du script principal, jamais l'inverse — cohérent avec le placement de la balise avant le script inline.

## Zone sensible
Oui : stockage (`workspaceSnapshot`/`restoreWorkspace`, IndexedDB). Conformément à la règle « zones sensibles » d'AGENTS.md et à la consigne de la consultation Claude/Anthropic, **la PR reste en draft pour relecture par Claude avant fusion**. Aucun changement de comportement attendu (déplacement pur) ; le champ `statut` (D-014) est déjà documenté dans `docs/spec/donnees.md` depuis la PR #17.

## Ce qui reste (T-01, après fusion de ce module)
Le reste du script inline de `correction.html` : élèves et corrections en cours (rendu de la table élèves, import CSV élèves, menus de colonnes, dialogues, navigation). À découper en une ou plusieurs tranches — proposer un découpage quand cette PR est fusionnée.
