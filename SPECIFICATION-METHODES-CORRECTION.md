# Méthodes de correction : décisions et points à préciser

Document de travail établi à partir du schéma des six méthodes fourni et des échanges avec le concepteur de l'application. Il distingue les décisions prises des détails qui restent à définir. Aucun développement n'est supposé réalisé du seul fait de figurer ici.

## Objectif et périmètre

Permettre, dans une même grille, des catégories utilisant différentes méthodes de correction, notamment pour les travaux écrits, les exposés et les débats. Adapter la définition des grilles, la correction, la sauvegarde, le calcul des résultats et la fiche imprimable ou PDF.

La hiérarchie de référence est : degré 1, Partie ; degré 2, Catégorie ; degré 3, Sous-catégorie ; degré 4, Capacité. Les noms peuvent évoluer, mais les degrés restent les références du parent au dernier enfant. Certaines méthodes n'utilisent pas tous ces degrés.

Les fichiers CSV de grille existants doivent être préservés. Un format JSON versionné est envisagé pour les nouvelles grilles ; son schéma exact et les modalités de conversion restent à définir. La définition d'une grille et les corrections individuelles sont à distinguer.

## Données communes et notation

- Une catégorie comporte notamment un nom, un ordre, une méthode, ses commentaires de niveau et les informations de fonctionnement de la méthode.
- Elle peut être évaluée ou non évaluée ; une catégorie non évaluée reste visible et renseignable à titre indicatif, sans contribuer à la note.
- Une catégorie évaluée est obligatoire ou facultative. Une catégorie obligatoire sans donnée est provisoirement exclue du calcul, avec indication que la note est incomplète.
- Pour les méthodes Capacités et Barème, un résultat partiel est calculé sur les éléments renseignés seulement. Une valeur non renseignée est distincte d'un zéro explicite.
- Parmi les catégories facultatives renseignées, retenir la combinaison qui maximise la moyenne avec les catégories obligatoires. Il faut au moins une catégorie obligatoire avec un résultat pour proposer une note ; des bonus seuls ne suffisent pas.
- Une catégorie peut employer trois niveaux, NA/ECA/A, ou quatre niveaux, NA/ECA−/ECA+/A. Le choix se fait par catégorie.
- Niveau et pourcentage de notation sont indépendants : le niveau retenu ne déplace pas automatiquement le curseur, et le curseur ne modifie pas automatiquement le niveau. Les modalités de sélection du niveau dépendent de la méthode.
- La note finale est plafonnée à 20/20.

## Curseurs calculés et manuels

Pour Capacités, Barème, Distribution et Minuteur, le correcteur peut modifier le pourcentage retenu. Lorsque le curseur est manuel, ce choix reste prioritaire si les données changent ; le calcul automatique continue à être actualisé séparément.

Un curseur fantôme, affiché en transparence derrière le curseur manuel et devant la réglette, montre la valeur automatique actualisée. S'il n'existe pas de résultat calculé, il n'y a pas de fantôme. Un clic sur le curseur manuel permet de revenir au calcul automatique. Prévoir une distinction lisible et un accès équivalent au clavier et au toucher.

Le niveau manuel et le curseur manuel reviennent séparément au calcul automatique. La méthode Distribution fait exception pour le niveau : celui-ci est calculé et ne peut pas être choisi manuellement.

Pour le Compteur, le pourcentage est calculé sans déplacement manuel du curseur : afficher un petit trait blanc vertical non saisissable plutôt qu'une poignée. Le niveau peut rester choisi manuellement. La catégorie Bonus n'utilise pas ce système de curseur fantôme.

## Attention et Dépassé

Attention et Dépassé signalent des états hors norme, distincts du calcul de la note. Leur sélection est manuelle, sauf règles de suggestion et de désactivation du Compteur précisées ci-dessous. Un commentaire justificatif n'est pas obligatoire en règle générale.

Pour le Minuteur, Attention est activé manuellement pour constater que l'élève n'a pas parlé. Son activation affiche automatiquement le commentaire pré-saisi dans la grille, notamment dans les vues de correction et sur la fiche. Dans ce cas, un minuteur jamais démarré passe de non renseigné à une absence de prise de parole constatée, à 0 %. Le Minuteur n'a pas d'état Dépassé.

## Méthodes

### Capacités

Évaluer des savoir-faire identifiés. Chaque capacité comporte notamment un identifiant, un nom, un poids dans la catégorie, des commentaires par niveau et une aide à la notation. En correction, conserver son niveau sélectionné ; les résultats de la catégorie sont calculés à partir des capacités renseignées, avec leurs poids.

La catégorie prévoit des commentaires Attention et Dépassé. Le résultat partiel, le niveau calculé et le pourcentage calculé doivent rester distinguables des choix manuels.

### Barème

Attribuer des points à des critères. Chaque critère comporte notamment un nom, un maximum de points, une aide à la notation et un pas d'incrémentation ou de décrémentation. En correction, enregistrer la note attribuée à chaque critère ; un champ vide est distinct d'une note de zéro.

La catégorie prévoit des commentaires Attention et Dépassé. Le résultat partiel est calculé sur les critères renseignés seulement. Les modalités exactes de validation et de calcul restent à préciser.

### Distribution

Mesurer la répartition des occurrences entre les niveaux. Le correcteur incrémente ou décrémente le nombre d'occurrences de chaque niveau ; un compteur ne descend pas sous zéro. Sans occurrence, la catégorie n'a pas de résultat calculé.

Le résultat est fondé sur la moyenne des points associés aux occurrences, et non sur le seul niveau le plus fréquent. Avec trois niveaux, l'exemple de référence est NA = 0, ECA = 1 et A = 2 points. Avec quatre niveaux, retenir des valeurs régulièrement espacées : NA = 0 %, ECA− = 1/3, ECA+ = 2/3 et A = 100 % du maximum. Les seuils de passage déterminent le niveau calculé ; celui-ci ne peut pas être remplacé manuellement. Le pourcentage de notation peut en revanche être ajusté manuellement.

Pour quatre niveaux, les seuils proposés par défaut sont les milieux entre les valeurs : 1/6, 1/2 et 5/6 du maximum, soit environ 16,7 %, 50 % et 83,3 %. Les seuils sont préremplis et modifiables pour chaque catégorie Distribution. Utiliser les valeurs exactes plutôt que les arrondis d'affichage pour les comparaisons.

La catégorie prévoit des commentaires Attention et Dépassé. Le schéma prévoit une commande commune pour passer de l'incrémentation à la décrémentation.

### Compteur

Mesurer la fréquence d'une action : le nombre total commence à zéro ; les commandes permettent de l'incrémenter et de le décrémenter sans descendre sous zéro. Les seuils sont atteints dès que leur valeur est égalée.

Le niveau est déterminé par les seuils, avec possibilité de choix manuel. Le pourcentage calculé progresse proportionnellement au nombre d'occurrences jusqu'à 100 % au seuil A. Exemple : seuil ECA = 2 et seuil A = 4 ; 1 occurrence donne 25 %, 2 donnent 50 %, 3 donnent 75 %, et 4 ou plus donnent 100 %. Le pourcentage n'est pas modifiable au curseur.

Au seuil D, le bouton Dépassé est suggéré par un contour bleu ; un clic le confirme avec un fond bleu. Si le compteur redescend sous le seuil D, Dépassé est automatiquement désactivé, même s'il avait été confirmé. Un commentaire associé est conservé sans rester affiché comme actif et est reproposé lors d'une nouvelle activation.

### Minuteur

Mesurer une durée par élève. Un élève ne peut avoir qu'un minuteur par grille. Le démarrage et la reprise sont manuels ; le temps est conservé entre les interventions.

Quand on quitte la fenêtre de correction d'un élève pour passer à un autre, le minuteur de l'élève quitté est mis en pause. Le minuteur du nouvel élève est démarré ou repris manuellement. Un changement d'onglet dans l'application ne doit pas, en lui-même, mettre le minuteur en pause. Après fermeture ou rechargement du navigateur, restaurer le minuteur en pause ; une fermeture inattendue peut limiter la précision à la dernière sauvegarde disponible.

La grille définit une durée cible et quatre seuils, trop court et trop long. Exemple de classement validé pour une cible de 5 minutes :

| Durée | Niveau calculé |
| --- | --- |
| Moins de 2 min | NA, trop court |
| De 2 min à moins de 4 min | ECA, trop court |
| De 4 min à 6 min incluses | A |
| Plus de 6 min à moins de 8 min | ECA, trop long |
| À partir de 8 min | NA, trop long |

La note varie progressivement selon la durée, indépendamment du niveau. Toute la zone A rapporte 100 %. Une durée nulle correspondant à une absence de prise de parole constatée rapporte 0 %. Une durée en zone NA peut rapporter des points.

Exemple de courbe accepté pour cette cible et ces seuils : 0 s = 0 % ; 10 s = 5 % ; 1 min 50 s ≈ 30 % ; 2 min = 33 % ; de 4 à 6 min = 100 % ; 8 min = 33 % ; 9 min 50 s = 5 % ; 10 min et plus = 0 %. Entre les repères, utiliser dans cet exemple une progression linéaire par portions. Le traitement détaillé des cas sans données et des éventuels arrondis reste à préciser.

Une courbe automatique commune est le point de départ ; chaque grille peut la personnaliser avec un graphique de durée en abscisse et de pourcentage en ordonnée, des poignées et des champs numériques adaptés à la tablette. La zone A reste un plateau à 100 % et zéro seconde correspond à 0 %. Enregistrer les points de la courbe ; des segments linéaires sont envisagés. Une courbe arrondie nécessiterait de définir son interpolation. La formule automatique générale pour des seuils et durées différents de l'exemple reste à définir.

### Bonus

Ajouter des points après le calcul de la moyenne. Chaque catégorie Bonus a un maximum propre ; un plafond global s'applique également à la somme des bonus. Le pas d'incrémentation ou de décrémentation et des commentaires de valorisation figurent dans la définition.

Les attributions restent enregistrées et visibles même si leur somme dépasse le plafond global : seul le montant ajouté à la note est plafonné. La note finale reste plafonnée à 20/20. Les bonus ne permettent pas, à eux seuls, de proposer une note sans moyenne issue d'au moins une catégorie obligatoire renseignée.

Les anciens points D des capacités doivent être convertis en un bonus regroupé, en conservant le détail de leurs origines. Les modalités techniques de migration et le maintien des résultats historiques doivent être vérifiés avant application.

## Sauvegarde, compatibilité et fiche

- Préserver les CSV existants et les corrections déjà sauvegardées ; prévoir une migration versionnée et vérifier les notes avant et après conversion. La compatibilité d'import exacte reste à définir.
- La sauvegarde et la restauration du devoir sur fichier sont prévues après les nouvelles méthodes. La sauvegarde locale actuelle ne synchronise pas les appareils et n'est pas un export de devoir.
- La fiche PDF ou imprimable doit comporter un détail adapté à chaque méthode, avec les résultats et commentaires pertinents. Le contenu exact visible par l'élève reste à préciser.
- Les deux vues de correction doivent partager les mêmes données et calculs. Le passage rapide entre élèves et les corrections en cours doivent être vérifiés dans les deux vues.

## Points encore ouverts

- Schéma JSON versionné, validation, identifiants stables, conversion des CSV et migration des données locales.
- Formule automatique générale de la courbe du Minuteur pour des seuils non symétriques et différents de l'exemple, et comportement précis de l'éditeur de courbe.
- Calculs et seuils exacts des autres méthodes, notamment Barème et catégories à quatre niveaux ; comportement des niveaux manuels lorsque les données changent.
- Définition précise du traitement du compteur initial à zéro, notamment pour la note provisoire d'un élève encore non observé.
- Comportement des fenêtres lors d'un changement d'onglet dans l'application, pour respecter à la fois la pause à la sortie d'une fenêtre d'élève et l'absence de pause due au seul changement d'onglet.
- Conditions de réactivation de Dépassé sous le seuil D du Compteur et présentation de son commentaire conservé.
- Détail des informations affichées sur le PDF, règles de confidentialité et cas de corrections incomplètes.
- Traitement des plafonds et de l'origine des anciens bonus lors de la migration, sans perte de données ni modification involontaire des notes.
