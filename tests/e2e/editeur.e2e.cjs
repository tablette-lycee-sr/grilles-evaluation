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

test("\u00e9diteur : importer une grille, la d\u00e9placer au clavier, l'exporter puis la recharger \u00e0 l'identique", () => avec(async page => {
  // Accepte les window.confirm (remplacement du devoir, fermeture de l'\u00e9diteur avec modifications).
  page.on("dialog", dialogue => dialogue.accept());
  await page.click("#createGridEditorBtn");
  await page.waitForSelector("#gridEditorDialog[open]");
  // Import de la grille d'exemple dans le brouillon de l'\u00e9diteur.
  await page.setInputFiles("#gridEditorImportInput", GRILLE_EXEMPLE);
  await page.waitForFunction(() => document.querySelectorAll("#gridEditorTree .grid-editor-row").length > 0, null, {timeout: 5000});
  assert.deepEqual(await page.evaluate(() => draft.parties.map(partie => partie.titre)), ["Pr\u00e9sentation orale", "Participation au d\u00e9bat"], "grille import\u00e9e dans le brouillon");
  // D\u00e9placement au clavier : la premi\u00e8re partie passe apr\u00e8s la seconde (Alt+Fl\u00e8che bas).
  await page.focus("#gridEditorTree .grid-editor-row .grid-editor-handle");
  await page.keyboard.press("Alt+ArrowDown");
  await page.waitForFunction(() => document.getElementById("gridEditorStatus").textContent === "\u00c9l\u00e9ment d\u00e9plac\u00e9.", null, {timeout: 5000});
  assert.deepEqual(await page.evaluate(() => draft.parties.map(partie => partie.titre)), ["Participation au d\u00e9bat", "Pr\u00e9sentation orale"], "la partie a \u00e9t\u00e9 d\u00e9plac\u00e9e dans le brouillon");
  // Export : fichier JSON valide, au nom de la grille, qui conserve l'ordre d\u00e9plac\u00e9.
  const [telechargement] = await Promise.all([page.waitForEvent("download"), page.click("#gridEditorExport")]);
  const nomExport = telechargement.suggestedFilename();
  assert.match(nomExport, /\.json$/, `nom de fichier export\u00e9 (re\u00e7u : ${nomExport})`);
  const cheminExport = await telechargement.path();
  const exporte = JSON.parse(fs.readFileSync(cheminExport, "utf8"));
  assert.equal(exporte.titre, "Exemple : oral et d\u00e9bat", "l'export porte le titre de la grille");
  assert.deepEqual(exporte.parties.map(partie => partie.titre), ["Participation au d\u00e9bat", "Pr\u00e9sentation orale"], "l'export conserve l'ordre d\u00e9plac\u00e9");
  assert.ok((await page.evaluate(() => document.getElementById("gridEditorStatus").textContent)).includes("export\u00e9e"), "message d'export confirm\u00e9");
  // Fermeture de l'\u00e9diteur (confirm accept\u00e9), puis rechargement de la grille export\u00e9e via le catalogue local.
  await page.click("#gridEditorClose");
  await page.waitForFunction(() => !document.getElementById("gridEditorDialog").open, null, {timeout: 5000});
  await page.click("#createAssignmentBtn");
  await page.waitForSelector("#gridCatalogDialog[open]");
  await page.setInputFiles("#localGridInput", cheminExport);
  await page.waitForFunction(() => !document.getElementById("gridCatalogDialog").open, null, {timeout: 5000});
  assert.equal(await page.evaluate(() => grid.titre), "Exemple : oral et d\u00e9bat", "la grille export\u00e9e se recharge");
  const titresGrille = await page.evaluate(() => grid.parties.map(partie => partie.titre));
  assert.deepEqual(titresGrille, exporte.parties.map(partie => partie.titre), "le rechargement conserve l'ordre des parties tel qu'export\u00e9");
  await shot(page, "editeur-export-t05");
}));
