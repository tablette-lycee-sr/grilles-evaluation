# Passation — T-06 : arbitrages Bonus / Barème (D-016, D-017)

*Vibe, 2026-11-27. Issue #9 (label `humain` — décision du concepteur, recueillie par QCM). Branche `agent/vibe/t06-arbitrages` depuis `origin/main`.*

## Décisions recueillies

- **Q1-B — Bonus** : la zone bleu foncé devient un **mini-bonus fixe**. Valeur du palier : **+0,5 pt** (proposée dans le QCM et acceptée ; constante `BONUS_PALIER=0.5` en tête de `src/js/carte-methodes.js`). Le gris reste 0 ; la zone bleu clair reprend linéairement du trait bleu foncé/bleu clair (66 %) jusqu'au plafond. → **D-016**, remplace D-010.
- **Q2-A adapté — Barème** : plutôt que des boutons de niveaux cliquables, un **point de couleur non cliquable** (nuancier NA rouge / ECA- orange / ECA-ECA+ jaune / A vert) à gauche de chaque champ de points, reflétant le **niveau courant de la catégorie** (gris tant que rien n'est saisi). → **D-017**.
- **Suite-A** : implémentation complète dans une seule PR draft.

## Implémentation

- `src/js/carte-methodes.js` — bloc bonus : la jauge a maintenant 3 zones de valeurs (0 / palier / linéaire). `count` = nombre de pas linéaires + le palier ; `valeurDe`/`indexDe`/`positionOf`/`fromPointer` réécrits. Le curseur se place au **centre du bleu foncé** tant que la valeur vaut le palier.
- `correction.html` — `renderMethodDetails` (branche Barème) : insertion de la marque `<i class="critere-niveau">` entre le nom du critère et le champ de points, colorée via `--couleur-niveau` (même variable que les boutons de niveaux), `role="img"` + `aria-label` « Niveau actuel de la catégorie : X ». La marque est recréée à chaque `render()` : elle suit donc la saisie en direct (et le niveau imposé manuellement).
- `correction.css` — grille des critères passée de 3 à 4 colonnes (règle de base + règle popup en `--u`), style du point (disque 10 px, ou `calc(12 * var(--u))` dans la fenêtre de correction).
- La fenêtre de correction (popup) hérite du point automatiquement (même `renderMethodDetails`) ; la fiche imprimable n'est pas modifiée (elle n'affiche pas le tiroir des critères).

## Tests

- e2e `bonus` adapté (`tests/e2e/methodes.e2e.cjs`) : 0 dans le gris, **0,5 partout dans le bleu foncé** (38,75 % et 50 %), 1,25 à 83 %, 2 au bout.
- e2e `barème` nouveau : point gris avant saisie → vert (6/6 = 100 %, A) → jaune (6+0/10 = 60 %, ECA) → rouge (0/10, NA) ; vérifie aussi « un point par critère ».
- Unitaires inchangés : le plafonnement global des bonus (somme + plafond) ne change pas ; la carte des valeurs n'est pas extraite par les marqueurs unitaires. Justification notée dans la PR.

## Reste à faire / ouvert

- **Valeur du palier (+0,5 pt)** à confirmer à l'usage sur tablette — c'est une constante, facile à ajuster (une ligne).
- Fiche imprimable : rien à changer (le point n'existe qu'à l'écran).
- Vérifications tablette habituelles : jauge bonus au doigt (le palier doit se sentir « par crans »), point de couleur lisible en popup.
