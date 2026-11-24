const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "correction.html"), "utf8");
const methodCalculationSource = fs.readFileSync(path.join(root, "src/js/methodes-calcul.js"), "utf8");
const gridText = fs.readFileSync(path.join(root, "grille-exemple-oral.json"), "utf8");
const defaultConfig = html.match(/^const DEFAULT_CONFIG = .*$/m)[0];

function section(start, end) {
  const first = html.indexOf(start);
  const last = html.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `Section introuvable : ${start}`);
  return html.slice(first, last);
}

function makeEngine() {
  const context = vm.createContext({structuredClone, Date});
  const source = `
    ${defaultConfig}
    let grid = {elements: [], niveaux: []};
    let config = structuredClone(DEFAULT_CONFIG);
    let levels = {};
    let leafChoices = {};
    let manualChoices = {};
    let manualCategoryPercent = {};
    let categoryEvaluations = {};
    let bonusChoices = {};
    let methodStates = {};
    ${section("function allNodes(", "function makeChoiceButton(")}
    ${methodCalculationSource}
    ${section("function gridFromJson(", "function resetChoices(")}
    ${section("function resetChoices(", "function captureActiveCorrection(")}
    ${section("function calculateFinalScore(", "function updateFinalScore(")}
    globalThis.engine = {
      load(text) {
        const loaded = gridFromJson(text);
        grid = loaded.grid;
        config = loaded.config;
        levels = Object.fromEntries(grid.niveaux.map(level => [level.id, level]));
        return loaded;
      },
      state(id, value) { methodStates[id] = value; },
      choices(value) { leafChoices = value; },
      warning(id, active = true) { if (active) categoryEvaluations[id] = {warning: true}; else delete categoryEvaluations[id]; },
      calculate(id) { return methodCalculation(grid.elements.find(node => node.id === id)); },
      curve(id, seconds) { return timerPercentage(grid.elements.find(node => node.id === id), seconds); },
      snapshot() { return snapshotMethodStates(); },
      score() { return calculateFinalScore(); }
    };
  `;
  vm.runInContext(source, context);
  context.engine.load(gridText);
  return context.engine;
}

test("la grille JSON contient les six méthodes", () => {
  const engine = makeEngine();
  const loaded = engine.load(gridText);
  assert.deepEqual(Array.from(loaded.grid.elements, node => node.methode).sort(),
    ["bareme", "bonus", "capacites", "compteur", "distribution", "minuteur"]);
});

test("les capacités sont pondérées avec les valeurs de la catégorie", () => {
  const engine = makeEngine();
  engine.choices({"voix-audible": "ECA-", "structurer-propos": "A"});
  const result = engine.calculate("expression-orale");
  assert.ok(Math.abs(result.percentage - 233 / 3) < 1e-10);
  assert.equal(result.level, "ECA+");
  assert.equal(result.count, 2);
});

test("le barème utilise uniquement les maximums des critères renseignés", () => {
  const engine = makeEngine();
  engine.state("contenu-expose", {scores: {"precision-informations": 2}});
  const result = engine.calculate("contenu-expose");
  assert.ok(Math.abs(result.percentage - 100 / 3) < 1e-10);
  assert.equal(result.level, "ECA");
  assert.equal(result.partial, true);
});

test("la distribution sans occurrence est vide, puis utilise la moyenne des niveaux", () => {
  const engine = makeEngine();
  assert.equal(engine.calculate("qualite-arguments").percentage, null);
  engine.state("qualite-arguments", {counts: {NA: 4, ECA: 2, A: 0}});
  const result = engine.calculate("qualite-arguments");
  assert.ok(Math.abs(result.percentage - 100 / 6) < 1e-10);
  assert.equal(result.level, "NA");
});

test("le compteur démarre à zéro et progresse jusqu'au seuil A", () => {
  const engine = makeEngine();
  assert.equal(engine.calculate("participation-echanges").percentage, 0);
  engine.state("participation-echanges", {count: 3});
  const result = engine.calculate("participation-echanges");
  assert.equal(result.percentage, 75);
  assert.equal(result.level, "ECA");
});

test("le minuteur distingue l'absence de donnée, le zéro constaté et la durée cible", () => {
  const engine = makeEngine();
  assert.equal(engine.calculate("gestion-temps").percentage, null);
  engine.warning("gestion-temps");
  assert.equal(engine.calculate("gestion-temps").percentage, 0);
  engine.warning("gestion-temps", false);
  engine.state("gestion-temps", {recorded: true, elapsedMs: 300000});
  const result = engine.calculate("gestion-temps");
  assert.equal(result.percentage, 100);
  assert.equal(result.level, "A");
});

test("une courbe lissée respecte les points et reste bornée", () => {
  const engine = makeEngine();
  const custom = JSON.parse(gridText);
  custom.parties[0].categories.find(node => node.methode === "minuteur").courbe.interpolation = "lisse";
  engine.load(JSON.stringify(custom));
  assert.equal(engine.curve("gestion-temps", 120), 33);
  assert.equal(engine.curve("gestion-temps", 240), 100);
  for (let seconds = 0; seconds <= 600; seconds++) {
    const value = engine.curve("gestion-temps", seconds);
    assert.ok(value >= 0 && value <= 100);
  }
});

test("la sauvegarde capture un minuteur en pause sans arrêter le minuteur actif", () => {
  const engine = makeEngine();
  engine.state("gestion-temps", {recorded: true, elapsedMs: 1000, startedAt: Date.now() - 4000});
  const snapshot = engine.snapshot();
  assert.equal(snapshot["gestion-temps"].startedAt, undefined);
  assert.ok(snapshot["gestion-temps"].elapsedMs >= 5000);
  assert.ok(engine.calculate("gestion-temps").percentage > 0);
});

test("les facultatifs améliorent la moyenne et le bonus est ajouté ensuite", () => {
  const engine = makeEngine();
  engine.state("expression-orale", {evaluee: false});
  engine.state("contenu-expose", {scores: {"precision-informations": 2}});
  engine.state("gestion-temps", {evaluee: false});
  engine.state("qualite-arguments", {evaluee: false});
  engine.state("participation-echanges", {count: 4});
  engine.state("role-debat", {bonus: 2});
  assert.ok(Math.abs(engine.score() - 46 / 3) < 1e-10);
});

test("une catégorie facultative ne diminue pas la moyenne", () => {
  const engine = makeEngine();
  engine.state("expression-orale", {evaluee: false});
  engine.state("contenu-expose", {scores: {"precision-informations": 2}});
  engine.state("gestion-temps", {evaluee: false});
  engine.state("qualite-arguments", {evaluee: false});
  engine.state("participation-echanges", {count: 0});
  assert.ok(Math.abs(engine.score() - 20 / 3) < 1e-10);
});

test("la somme des bonus est plafonnée sans modifier les points attribués", () => {
  const engine = makeEngine();
  const extended = JSON.parse(gridText);
  extended.parties[1].categories.push({id: "bonus-supplementaire", titre: "Bonus supplémentaire", methode: "bonus", evaluee: true, pointsMaximum: 2, pas: 0.25});
  engine.load(JSON.stringify(extended));
  engine.state("expression-orale", {evaluee: false});
  engine.state("contenu-expose", {scores: {"precision-informations": 3}});
  engine.state("gestion-temps", {evaluee: false});
  engine.state("qualite-arguments", {evaluee: false});
  engine.state("role-debat", {bonus: 2});
  engine.state("bonus-supplementaire", {bonus: 2});
  assert.equal(engine.score(), 13);
});

test("une grille invalide est refusée avant chargement", () => {
  const engine = makeEngine();
  const invalid = JSON.parse(gridText);
  invalid.parties[0].categories[0].coefficient = -1;
  assert.throws(() => engine.load(JSON.stringify(invalid)), /coefficient invalide/);
});
