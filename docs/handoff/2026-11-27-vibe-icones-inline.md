# Passation — icônes intégrées en data-URI + horodatage des captures e2e (issue #30)

*2026-11-27, Vibe. Branche `agent/vibe/icones-inline`. Issue : #30.*

## Constat utilisateur

En usage réel (tablette) : des boutons devenaient invisibles ou perdaient leur icône (exemple cité : la croix « Fermer »), mais l'action restait déclenchable en cliquant sur l'emplacement du contrôle.

## Cause établie

- Les icônes sont dessinées par un **masque CSS** : `.menu-icon{background-color:currentColor;-webkit-mask:var(--icon) center/contain no-repeat;mask:...}`.
- La variable `--icon` pointait vers **des fichiers SVG externes** (`icones/*.svg`) : 36 références dans `correction.html` + 6 sites dynamiques dans `src/js/` (rendu-cartes, carte-methodes, devoir-eleves, chargement-grilles, corrections-en-cours, fenetre-correction).
- Si un SVG n'est pas chargé (réseau instable, cache froid, premier rendu hors-ligne), le masque vaut « image transparente » : **l'icône disparaît, le bouton reste cliquable** — exactement le symptôme.
- C'était la seule dépendance réseau du rendu de l'interface, en tension avec le principe « 100 % statique, zéro dépendance » du projet.

## Remède appliqué

1. **34 → 32 classes CSS `icone-<nom>`** dans `correction.css` (bloc inséré après `.menu-icon`, fichier CRLF conservé) : chaque règle pose `--icon:url("data:image/svg+xml,…")` avec le contenu **intégral** du fichier source (encodage pourcent, `'` conservé, wrapper `"`).
2. `correction.html` : les 36 `<span class="menu-icon" style="--icon:url('icones/x.svg')"…>` deviennent `<span class="menu-icon icone-x" aria-hidden="true"></span>`. Aucun autre changement.
3. JS (même comportement, par classes) :
   - `rendu-cartes.js` `methodIcon(name, className)` → classe `icone-${name}` ;
   - `chargement-grilles.js` (check), `corrections-en-cours.js` (portrait), `devoir-eleves.js` (`icone-${icon}` des actions de colonne) ;
   - `fenetre-correction.js` `updateCorrectionTrombiToggle` : bascule `icone-grid-view`/`icone-view-list` par `classList.toggle` (les deux boutons, même logique qu'avant).
4. Le pipeline de rendu **ne change pas** (toujours `mask:var(--icon)`) : rendu attendu identique au pixel près. Le dossier `icones/` reste en place comme source (le test de garde le vérifie) ; les fichiers non utilisés ne sont pas supprimés.
5. **Test de garde** `tests/icones.test.cjs` : (a) plus aucune référence réseau d'icône dans HTML/CSS/JS ; (b) chaque classe `icone-X` utilisée (statique + liste des noms dynamiques) a une règle en data-URI ; (c) le contenu décodé de chaque data-URI reste identique au fichier source. Ce test a déjà servi : il a attrapé l'oubli de `timer_pause`/`timer_play` (choix conditionnel dans `carte-methodes.js`, invisible au grep).

## Horodatage des captures e2e

`shot()` (tests/e2e/helpers.cjs) préfixe désormais chaque capture par `AAAAMMJJ-HHMMSS_` : le tri alphabétique de l'artefact « captures-e2e » suit l'ordre chronologique des exécutions, puis l'ordre des captures au sein d'une exécution.

## Vérifications

- `npm test` : 26 unitaires verts (23 + 3 nouvelles assertions de garde).
- `node --check` sur les 5 modules JS modifiés.
- e2e : CI (captures à inspecter dans l'artefact `captures-e2e` — les icônes doivent être rendues à l'identique).

## Points de relecture

- Vérifier visuellement sur quelques captures e2e (navigation, sous-menu, fenêtre de correction, trombinoscope) que les icônes sont identiques à avant.
- La taille de `correction.css` augmente d'environ 30 Ko (32 icônes intégrées) — jugé acceptable pour l'usage hors-ligne.
- `icones/arrow_right (1).svg` (nom avec espace) est un doublon non référencé : conservé volontairement, aucune incidence.
