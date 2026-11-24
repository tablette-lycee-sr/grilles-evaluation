# Journal des décisions

Une ligne par décision. Format : `D-NNN · date · décision · raison`. Ajouter à la fin ; ne pas réécrire l'historique (annuler par une nouvelle décision).
Dates antérieures au 2026-11-23 : d'après l'historique git, à titre indicatif.

| ID | Date | Décision | Raison |
|---|---|---|---|
| D-001 | 2026-11-21 | Les nouvelles grilles sont en **JSON versionné** ; pas d'import automatique des anciennes grilles CSV. | Format plus riche (six méthodes), validation stricte, compatibilité sans conversion risquée. |
| D-002 | 2026-11-21 | Six méthodes de correction ; calculs séparés des choix manuels (curseur calculé / manuel / fantôme). | Le correcteur garde la main sans perdre le calcul automatique. Voir `spec/methodes-correction.md`. |
| D-003 | 2026-11-22 | Les cartes de méthodes reprennent les **schémas d'évaluation** validés par l'utilisateur ; unité `--u`. | Mise en page standardisée et proportionnelle (tablette). |
| D-004 | 2026-11-23 | Fenêtre de correction à **90 %** de la largeur (au lieu de 75 %), cartes en colonnes en paysage. | Plus de place pour les schémas ; fermeture facilitée par un bouton de 52 px. |
| D-005 | 2026-11-23 | En portrait, **bandeau élève fixe** en haut de la fenêtre ; catégories défilantes dessous. | Libère la largeur sans colonne latérale. |
| D-006 | 2026-11-23 | **Largeur de carte unique** (328,5 u) ; colonne centrale alignée ; tiroir de détail rattaché sous la carte. | Mise en page standardisée malgré les différences entre méthodes. |
| D-007 | 2026-11-23 | **Commentaires dans la boîte**, texte éditable au clic, liste prédéfinie via la flèche ; texte libre prioritaire (`commentTexts`). | Saisie rapide et personnalisation ; la fiche imprimée utilise le texte libre. |
| D-008 | 2026-11-23 | **Nuancier des niveaux** : NA rouge, ECA- orange, ECA et ECA+ jaune, A vert ; jauges désaturées. | Lisibilité immédiate du niveau choisi et du niveau calculé. |
| D-009 | 2026-11-23 | Bouton coefficient : **NN** (non noté), pointillés, carte à 50 % ; second clic = retour. | Exclure une catégorie de la note de façon visible et réversible. |
| D-010 | 2026-11-23 | **Bonus** : gris = 0 (poignée au centre du gris), points à partir du trait gris/bleu foncé, échelle linéaire jusqu'au bout. | Distinguer « pas de bonus » d'un petit bonus. *Hypothèse « tout le bleu » à valider (T-06).* |
| D-011 | 2026-11-23 | **Minuteur** : la poignée suit le fer à cheval ; position → durée → pourcentage manuel ; la durée mesurée reste visible (fantôme). | Évaluer de « trop court » à « trop long » en passant par la cible, sans modifier la mesure. |
| D-012 | 2026-11-23 | Information d'une méthode : **fenêtre contextuelle** détaillée (consigne, fonctionnement, niveaux, commentaires), pas d'alerte du navigateur. | Cohérence graphique et contenu complet. |
| D-013 | 2026-11-23 | Le **dépôt GitHub est la source de vérité** ; `AGENTS.md` unique ; CI avec tests unitaires et e2e (Playwright + `node:test`). | Travail alterné entre agents (Codex, Copilot, Claude) sans répéter les consignes. |
| D-014 | 2026-11-24 | Bouton coefficient : **cycle de 4 statuts** par clics successifs — **Noté** (coefficient) → **NN** (évalué mais non noté : contours en tirets, exclu du calcul) → **2(+)** (incluse seulement si cette inclusion augmente la note finale) → **NE** (non évalué : opacité 25 %, contrôles désactivés, fiche réduite au titre) → Noté. Remplace D-009 (la carte NN repasse à opacity 1). | Nuancer la correction élève par élève : NN indicative, 2(+) pour protéger la moyenne, NE pour un élève absent ou non évalué. |
