# État d'avancement

*Dernière mise à jour : 2026-11-24 (Vibe, T-07 cycle de notation par catégorie). Légende : ✅ fait · 🟡 partiel / à vérifier · ⬜ à faire · 🐞 bug connu.*
Mettre à jour la ligne concernée à chaque PR. Les **tâches** vivent dans les issues GitHub ; ce fichier donne la vue d'ensemble.

## Fonctionnalités

| Fonctionnalité | État | Spec | Tests | Notes |
| --- | --- | --- | --- | --- |
| Grille JSON (chargement, validation) | ✅ | `spec/format-grille.md` | unitaires (21) | Anciennes grilles CSV encore lues, sans conversion automatique. |
| Éditeur de grilles | ✅ | README (section Éditeur) | unitaires | Éditeur de courbe du Minuteur inclus. |
| Six méthodes : calculs | ✅ | `spec/methodes-correction.md` | unitaires | Zone sensible. |
| Six méthodes : interface (schémas) | ✅ | `spec/ui-correction.md` | e2e (10) | Largeur unique, tiroir, commentaires dans la boîte, fenêtre d'info. |
| Minuteur : poignée sur le fer à cheval | ✅ | `spec/ui-correction.md` §5 | e2e | À éprouver au doigt sur une vraie tablette. |
| Bonus : échelle à partir du bleu foncé | 🟡 | `spec/ui-correction.md` §5 | e2e | Hypothèse « tout le bleu » à valider par l'utilisateur (T-06 · #9). |
| Fenêtre de correction individuelle (90 %, bandeau portrait) | ✅ | `spec/ui-correction.md` §7 | e2e | |
| Trombinoscope, groupes d'élèves (CSV) | ✅ | README | — | Pas de test automatique. |
| Sauvegarde locale (IndexedDB) | ✅ | `spec/donnees.md` | — | Zone sensible. Nouveaux champs : `manualSeconds`, `commentTexts`, `bonusText`, `evaluee`, `statut (D-014)`, `popupDetailsOpen`. |
| Cycle de notation par catégorie (Noté / NN / 2(+) / NE) | ✅ | `spec/ui-correction.md` §3 | unitaires + e2e | T-07 · #16 (D-014) : à éprouver sur tablette, PDF à imprimer par l'utilisateur. |
| Fiche imprimable / PDF | 🟡 | spec méthodes (« Sauvegarde, compatibilité et fiche ») | — | Existe (`makePrint*`). À vérifier avec : commentaires libres, NN, Minuteur manuel. Contenu visible par l'élève à préciser. |
| Onglets Résultats et Export | 🟡 | — | — | État réel à qualifier (relever ce qui est implémenté). |
| Sauvegarde / restauration du devoir sur fichier | ⬜ | à rédiger | — | Prévue après les méthodes. |
| Migration des anciennes corrections locales | ⬜ | spec méthodes | — | Questions suspendues par le concepteur. |
| Tests automatiques (GitHub Actions) | 🟡 | `TESTING.md` | unitaires + e2e | Fournis avec le kit ; à vérifier à la première PR. |
| Découpage de `correction.html` en fichiers | 🟡 | — | unitaires (23) | T-01 · #4 : modules 1-6 extraits et fusionnés (calculs, rendu des cartes, assemblage, impression, fenêtre de correction et trombinoscope, import de grilles) ; restent élèves et corrections en cours, stockage. |

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

## Bugs et risques connus

- Un ancien choix manuel du Minuteur (avant `manualSeconds`) est replacé sur la piste haute par recherche sur la courbe : approximation acceptable, à surveiller.
- Les tests unitaires dépendent des marqueurs de fonctions dans `correction.html` (voir `AGENTS.md`, « Pièges »).
- Les icônes de `icones/` sont indispensables à l'affichage (masques CSS) ; une icône manquante rend le bouton vide sans erreur.
