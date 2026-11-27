"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {openApp, openCorrection, section, shot} = require("./helpers.cjs");

const couleurFond = (page, selector) => page.evaluate(s => getComputedStyle(document.querySelector(s)).backgroundColor, selector);
// Fait défiler la fenêtre jusqu'à la jauge avant de la mesurer : les coordonnées de la souris doivent être visibles.
async function jaugeVisible(page, id) {
  const jauge = page.locator(`${section(id)} .jauge`);
  await jauge.scrollIntoViewIfNeeded();
  return jauge.boundingBox();
}
const etat = (page, id) => page.evaluate(i => methodStates[i] || {}, id);

async function avec(corps, taille) {
  const app = await openApp(taille);
  try { await openCorrection(app.page); await corps(app.page); assert.deepEqual(app.page.errors, []); } finally { await app.close(); }
}

test("le niveau choisi prend la couleur du niveau (NA rouge, ECA- orange, ECA jaune, A vert)", () => avec(async page => {
  await page.click(`${section("expression-orale")} .boutons [data-method-level="ECA-"]`);
  assert.equal(await couleurFond(page, `${section("expression-orale")} .boutons [data-method-level="ECA-"]`), "rgb(255, 189, 89)");
  await page.click(`${section("contenu-expose")} .boutons [data-method-level="A"]`);
  assert.equal(await couleurFond(page, `${section("contenu-expose")} .boutons [data-method-level="A"]`), "rgb(23, 161, 63)");
  await page.click(`${section("participation-echanges")} .boutons [data-method-level="NA"]`);
  assert.equal(await couleurFond(page, `${section("participation-echanges")} .boutons [data-method-level="NA"]`), "rgb(255, 49, 49)");
  await page.click(`${section("contenu-expose")} .boutons [data-method-level="ECA"]`);
  assert.equal(await couleurFond(page, `${section("contenu-expose")} .boutons [data-method-level="ECA"]`), "rgb(255, 215, 55)");
}));

test("distribution et compteur enregistrent les occurrences", () => avec(async page => {
  for (const niveau of ["NA", "A", "A"]) await page.click(`${section("qualite-arguments")} .boutons [data-method-level="${niveau}"]`);
  assert.deepEqual((await etat(page, "qualite-arguments")).counts, {NA: 1, A: 2});
  for (let i = 0; i < 6; i++) await page.click(`${section("participation-echanges")} .compteur`);
  assert.equal((await etat(page, "participation-echanges")).count, 6);
  assert.ok(await page.locator(`${section("participation-echanges")} .rond--anneau`).count(), "l'anneau de Dépassé est suggéré au seuil D");
}));

test("bonus : 0 dans le gris, mini-bonus fixe dans le bleu foncé (D-016), puis échelle linéaire jusqu'au plafond", () => avec(async page => {
  const jauge = await jaugeVisible(page, "role-debat");
  const cliquer = async pourcent => page.mouse.click(jauge.x + jauge.width * pourcent / 100, jauge.y + jauge.height / 2);
  const bonus = async () => (await etat(page, "role-debat")).bonus ?? 0;
  await cliquer(10); assert.equal(await bonus(), 0);
  await cliquer(29); assert.equal(await bonus(), 0);
  await cliquer(38.75); assert.equal(await bonus(), 0.5, "entrée dans le bleu foncé : palier fixe de +0,5");
  await cliquer(50); assert.equal(await bonus(), 0.5, "tout le bleu foncé vaut le même palier");
  await cliquer(83); assert.equal(await bonus(), 1.25, "échelle linéaire dans le bleu clair");
  await cliquer(99.5); assert.equal(await bonus(), 2);
}));

test("barème : un point de couleur à gauche de chaque critère suit le niveau courant de la catégorie (D-017)", () => avec(async page => {
  const carte = section("contenu-expose");
  await page.click(`${carte} .capacite`); // ouvre le détail des critères
  await page.waitForSelector(`${carte} .method-criterion`);
  const couleur = async () => page.locator(`${carte} .method-criterion .critere-niveau`).first().evaluate(el => getComputedStyle(el).backgroundColor);
  const points = async () => page.locator(`${carte} .method-criterion .critere-niveau`).count();
  assert.equal(await points(), 2, "un point par critère");
  assert.equal(await couleur(), "rgb(133, 133, 133)", "rien n'est saisi : point gris");
  await page.fill(`${carte} .method-criterion input >> nth=0`, "6");
  assert.equal(await couleur(), "rgb(23, 161, 63)", "6/6 sur le premier critère = 100 % : niveau A (vert)");
  await page.fill(`${carte} .method-criterion input >> nth=1`, "0");
  assert.equal(await couleur(), "rgb(255, 215, 55)", "6+0 sur 10 = 60 % : niveau ECA (jaune)");
  await page.fill(`${carte} .method-criterion input >> nth=0`, "0");
  await page.fill(`${carte} .method-criterion input >> nth=1`, "0");
  assert.equal(await couleur(), "rgb(255, 49, 49)", "0 point : niveau NA (rouge)");
}));

test("minuteur : la poignée suit le fer à cheval (piste haute, virage, piste basse)", () => avec(async page => {
  const jauge = await jaugeVisible(page, "gestion-temps");
  const u = jauge.height / 20, largeurU = jauge.width / u, L = largeurU - 10;
  const point = (x, y) => [jauge.x + x * u, jauge.y + y * u];
  const position = () => page.evaluate(s => { const c = document.querySelector(`${s} .curseur--principal`); return [Number(c.style.getPropertyValue("--cx")), Number(c.style.getPropertyValue("--cy"))]; }, section("gestion-temps"));
  await page.mouse.move(...point(5, 3)); await page.mouse.down();
  const trace = [];
  for (const [x, y] of [[40, 3], [L, 3], [L + 7, 10], [L, 17], [40, 17]]) {
    await page.mouse.move(...point(x, y), {steps: 4});
    const [cx, cy] = await position();
    trace.push({x, y, cx, cy, secondes: (await etat(page, "gestion-temps")).manualSeconds});
  }
  await page.mouse.up();
  for (const t of trace) { assert.ok(Math.abs(t.cx - t.x) < 1.5 && Math.abs(t.cy - t.y) < 1.5, `la poignée quitte le chemin : ${JSON.stringify(t)}`); }
  const durees = trace.map(t => t.secondes);
  assert.deepEqual(durees, [...durees].sort((a, b) => a - b), "la durée croît le long du chemin");
  await shot(page, "minuteur-fer-a-cheval");
}));

test("bouton coefficient : cycle Noté, NN, 2(+), NE puis retour à Noté", () => avec(async page => {
  const id = "expression-orale", note = `${section(id)} .note`, carte = `${section(id)} .carte`;
  const style = (selecteur, propriete) => page.evaluate(([s, p]) => getComputedStyle(document.querySelector(s))[p], [selecteur, propriete]);
  assert.equal(await page.locator(note).innerText(), "3");
  await page.click(note);
  assert.equal(await page.locator(note).innerText(), "NN");
  assert.equal(await style(section(id), "opacity"), "1");
  assert.equal(await style(carte, "borderTopStyle"), "dashed");
  await page.click(`${section(id)} .boutons [data-method-level="ECA-"]`);
  assert.equal(await page.locator(`${section(id)} .boutons [data-method-level="ECA-"]`).getAttribute("aria-pressed"), "true");
  await page.click(note);
  assert.equal(await page.locator(note).innerText(), "3(+)");
  assert.equal(await style(carte, "borderTopStyle"), "solid");
  await page.click(note);
  assert.equal(await page.locator(note).innerText(), "NE");
  assert.equal(await style(section(id), "opacity"), "0.25");
  assert.equal(await style(carte, "borderTopStyle"), "dashed");
  assert.ok(await page.locator(`${section(id)} .boutons [data-method-level="ECA-"]`).isDisabled());
  assert.ok(await page.locator(`${section(id)} .rond`).isDisabled());
  assert.ok(!(await page.locator(`${section(id)} .note`).isDisabled()));
  await page.click(note);
  assert.equal(await page.locator(note).innerText(), "3");
  assert.equal(await style(section(id), "opacity"), "1");
  assert.equal(await page.locator(`${section(id)} .boutons [data-method-level="ECA-"]`).isDisabled(), false);
}));

test("catégorie facultative : le bouton démarre à (2+) et suit le même cycle", () => avec(async page => {
  const note = `${section("participation-echanges")} .note`;
  assert.equal(await page.locator(note).innerText(), "(2+)");
  await page.click(note);
  assert.equal(await page.locator(note).innerText(), "NE");
  assert.equal(await page.evaluate(s => getComputedStyle(document.querySelector(s)).opacity, section("participation-echanges")), "0.25");
  await page.click(note);
  await page.click(note);
  assert.equal(await page.locator(note).innerText(), "NN");
  assert.equal((await etat(page, "participation-echanges")).statut, "nn");
}));

test("commentaire de niveau : texte éditable, liste prédéfinie, texte libre conservé", () => avec(async page => {
  const id = "expression-orale";
  await page.click(`${section(id)} .boutons [data-method-level="ECA-"]`);
  const texte = page.locator(`${section(id)} .carte > .champ--niveau .champ-texte`);
  await texte.click(); await page.keyboard.press("Control+A"); await page.keyboard.type("Débit trop rapide.");
  assert.equal((await etat(page, id)).commentTexts["expression-orale:ECA-"], "Débit trop rapide.");
  await page.evaluate(() => render());
  assert.equal(await page.locator(`${section(id)} .carte > .champ--niveau .champ-texte`).inputValue(), "Débit trop rapide.");
  await page.selectOption(`${section(id)} .carte > .champ--niveau .champ-liste`, {index: 1});
  assert.equal(await page.locator(`${section(id)} .carte > .champ--niveau .champ-texte`).inputValue(), "L'expression reste difficile à suivre par moments.");
}));

test("fenêtre d'information : s'ouvre, liste les niveaux, Échap la ferme sans fermer la correction", () => avec(async page => {
  await page.click(`${section("expression-orale")} .aide`);
  assert.ok(await page.evaluate(() => document.getElementById("methodInfoDialog").open));
  assert.ok(await page.locator("#methodInfoDialog .mi-level").count() >= 3);
  await shot(page, "fenetre-info");
  await page.keyboard.press("Escape");
  assert.equal(await page.evaluate(() => document.getElementById("methodInfoDialog").open), false);
  assert.ok(await page.evaluate(() => document.getElementById("correctionPopup").open));
}));

test("Attention et Dépassé s'excluent : activer l'un désactive l'autre et efface son motif", () => avec(async page => {
  const alerte = `${section("expression-orale")} .boutons .alerte`, depasse = `${section("expression-orale")} .boutons .rond:not(.rond--vide)`;
  await page.click(alerte);
  await page.evaluate(() => { categoryEvaluations["expression-orale"].motifIds = {warning: "expression-attention", exceeded: "expression-depasse"}; });
  await page.click(depasse);
  let evaluation = await page.evaluate(() => categoryEvaluations["expression-orale"]);
  assert.ok(evaluation.exceeded, "Dépassé actif");
  assert.ok(!evaluation.warning, "Attention désactivé par Dépassé");
  assert.equal(evaluation.motifIds.warning, "", "le motif Attention choisi est effacé");
  await page.click(alerte);
  evaluation = await page.evaluate(() => categoryEvaluations["expression-orale"]);
  assert.ok(evaluation.warning && !evaluation.exceeded, "activer Attention désactive Dépassé");
  assert.equal(evaluation.motifIds.exceeded, "", "le motif Dépassé choisi est effacé");
}));

test("compteur : le Dépassé suggéré (anneau) n'empêche pas d'activer Attention", () => avec(async page => {
  for (let i = 0; i < 6; i++) await page.click(`${section("participation-echanges")} .compteur`);
  assert.ok(await page.locator(`${section("participation-echanges")} .boutons .rond--anneau`).count(), "l'anneau de suggestion est visible au seuil D");
  await page.click(`${section("participation-echanges")} .boutons .alerte`);
  const evaluation = await page.evaluate(() => categoryEvaluations["participation-echanges"]);
  assert.ok(evaluation.warning, "Attention s'active normalement malgré la suggestion");
  assert.ok(!evaluation.exceeded, "la suggestion de Dépassé n'active rien");
  assert.ok(await page.locator(`${section("participation-echanges")} .boutons .rond--anneau`).count(), "l'anneau de suggestion reste affiché, Dépassé reste disponible");
}));
