"use strict";
const path = require("node:path");
const fs = require("node:fs");
const test = require("node:test");
const assert = require("node:assert/strict");
const {openApp, shot} = require("./helpers.cjs");

const GRILLE_EXEMPLE = path.join(__dirname, "..", "..", "grille-exemple-oral.json");

async function avec(corps) {
  const app = await openApp();
  try { await corps(app.page); assert.deepEqual(app.page.errors, []); } finally { await app.close(); }
}

test("devoir : cr\u00e9er un devoir depuis le catalogue charge la grille choisie et ouvre la vue Devoir", () => avec(async page => {
  // La grille d'exemple est d\u00e9j\u00e0 charg\u00e9e : window.confirm propose de remplacer le devoir actuel.
  page.on("dialog", dialogue => dialogue.accept());
  await page.click("#createAssignmentBtn");
  await page.waitForSelector("#gridCatalogDialog[open]");
  await page.waitForFunction(() => document.querySelectorAll("#gridModalCatalog .grid-modal-choice").length > 0, null, {timeout: 5000});
  const choix = page.locator("#gridModalCatalog .grid-modal-choice", {hasText: "Exemple : oral et d\u00e9bat"});
  await choix.click();
  await page.waitForFunction(() => !document.getElementById("gridCatalogDialog").open, null, {timeout: 5000});
  const statut = await page.evaluate(() => document.getElementById("status").textContent);
  assert.ok(statut.includes("grille-exemple-oral.json") && statut.includes("charg\u00e9e"), `chargement depuis le catalogue (re\u00e7u : \u00ab ${statut} \u00bb)`);
  assert.equal(await page.evaluate(() => grid.titre), "Exemple : oral et d\u00e9bat", "la grille du catalogue est active");
  assert.equal(await page.evaluate(() => document.getElementById("gridCatalogDialog").open), false, "le catalogue est referm\u00e9");
  assert.equal(await page.evaluate(() => document.getElementById("assignmentDetails").hidden), false, "le formulaire du devoir est affich\u00e9");
  assert.equal(await page.evaluate(() => document.getElementById("assignmentEmptyState").hidden), true, "l'\u00e9tat vide dispara\u00eet");
  assert.equal(await page.evaluate(() => document.querySelector('[data-view="devoir"]').getAttribute("aria-current")), "page", "la vue Devoir est active");
  assert.ok(await page.evaluate(() => Boolean(assignment.id)), "le devoir est initialis\u00e9 (identifiant pr\u00eat)");
  await shot(page, "catalogue-t05");
}));

test("devoir : une grille JSON locale choisie dans le catalogue initialise aussi le devoir", () => avec(async page => {
  page.on("dialog", dialogue => dialogue.accept()); // window.confirm du remplacement (grille d’exemple déjà chargée par openApp)
  await page.click("#createAssignmentBtn");
  await page.waitForSelector("#gridCatalogDialog[open]");
  await page.waitForFunction(() => document.querySelectorAll("#gridModalCatalog .grid-modal-choice").length > 0, null, {timeout: 5000});
  await page.setInputFiles("#localGridInput", GRILLE_EXEMPLE);
  await page.waitForFunction(() => !document.getElementById("gridCatalogDialog").open, null, {timeout: 5000});
  const statut = await page.evaluate(() => document.getElementById("status").textContent);
  assert.ok(statut.includes("grille-exemple-oral.json") && statut.includes("charg\u00e9e"), `chargement local (re\u00e7u : \u00ab ${statut} \u00bb)`);
  assert.equal(await page.evaluate(() => grid.titre), "Exemple : oral et d\u00e9bat", "la grille locale est active");
  assert.equal(await page.evaluate(() => document.getElementById("assignmentDetails").hidden), false, "le devoir est initialis\u00e9");
  await shot(page, "catalogue-local-t05");
}));
