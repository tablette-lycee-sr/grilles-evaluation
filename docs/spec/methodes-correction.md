# Méthodes de correction : décisions et points à préciser

Document de travail établi à partir du schéma des six méthodes fourni et des échanges avec le concepteur de l'application. Il distingue les décisions prises des détails qui restent à définir. Aucun développement n'est supposé réalisé du seul fait de figurer ici.

## Objectif et périmètre

Permettre, dans une même grille, des catégories utilisant différentes méthodes de correction, notamment pour les travaux écrits, les exposés et les débats. Adapter la définition des grilles, la correction, la sauvegarde, le calcul des résultats et la fiche imprimable ou PDF.

La hiérarchie de référence est : degré 1, Partie ; degré 2, Catégorie ; degré 3, Sous-catégorie ; degré 4, Capacité. Les noms peuvent évoluer, mais les degrés restent les références du parent au dernier enfant. Pour la méthode Capacités, les sous-catégories sont facultatives : une catégorie peut contenir des capacités directement ou les regrouper dans des sous-catégories. Certaines méthodes n'utilisent pas tous ces degrés.

Les grilles utilisées à l'avenir seront au format JSON versionné ; son schéma exact reste à définir. Les anciennes grilles CSV ne seront pas réutilisées telles quelles et leur import automatique n'est plus prévu. Les fichiers CSV existants doivent néanmoins être préservés. La définition d'une grille et les corrections individuelles sont à distinguer.

Chaque grille est définie par un JSON autonome contenant les éléments nécessaires à sa définition et à ses calculs, notamment les catégories, paramètres, commentaires et éventuelle courbe du Minuteur. Les corrections des élèves restent séparées de ce fichier.

Le JSON doit être lisible, documenté et modifiable dans un éditeur de texte. La création et la modification des grilles doivent aussi être possibles dans l'application : l'éditeur général de grilles fait partie du même chantier que les nouvelles méthodes, en plus de l'éditeur de courbe du Minuteur.

Les parties, catégories et éléments corrigés portent des identifiants uniques et stables enregistrés dans le JSON. Changer un titre ne change pas l'identifiant et ne doit pas détacher les corrections de leur élément. Un éventuel éditeur de grille peut générer ces identifiants ; ils doivent aussi être présents dans une grille rédigée manuellement. L'ordre des éléments dans les listes JSON détermine leur ordre d'affichage.

Les réglages qui influencent les calculs sont enregistrés explicitement dans le JSON, y compris lorsqu'ils reprennent les valeurs proposées par défaut. D'autres informations peuvent bénéficier de valeurs par défaut.

Les pourcentages du JSON sont exprimés sur une échelle de 0 à 100 : par exemple, 25 signifie 25 %. Les seuils de niveau de Capacités, Barème et Distribution sont des pourcentages entiers, y compris lorsqu'ils sont personnalisés : pour quatre niveaux, les valeurs par défaut 17 %, 50 % et 83 % remplacent les milieux fractionnaires exacts. Cette approximation des seuils ne signifie pas que les résultats intermédiaires sont arrondis avant comparaison ou calcul de la note.

Les pourcentages calculés des catégories sont affichés à deux décimales. Le calcul du niveau et de la note utilise la valeur non arrondie, même lorsqu'un résultat affiché est très proche d'un seuil.

Pour Capacités et Distribution, si une valeur de niveau change dans l'éditeur de grille, les seuils encore automatiques sont recalculés à partir des milieux entre les valeurs adjacentes, arrondis à des pourcentages entiers. Les seuils déjà personnalisés restent inchangés. Le JSON conserve les valeurs des seuils ; un seuil égal à la valeur par défaut est considéré comme automatique, et une valeur différente comme personnalisée. Cette déduction ne permet pas de fixer durablement un seuil égal au défaut. En cas de modification directe du JSON, les valeurs écrites dans le fichier font foi : il faut également modifier les seuils si l'on souhaite les changer, car leur origine ne peut pas toujours être déduite sans l'ancien état.

La présentation générale validée utilise des noms lisibles et des listes de parties contenant des catégories. Chaque catégorie porte ses données communes et celles de sa méthode : par exemple, une catégorie Compteur comporte son identifiant, son titre, sa méthode, son statut d'évaluation, sa prise en compte, son coefficient, ses niveaux et ses seuils. L'exemple discuté est simplifié et ne constitue pas encore le schéma définitif.

Le devoir reste lié à sa grille JSON : les changements de la grille peuvent être appliqués à un devoir déjà commencé. Pour l'instant, le correcteur demande la relecture et confirme la mise à jour après avoir été averti de ses effets ; une nouvelle sélection du fichier peut être nécessaire selon les capacités et autorisations du navigateur. Les corrections existantes doivent être préservées ; le traitement des éléments supprimés ou dont la méthode change reste à préciser.

Un coefficient ajusté pour un devoir est enregistré pour ce devoir uniquement ; il ne modifie pas automatiquement la grille JSON de référence. L'éditeur de grille permet séparément de modifier cette référence.

## Données communes et notation

- Une catégorie comporte notamment un nom, un ordre, une méthode, ses commentaires de niveau et les informations de fonctionnement de la méthode.
- Les catégories Capacités, Barème, Distribution, Compteur et Minuteur utilisent un coefficient dans la moyenne. Seules les catégories Bonus ajoutent des points après la moyenne.
- Chaque catégorie porte un **statut de notation** adapté pour chaque élève (D-014) : **notée**, **NN** (évaluée mais non notée : reste visible et renseignable à titre indicatif, sans contribuer à la note), **2(+)** (notée seulement si cette inclusion augmente la note finale) ou **NE** (non évaluée, non notée : contrôles désactivés et fiche réduite à son titre). Le statut défini dans la grille sert de valeur de départ ; cette adaptation relève de sa correction individuelle.
- Une catégorie évaluée est obligatoire ou facultative. Une catégorie obligatoire sans donnée est provisoirement exclue du calcul, avec indication que la note est incomplète.
- Pour les méthodes Capacités et Barème, un résultat partiel est calculé sur les éléments renseignés seulement. Une valeur non renseignée est distincte d'un zéro explicite.
- Parmi les catégories facultatives renseignées, retenir la combinaison qui maximise la moyenne avec les catégories obligatoires. Les catégories portant le statut **2(+)** suivent la même règle. Il faut au moins une catégorie obligatoire avec un résultat pour proposer une note ; des bonus seuls ne suffisent pas.
- Une catégorie peut employer trois niveaux, NA/ECA/A, ou quatre niveaux, NA/ECA−/ECA+/A. Le choix se fait par catégorie.
- Pour un niveau de catégorie ou de capacité, la grille peut proposer plusieurs commentaires ; le correcteur en retient au maximum un. Le premier texte est présélectionné lorsque le niveau est retenu pour la première fois ; le correcteur peut choisir un autre texte ou aucun. Lorsqu'il revient à un niveau déjà utilisé, son choix précédent est retrouvé, y compris le choix explicite d'aucun commentaire.
- Niveau et pourcentage de notation sont indépendants : le niveau retenu ne déplace pas automatiquement le curseur, et le curseur ne modifie pas automatiquement le niveau. Les modalités de sélection du niveau dépendent de la méthode.
- La note finale est plafonnée à 20/20. La note proposée est affichée à deux décimales, sans arrondir les calculs intermédiaires ; le correcteur conserve la possibilité de saisir sa note finale.

## Curseurs calculés et manuels

Pour Capacités, Barème, Distribution et Minuteur, le correcteur peut modifier le pourcentage retenu. Lorsque le curseur est manuel, ce choix reste prioritaire si les données changent ; le calcul automatique continue à être actualisé séparément.

Un curseur fantôme, affiché en transparence derrière le curseur manuel et devant la réglette, montre la valeur automatique actualisée. S'il n'existe pas de résultat calculé, il n'y a pas de fantôme. Un clic sur le curseur manuel permet de revenir au calcul automatique. Prévoir une distinction lisible et un accès équivalent au clavier et au toucher.

Le niveau manuel et le curseur manuel reviennent séparément au calcul automatique. Pour Capacités, Barème, Compteur et Minuteur, un niveau choisi manuellement reste retenu lorsque les données changent ; le nouveau niveau calculé reste identifiable. La méthode Distribution fait exception pour le niveau : celui-ci est calculé et ne peut pas être choisi manuellement. La désactivation de Dépassé sous le seuil D du Compteur suit sa règle particulière.

Pour le Compteur, le pourcentage est calculé sans déplacement manuel du curseur : afficher un petit trait blanc vertical non saisissable plutôt qu'une poignée. Le niveau peut rester choisi manuellement. La catégorie Bonus n'utilise pas ce système de curseur fantôme.

## Attention et Dépassé

Attention et Dépassé signalent des états hors norme, distincts du calcul de la note. Leur sélection est manuelle, sauf règles de suggestion et de désactivation du Compteur précisées ci-dessous. Pour chaque état, le correcteur peut choisir au maximum un commentaire proposé dans la grille ; un commentaire justificatif n'est pas obligatoire en règle générale.

Pour le Minuteur, Attention est activé manuellement pour constater que l'élève n'a pas parlé. Son activation affiche automatiquement le commentaire pré-saisi dans la grille, notamment dans les vues de correction et sur la fiche. Dans ce cas, un minuteur jamais démarré passe de non renseigné à une absence de prise de parole constatée, à 0 %. Si un pourcentage manuel existait, cette activation le désactive et rétablit le calcul automatique à 0 %. Démarrer le minuteur désactive automatiquement Attention et son commentaire d'absence ; la durée devient la donnée de calcul. Le Minuteur n'a pas d'état Dépassé.

Si une durée positive est déjà enregistrée, cliquer sur Attention propose de réinitialiser cette durée puis d'activer Attention. La remise à zéro et l'activation ne sont effectuées qu'après confirmation ; en cas d'annulation, la durée reste inchangée.

## Méthodes

### Capacités

Évaluer des savoir-faire identifiés. Chaque capacité comporte notamment un identifiant, un nom, un poids dans la catégorie, des commentaires par niveau et une aide à la notation. En correction, conserver son niveau sélectionné ; les résultats de la catégorie sont calculés à partir des capacités renseignées, avec leurs poids.

La catégorie prévoit des commentaires Attention et Dépassé. Le résultat partiel, le niveau calculé et le pourcentage calculé doivent rester distinguables des choix manuels.

Pour quatre niveaux, les valeurs par défaut sont NA = 0 %, ECA− = 33 %, ECA+ = 67 % et A = 100 %. La moyenne est pondérée par les poids des capacités renseignées. Les seuils de niveau par défaut sont 25 % et 75 % pour trois niveaux, ou 17 %, 50 % et 83 % pour quatre niveaux ; ils sont modifiables pour chaque catégorie Capacités. Le pourcentage saisi manuellement reste indépendant du niveau.

Toutes les valeurs de notation des niveaux sont préremplies et modifiables pour chaque catégorie Capacités, y compris NA et A, dont les valeurs par défaut sont 0 % et 100 %. Elles sont distinctes des seuils qui déterminent le niveau calculé.

Si un niveau de catégorie a été choisi manuellement, il reste retenu lorsqu'une capacité est modifiée, jusqu'au retour volontaire au calcul automatique. Le nouveau niveau calculé reste identifiable.

### Barème

Attribuer des points à des critères. Chaque critère comporte notamment un nom, un maximum de points, une aide à la notation et un pas d'incrémentation ou de décrémentation. En correction, enregistrer la note attribuée à chaque critère ; un champ vide est distinct d'une note de zéro.

Une note inférieure à zéro est ramenée à zéro ; une note supérieure au maximum du critère est ramenée à ce maximum. Le pas s'applique aux boutons d'incrémentation et de décrémentation, mais ne limite pas les valeurs saisies au clavier.

La catégorie prévoit des commentaires Attention et Dépassé. Le résultat est la somme des points obtenus rapportée à la somme des maximums des seuls critères renseignés ; il est partiel tant que tous les critères ne sont pas renseignés. Le calcul conserve la précision disponible ; les résultats sont arrondis uniquement à l'affichage, selon une précision restant à définir.

Les seuils du niveau calculé sont préremplis et modifiables pour chaque catégorie Barème. Par défaut, ils sont de 25 % et 75 % pour trois niveaux, ou 17 %, 50 % et 83 % pour quatre niveaux. Les résultats calculés ne sont pas arrondis avant comparaison aux seuils.

### Distribution

Mesurer la répartition des occurrences entre les niveaux. Le correcteur incrémente ou décrémente le nombre d'occurrences de chaque niveau ; un compteur ne descend pas sous zéro. Sans occurrence, la catégorie n'a pas de résultat calculé.

Le résultat est fondé sur la moyenne des points associés aux occurrences, et non sur le seul niveau le plus fréquent. Avec trois niveaux, l'exemple de référence est NA = 0, ECA = 1 et A = 2 points. Avec quatre niveaux, les valeurs par défaut sont NA = 0 %, ECA− = 33 %, ECA+ = 67 % et A = 100 % du maximum. Toutes les valeurs de notation des niveaux, y compris NA et A, sont modifiables pour chaque catégorie Distribution. Les seuils de passage, distincts de ces valeurs, déterminent le niveau calculé ; celui-ci ne peut pas être remplacé manuellement. Le pourcentage de notation peut en revanche être ajusté manuellement.

Les seuils proposés par défaut sont de 25 % et 75 % pour trois niveaux, ou 17 %, 50 % et 83 % pour quatre niveaux. Les seuils sont préremplis et modifiables pour chaque catégorie Distribution. Les résultats calculés ne sont pas arrondis avant comparaison aux seuils.

La catégorie prévoit des commentaires Attention et Dépassé. Le schéma prévoit une commande commune pour passer de l'incrémentation à la décrémentation.

### Compteur

Mesurer la fréquence d'une action : le nombre total commence à zéro ; ce zéro constitue immédiatement un résultat et contribue à la note si la catégorie est prise en compte, même avant la première manipulation. Les commandes permettent de l'incrémenter et de le décrémenter sans descendre sous zéro. Les seuils sont atteints dès que leur valeur est égalée.

Le niveau est déterminé par les seuils, avec possibilité de choix manuel. Le pourcentage calculé progresse proportionnellement au nombre d'occurrences jusqu'à 100 % au seuil A. Exemple : seuil ECA = 2 et seuil A = 4 ; 1 occurrence donne 25 %, 2 donnent 50 %, 3 donnent 75 %, et 4 ou plus donnent 100 %. Le pourcentage n'est pas modifiable au curseur.

Pour quatre niveaux, la grille définit des nombres distincts et croissants pour les seuils ECA−, ECA+ et A. Exemple : avec les seuils 2, 3 et 4, une occurrence donne NA, deux donnent ECA−, trois donnent ECA+ et quatre donnent A. Cette répartition ne modifie pas le calcul du pourcentage.

Au seuil D, le bouton Dépassé est suggéré par un contour bleu ; un clic le confirme avec un fond bleu. Le correcteur peut aussi activer Dépassé manuellement avant que le seuil soit atteint. Toute diminution laissant le compteur sous le seuil D désactive automatiquement Dépassé, même si celui-ci avait été activé alors que le compteur était déjà sous le seuil. Un commentaire associé est conservé sans rester affiché comme actif et est reproposé lors d'une nouvelle activation.

### Minuteur

Mesurer une durée par élève. Les durées de la grille JSON sont des nombres exprimés en secondes ; l'application les présente en minutes et secondes. Une grille contient au maximum une catégorie Minuteur ; chaque élève y possède son propre temps. Le démarrage et la reprise sont manuels ; le temps est conservé entre les interventions.

Quand on ferme explicitement la fenêtre de correction d'un élève ou qu'on passe à un autre élève, le minuteur de l'élève quitté est mis en pause. Le minuteur du nouvel élève est démarré ou repris manuellement. Un changement d'onglet dans l'application peut masquer la correction, mais ne doit pas être considéré comme une sortie de l'élève : le minuteur continue. Après fermeture ou rechargement du navigateur, restaurer le minuteur en pause ; une fermeture inattendue peut limiter la précision à la dernière sauvegarde disponible.

La grille définit une durée cible et quatre seuils, trop court et trop long. Exemple de classement validé pour une cible de 5 minutes :

| Durée | Niveau calculé |
| --- | --- |
| Moins de 2 min | NA, trop court |
| De 2 min à moins de 4 min | ECA, trop court |
| De 4 min à 6 min incluses | A |
| Plus de 6 min à moins de 8 min | ECA, trop long |
| À partir de 8 min | NA, trop long |

Pour une catégorie à quatre niveaux, chacune des deux zones ECA est divisée en ECA− et ECA+. Les deux séparations sont préremplies au milieu de leur zone et modifiables dans la grille. La partie la plus proche de la zone A est ECA+ ; la partie la plus éloignée est ECA−. Ces séparations déterminent le niveau sans modifier la courbe de points.

Les seuils incohérents sont refusés avec une explication avant validation de la grille, notamment si leur ordre est incorrect ou si la durée cible se trouve hors de la zone A.

La note varie progressivement selon la durée, indépendamment du niveau. Toute la zone A rapporte 100 %. Une durée nulle correspondant à une absence de prise de parole constatée rapporte 0 %. Une durée en zone NA peut rapporter des points.

Exemple de courbe accepté pour cette cible et ces seuils : 0 s = 0 % ; 10 s = 5 % ; 1 min 50 s ≈ 30 % ; 2 min = 33 % ; de 4 à 6 min = 100 % ; 8 min = 33 % ; 9 min 50 s = 5 % ; 10 min et plus = 0 %. Entre les repères, utiliser dans cet exemple une progression linéaire par portions. Le traitement détaillé des cas sans données et des éventuels arrondis reste à préciser.

Une courbe automatique commune est le point de départ ; chaque grille peut la personnaliser avec un graphique de durée en abscisse et de pourcentage en ordonnée, des poignées et des champs numériques adaptés à la tablette. La zone A reste un plateau à 100 % et zéro seconde correspond à 0 %. Enregistrer les points de la courbe personnalisée ; celle-ci est lissée et passe par les points choisis. La courbe automatique initiale reste définie par segments linéaires.

La courbe personnalisée est comprise entre 0 % et 100 % ; elle ne diminue pas avant la zone A et n'augmente pas après cette zone. Les paliers sont autorisés.

Si les seuils définissant la courbe sont modifiés après personnalisation, prévenir que la courbe sera remplacée par une nouvelle courbe automatique adaptée aux seuils et demander confirmation avant ce remplacement. Les séparations entre ECA− et ECA+ ne modifient pas la courbe et ne déclenchent pas son remplacement.

La courbe automatique initiale est linéaire par portions, avec les repères suivants :

- À 0 seconde : 0 % ; à un douzième du seuil NA trop court : 5 % ; au seuil NA trop court : 33 %.
- Du seuil d'entrée dans la zone A au seuil de sortie de cette zone : 100 %.
- Au seuil NA trop long : 33 %. La durée supplémentaire jusqu'à 0 % est égale à la largeur de la zone ECA trop longue, c'est-à-dire l'écart entre le seuil NA trop long et la sortie de la zone A.
- Entre le seuil NA trop long et cette durée à 0 %, placer le repère à 5 % à un douzième de cet intervalle avant la durée à 0 %. Au-delà, le résultat reste à 0 %.

Exemple asymétrique accepté : cible 5 min, seuils 1 min et 4 min côté court, 6 min et 9 min côté long. Les repères sont 0 s = 0 %, 5 s = 5 %, 1 min = 33 %, de 4 à 6 min = 100 %, 9 min = 33 %, 11 min 45 s = 5 %, et 12 min ou plus = 0 %.

### Bonus

Ajouter des points après le calcul de la moyenne. Chaque catégorie Bonus a un maximum propre ; un plafond global s'applique également à la somme des bonus. Le pas d'incrémentation ou de décrémentation et des commentaires de valorisation figurent dans la définition. Un commentaire justificatif est facultatif, même lorsque des points sont attribués.

Les attributions restent enregistrées et visibles même si leur somme dépasse le plafond global : seul le montant ajouté à la note est plafonné. La note finale reste plafonnée à 20/20. Les bonus ne permettent pas, à eux seuls, de proposer une note sans moyenne issue d'au moins une catégorie obligatoire renseignée.

Si les anciennes corrections sont reprises, leurs anciens points D des capacités doivent être convertis en un bonus regroupé, en conservant le détail de leurs origines. Les modalités de cette éventuelle reprise et le maintien des résultats historiques restent à définir avant application.

## Sauvegarde, compatibilité et fiche

- Préserver les fichiers CSV existants et les corrections déjà sauvegardées ; les nouvelles grilles seront en JSON, sans import automatique des anciennes grilles CSV.
- Si les corrections locales sont migrées, conserver une copie de l'ancien état et vérifier la migration avant activation. En cas d'échec, ne pas écraser la copie. Cette copie locale ne remplace pas une sauvegarde sur fichier et peut disparaître avec les données du navigateur.
- Les questions sur le traitement des imports et des fichiers partiellement invalides sont suspendues à la demande du concepteur ; leur portée reste à préciser avant mise en œuvre.
- La sauvegarde et la restauration du devoir sur fichier sont prévues après les nouvelles méthodes. La sauvegarde locale actuelle ne synchronise pas les appareils et n'est pas un export de devoir.
- La fiche PDF ou imprimable doit comporter un détail adapté à chaque méthode, avec les résultats et commentaires pertinents. Le contenu exact visible par l'élève reste à préciser.
- Les deux vues de correction doivent partager les mêmes données et calculs. Le passage rapide entre élèves et les corrections en cours doivent être vérifiés dans les deux vues.

## Points encore ouverts

- Schéma JSON versionné et éventuelle reprise des corrections locales. Les questions relatives aux imports sont suspendues.
- Contraintes détaillées de validation des seuils du Minuteur et comportement précis de l'éditeur de courbe.
- Calculs et seuils exacts restants des autres méthodes ; précision de l'affichage.
- Détail des informations affichées sur le PDF, règles de confidentialité et cas de corrections incomplètes.
- Traitement des plafonds et de l'origine des anciens bonus lors de la migration, sans perte de données ni modification involontaire des notes.
