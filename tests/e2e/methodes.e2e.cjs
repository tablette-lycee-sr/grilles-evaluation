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

test("bonus : 0 jusqu'au trait gris/bleu foncé, puis une échelle linéaire jusqu'au plafond", () => avec(async page => {
  const jauge = await jaugeVisible(page, "role-debat");
  const cliquer = async pourcent => page.mouse.click(jauge.x + jauge.width * pourcent / 100, jauge.y + jauge.height / 2);
  const bonus = async () => (await etat(page, "role-debat")).bonus ?? 0;
  await cliquer(10); assert.equal(await bonus(), 0);
  await cliquer(29); assert.equal(await bonus(), 0);
  await cliquer(38.75); assert.equal(await bonus(), 0.25);
  await cliquer(99.5); assert.equal(await bonus(), 2);
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

test("bouton coefficient : NN, pointillés, bloc à 50 %, puis retour à la valeur précédente", () => avec(async page => {
  const note = `${section("participation-echanges")} .note`;
  assert.equal(await page.locator(note).innerText(), "(2)");
  await page.click(note);
  assert.equal(await page.locator(note).innerText(), "NN");
  assert.equal(await page.evaluate(s => getComputedStyle(document.querySelector(s)).opacity, section("participation-echanges")), "0.5");
  assert.equal(await page.evaluate(s => getComputedStyle(document.querySelector(s)).borderTopStyle, note), "dashed");
  await page.click(note);
  assert.equal(await page.locator(note).innerText(), "(2)");
  assert.equal(await page.evaluate(s => getComputedStyle(document.querySelector(s)).opacity, section("participation-echanges")), "1");
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
