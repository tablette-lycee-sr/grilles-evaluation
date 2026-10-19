# grilles-evaluation

Grilles d'évaluation en Histoire-géographie

## Options au niveau des catégories

Le CSV peut contenir des lignes `categorie` pour déclarer les options de catégorie. La colonne `id` porte l'identifiant stable, `avertissement_autorise` et `depasse_autorise` activent les contrôles correspondants, et `coefficient_categorie` reste le coefficient de calcul. Les lignes `capacite` peuvent renseigner `categorie_id` pour référencer cette catégorie sans dépendre de son titre. Ces colonnes sont facultatives : un ancien CSV continue de se charger avec les options désactivées et le rattachement historique par titres.

Les lignes `motif` définissent les commentaires généraux proposés dans la liste de la catégorie. Leur colonne `categorie_id` référence l'identifiant de la ligne `categorie`, `id` est l'identifiant stable du motif et `titre` son texte affiché. Les choix d'avertissement, de dépassement et de motif sont conservés séparément des niveaux de capacité ; ils ne modifient pas la note.
