# grilles-evaluation

Grilles d'évaluation en Histoire-géographie

## Sauvegarde locale

Le devoir actif, sa grille et ses coefficients, le groupe d'élèves et les corrections individuelles sont enregistrés automatiquement dans IndexedDB sur l'appareil et le navigateur utilisés. Les photos ne sont pas enregistrées et doivent être associées à nouveau après fermeture ou rechargement de la page.

Cette sauvegarde ne synchronise pas les appareils et peut disparaître si les données du navigateur sont effacées. Elle contient des données personnelles et ne remplace pas une sauvegarde sur fichier, qui reste à développer. Évitez les appareils partagés et respectez les règles de protection des données de l'établissement.

Un seul devoir et un seul groupe sont conservés comme espace de travail actif. Leur remplacement ou la suppression d'élèves efface les corrections concernées après confirmation. Si un autre onglet modifie la sauvegarde, un avertissement signale que les nouvelles modifications de l'onglet courant ne sont plus enregistrées.

## Groupes d'élèves

Dans le sous-menu Élèves, l'enregistrement télécharge un fichier CSV contenant uniquement les colonnes `Nom`, `Prénom`, `Classe` et `PAP`. Le chargement accepte ce format et reprend le nom du groupe depuis le nom du fichier. Le fichier peut aussi représenter un groupe vide. Le nom est adapté si certains caractères ne sont pas autorisés dans un nom de fichier.

Le CSV ne contient ni photos ni données propres au devoir (sous-groupe, sujet, remarque, notes et corrections). La création d'un nouveau devoir réinitialise ces données ; le chargement d'un groupe remplace le groupe actif et ses corrections après confirmation. Le fichier contenant des noms et des informations PAP, conservez-le dans un emplacement approprié aux données personnelles.

La réinitialisation de la liste efface après confirmation le groupe actif, ses élèves et leurs corrections du devoir actif, sans modifier les fichiers enregistrés. Il faut ensuite créer ou charger un groupe. Le nom d'un groupe actif peut être modifié en cliquant dessus.

## Modes de correction

Dans le sous-menu Correction, le choix du mode détermine ce qui s'ouvre au clic sur un portrait : la grille complète ou une fenêtre de correction par catégories. La fenêtre affiche toutes les catégories de la grille, avec un défilement lorsque nécessaire. Un clic à l'extérieur ou la touche Échap la ferme et conserve les évaluations et la remarque de l'élève. Les deux modes utilisent les mêmes données ; le mode choisi est mémorisé localement.

## Options au niveau des catégories

Le CSV peut contenir des lignes `categorie` pour déclarer un identifiant stable et `coefficient_categorie`. Les lignes `capacite` peuvent renseigner `categorie_id` pour référencer cette catégorie sans dépendre de son titre. Les anciennes colonnes `avertissement_autorise` et `depasse_autorise` sont ignorées : les boutons Avertissement et Dépassé sont disponibles pour toutes les catégories évaluables.

Les lignes `motif` utilisent `categorie_id` pour référencer la catégorie, `id` comme identifiant stable et `titre` comme texte. Les menus Avertissement et Dépassé utilisent pour le moment des motifs fictifs, en attendant la définition de leur stockage dans le CSV. Les choix d'avertissement, de dépassement et de motif restent distincts des niveaux de capacité et ne modifient pas la note.

## Grille JSON d'exemple

Le fichier `grille-exemple-oral.json` propose une grille autonome illustrant les six méthodes de correction. Il ne contient aucune correction d'élève. Lors de la création d'un devoir, une grille peut être choisie dans le catalogue officiel ou chargée depuis un fichier JSON sur l'appareil.

`versionFormat` identifie la version du format ; `metadonnees.version` identifie celle de la grille. Les champs de `metadonnees` sont facultatifs : ils proposent notamment une date de création, un auteur (`null` lorsqu'il n'est pas renseigné), une langue, des étiquettes et une description. Les identifiants restent stables lorsque les titres changent ; l'ordre des listes détermine l'affichage.

Les pourcentages utilisent l'échelle de 0 à 100 et les durées du Minuteur sont exprimées en secondes. Les commentaires proposés pour un niveau sont des listes : le premier est présélectionné, mais le correcteur peut en choisir un autre ou aucun. Les données des méthodes et les choix du correcteur sont sauvegardés localement avec chaque correction, séparément de la définition de la grille.

## Éditeur de grille

Le bouton « Créer une grille de correction » du sous-menu Devoir ouvre l'éditeur. Il permet de créer des parties, des catégories et leurs éléments, de choisir parmi les six méthodes et de renseigner leurs paramètres et commentaires. Le Minuteur propose un éditeur de courbe ; l'éditeur peut également ouvrir une grille JSON existante pour la modifier.

Les poignées déplacent les éléments à l'intérieur des niveaux compatibles avec leur méthode ; au clavier, utiliser Alt avec les flèches. L'ordre des capacités et des sous-catégories est conservé dans le fichier exporté. La barre verticale permet d'exporter la grille après validation ; elle peut ensuite être sélectionnée lors de la création d'un devoir. Une grille non exportée est conservée seulement pendant la session et sera perdue au rechargement de la page.

Les tests peuvent être lancés avec `node --test` depuis une copie locale du dépôt. Le workspace GitHub virtuel ne peut pas être lu directement par Node.
