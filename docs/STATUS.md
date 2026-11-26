# État d'avancement

*Dernière mise à jour : 2026-11-26 (Vibe, T-02 : fiche imprimable cohérente écran/papier). Légende : ✅ fait · 🟡 partiel / à vérifier · ⬜ à faire · 🐞 bug connu.*
Mettre à jour la ligne concernée à chaque PR. Les **tâches** vivent dans les issues GitHub ; ce fichier donne la vue d'ensemble.

## Fonctionnalités

| Fonctionnalité | État | Spec | Tests | Notes |
| --- | --- | --- | --- | --- |
| Grille JSON (chargement, validation) | ✅ | `spec/format-grille.md` | unitaires (21) | Anciennes grilles CSV encore lues, sans conversion automatique. |
| Éditeur de grilles | ✅ | README (section Éditeur) | unitaires | Éditeur de courbe du Minuteur inclus. |
| Six méthodes : calculs | ✅ | `spec/methodes-correction.md` | unitaires | Zone sensible. |
| Six méthodes : interface (schémas) | ✅ | `spec/ui-correction.md` | e2e (13) | Largeur unique, tiroir, commentaires dans la boîte, fenêtre d'info. |
| Minuteur : poignée sur le fer à cheval | ✅ | `spec/ui-correction.md` §5 | e2e | À éprouver au doigt sur une vraie tablette. |
| Bonus : échelle à partir du bleu foncé | 🟡 | `spec/ui-correction.md` §5 | e2e | Hypothèse « tout le bleu » à valider par l'utilisateur (T-06 · #9). |
| Fenêtre de correction individuelle (90 %, bandeau portrait) | ✅ | `spec/ui-correction.md` §7 | e2e | |
| Trombinoscope, groupes d'élèves (CSV) | ✅ | README | — | Pas de test automatique. |
| Sauvegarde locale (IndexedDB) | ✅ | `spec/donnees.md` | — | Zone sensible. Nouveaux champs : `manualSeconds`, `commentTexts`, `bonusText`, `evaluee`, `statut (D-014)`, `popupDetailsOpen`. |
| Cycle de notation par catégorie (Noté / NN / 2(+) / NE) | ✅ | `spec/ui-correction.md` §3 | unitaires + e2e | T-07 · #16 (D-014) : à éprouver sur tablette, PDF à imprimer par l'utilisateur. |
| Fiche imprimable / PDF | ✅ | spec méthodes (« Sauvegarde, compatibilité et fiche ») | e2e (impression) | T-02 · #5 : NN sans valeur de note, 2(+) signalé, NE réduit, Bonus NN, textes libres (D-007), durée retenue du Minuteur (D-011), motifs Attention/Dépassé toutes catégories ; coefficient non imprimé. Inventaire validé sur #5 ; PDF réel à imprimer par l'utilisateur. |
| Onglets Résultats et Export | 🟡 | — | — | T-04 · #7 : **qualifié**. **Résultats** : non implémenté (placeholder « disponible prochainement », aucun sous-menu, aucune fonction) → à concevoir puis bâtir, cf. T-08 · #26 (labels `humain`, `spec-needed`). **Export** : réduit au sous-menu « Imprimer / PDF » (`exportPrintBtn` → fiche imprimable de `src/js/impression.js`) ; l'écran de la vue reste un placeholder ; l'export du devoir sur fichier est le sujet de T-02 / T-03 (#5 / #6). Boutons « Ouvrir un devoir », « Sauvegarder le devoir » et « Télécharger une grille » du sous-menu Devoir : désactivés « (à venir) ». |
| Sauvegarde / restauration du devoir sur fichier | ⬜ | à rédiger | — | Prévue après les méthodes. |
| Migration des anciennes corrections locales | ⬜ | spec méthodes | — | Questions suspendues par le concepteur. |
| Tests automatiques (GitHub Actions) | 🟡 | `TESTING.md` | unitaires + e2e | Fournis avec le kit ; à vérifier à la première PR. |
| Découpage de `correction.html` en fichiers | ✅ | — | unitaires (23) | T-01 · #4 : **clôturé** — 10 modules extraits et fusionnés : 1 `methodes-calcul.js` (#12), 2 `rendu-cartes.js` (#13), 3 `carte-methodes.js` (#14), 4 `impression.js` (#15), 5 `fenetre-correction.js` (#19), 6 `import-grilles.js` (#20), 7 `stockage.js` (#21), 8 `corrections-en-cours.js` (#22), 9 `devoir-eleves.js` (#23), 10 `chargement-grilles.js` (#24). Reste dans `correction.html` (volontaire) : état initial, fonctions frontières des marqueurs de tests, dialogues/menus/navigation, câblage top-level ; récapitulatif dans `docs/handoff/2026-11-25-vibe-t01-clos.md`. |

## Points encore ouverts (repris de la spec des méthodes)

Schéma JSON versionné et reprise éventuelle des corrections locales · contraintes de validation des seuils du Minuteur et comportement de l'éditeur de courbe · seuils exacts restants et précision d'affichage · contenu de la fiche PDF, confidentialité, corrections incomplètes · plafonds et origine des anciens bonus lors d'une migration.

## Tâches créées comme issues (2026-11-24)

| ID | Titre | Niveau | Issue | Critères d'acceptation (résumé) |
| --- | --- | --- | --- | --- |
| T-01 | Extraire le JavaScript de `correction.html` en fichiers (`src/js/…`), un module par PR | agent:ok, prudent | #4 | Comportement identique ; tests unitaires adaptés (marqueurs `section()`), e2e verts ; pas de build, scripts classiques. |
| T-02 | Fiche imprimable : détail par méthode, vérifier NN / commentaires libres / Minuteur manuel | **sensible** | #5 | Fiche cohérente avec l'écran ; test sur une grille d'exemple ; contenu validé par l'utilisateur. |
| T-03 | Sauvegarde et restauration du devoir sur fichier (spec puis code) | **sensible** | #6 | Spec rédigée et validée d'abord ; aller-retour sans perte ; données personnelles documentées. |
| T-04 | Qualifier les onglets Résultats et Export | agent:ok | #7 | Liste de l'existant dans ce fichier ; issues de suite. |
| T-05 | Tests e2e supplémentaires : import CSV d'élèves, éditeur de grille, impression | agent:ok | #8 | Chaque scénario nommé dans `TESTING.md`. |
| T-06 | Valider l'échelle du Bonus et les critères du Barème (couleur ? niveau ?) | humain | #9 | Décision notée dans `DECISIONS.md`. |
| T-07 | Cycle de notation par catégorie : Noté / NN / 2(+) / NE | **sensible** | #16 | Cycle respecté ; 2(+) dynamique ; NE = contrôles désactivés et PDF réduit au titre ; unitaires + e2e adaptés ; D-014 remplace D-009. |
| T-08 | Onglet Résultats : concevoir puis implémenter la vue | humain, spec-needed | #26 | Conception validée par l'utilisateur ; spec rédigée et validée ; implémentation et tests ensuite. |

## Bugs et risques connus

- Un ancien choix manuel du Minuteur (avant `manualSeconds`) est replacé sur la piste haute par recherche sur la courbe : approximation acceptable, à surveiller.
- Les tests unitaires dépendent des marqueurs de fonctions dans `correction.html` (voir `AGENTS.md`, « Pièges »).
- Les icônes de `icones/` sont indispensables à l'affichage (masques CSS) ; une icône manquante rend le bouton vide sans erreur.
