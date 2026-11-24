# Interface de correction : règles de mise en page

Référence visuelle d'origine : `design/schemas-evaluation.html` (si ajouté au dépôt). Ce document est la version normative ; en cas d'écart avec le CSS, signaler.
Code : `renderMethodCategory` / `updateMethodGauge` (JS), blocs `.method-category …` de `correction.css`.

## 1. Unité et largeur
- Toutes les dimensions d'une carte de méthode sont en **`--u`** : `--u = clamp(1px, (100vw − 44px) / 328,5, 1,5px)` (variable racine `--methode-u`). Ne jamais mettre de px fixes dans ces blocs.
- **Largeur unique** pour toutes les méthodes : **328,5 u** (≈ 493 px à 1,5 px).
- Grille interne commune : colonnes `37 u | 212 u | 65,5 u`, écart 3 u, marge 3 u, bordure 1 u noire, rayon 10 u. La colonne centrale contient les niveaux et la jauge, **centrés** : ils doivent être alignés verticalement d'une carte à l'autre (test e2e).
- Lignes : `titre 24 u | boutons 28 u | jauge 26 u | commentaire auto | motif auto` (Minuteur : 29 u + 29 u ; Bonus : 28 u + 15 u).

## 2. Anatomie d'une carte
1. **Titre** : icône de la méthode (gris) + titre (une ligne, ellipsis).
2. **Colonne gauche** : pastille de **coefficient** (bouton) et bouton **aide** (voir §6).
3. **Rangée de boutons** (centrée) : triangle **Attention** `!`, boutons de **niveaux**, rond **D** (réserve invisible pour le Minuteur afin de garder l'alignement).
4. **Jauge** (7 u de haut, 117 u de large à 3 niveaux, 157 u à 4) avec séparateurs noirs aux seuils.
5. **Colonne droite**, propre à la méthode (§4).
6. **Commentaire** (dans la boîte) : champ de texte **éditable au clic** + flèche violette ouvrant la liste des commentaires prédéfinis du niveau. Choisir dans la liste remplace le texte saisi. N'apparaît que si le niveau a des commentaires prédéfinis ou du texte libre.
7. **Motif** Attention/Dépassé (même style de champ), affiché quand le bouton correspondant est actif.
8. **Tiroir de détail** (Capacités, Barème) : s'ouvre **sous** la carte, même largeur, fond gris plus clair et bordure, coins bas arrondis ; la carte perd ses coins bas arrondis quand il est ouvert. Il se déclenche par la carte violette « n/m capacités » (flèche pivotée quand ouvert). Fermé par défaut dans la fenêtre de correction.

## 3. États et couleurs
| Niveau | Couleur | Utilisation |
|---|---|---|
| NA | rouge `#ff3131` | |
| ECA- | orange `#ffbd59` | niveau à 4 niveaux |
| ECA, ECA+ | jaune `#ffd737` | |
| A | vert `#17a13f` | |

- **Niveau choisi par le correcteur** : fond plein de la couleur du niveau, texte noir gras.
- **Niveau calculé** : **anneau** (bordure 3 u) de la couleur du niveau, même nuancier. Les deux peuvent se cumuler.
- **Jauge** : segments aux teintes **désaturées** (`--jauge-*`), à ne pas remplacer par le nuancier vif.
- **Curseurs** : calculé = rond creux ; **manuel** = rond blanc plein ; **fantôme** = rond translucide à la valeur calculée quand un curseur manuel existe. Un clic sur le curseur manuel (sans le déplacer) ou la touche Échap revient au calcul.
- **Attention** actif : triangle rouge avec intérieur blanc ; **D** actif : rond bleu ; D **suggéré** (Compteur au seuil D) : anneau bleu.
- **Non noté** : le bouton coefficient affiche **NN** (bordure en pointillés, comme les coefficients entre parenthèses des catégories facultatives) et **toute la carte, tiroir compris, passe à 50 % d'opacité**. Un second clic restaure la valeur précédente. La pastille « + » du Bonus devient aussi NN.

## 4. Colonne droite par méthode
| Méthode | Contenu |
|---|---|
| Capacités, Barème | Carte violette « n/m capacités \| critères » qui ouvre le tiroir. |
| Distribution | Boutons de niveaux **violets** avec « + » (ou « − »), chiffres de comptage colorés **sous** les segments, bascule verticale +/− à droite. |
| Compteur | Carré violet « + n » (incrémente) et pastille « −1 ». Jauge en lecture seule. |
| Minuteur | Pastille violette (icône + durée, démarre/pause), durée cible en vert, bouton remise à zéro. |
| Bonus | Pas de boutons de niveau : jauge bleue + valeur « +n » à droite + champ de commentaire. |

## 5. Jauges particulières
**Bonus** — `échelle = [gris | bleu foncé | bleu clair]` (séparateurs à 30 % et 66 %).
- Gris = **0**, une seule position (poignée au **centre du gris**, poignée creuse).
- Les points se répartissent **linéairement** du trait gris/bleu foncé jusqu'au bout de la jauge : position = `30 + 70 × (points / pointsMaximum)` %. Ex. 2 points, pas 0,25 : 0,25 → 38,75 %. *(Hypothèse à valider : l'échelle couvre le bleu foncé et le bleu clair.)*
- Saisie au pointeur sur toute la jauge (zone de toucher élargie) et au clavier (une graduation par flèche).

**Minuteur** — jauge en **fer à cheval** : piste haute (trop court → plateau A, de gauche à droite), **virage vert** (plateau A, milieu = durée cible), piste basse (plateau A → trop long, de droite à gauche). Géométrie dans le repère de la jauge (unités `--u`) : largeur `W` = 117 ou 157, `L = W − 10`, rayon du virage 7, pistes à y = 3 et y = 17.
- Repères temps → position le long du chemin : `0`, `naTropCourt`, `entreeA` (début du vert), `dureeCible` (milieu du virage), `sortieA`, `naTropLong`, fin de courbe. Interpolation linéaire entre repères (`methodTimerToPath` / `methodPathToTimer`).
- Glisser n'importe où sur la jauge place la poignée sur le **point du chemin le plus proche** (`methodTimerNearest`) ; la position donne une **durée**, puis un **pourcentage** par la courbe de la grille. Ce pourcentage est le choix manuel ; la **durée mesurée** par le chronomètre reste inchangée (curseur fantôme). Clavier : flèches le long du chemin.

## 6. Fenêtre d'information d'une méthode
Bouton « i » ⇒ **fenêtre contextuelle** (jamais d'alerte du navigateur), aux codes graphiques de l'appli : consigne de la grille · fonctionnement de la méthode (coefficient, durée cible…) · niveaux avec libellé, **seuils**, valeur retenue et **commentaires** du niveau · motifs Attention/Dépassé · liste des capacités ou critères avec aide à la notation. Fermeture : croix, Échap, clic extérieur ; **sans fermer** la fenêtre de correction (les événements sont retenus dans la fenêtre d'information).

## 7. Fenêtre de correction individuelle
- Largeur **90 %** de l'écran (au plus `100vw − 24 px`).
- **Paysage** : colonne élève (photo + informations) à gauche ; à droite nom + bouton de fermeture, puis les cartes rangées en **colonnes** (autant que la largeur le permet), défilement vertical ; champ « Remarque » en bas.
- **Portrait** (ou largeur < 700 px) : **bandeau d'identification fixe** en haut (photo 64 px, nom en grand, classe / sous-groupe / sujet / PAP, bouton de fermeture) ; les catégories défilent dessous.
- **Bouton de fermeture** : 52 × 52 px, icône 30 px.
- Fermeture par clic extérieur ou Échap ; les évaluations et la remarque sont conservées.

## 8. Accessibilité (utilisée par les tests)
Les boutons de niveaux ont `aria-label="<titre catégorie> : <niveau>"` et `data-method-level` ; les jauges contiennent un `input[type=range]` invisible qui porte le clavier et `aria-valuetext` ; les champs de commentaire ont des `aria-label` explicites. Ne pas les renommer sans adapter `tests/e2e/`.
