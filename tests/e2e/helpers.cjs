"use strict";
// Utilitaires communs aux tests de bout en bout (navigateur réel).
// Les tests s'exécutent avec le runner natif : `node --test "tests/e2e/*.e2e.cjs"`.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {chromium} = require("playwright");

const ROOT = path.join(__dirname, "..", "..");
const SCREENS = path.join(ROOT, "test-results", "screens");
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".csv": "text/csv; charset=utf-8", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".jpg": "image/jpeg", ".png": "image/png"};

// Petit serveur statique : l'application charge grilles.json avec fetch(), ce qui exige http(s).
function startServer() {
  const server = http.createServer((request, response) => {
    const file = path.join(ROOT, decodeURIComponent(request.url.split("?")[0]));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { response.writeHead(404); response.end(); return; }
    response.writeHead(200, {"content-type": TYPES[path.extname(file)] || "application/octet-stream"});
    fs.createReadStream(file).pipe(response);
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve(server)));
}

// Ouvre l'application, charge la grille d'exemple (six méthodes) et expose page.errors (erreurs JS non interceptées).
async function openApp({width = 1300, height = 900} = {}) {
  const server = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport: {width, height}});
  page.errors = [];
  page.on("pageerror", error => page.errors.push(String(error)));
  await page.goto(`http://127.0.0.1:${server.address().port}/correction.html`);
  const text = fs.readFileSync(path.join(ROOT, "grille-exemple-oral.json"), "utf8");
  await page.evaluate(source => applyLoadedGrid(gridFromJson(source), "exemple"), text);
  return {page, close: async () => { await browser.close(); server.close(); }};
}

// Ouvre la fenêtre de correction individuelle pour un élève fictif, comme après un clic sur son portrait.
// S'appuie sur des fonctions globales de correction.html (applyLoadedStudentGroup, loadStudentCorrection, openCorrectionPopup) :
// si elles sont renommées, adapter ce seul endroit.
async function openCorrection(page) {
  await page.evaluate(() => {
    applyLoadedStudentGroup({name: "Groupe e2e", students: [{nom: "DUPONT", prenom: "Léa", classe: "2de 3", pap: true}]});
  });
  await page.click('[data-view="correction"]');
  await page.evaluate(() => {
    const student = activeStudentGroup.students[0];
    loadStudentCorrection(student);
    openCorrectionPopup(student);
  });
  await page.waitForSelector("#correctionPopup[open] [data-method-node]");
}

const section = id => `#correctionPopup [data-method-node="${id}"]`;

async function shot(page, name, options = {}) {
  fs.mkdirSync(SCREENS, {recursive: true});
  await page.screenshot({path: path.join(SCREENS, `${name}.png`), ...options});
}

module.exports = {openApp, openCorrection, section, shot};
