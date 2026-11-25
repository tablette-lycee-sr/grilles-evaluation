# Passation — 2026-11-25 — Vibe — T-04 : qualification des onglets Résultats et Export

**Issue / tâche :** #7 · **Branche :** `agent/vibe/t04-qualifier-onglets` · **PR :** (voir GitHub, `Closes #7`)

## Méthode
Relevé direct dans le code (`correction.html`, `src/js/*.js`) : structure de navigation, `setActiveView`, sous-menus, recherche des références « resultats »/« export ». Aucun code modifié.

## État réel relevé

### Onglet Résultats (`data-view="resultats"`)
- **Non implémenté.** `setActiveView("resultats")` masque la correction, cache `assignmentPanel`/`studentsPanel` et affiche `otherViewPlaceholder` : titre « Résultats » + « Cette partie sera disponible prochainement. »
- Aucun sous-menu (`data-submenu="resultats"` absent), aucune fonction dans `src/js/` ne référence « resultats », aucun état ou filtre dédié.
- Données disponibles pour bâtir la vue : `studentCorrections`, `assignmentStudentDetails`, `methodStates` (champ `statut` du cycle D-014), `assignment` (classe, période).
- **Issue de suite créée : T-08 · #26** (labels `humain`, `spec-needed`) : conception pédagogique d'abord, puis spec, puis implémentation.

### Onglet Export (`data-view="export"`)
- **Partiellement réel.** Sous-menu `data-submenu="export"` avec un seul bouton actif : `exportPrintBtn` « Imprimer / PDF » → `renderPrintReport(); window.print()` (logique dans `src/js/impression.js`, enrichie par T-07 : bloc NE réduit au titre, ligne NN).
- Le corps de la vue affiche le même placeholder que Résultats : l'onglet est en pratique un raccourci vers l'impression de la fiche.
- L'export du devoir **sur fichier** (sauvegarde/restauration) n'existe pas : boutons du sous-menu Devoir « Ouvrir un devoir (à venir) », « Sauvegarder le devoir (à venir) », « Télécharger une grille (à venir) » désactivés — c'est le périmètre de **T-03 · #6** (spec d'abord) ; le contenu de la fiche reste à peaufiner via **T-02 · #5**.
- Le sous-menu Export (un seul bouton) ne justifie pas d'issue dédiée tant que T-02/T-03 ne redéfinissent pas le périmètre.

## Fait dans cette PR (documents uniquement)
- `docs/STATUS.md` : ligne « Onglets Résultats et Export » renseignée avec l'état relevé et les renvois (T-08 · #26, T-02/T-03) ; ligne T-08 ajoutée au tableau des tâches ; entête datée.
- Issue **#26** (T-08) créée, sans « Closes » (nouvelle tâche, pas une clôture).
- Passation présente note.

## Vérifications
- `npm test` : 23/23 (aucun code changé).
- CI : verte (PR documentaire).

## Recommandation pour T-08
Lancer d'abord la **conception humaine** (que veux-tu voir dans Résultats ?), idéalement en consultation, avant toute spec. Les choix d'agrégation (moyennes avec NN/2(+)/NE du cycle D-014) toucheront la zone « calculs » : relecture Claude recommandée au moment de la spec.
