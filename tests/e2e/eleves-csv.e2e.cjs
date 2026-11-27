"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {openApp, shot} = require("./helpers.cjs");

// CSV d'élèves : colonnes Nom,Prénom,Classe,PAP (PAP vide = false, « oui » = true).
const CSV_DEUX_ELEVES = "Nom,Pr\u00e9nom,Classe,PAP\nDUPONT,L\u00e9a,2de 3,oui\nMARTIN,Hugo,2de 3,\n";
const CSV_TROIS_ELEVES = "Nom,Pr\u00e9nom,Classe,PAP\nDUPONT,L\u00e9a,2de 3,oui\nMARTIN,Hugo,2de 3,\nROSSI,Maria,2de 3,non\n";

async function avec(corps) {
  const app = await openApp();
  try { await corps(app.page); assert.deepEqual(app.page.errors, []); } finally { await app.close(); }
}

test("\u00e9l\u00e8ves : charger un CSV dans l'application vierge cr\u00e9e le groupe actif sans confirmation", () => avec(async page => {
  await page.setInputFiles("#studentGroupCsvInput", {name: "Groupe e2e.csv", mimeType: "text/csv", buffer: Buffer.from(CSV_DEUX_ELEVES, "utf8")});
  await page.waitForFunction(() => document.getElementById("studentGroupWorkspace").hidden === false, null, {timeout: 5000});
  assert.equal(await page.evaluate(() => document.getElementById("loadStudentGroupDialog").open), false, "aucune confirmation de remplacement sans groupe actif");
  assert.equal(await page.evaluate(() => activeStudentGroup.name), "Groupe e2e", "le nom du groupe est repris du nom du fichier");
  const eleves = await page.evaluate(() => activeStudentGroup.students.map(eleve => ({nom: eleve.nom, prenom: eleve.prenom, classe: eleve.classe, pap: eleve.pap})));
  assert.deepEqual(eleves, [
    {nom: "DUPONT", prenom: "L\u00e9a", classe: "2de 3", pap: true},
    {nom: "MARTIN", prenom: "Hugo", classe: "2de 3", pap: false},
  ], "les \u00e9l\u00e8ves sont pars\u00e9s (PAP vide = false)");
  const statut = await page.evaluate(() => document.getElementById("studentGroupFileStatus").textContent);
  assert.ok(statut.includes("Groupe \u00ab Groupe e2e \u00bb charg\u00e9 : 2 \u00e9l\u00e8ve(s)."), `message de chargement (re\u00e7u : \u00ab ${statut} \u00bb)`);
  assert.equal(await page.evaluate(() => document.querySelector('[data-view="eleves"]').getAttribute("aria-current")), "page", "la vue \u00c9l\u00e8ves est active");
  await shot(page, "eleves-csv-t05");
}));

test("\u00e9l\u00e8ves : charger un second CSV demande confirmation, annulable, puis remplace le groupe et ses donn\u00e9es", () => avec(async page => {
  await page.setInputFiles("#studentGroupCsvInput", {name: "Premier groupe.csv", mimeType: "text/csv", buffer: Buffer.from(CSV_DEUX_ELEVES, "utf8")});
  await page.waitForFunction(() => document.getElementById("studentGroupWorkspace").hidden === false, null, {timeout: 5000});
  // Des donn\u00e9es de correction fictives, que le remplacement doit effacer.
  await page.evaluate(() => { studentCorrections["tmp"] = {}; assignmentStudentDetails["tmp"] = {}; });
  // Second CSV : la bo\u00eete de confirmation s'ouvre et nomme les deux groupes.
  await page.setInputFiles("#studentGroupCsvInput", {name: "Second groupe.csv", mimeType: "text/csv", buffer: Buffer.from(CSV_TROIS_ELEVES, "utf8")});
  await page.waitForFunction(() => document.getElementById("loadStudentGroupDialog").open, null, {timeout: 5000});
  const message = await page.evaluate(() => document.getElementById("loadStudentGroupMessage").textContent);
  assert.ok(message.includes("Second groupe") && message.includes("Premier groupe"), `message de remplacement (re\u00e7u : \u00ab ${message} \u00bb)`);
  // Annuler conserve le groupe actif et ses donn\u00e9es.
  await page.click("#cancelLoadStudentGroup");
  await page.waitForFunction(() => !document.getElementById("loadStudentGroupDialog").open, null, {timeout: 5000});
  assert.equal(await page.evaluate(() => activeStudentGroup.name), "Premier groupe", "annuler conserve le groupe actif");
  assert.equal(await page.evaluate(() => Object.keys(studentCorrections).length), 1, "annuler conserve les corrections");
  // Confirmer remplace le groupe et efface les donn\u00e9es du devoir.
  await page.setInputFiles("#studentGroupCsvInput", {name: "Second groupe.csv", mimeType: "text/csv", buffer: Buffer.from(CSV_TROIS_ELEVES, "utf8")});
  await page.waitForFunction(() => document.getElementById("loadStudentGroupDialog").open, null, {timeout: 5000});
  await page.click("#confirmLoadStudentGroup");
  await page.waitForFunction(() => document.getElementById("studentGroupFileStatus").textContent.includes("Second groupe"), null, {timeout: 5000});
  assert.equal(await page.evaluate(() => activeStudentGroup.name), "Second groupe", "le groupe actif est remplac\u00e9");
  assert.equal(await page.evaluate(() => activeStudentGroup.students.length), 3, "les trois \u00e9l\u00e8ves du second CSV sont charg\u00e9s");
  assert.deepEqual(await page.evaluate(() => [studentCorrections, assignmentStudentDetails]), [{}, {}], "les corrections et d\u00e9tails du devoir pr\u00e9c\u00e9dent sont effac\u00e9s");
  await shot(page, "eleves-csv-remplacement-t05");
}));
