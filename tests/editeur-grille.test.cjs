const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const editorSource = fs.readFileSync(path.join(root, "editeur-grille.js"), "utf8");
const html = fs.readFileSync(path.join(root, "correction.html"), "utf8");
const example = JSON.parse(fs.readFileSync(path.join(root, "grille-exemple-oral.json"), "utf8"));

function treeEngine() {
  const elements = new Map();
  const document = {getElementById(id) {
    if (!elements.has(id)) elements.set(id, {addEventListener() {}});
    return elements.get(id);
  }};
  const context = vm.createContext({document, window: {addEventListener() {}, confirm() {return false}}, structuredClone});
  const original = "dirty=true;renderTree();return true;";
  assert.ok(editorSource.includes(original));
  const source = editorSource.replace(original, "dirty=true;return true;").replace(
    "  function announce(message) {",
    "  globalThis.treeTest={setDraft(value){draft=value},getDraft(){return draft},entries,move,newGrid,newCategory,setLevels};\n  function announce(message) {"
  );
  vm.runInContext(source, context);
  context.treeTest.setDraft(structuredClone(example));
  return context.treeTest;
}

function parseGrid(grid) {
  const config = html.match(/^const DEFAULT_CONFIG = .*$/m)[0];
  const source = fs.readFileSync(path.join(root, "src/js/import-grilles.js"), "utf8");
  const context = vm.createContext({structuredClone});
  vm.runInContext(`${config}\n${source}\nglobalThis.parseGrid=gridFromJson;`, context);
  return context.parseGrid(JSON.stringify(grid));
}

test("une capacité peut entrer dans une sous-catégorie", () => {
  const engine = treeEngine();
  assert.equal(engine.move("voix-audible", "construction-du-propos", "inside"), true);
  const parsed = parseGrid(engine.getDraft());
  const category = parsed.grid.elements.find(node => node.id === "expression-orale");
  assert.deepEqual(Array.from(category.enfants[0].enfants, node => node.id), ["structurer-propos", "voix-audible"]);
});

test("une capacité peut sortir d'une sous-catégorie sans créer de fausse capacité", () => {
  const engine = treeEngine();
  assert.equal(engine.move("structurer-propos", "construction-du-propos", "after"), true);
  const parsed = parseGrid(engine.getDraft());
  const category = parsed.grid.elements.find(node => node.id === "expression-orale");
  assert.deepEqual(Array.from(category.enfants, node => node.id), ["voix-audible", "construction-du-propos", "structurer-propos"]);
  assert.equal(category.enfants[1].enfants.length, 0);
});

test("les catégories peuvent être réordonnées dans une partie", () => {
  const engine = treeEngine();
  assert.equal(engine.move("contenu-expose", "expression-orale", "before"), true);
  const parsed = parseGrid(engine.getDraft());
  assert.deepEqual(Array.from(parsed.partLayout[0].categories, category => category.nodeId), ["contenu-expose", "expression-orale", "gestion-temps"]);
});

test("un déplacement incompatible ne modifie pas la grille", () => {
  const engine = treeEngine();
  const before = JSON.stringify(engine.getDraft());
  assert.equal(engine.move("voix-audible", "participation-echanges", "inside"), false);
  assert.equal(engine.move("expression-orale", "construction-du-propos", "inside"), false);
  assert.equal(JSON.stringify(engine.getDraft()), before);
});

test("l'annulation d'un déplacement entre échelles différentes préserve la grille", () => {
  const engine = treeEngine();
  const category = engine.newCategory("capacites");
  engine.getDraft().parties[0].categories.push(category);
  const before = JSON.stringify(engine.getDraft());
  assert.equal(engine.move("voix-audible", category.id, "inside"), false);
  assert.equal(JSON.stringify(engine.getDraft()), before);
});

test("un ordre d'enfants incohérent est refusé", () => {
  const grid = structuredClone(example);
  grid.parties[0].categories[0].ordreEnfants = ["voix-audible", "voix-audible"];
  assert.throws(() => parseGrid(grid), /ordre des éléments invalide/);
});

test("les modèles des six méthodes produisent une grille acceptée par le lecteur", () => {
  const engine = treeEngine();
  const grid = engine.newGrid();
  const categories = ["capacites", "bareme", "distribution", "compteur", "minuteur", "bonus"].map(method => engine.newCategory(method));
  grid.parties.push({id: "partie-test", titre: "Partie", categories});
  const parsed = parseGrid(grid);
  assert.equal(parsed.grid.elements.length, 6);
});

test("les modèles à quatre niveaux restent compatibles avec le lecteur", () => {
  const engine = treeEngine();
  const grid = engine.newGrid();
  const categories = ["capacites", "bareme", "distribution", "compteur", "minuteur"].map(method => {
    const category = engine.newCategory(method);
    engine.setLevels(category, "4");
    return category;
  });
  grid.parties.push({id: "partie-test", titre: "Partie", categories});
  const parsed = parseGrid(grid);
  assert.ok(Array.from(parsed.grid.elements).every(category => category.niveaux.length === 4));
});

test("une liste de commentaires mal formée est refusée", () => {
  const grid = structuredClone(example);
  grid.parties[0].categories[0].commentaires.niveaux.NA = "Texte incorrect";
  assert.throws(() => parseGrid(grid), /liste de commentaires invalide/);
});