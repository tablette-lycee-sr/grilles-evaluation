# Projet : grilles d'évaluation en histoire-géographie

## Objectif
Permettre à un enseignant de corriger rapidement, sur tablette, des travaux d'élèves (écrit, oral, débat) à partir de **grilles de compétences** personnalisables, et d'obtenir une note, des commentaires et une fiche individuelle.

## Utilisateur et contexte d'usage
- Un enseignant (propriétaire du projet), en classe ou chez lui, sur **tablette** ; aussi sur ordinateur.
- Les données des élèves (noms, classes, PAP, corrections) sont **personnelles** : elles restent sur l'appareil (IndexedDB). Les photos ne sont pas sauvegardées.
- Application statique sur GitHub Pages : pas de serveur, pas de compte, pas de synchronisation.

## Contraintes
- Zéro dépendance d'exécution et zéro appel réseau (usage possible hors ligne, protection des données).
- Interface en français ; ergonomie tactile ; portrait et paysage.
- Compatibilité : les corrections déjà enregistrées et les fichiers existants ne doivent jamais être perdus.

## Périmètre actuel
Création d'un devoir à partir d'une grille JSON · éditeur de grilles · groupes d'élèves (CSV) · trombinoscope · correction en grille complète ou en fenêtre individuelle · six méthodes de correction · sauvegarde locale automatique · fiche imprimable.

## Hors périmètre (pour l'instant)
Synchronisation entre appareils · comptes utilisateurs · export des notes vers un logiciel de vie scolaire · import automatique des anciennes grilles CSV.

## Vocabulaire
| Terme | Sens |
|---|---|
| **Niveau** | Résultat d'une évaluation : **NA** (non acquis), **ECA** (en cours d'acquisition, ou **ECA-** / **ECA+** à quatre niveaux), **A** (acquis). |
| **D** | « Dépassé » : bonification indépendante des niveaux, signalée par le correcteur. |
| **Attention** | Avertissement sur une catégorie (symbole !), indépendant des niveaux et sans effet sur la note. |
| **Partie / catégorie / sous-catégorie / capacité / critère** | Hiérarchie d'une grille. Une catégorie a une **méthode** ; ses éléments sont des capacités (méthode Capacités) ou des critères (méthode Barème). |
| **Méthode** | Façon d'évaluer une catégorie : Capacités, Barème, Distribution, Compteur, Minuteur, Bonus. |
| **Coefficient** | Poids d'une catégorie dans la note. « **NN** » = non noté (catégorie exclue de la note). |
| **Curseur calculé / manuel / fantôme** | Le calcul automatique place un curseur ; le correcteur peut le remplacer (curseur manuel, plein) ; la valeur calculée reste visible (fantôme). |
| **Fiche** | Document imprimable ou PDF récapitulant la correction d'un élève. |
