# grilles-evaluation

Grilles d'évaluation en Histoire-géographie

## Sauvegarde locale

Le devoir actif, sa grille et ses coefficients, le groupe d'élèves et les corrections individuelles sont enregistrés automatiquement dans IndexedDB sur l'appareil et le navigateur utilisés. Les photos ne sont pas enregistrées et doivent être associées à nouveau après fermeture ou rechargement de la page.

Cette sauvegarde ne synchronise pas les appareils et peut disparaître si les données du navigateur sont effacées. Elle contient des données personnelles et ne remplace pas une sauvegarde sur fichier, qui reste à développer. Évitez les appareils partagés et respectez les règles de protection des données de l'établissement.

Un seul devoir et un seul groupe sont conservés comme espace de travail actif. Leur remplacement ou la suppression d'élèves efface les corrections concernées après confirmation. Si un autre onglet modifie la sauvegarde, un avertissement signale que les nouvelles modifications de l'onglet courant ne sont plus enregistrées.

## Groupes d'élèves

Dans le sous-menu Élèves, l'enregistrement télécharge un fichier CSV contenant uniquement les colonnes `Nom`, `Prénom`, `Classe` et `PAP`. Le chargement accepte ce format et reprend le nom du groupe depuis le nom du fichier. Le fichier peut aussi représenter un groupe vide. Le nom est adapté si certains caractères ne sont pas autorisés dans un nom de fichier.

Le CSV ne contient ni photos ni données propres au devoir (sous-groupe, sujet, remarque, notes et corrections). La création d'un nouveau devoir réinitialise ces données ; le chargement d'un groupe remplace le groupe actif et ses corrections après confirmation. Le fichier contenant des noms et des informations PAP, conservez-le dans un emplacement approprié aux données personnelles.

## Modes de correction

Dans le sous-menu Correction, le choix du mode détermine ce qui s'ouvre au clic sur un portrait : la grille complète ou une fenêtre de correction par catégories. La fenêtre affiche toutes les catégories de la grille, avec un défilement lorsque nécessaire. Un clic à l'extérieur ou la touche Échap la ferme et conserve les évaluations et la remarque de l'élève. Les deux modes utilisent les mêmes données ; le mode choisi est mémorisé localement.

## Options au niveau des catégories

Le CSV peut contenir des lignes `categorie` pour déclarer un identifiant stable et `coefficient_categorie`. Les lignes `capacite` peuvent renseigner `categorie_id` pour référencer cette catégorie sans dépendre de son titre. Les anciennes colonnes `avertissement_autorise` et `depasse_autorise` sont ignorées : les boutons Avertissement et Dépassé sont disponibles pour toutes les catégories évaluables.

Les lignes `motif` utilisent `categorie_id` pour référencer la catégorie, `id` comme identifiant stable et `titre` comme texte. Les menus Avertissement et Dépassé utilisent pour le moment des motifs fictifs, en attendant la définition de leur stockage dans le CSV. Les choix d'avertissement, de dépassement et de motif restent distincts des niveaux de capacité et ne modifient pas la note.
