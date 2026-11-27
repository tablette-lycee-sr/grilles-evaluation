# Sauvegarde et restauration du devoir sur fichier

Spec T-03 · #6 · à valider par l'utilisateur avant tout code (labels `spec-needed`, `sensible`).

## Objectif

Enregistrer le devoir complet (grille, coefficients, devoir, élèves, corrections) dans un **fichier local**, et le recharger **sans perte** — sur le même appareil (après effacement du navigateur, archivage) ou sur un autre appareil du même enseignant. La sauvegarde locale (IndexedDB, `docs/spec/donnees.md`) reste le mécanisme courant de session ; le fichier est le moyen de conserver et de transporter un devoir.

## Format du fichier

- Un fichier **JSON**, encodage UTF-8, extension proposée **`.devoir.json`** (reconnaissable au premier coup d'œil, reste un JSON standard).
- Nom proposé à l'enregistrement : `devoir-<titre du devoir allégé>-<date AAAA-MM-JJ>.devoir.json`, modifiable par l'enseignant dans la boîte de téléchargement.
- Structure : le fichier **est** l'enregistrement existant (`workspaceSnapshot`, cf. `docs/spec/donnees.md`), avec deux champs d'enveloppe ajoutés :

```json
{
  "type": "devoir-grilles-evaluation",
  "dateEnregistrement": "2026-11-27T21:15:00",
  "version": 1,
  "gridLoaded": true,
  "grid": {}, "config": {}, "partLayout": [],
  "assignment": {}, "activeStudentGroup": {},
  "assignmentStudentDetails": {}, "studentCorrections": {},
  "activeCorrectionStudentId": "…", "correctionInteractionMode": "popup",
  "currentCorrection": {}
}
```

- `type` identifie le fichier (valeur exacte exigée, refus clair sinon) ; `dateEnregistrement` est purement indicatif (jamais lu par la restauration) ; le reste est **l'enregistrement tel quel, sans aucune transformation** — l'aller-retour ne peut rien perdre par construction (`workspaceSnapshot` → JSON → `restoreWorkspace`).
- Pas de champ `revision` dans le fichier (propre au mécanisme de concurrence IndexedDB).

## Versionnement et migration

- **Version 1** = l'état actuel de `workspaceSnapshot` ; la référence des champs est `docs/spec/donnees.md`.
- Toute évolution du contenu ⇒ `version` + 1, avec la règle d'or : migration décrite dans cette spec, testée, validée par l'humain, jamais d'écrasement en cas d'échec.
- Ouvrir un fichier d'une version inconnue (ou plus récente que l'application) ⇒ message clair (« fichier d'une version plus récente, mettez l'application à jour ») et **aucun chargement partiel**.
- Pas de compatibilité ascendante à ce jour (aucune correction en production ; décision utilisateur du 2026-11-26).

## Interface

- **Enregistrer** : commande « Enregistrer le devoir » — emplacement proposé : sous-navigation de la vue Devoir, à côté de l'import de grille et du groupe d'élèves. Téléchargement via `Blob` + `URL.createObjectURL` (aucune donnée ne transite par un réseau) ; nom de fichier suggéré selon la règle ci-dessus.
- **Ouvrir** : commande « Ouvrir un devoir » au même emplacement ; `input type="file"` limité à `.json` / `application/json` ; lecture locale, vérification de `type` puis de `version`.
- **Confirmation avant remplacement** : restaurer remplace l'espace de travail actif (grille, devoir, groupe, corrections). Si l'espace actif contient des corrections, une confirmation est demandée (même règle que le remplacement de groupe), avec rappel que l'espace actuel sera perdu s'il n'a pas été enregistré lui-même dans un fichier.
- Après restauration : message de statut clair (« Devoir « … » restauré. »), vue Devoir active ; l'enseignant peut ensuite enregistrer à nouveau un fichier à tout moment.

## Contenu et confidentialité

- Le fichier contient des **données personnelles** : noms, prénoms, classes, marqueur PAP, toutes les corrections, la grille et ses coefficients. **Aucune photo** (déjà hors stockage local : après rechargement, le trombinoscope fonctionne sans photos ; relire le groupe depuis le dossier local si nécessaire).
- Recommandations (reprises du README) : conserver le fichier dans un emplacement adapté aux données personnelles, éviter les appareils partagés, respecter les règles de l'établissement.
- Le fichier n'est **jamais committé** ; rien ne change côté dépôt (aucun exemple de fichier réel dans le projet ; un exemple *anonymisé* peut servir aux tests).

## Critères d'aller-retour (checklist de validation)

Enregistrer puis recharger la grille d'exemple avec un devoir en cours doit restituer :

- la grille, la configuration (coefficients, seuils, plafond de bonus) et la disposition des parties ;
- le devoir (`assignment`) et les détails par élève (`assignmentStudentDetails` : sous-groupes, sujet, remarque, note) ;
- le groupe actif et les corrections de chaque élève, **et** la correction courante : les six méthodes (`scores`, `counts`/`decrement`, `count`, `startedAt`/`elapsedMs`/`recorded`, `manualSeconds`, `bonus`/`bonusComment`/`bonusText`), `manualChoices`, `manualCategoryPercent`, `categoryEvaluations` (avec `motifIds`), `leafChoices`, `commentSelections`, `commentTexts` (texte libre prioritaire), `evaluee`, `statut` (cycle D-014), `detailsOpen`/`popupDetailsOpen` ;
- l'élève actif après restauration (`activeCorrectionStudentId`) et le mode d'interaction (`popup`/`complete`).

## Tests

- **Unitaire** : aller-retour `workspaceSnapshot` → sérialisation JSON → re-dissociation → `restoreWorkspace` sur la grille d'exemple, égalité profonde des structures clés (moteur de tests actuel, sections marquées).
- **E2E** : scénario enregistrement (téléchargement intercepté par Playwright) puis rechargement (`setInputFiles`) avec vérifications à l'écran ; s'appuyer sur `tests/e2e/helpers.cjs`.

## Hors périmètre

- Aucune synchronisation entre appareils.
- Aucun chiffrement intégré au fichier (l'emplacement de stockage reste à la charge de l'enseignant).
- Aucune migration automatique des corrections des anciennes versions (issue séparée si besoin).

## Questions à trancher avant le code

1. Extension `.devoir.json` — d'accord ?
2. Emplacement des deux commandes (sous-navigation de la vue Devoir) — d'accord ?
3. Confirmation avant remplacement de l'espace actif — d'accord ?
4. Nom de fichier proposé automatiquement avec la date — d'accord ?
