# grilles-evaluation

Grilles d'évaluation en Histoire-géographie

## Options au niveau des catégories

Le CSV peut contenir des lignes `categorie` pour déclarer un identifiant stable et `coefficient_categorie`. Les lignes `capacite` peuvent renseigner `categorie_id` pour référencer cette catégorie sans dépendre de son titre. Les anciennes colonnes `avertissement_autorise` et `depasse_autorise` sont ignorées : les boutons Avertissement et Dépassé sont disponibles pour toutes les catégories évaluables.

Les lignes `motif` utilisent `categorie_id` pour référencer la catégorie, `id` comme identifiant stable et `titre` comme texte. Les menus Avertissement et Dépassé utilisent pour le moment des motifs fictifs, en attendant la définition de leur stockage dans le CSV. Les choix d'avertissement, de dépassement et de motif restent distincts des niveaux de capacité et ne modifient pas la note.
