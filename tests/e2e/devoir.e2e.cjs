"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {openApp, openCorrection, section, shot} = require("./helpers.cjs");

const statut = page => page.evaluate(() => document.getElementById("status").textContent);

async function avec(corps) {
  const app = await openApp();
  try { await corps(app.page); assert.deepEqual(app.page.errors, []); } finally { await app.close(); }
}

test("devoir : enregistrement puis ouverture du fichier rend la correction à l'identique", () => avec(async page => {
  await openCorrection(page);
  await page.click(`${section("expression-orale")} .boutons [data-method-level="ECA-"]`);
  await page.keyboard.press("Escape");
  // Enregistrement : le téléchargement porte le nom validé DEVOIR_<Date>_<Groupe>_<Titre>.
  const [telechargement] = await Promise.all([page.waitForEvent("download"), page.click("#saveDevoirBtn")]);
  const nom = telechargement.suggestedFilename();
  const today = new Date(), date = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
  assert.match(nom, new RegExp(`^DEVOIR_${date}_Groupe-e2e_.+\\.devoir\\.json$`), `nom de fichier au format validé (reçu : ${nom})`);
  const chemin = await telechargement.path();
  assert.ok((await statut(page)).includes("enregistré dans le fichier"), "message de confirmation d'enregistrement");
  // Après rechargement (l'espace de travail local rouvre) l'état change, puis le fichier ramène l'état enregistré.
  await page.reload();
  await page.waitForSelector("#assignmentGridTree .assignment-node");
  await openCorrection(page);
  await page.click(`${section("expression-orale")} .boutons [data-method-level="A"]`);
  await page.keyboard.press("Escape");
  await page.click('[data-view="devoir"]');
  await page.setInputFiles("#devoirFileInput", chemin);
  await page.click("#confirmOpenDevoir");
  assert.equal(await page.evaluate(() => manualChoices["expression-orale"]), "ECA-", "le niveau enregistré est restauré");
  assert.equal(await page.evaluate(() => Object.keys(studentCorrections).length > 0), true, "les corrections par élève du fichier sont restaurées");
  assert.ok((await statut(page)).includes("restauré"), "message de restauration");
  await shot(page, "devoir-restaure-t03");
}));

test("devoir : ouvrir refuse un fichier étranger avec un message clair et sans confirmation de remplacement", () => avec(async page => {
  await openCorrection(page);
  await page.click('[data-view="devoir"]');
  await page.setInputFiles("#devoirFileInput", {name: "autre.devoir.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({version: 1}))});
  assert.ok((await statut(page)).includes("n'est pas un devoir de l'application"), "message de refus");
  assert.equal(await page.evaluate(() => document.getElementById("openDevoirDialog").open), false, "aucune boîte de confirmation pour un fichier invalide");
}));

test("devoir : enregistrer sans devoir chargé affiche une invitation, sans téléchargement", () => avec(async page => {
  await page.evaluate(() => { document.querySelector(".app").classList.remove("grid-loaded"); });
  let telecharge = false;
  page.once("download", () => { telecharge = true; });
  await page.click("#saveDevoirBtn");
  await page.waitForTimeout(300);
  assert.ok((await statut(page)).includes("Créez d'abord un devoir"), "invitation à créer un devoir");
  assert.equal(telecharge, false, "aucun fichier produit");
}));
