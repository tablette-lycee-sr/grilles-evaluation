"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {openApp, openCorrection, section, shot} = require("./helpers.cjs");

const METHODES = ["expression-orale", "contenu-expose", "gestion-temps", "qualite-arguments", "participation-echanges", "role-debat"];

test("fenêtre de correction : 90 % de la largeur, six catégories, aucune erreur JS", async () => {
  const {page, close} = await openApp({width: 1400, height: 800});
  try {
    await openCorrection(page);
    const ratio = await page.evaluate(() => document.getElementById("correctionPopup").getBoundingClientRect().width / innerWidth);
    assert.ok(Math.abs(ratio - 0.9) < 0.01, `largeur de la fenêtre : ${ratio}`);
    assert.equal(await page.locator("#correctionPopup [data-method-node]").count(), METHODES.length);
    await shot(page, "fenetre-paysage");
    assert.deepEqual(page.errors, []);
  } finally { await close(); }
});

test("toutes les cartes ont la même largeur et la même colonne centrale", async () => {
  const {page, close} = await openApp({width: 1400, height: 1200});
  try {
    await openCorrection(page);
    const mesures = await page.evaluate(ids => ids.map(id => {
      const carte = document.querySelector(`#correctionPopup [data-method-node="${id}"] .carte`).getBoundingClientRect();
      const jauge = document.querySelector(`#correctionPopup [data-method-node="${id}"] .jauge`).getBoundingClientRect();
      return {id, largeur: Math.round(carte.width), centre: Math.round(jauge.left + jauge.width / 2 - carte.left)};
    }), METHODES);
    for (const m of mesures) {
      assert.equal(m.largeur, mesures[0].largeur, `largeur de ${m.id}`);
      assert.ok(Math.abs(m.centre - mesures[0].centre) <= 1, `centre de la jauge de ${m.id} : ${m.centre} / ${mesures[0].centre}`);
    }
  } finally { await close(); }
});

test("portrait : le bandeau élève reste fixe pendant le défilement et la fermeture est facile à atteindre", async () => {
  const {page, close} = await openApp({width: 820, height: 1150});
  try {
    await openCorrection(page);
    const avant = await page.evaluate(() => document.querySelector("#correctionPopup .correction-popup-heading h2").getBoundingClientRect().top);
    await page.evaluate(() => { document.getElementById("correctionPopupCategories").scrollTop = 400; });
    const apres = await page.evaluate(() => document.querySelector("#correctionPopup .correction-popup-heading h2").getBoundingClientRect().top);
    assert.equal(Math.round(apres), Math.round(avant));
    const bouton = await page.evaluate(() => { const b = document.querySelector("#correctionPopup .correction-popup-heading .icon-button").getBoundingClientRect(); return [b.width, b.height]; });
    assert.ok(bouton[0] >= 48 && bouton[1] >= 48, `bouton de fermeture : ${bouton}`);
    await shot(page, "fenetre-portrait");
  } finally { await close(); }
});
