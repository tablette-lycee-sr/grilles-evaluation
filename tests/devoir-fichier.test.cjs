const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "src/js/devoir-fichier.js"), "utf8");

// Moteur minimal : les globals utilisés par devoirFileName (activeStudentGroup, assignment, grid) sont injectés tels quels.
function moteur(globals = {}) {
  const context = vm.createContext({...globals, structuredClone});
  vm.runInContext(`${source}\nglobalThis.outil={devoirFileName,serializeDevoir,parseDevoir};`, context);
  return context.outil;
}

// Petit espace de travail réaliste construit à la main (sans DOM) pour l'aller-retour.
function snapshotExemple() {
  const grid = JSON.parse(fs.readFileSync(path.join(root, "grille-exemple-oral.json"), "utf8"));
  return {
    version: 1, gridLoaded: true, grid, config: {version: 1, ponderations: {}, seuils: {}, bonus: {}}, partLayout: [],
    assignment: {id: "a1", name: "Napoléon", date: "2026-11-27", maxScore: 20},
    activeStudentGroup: {name: "2de 3", students: [{nom: "DUPONT", prenom: "Léa", classe: "2de 3", pap: true}]},
    assignmentStudentDetails: {"e1": {sousGroupe: "A"}}, studentCorrections: {"e1": {note: "14"}},
    activeCorrectionStudentId: "e1", correctionInteractionMode: "popup",
    currentCorrection: {manualChoices: {}, manualCategoryPercent: {}, categoryEvaluations: {}, leafChoices: {}, bonusChoices: {}, methodStates: {}, studentName: "DUPONT Léa", note: "14"}
  };
}

test("devoirFileName suit le format DEVOIR_<Date>_<Groupe>_<Titre> sans accents ni caractères interdits", () => {
  const outil = moteur({activeStudentGroup: {name: "2de 3 — Débat"}, assignment: {name: "Étude critique : Napoléon"}, grid: {titre: "Grille orale"}});
  const today = new Date(), date = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
  assert.equal(outil.devoirFileName(), `DEVOIR_${date}_2de-3-Debat_Etude-critique-Napoleon.devoir.json`);
});

test("devoirFileName propose des remplaçants quand le groupe ou le titre manque", () => {
  const outil = moteur({activeStudentGroup: null, assignment: {}, grid: {}});
  const today = new Date(), date = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
  assert.equal(outil.devoirFileName(), `DEVOIR_${date}_sans-groupe_sans-titre.devoir.json`);
});

test("aller-retour : parseDevoir du fichier sérialisé rend l'espace de travail à l'identique", () => {
  const outil = moteur();
  const snapshot = snapshotExemple();
  const fichier = JSON.stringify({type: "devoir-grilles-evaluation", dateEnregistrement: "2026-11-27T21:15:00.000Z", ...structuredClone(snapshot)});
  const parse = outil.parseDevoir(fichier);
  assert.equal(parse.type, "devoir-grilles-evaluation");
  for (const cle of ["version", "gridLoaded", "config", "partLayout", "assignment", "activeStudentGroup", "assignmentStudentDetails", "studentCorrections", "activeCorrectionStudentId", "correctionInteractionMode", "currentCorrection"]) {
    assert.deepEqual(structuredClone(parse[cle]), structuredClone(snapshot[cle]), `champ ${cle} intact après l'aller-retour`);
  }
});

test("parseDevoir refuse un JSON invalide, un mauvais type et une version inconnue ou future", () => {
  const outil = moteur();
  assert.throws(() => outil.parseDevoir("{pas du json"), /illisible/);
  assert.throws(() => outil.parseDevoir(JSON.stringify({version: 1})), /n'est pas un devoir/);
  assert.throws(() => outil.parseDevoir(JSON.stringify({type: "devoir-grilles-evaluation"})), /format de sauvegarde inconnu/);
  assert.throws(() => outil.parseDevoir(JSON.stringify({type: "devoir-grilles-evaluation", version: 2})), /version plus récente/);
});
