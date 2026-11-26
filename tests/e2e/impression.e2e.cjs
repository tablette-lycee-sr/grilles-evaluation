"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {openApp, openCorrection, shot} = require("./helpers.cjs");

async function avec(corps) {
  const app = await openApp();
  try { await openCorrection(app.page); await corps(app.page); assert.deepEqual(app.page.errors, []); } finally { await app.close(); }
}

// Rend la fiche visible dans les conditions réelles du papier : émule le média d'impression
// (les règles @media print de l'application masquent tout sauf #printReport) et régénère son contenu.
async function afficherFiche(page) {
  await page.evaluate(() => {
    document.getElementById("correctionPopup")?.close();
    renderPrintReport();
  });
  await page.emulateMedia({media: "print"});
  await page.evaluate(() => window.scrollTo(0, 0));
}

// Texte de la section fiche d'une catégorie, retrouvée par son titre.
const texteSection = (page, titre) => page.evaluate(t => {
  const heading = [...document.querySelectorAll("#printReport .print-category-heading")].find(h => h.textContent.includes(t));
  if (!heading) return "";
  const section = heading.closest("section");
  return `${heading.textContent}\n${[...section.querySelectorAll(":scope > .print-method-line")].map(line => line.textContent).join("\n")}`;
}, titre);

test("fiche : NN sans valeur de note, 2(+) signalé, NE réduit, Bonus NN non pris en compte", () => avec(async page => {
  await page.evaluate(() => {
    methodStates["expression-orale"] = {statut: "nn"};
    methodStates["contenu-expose"] = {statut: "plus"};
    methodStates["gestion-temps"] = {statut: "ne"};
    methodStates["role-debat"] = {evaluee: false, bonus: 0};
  });
  await afficherFiche(page);
  await shot(page, "fiche-statuts-t02", {fullPage: true});
  const expression = await texteSection(page, "Expression orale");
  assert.ok(expression.includes("NN"), "l'en-tête affiche NN");
  assert.ok(expression.includes("Évaluée mais non notée (NN)"));
  assert.doesNotMatch(expression, /\d+,\d+ %/, "aucun pourcentage imprimé pour une catégorie NN");
  const contenu = await texteSection(page, "Contenu de l'exposé");
  assert.ok(contenu.includes("(+)"), "le résumé porte la mention (+)");
  assert.ok(contenu.includes("Notée seulement si elle augmente la note finale"));
  const gestion = await texteSection(page, "Gestion du temps");
  assert.ok(gestion.includes("NE"), "l'en-tête affiche NE");
  assert.doesNotMatch(gestion, /Durée|Nombre|Niveau :/, "la fiche NE est réduite au titre");
  assert.ok((await page.evaluate(() => document.querySelectorAll("#printReport .print-method-line").length > 0)), "d'autres sections gardent leurs lignes de détail");
  const bonus = await texteSection(page, "Rôle dans le débat");
  assert.ok(bonus.includes("NN"), "l'en-tête du Bonus affiche NN");
  assert.ok(bonus.includes("Bonus non pris en compte"));
  assert.doesNotMatch(bonus, /\+\d+ pt/, "aucune valeur de bonus imprimée");
}));

test("fiche : la durée retenue du Minuteur est imprimée, la mesure rappelée si elle diffère", () => avec(async page => {
  await page.evaluate(() => { methodStates["gestion-temps"] = {manualSeconds: 90}; });
  await afficherFiche(page);
  let gestion = await texteSection(page, "Gestion du temps");
  assert.ok(gestion.includes("Durée : 1′30″ / 5′00″"), `durée manuelle imprimée (reçu : ${gestion})`);
  await page.evaluate(() => {
    methodStates["gestion-temps"] = {recorded: true, elapsedMs: 125000, manualSeconds: 90};
    renderPrintReport();
  });
  gestion = await texteSection(page, "Gestion du temps");
  assert.ok(gestion.includes("Durée : 1′30″ (mesurée 2′05″) / 5′00″"), `mesure rappelée entre parenthèses (reçu : ${gestion})`);
  await page.evaluate(() => {
    methodStates["gestion-temps"] = {recorded: true, elapsedMs: 125000};
    renderPrintReport();
  });
  gestion = await texteSection(page, "Gestion du temps");
  assert.ok(gestion.includes("Durée : 2′05″ / 5′00″"), "sans durée manuelle, la mesure est imprimée seule");
  await page.evaluate(() => {
    methodStates["gestion-temps"] = {};
    renderPrintReport();
  });
  gestion = await texteSection(page, "Gestion du temps");
  assert.ok(gestion.includes("Durée : — / 5′00″"), "minuteur jamais démarré et sans position manuelle : tiret");
}));

test("fiche : les motifs Attention et Dépassé s'impriment aussi sur les catégories sans méthode", () => avec(async page => {
  await page.evaluate(() => {
    const config=structuredClone(DEFAULT_CONFIG);
    config.ponderations={};config.coefficientsCategories={};
    applyLoadedGrid({grid: structuredClone(DEFAULT_GRID), config, partLayout: structuredClone(PART_LAYOUT)}, "defaut.csv");
    const node = grid.elements.find(item => !item.methode);
    node.commentMotifs = [{id: "m1", label: "Motif attention", kind: "PROBLEME"}, {id: "m2", label: "Motif dépassé", kind: "VALORISATION"}];
    categoryEvaluations[node.id] = {warning: true, exceeded: true, motifIds: {warning: "m1", exceeded: "m2"}};
    renderPrintReport();
  });
  await afficherFiche(page);
  await shot(page, "fiche-motifs-t02", {fullPage: true});
  const texte = await page.evaluate(() => document.getElementById("printReport").textContent);
  assert.ok(texte.includes("Motif attention"), "le motif Attention précis est imprimé");
  assert.ok(texte.includes("Dépassé : Motif dépassé"), "le motif Dépassé est imprimé");
  await page.evaluate(() => {
    const node = grid.elements.find(item => !item.methode);
    categoryEvaluations[node.id] = {warning: true, motifId: "m1"};
    renderPrintReport();
  });
  const texte2 = await page.evaluate(() => document.getElementById("printReport").textContent);
  assert.ok(texte2.includes("Motif attention"), "repli sur le motif générique quand motifIds est absent");
}));

test("fiche : la durée manuelle du Minuteur n'est plus retenue après « n'a pas pris la parole »", () => avec(async page => {
  await page.evaluate(() => {
    methodStates["gestion-temps"] = {manualSeconds: 90};
    manualCategoryPercent["gestion-temps"] = 30;
    renderPrintReport();
  });
  await afficherFiche(page);
  let gestion = await texteSection(page, "Gestion du temps");
  assert.ok(gestion.includes("Durée : 1′30″ / 5′00″"), `position manuelle encore définie : durée manuelle retenue (reçu : ${gestion})`);
  await page.evaluate(() => toggleCategoryEvaluation("gestion-temps", "warning"));
  await afficherFiche(page);
  gestion = await texteSection(page, "Gestion du temps");
  assert.ok(gestion.includes("Attention"), "le signalement est imprimé");
  assert.ok(gestion.includes("Durée : 0′00″ / 5′00″"), `durée manuelle oubliée après le signalement (reçu : ${gestion})`);
  assert.ok(!gestion.includes("1′30″"), "aucune trace de l'ancienne durée manuelle");
  assert.ok(!gestion.includes("(mesurée"), "pas de rappel de mesure : la mesure vaut zéro");
  await page.evaluate(() => {
    methodStates["gestion-temps"].elapsedMs = 125000;
    renderPrintReport();
  });
  gestion = await texteSection(page, "Gestion du temps");
  assert.ok(gestion.includes("Durée : 2′05″ / 5′00″"), "sans position manuelle, la durée mesurée reprend la main");
}));

test("fiche : les motifs des catégories sans méthode respectent leur type (Attention = PROBLÈME, Dépassé = VALORISATION)", () => avec(async page => {
  await page.evaluate(() => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.ponderations = {};config.coefficientsCategories = {};
    applyLoadedGrid({grid: structuredClone(DEFAULT_GRID), config, partLayout: structuredClone(PART_LAYOUT)}, "defaut.csv");
    const node = grid.elements.find(item => !item.methode);
    node.commentMotifs = [{id: "m1", label: "Motif attention", kind: "PROBLEME"}, {id: "m2", label: "Motif dépassé", kind: "VALORISATION"}];
    categoryEvaluations[node.id] = {warning: true, exceeded: true, motifIds: {warning: "m2", exceeded: "m1"}};
    renderPrintReport();
  });
  await afficherFiche(page);
  await shot(page, "fiche-motifs-t02b", {fullPage: true});
  const texte = await page.evaluate(() => document.getElementById("printReport").textContent);
  assert.ok(!texte.includes("Motif attention"), "un identifiant de VALORISATION choisi en Attention n'imprime rien");
  assert.ok(!texte.includes("Motif dépassé"), "un identifiant de PROBLÈME choisi en Dépassé n'imprime rien");
  assert.ok(texte.includes("Dépassé"), "la mention Dépassé s'imprime sans libellé hors type");
  await page.evaluate(() => {
    const node = grid.elements.find(item => !item.methode);
    categoryEvaluations[node.id] = {warning: true, exceeded: true, motifIds: {warning: "m1"}};
    renderPrintReport();
  });
  const texte2 = await page.evaluate(() => document.getElementById("printReport").textContent);
  assert.ok(texte2.includes("Attention : Motif attention"), "le motif Attention du bon type est imprimé");
  assert.ok(texte2.includes("Dépassé"), "la mention Dépassé s'imprime");
  assert.ok(!texte2.includes("Dépassé : "), "Dépassé sans motif de type VALORISATION : mention sans libellé");
}));
