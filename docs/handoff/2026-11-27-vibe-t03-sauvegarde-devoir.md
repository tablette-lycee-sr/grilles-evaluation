# Passation — T-03 sauvegarde du devoir sur fichier (Vibe, 2026-11-27)

## Ce qui est livré (PR #29, branche `agent/vibe/t03-sauvegarde-devoir`)

1. **Spec d'abord** : `docs/spec/sauvegarde-devoir.md` — validée par l'utilisateur (4 questions tranchées, dont le nommage `DEVOIR_<Date>_<Groupe>_<Titre>` imposé par l'utilisateur), puis implémentée dans la même PR.
2. **`src/js/devoir-fichier.js`** (nouveau module, 7ᵉ `<script src>`, chargé après `stockage.js`) :
   - `devoirFileName()` — `DEVOIR_<AAAA-MM-JJ>_<Groupe>_<Titre>.devoir.json` ; accents retirés (NFD), caractères non alphanumériques → tirets, tronqué à 60 car. ; remplaçants `sans-groupe`/`sans-titre` ; titre = `assignment.name`, à défaut `grid.titre` ;
   - `serializeDevoir()` — `{type:"devoir-grilles-evaluation", dateEnregistrement, ...workspaceSnapshot()}` : l'enregistrement local **tel quel**, aucune transformation ;
   - `parseDevoir(texte)` — JSON → vérification `type` puis `version` (1 = ok ; > 1 = « fichier plus récent » ; autre = « format inconnu ») ; renvoie l'espace de travail sans l'enveloppe ;
   - `enregistrerDevoir()` — garde « grille chargée » (sinon invitation au statut), Blob + lien de téléchargement local (aucun réseau), message rappelant l'emplacement adapté aux données personnelles ;
   - `ouvrirDevoir(fichier)` / `restaurerDevoir(snapshot)` — erreurs au statut ; si un espace de travail actif existe, boîte de confirmation (`openDevoirDialog`, même motif que `loadStudentGroupDialog`) avant `restoreWorkspace` + `saveWorkspace()` ; message de restauration avec rappel photos.
3. **`correction.html`** : les deux boutons « à venir » du sous-menu Devoir sont activés (`openDevoirBtn`, `saveDevoirBtn`) + `devoirFileInput` (`.json`) + dialog de confirmation ; câblage à côté du câblage du groupe d'élèves.
4. **Tests** :
   - unitaires `tests/devoir-fichier.test.cjs` (4) : format du nom de fichier (accents, ponctuation, remplaçants), aller-retour parse(JSON) — champs comparés un à un, refus (JSON invalide, mauvais type, version absente, version future). Total unitaires : 27.
   - e2e `tests/e2e/devoir.e2e.cjs` (3) : enregistrement (téléchargement capté, nom vérifié) → rechargement de page (la sauvegarde locale rouvre) → changement d'état → ouverture du fichier avec confirmation → niveaux et corrections restaurés ; refus d'un fichier étranger sans boîte de confirmation ; garde « créez d'abord un devoir » sans téléchargement. Capture `devoir-restaure-t03.png`.
5. **Docs** : STATUS (ligne ✅, entête datée), `spec/donnees.md` règle 4 (renvoie vers la nouvelle spec), README §Sauvegarde locale.

## Points d'attention pour la relecture (zone `sensible`)

- **`restoreWorkspace(snapshot)`** est appelé avec l'objet du fichier : il valide `version===1` (double garde avec `parseDevoir`). Aucun champ du fichier n'est transformé : la compatibilité de la structure reste pilotée par `docs/spec/donnees.md` (règle d'or).
- **Confirmation avant remplacement** : fenêtre maison (pas de `window.confirm`) pour rester cohérent avec les autres remplacements destructeurs. Dans `toggleCategoryEvaluation` (minuteur), un `window.confirm` préexiste — non touché.
- **Photos** : le fichier ne les contient pas (comme la sauvegarde locale) ; le message de restauration le rappelle.
- Le nommage impose l'utilisateur : les séparateurs sont `_` entre champs, `-` à l'intérieur (accents retirés). `slice(0,60)` par champ pour éviter les noms excessifs.
- `pendingDevoirImport` (module) suit le motif existant `pendingStudentGroupImport`.
